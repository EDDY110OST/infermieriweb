export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { sendEmailDettaglio, ASSISTENZA_EMAIL } from "../../../lib/mailer.js";
import {
  destinatariPossibili, preparaComunicazione, emailComunicazione, oggettoPer,
  SOGLIA_BREVO, PAUSA_MS,
} from "../../../lib/comunicazioni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  return session && session.role === "admin" ? session : null;
};
const RISPONDI_A = ASSISTENZA_EMAIL; // info@infermieriweb.it: le risposte arrivano a noi
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Invii in corso IN QUESTO processo. Se il server si riavvia a metà (deploy), la riga
// resta «in_corso» senza progressi: dopo 2 minuti fermi la si mostra come «interrotta»,
// con chi l'ha già ricevuta (inviati_ids) e chi no.
const inCorso = new Set();

async function segnaInterrotte() {
  const ferme = await sql`
    SELECT id FROM admin_broadcasts
    WHERE stato = 'in_corso' AND aggiornata_at < now() - interval '2 minutes'`;
  for (const f of ferme) {
    if (inCorso.has(f.id)) continue;
    await sql`UPDATE admin_broadcasts SET stato = 'interrotta', finita_at = now() WHERE id = ${f.id} AND stato = 'in_corso'`;
  }
}

// L'invio vero: una mail per persona, ~400 ms fra l'una e l'altra, progressi scritti
// nella riga a ogni passo (la pagina li legge e mostra «Mandate 5 di 20»).
async function eseguiInvio(id, destinatari, oggetto, html) {
  inCorso.add(id);
  try {
    for (let i = 0; i < destinatari.length; i++) {
      const d = destinatari[i];
      const esito = await sendEmailDettaglio({
        to: d.email, toName: d.name, replyTo: RISPONDI_A,
        subject: oggettoPer(oggetto, d.nome), html: emailComunicazione({ html, nome: d.nome }),
      });
      if (esito.ok) {
        await sql`
          UPDATE admin_broadcasts SET riuscite = riuscite + 1, inviati_ids = inviati_ids || ${JSON.stringify([d.id])}::jsonb,
                 aggiornata_at = now()
          WHERE id = ${id}`;
      } else {
        await sql`
          UPDATE admin_broadcasts SET non_riuscite = non_riuscite + 1,
                 elenco_non_riuscite = elenco_non_riuscite || ${JSON.stringify([{ id: d.id, nome: d.name, email: d.email, errore: esito.errore || "invio non riuscito" }])}::jsonb,
                 aggiornata_at = now()
          WHERE id = ${id}`;
      }
      if (i < destinatari.length - 1) await pausa(PAUSA_MS);
    }
    await sql`UPDATE admin_broadcasts SET stato = 'finita', finita_at = now(), aggiornata_at = now() WHERE id = ${id}`;
  } catch (e) {
    console.error("[comunicazioni] invio interrotto:", e.message);
    await sql`UPDATE admin_broadcasts SET stato = 'interrotta', finita_at = now() WHERE id = ${id}`.catch(() => {});
  } finally {
    inCorso.delete(id);
  }
}

// GET /api/admin/comunicazioni — destinatari possibili, storico, email dell'admin collegato
// GET /api/admin/comunicazioni?id=N — una comunicazione (progressi + testo per rileggerla)
export async function GET({ request, url }) {
  const session = soloAdmin(request);
  if (!session) return json({ error: "Riservato agli amministratori" }, 403);
  await segnaInterrotte();

  const id = Number(url.searchParams.get("id"));
  if (id) {
    const [c] = await sql`SELECT * FROM admin_broadcasts WHERE id = ${id}`;
    if (!c) return json({ error: "Comunicazione non trovata" }, 404);
    // durante l'invio la pagina chiede solo i progressi (ogni secondo): niente testo
    if (url.searchParams.get("progressi")) {
      const progressi = { ...c };
      delete progressi.html;
      return json({ comunicazione: progressi });
    }
    return json({ comunicazione: { ...c, anteprima: emailComunicazione({ html: c.html, nome: "Nome" }) } });
  }

  const { destinatari, senza_email } = await destinatariPossibili();
  const storico = await sql`
    SELECT id, chiave, oggetto, destinatari, riuscite, non_riuscite, elenco_non_riuscite, stato,
           mandata_da, created_at, finita_at, destinatari_ids, inviati_ids
    FROM admin_broadcasts ORDER BY created_at DESC, id DESC LIMIT 50`;
  const [admin] = await sql`SELECT email FROM professional_users WHERE id = ${session.uid || 0} AND role = 'admin'`;
  return json({ destinatari, senza_email, storico, admin_email: admin?.email || "", soglia: SOGLIA_BREVO });
}

