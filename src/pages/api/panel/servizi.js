export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/servizi — tutte le prestazioni del professionista (anche disattivate)
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const servizi = await sql`
    SELECT id, name, duration_min, price_cents, active, sort
    FROM services WHERE professional_id = ${session.pid} ORDER BY sort, id`;
  return json({ servizi });
}

const valida = (body) => {
  const name = String(body.name || "").trim().slice(0, 120);
  const duration = Math.round(Number(body.duration_min));
  const price = Math.round(Number(body.price_cents));
  if (name.length < 3) return { error: "Il nome della prestazione è troppo corto" };
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) return { error: "Durata non valida (5-480 minuti)" };
  if (!Number.isFinite(price) || price < 0 || price > 100000000) return { error: "Prezzo non valido" };
  return { name, duration, price };
};

// POST /api/panel/servizi — nuova prestazione
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const v = valida(body);
  if (v.error) return json(v, 400);

  const [nuovo] = await sql`
    INSERT INTO services (professional_id, name, duration_min, price_cents, active, sort)
    SELECT ${session.pid}, ${v.name}, ${v.duration}, ${v.price}, TRUE, COALESCE(MAX(sort), 0) + 1
    FROM services WHERE professional_id = ${session.pid}
    RETURNING id`;
  return json({ ok: true, id: nuovo.id });
}

// PATCH /api/panel/servizi — modifica prestazione {id, name?, duration_min?, price_cents?, active?}
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [attuale] = await sql`
    SELECT name, duration_min, price_cents, active FROM services
    WHERE id = ${id} AND professional_id = ${session.pid}`;
  if (!attuale) return json({ error: "Prestazione non trovata" }, 404);

  const v = valida({
    name: body.name ?? attuale.name,
    duration_min: body.duration_min ?? attuale.duration_min,
    price_cents: body.price_cents ?? attuale.price_cents,
  });
  if (v.error) return json(v, 400);
  const active = body.active ?? attuale.active;

  await sql`
    UPDATE services SET name = ${v.name}, duration_min = ${v.duration}, price_cents = ${v.price}, active = ${!!active}
    WHERE id = ${id} AND professional_id = ${session.pid}`;
  return json({ ok: true });
}

// DELETE /api/panel/servizi?id=3 — elimina (solo se mai prenotata, sennò disattivare)
export async function DELETE({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);

  const usato = await sql`SELECT id FROM bookings WHERE service_id = ${id} LIMIT 1`;
  if (usato.length) {
    return json({ error: "Questa prestazione ha prenotazioni nello storico: puoi disattivarla ma non eliminarla." }, 409);
  }
  await sql`DELETE FROM services WHERE id = ${id} AND professional_id = ${session.pid}`;
  return json({ ok: true });
}
