export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, linkReimpostaPassword } from "../../../lib/auth.js";
import { sendEmail, emailBenvenutoProfessionista } from "../../../lib/mailer.js";
import { normalizzaEmail, emailValida, avvisoEmail, emailUsataDaAltri, aggiornaEmailProfessionista, registraCambioEmail, dominioEmail } from "../../../lib/email.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Il tasto «scegli la password» del benvenuto rimandato: stesso meccanismo del recupero
// (/api/panel/recupero → /reimposta-password), ma vale 72 ore invece di 60 minuti
// perché arriva in un'email di benvenuto, non su richiesta. Si usa una volta sola.
const ORE_LINK_BENVENUTO = 72;

const ERR_FORMATO = "Email non valida: controlla che ci siano la @ e il dominio completo (es. nome@gmail.com)";

// POST /api/admin/email-professionista {id, azione?, email?, verifica?, forza?}
// Riquadro «Accesso al pannello» (Admin → Infermieri → Modifica scheda) e tasto
// «Correggi email e rimanda il benvenuto» nell'elenco. azione:
//  - "correggi": cambia l'email nelle DUE tabelle insieme (scheda + accesso), niente email;
//  - "rimanda": rimanda il benvenuto all'email di accesso attuale, con il tasto per
//    scegliere (o reimpostare) la password; l'email non cambia;
//  - "correggi-e-rimanda" (predefinita): le due cose insieme.
// verifica: true → solo i controlli (formato, doppioni, avviso), non cambia nulla: serve alla
// schermata di conferma. Se il dominio sembra un errore di battitura serve forza: true.
// La password non si tocca mai e nella mail non c'è nessuna password in chiaro.
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);
  const azione = ["correggi", "rimanda", "correggi-e-rimanda"].includes(body.azione) ? body.azione : "correggi-e-rimanda";
  const cambiaEmail = azione !== "rimanda";
  const rimanda = azione !== "correggi";

  const [p] = await sql`SELECT id, slug, name, full_name, email, vat_number, status FROM professionals WHERE id = ${id}`;
  if (!p) return json({ error: "Professionista non trovato" }, 404);
  if (p.status === "deleted") return json({ error: "Questo profilo è stato eliminato" }, 409);
  if (p.status === "suspended" && rimanda) return json({ error: "Il profilo è sospeso: il benvenuto non si rimanda. Riattivalo prima. L'email di accesso si può comunque correggere." }, 409);
  const [u] = await sql`SELECT id, email, name, pass_hash FROM professional_users WHERE professional_id = ${id} LIMIT 1`;
  if (!u) return json({ error: "Questo profilo non ha un accesso al pannello" }, 404);

  const vecchiaAccesso = normalizzaEmail(u.email);
  const vecchiaScheda = normalizzaEmail(p.email);
  const nuova = cambiaEmail ? normalizzaEmail(body.email) : vecchiaAccesso;
  if (!emailValida(nuova)) {
    return json({ error: cambiaEmail ? ERR_FORMATO : `L'email di accesso attuale (${nuova || "vuota"}) non è valida: correggila prima di rimandare il benvenuto` }, 400);
  }
  if (cambiaEmail) {
    const altro = await emailUsataDaAltri(nuova, id);
    if (altro) return json({ error: `Questa email è già usata per entrare da ${altro.name}: due persone non possono avere la stessa email` }, 409);
  }

  const cambiata = cambiaEmail && (nuova !== vecchiaAccesso || nuova !== vecchiaScheda);
  const avviso = avvisoEmail(nuova);

  if (body.verifica) {
    return json({ ok: true, verifica: true, azione, email: nuova, prima: vecchiaAccesso || vecchiaScheda, cambiata, avviso });
  }
  if (avviso && !body.forza) return json({ conferma_richiesta: true, avviso, email: nuova }, 409);
  const chi = session.name || "admin";

  // 1. le due tabelle insieme, in una sola istruzione
  if (cambiata) {
    const ok = await aggiornaEmailProfessionista(id, nuova, chi);
    if (!ok) return json({ error: "Questa email è appena stata presa da un altro account: scegline un'altra" }, 409);
    // la candidatura approvata segue (così si ritrova per email, anche per l'eliminazione)
    await sql`
      UPDATE applications SET email = ${nuova}
      WHERE status = 'approved' AND lower(email) IN (${vecchiaAccesso}, ${vecchiaScheda}) AND lower(email) <> ${nuova}`;
    // registro (solo i domini, niente indirizzi)
    await registraCambioEmail({
      chi, pid: id, prima: vecchiaAccesso, dopo: nuova, origine: azione === "correggi" ? "correggi-accesso" : "correggi-e-rimanda",
      extra: { avviso_confermato: !!avviso },
    });
  }
  if (!rimanda) return json({ ok: true, azione, email: nuova, prima: vecchiaAccesso, cambiata, emailed: false });

  // 2. la password l'aveva scelta lui? (candidatura con pass_hash «scrypt$…»). Profili
  //    creati a mano, senza candidatura: hanno già una loro password → «scelta».
  const [cand] = await sql`
    SELECT pass_hash FROM applications WHERE status = 'approved' AND lower(email) = ${nuova}
    ORDER BY created_at DESC LIMIT 1`;
  const passwordScelta = !cand || String(cand.pass_hash || "").startsWith("scrypt$");

  // 3. benvenuto, con il tasto per scegliere (o reimpostare) la password
  const benvenuto = emailBenvenutoProfessionista({
    name: p.full_name || u.name || p.name, email: nuova, slug: p.slug,
    senzaPiva: !p.vat_number, passwordScelta, rimandato: true, emailCambiata: cambiata, oreLink: ORE_LINK_BENVENUTO,
    resetLink: linkReimpostaPassword({ email: nuova, passHash: u.pass_hash, secondi: 60 * 60 * ORE_LINK_BENVENUTO }),
  });
  const emailed = await sendEmail({ to: nuova, toName: p.full_name || u.name || p.name, ...benvenuto });

  // 4. registro (solo il dominio, niente indirizzi né password)
  try {
    await sql`
      INSERT INTO admin_audit (admin, azione, soggetto_id, dettagli)
      VALUES (${chi}, 'benvenuto_rimandato', ${id},
              ${JSON.stringify({ origine: azione, dominio: dominioEmail(nuova), inviato: emailed, email_cambiata: cambiata, password_scelta: passwordScelta })}::jsonb)`;
  } catch (e) {
    console.error("[email] registro non scritto:", e.message);
  }

  return json({ ok: true, azione, email: nuova, prima: vecchiaAccesso, cambiata, emailed, avviso, passwordScelta });
}