// POST /api/admin/comunicazioni
//   {azione: "anteprima", oggetto, formato, html|testo, esempio_id?} → la mail come la riceve una persona
//   {azione: "prova", …}  → la stessa mail SOLO all'admin collegato (oggetto con «[Prova]»)
//   {azione: "invia", chiave, ids, …} → parte l'invio a tutti; la chiave (dal browser)
//      impedisce il doppio invio: con la stessa chiave risponde con quella già partita.
export async function POST({ request }) {
  const session = soloAdmin(request);
  if (!session) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const azione = String(body.azione || "");
  if (!["anteprima", "prova", "invia"].includes(azione)) return json({ error: "Azione non valida" }, 400);

  // Doppio invio: la chiave si controlla PRIMA di tutto (anche se il testo nel frattempo è cambiato)
  const chiave = String(body.chiave || "").trim().slice(0, 80);
  if (azione === "invia") {
    if (!/^[A-Za-z0-9-]{16,80}$/.test(chiave)) return json({ error: "Chiave di invio mancante: ricarica la pagina" }, 400);
    const [gia] = await sql`
      SELECT id, oggetto, destinatari, riuscite, non_riuscite, elenco_non_riuscite, stato, created_at
      FROM admin_broadcasts WHERE chiave = ${chiave}`;
    if (gia) return json({ ok: true, gia: true, comunicazione: gia });
  }

  const c = preparaComunicazione(body);
  if (c.error) return json({ error: c.error }, 400);

  if (azione === "anteprima") {
    const { destinatari } = await destinatariPossibili();
    const esempio = destinatari.find((d) => d.id === Number(body.esempio_id)) || destinatari[0] || { nome: "Maria" };
    return json({ ok: true, oggetto: oggettoPer(c.oggetto, esempio.nome), html: emailComunicazione({ html: c.html, nome: esempio.nome }), nome: esempio.nome, caratteri: c.caratteri });
  }

  if (azione === "prova") {
    const [admin] = await sql`SELECT email, name FROM professional_users WHERE id = ${session.uid || 0} AND role = 'admin'`;
    if (!admin?.email) return json({ error: "Non trovo la tua email di amministratore" }, 404);
    const nome = String(admin.name || session.name || "").split(/\s+/)[0] || "collega";
    const esito = await sendEmailDettaglio({
      to: admin.email, toName: admin.name, replyTo: RISPONDI_A,
      subject: `[Prova] ${oggettoPer(c.oggetto, nome)}`, html: emailComunicazione({ html: c.html, nome }),
    });
    if (!esito.ok) return json({ error: `La prova non è partita (${esito.errore})` }, 502);
    return json({ ok: true, a: admin.email });
  }

  // --- invia ---
  const { destinatari } = await destinatariPossibili();
  const scelti = new Set((Array.isArray(body.ids) ? body.ids : []).map(Number));
  const visti = new Set();
  const lista = destinatari.filter((d) => {
    if (!scelti.has(d.id) || visti.has(d.email)) return false; // stessa email due volte = una mail sola
    visti.add(d.email);
    return true;
  });
  if (!lista.length) return json({ error: "Nessun destinatario scelto" }, 400);

  const [nuova] = await sql`
    INSERT INTO admin_broadcasts (chiave, oggetto, html, destinatari, destinatari_ids, mandata_da)
    VALUES (${chiave}, ${c.oggetto}, ${c.html}, ${lista.length}, ${JSON.stringify(lista.map((d) => d.id))}::jsonb, ${session.name || "admin"})
    ON CONFLICT (chiave) DO NOTHING
    RETURNING id, oggetto, destinatari, riuscite, non_riuscite, elenco_non_riuscite, stato, created_at`;
  if (!nuova) {
    // due clic quasi insieme: il secondo trova la riga del primo
    const [gia] = await sql`SELECT id, oggetto, destinatari, riuscite, non_riuscite, elenco_non_riuscite, stato, created_at FROM admin_broadcasts WHERE chiave = ${chiave}`;
    return json({ ok: true, gia: true, comunicazione: gia });
  }
  void eseguiInvio(nuova.id, lista, c.oggetto, c.html); // non si aspetta: la pagina segue i progressi
  return json({ ok: true, comunicazione: nuova, oltre_soglia: lista.length > SOGLIA_BREVO }, 202);
}
