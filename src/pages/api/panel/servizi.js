export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, pidBersaglio, adminSuAltro } from "../../../lib/auth.js";
import { voceDiListino, eConsulenza } from "../../../lib/listino.js";

const tracciaAdmin = async (session, fornito, pid) => {
  if (adminSuAltro(session, fornito)) {
    await sql`UPDATE professionals SET edited_by = ${session.name || "admin"}, edited_at = now() WHERE id = ${pid}`;
  }
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/servizi — tutte le prestazioni del professionista (anche
// disattivate), MAI quelle eliminate (deleted_at): per lui non esistono più.
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  const url = new URL(request.url);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const servizi = await sql`
    SELECT id, name, duration_min, price_cents, price_notte_cents, active, sort, catalog_key
    FROM services WHERE professional_id = ${pid} AND deleted_at IS NULL ORDER BY sort, id`;
  return json({ servizi });
}

// Controlla la prestazione contro il LISTINO (tabella catalog_services, gestita
// dagli amministratori): il professionista può inserire solo voci del listino
// generale o create su misura per lui, e non sotto il prezzo minimo deciso.
const valida = async (body, pid, catalogKeyEsistente = "") => {
  const catalogKey = String(body.catalog_key || catalogKeyEsistente || "").trim();
  const voce = await voceDiListino(catalogKey, pid);
  if (!voce) return { error: "Questa prestazione non è (più) nel listino: scegline una dall'elenco" };
  const name = voce.nome; // il nome lo detta il listino (niente testo libero)
  const consulenza = eConsulenza(catalogKey) || voce.categoria === "consulenza";
  // Le consulenze durano un'ora fissa (sono "a ora"): la durata non si tocca.
  const duration = consulenza ? voce.durata_min : Math.round(Number(body.duration_min));
  const price = Math.round(Number(body.price_cents));
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) return { error: "Durata non valida (5-480 minuti)" };
  if (!Number.isFinite(price) || price > 100000000) return { error: "Prezzo non valido" };
  if (price < voce.min_cents) {
    const eu = (c) => (c / 100).toFixed(2).replace(".", ",");
    return { error: `Per "${voce.nome}" il prezzo minimo è ${eu(voce.min_cents)} €${consulenza ? " all'ora" : ""} (consigliato ${eu(voce.sugg_cents)} €)` };
  }

  // Prezzo notturno (22:00-07:00): facoltativo. Vuoto = questa prestazione di notte non si fa.
  // Se indicato è una MAGGIORAZIONE, quindi non può essere inferiore al prezzo di giorno.
  // Le consulenze non hanno tariffa notturna: si fanno in orario d'ufficio, sull'agenda.
  const grezzoNotte = consulenza ? null : body.price_notte_cents;
  let priceNotte = null;
  if (grezzoNotte !== undefined && grezzoNotte !== null && grezzoNotte !== "") {
    priceNotte = Math.round(Number(grezzoNotte));
    if (!Number.isFinite(priceNotte) || priceNotte > 100000000) return { error: "Prezzo notturno non valido" };
    if (priceNotte < price) return { error: "Il prezzo notturno è una maggiorazione: non può essere inferiore a quello di giorno" };
  }
  return { name, duration, price, catalogKey, priceNotte };
};

// POST /api/panel/servizi — nuova prestazione
export async function POST({ request }) {
  const session = sessionFromRequest(request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const pid = pidBersaglio(session, body.pid);
  if (!pid) return json({ error: "Non autenticato" }, 401);
  const v = await valida(body, pid);
  if (v.error) return json(v, 400);

  const [gia] = await sql`
    SELECT id, deleted_at FROM services WHERE professional_id = ${pid} AND catalog_key = ${v.catalogKey}
    ORDER BY (deleted_at IS NULL) DESC LIMIT 1`;
  if (gia && !gia.deleted_at) return json({ error: "Questa prestazione è già nell'elenco" }, 400);

  // Era stata eliminata (morbida) e la ri-aggiunge: si "resuscita" la stessa riga
  // (così lo storico prenotazioni resta agganciato e non nascono doppioni)
  if (gia && gia.deleted_at) {
    await sql`
      UPDATE services
      SET name = ${v.name}, duration_min = ${v.duration}, price_cents = ${v.price}, price_notte_cents = ${v.priceNotte},
          active = TRUE, deleted_at = NULL,
          sort = (SELECT COALESCE(MAX(sort), 0) + 1 FROM services s2 WHERE s2.professional_id = ${pid} AND s2.deleted_at IS NULL)
      WHERE id = ${gia.id}`;
    await tracciaAdmin(session, body.pid, pid);
    return json({ ok: true, id: gia.id });
  }

  const [nuovo] = await sql`
    INSERT INTO services (professional_id, name, duration_min, price_cents, price_notte_cents, active, sort, catalog_key)
    SELECT ${pid}, ${v.name}, ${v.duration}, ${v.price}, ${v.priceNotte}, TRUE, COALESCE(MAX(sort), 0) + 1, ${v.catalogKey}
    FROM services WHERE professional_id = ${pid}
    RETURNING id`;
  await tracciaAdmin(session, body.pid, pid);
  return json({ ok: true, id: nuovo.id });
}

// PATCH /api/panel/servizi — modifica prestazione {id, name?, duration_min?, price_cents?, active?}
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const pid = pidBersaglio(session, body.pid);
  if (!pid) return json({ error: "Non autenticato" }, 401);
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [attuale] = await sql`
    SELECT name, duration_min, price_cents, price_notte_cents, active, catalog_key FROM services
    WHERE id = ${id} AND professional_id = ${pid} AND deleted_at IS NULL`;
  if (!attuale) return json({ error: "Prestazione non trovata" }, 404);

  const v = await valida({
    duration_min: body.duration_min ?? attuale.duration_min,
    price_cents: body.price_cents ?? attuale.price_cents,
    price_notte_cents: body.price_notte_cents !== undefined ? body.price_notte_cents : attuale.price_notte_cents,
  }, pid, attuale.catalog_key);
  if (v.error) return json(v, 400);
  const active = body.active ?? attuale.active;

  await sql`
    UPDATE services SET name = ${v.name}, duration_min = ${v.duration}, price_cents = ${v.price}, price_notte_cents = ${v.priceNotte}, active = ${!!active}
    WHERE id = ${id} AND professional_id = ${pid}`;
  await tracciaAdmin(session, body.pid, pid);
  return json({ ok: true });
}

// DELETE /api/panel/servizi?id=3 — elimina la prestazione dalla scheda.
// Se ha prenotazioni nello storico non si può cancellare fisicamente (il vincolo
// bookings.service_id lo impedisce e lo storico va conservato): la si ARCHIVIA
// (active=false + deleted_at) → per il professionista è eliminata a tutti gli effetti.
export async function DELETE({ request, url }) {
  const session = sessionFromRequest(request);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);

  const [mia] = await sql`SELECT id FROM services WHERE id = ${id} AND professional_id = ${pid} AND deleted_at IS NULL`;
  if (!mia) return json({ error: "Prestazione non trovata" }, 404);

  const usato = await sql`SELECT id FROM bookings WHERE service_id = ${id} LIMIT 1`;
  if (usato.length) {
    await sql`UPDATE services SET active = FALSE, deleted_at = now() WHERE id = ${id} AND professional_id = ${pid}`;
  } else {
    await sql`DELETE FROM services WHERE id = ${id} AND professional_id = ${pid}`;
  }
  await tracciaAdmin(session, url.searchParams.get("pid"), pid);
  return json({ ok: true, archiviata: usato.length > 0 });
}
