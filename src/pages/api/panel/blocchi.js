export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { romeDateTime } from "../../../lib/slots.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/blocchi {start, end, reason} — blocca uno spazio in agenda
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  // Ora locale di Roma → istante corretto anche in ora solare (niente offset cablati)
  const daLocale = (testo) => {
    const m = String(testo || "").match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    return romeDateTime(m[1], Number(m[2]) * 60 + Number(m[3]));
  };
  const start = body.start_local ? daLocale(body.start_local) : new Date(body.start || "");
  const end = body.end_local ? daLocale(body.end_local) : new Date(body.end || "");
  const reason = String(body.reason || "").slice(0, 160);
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return json({ error: "Intervallo non valido" }, 400);
  }

  const [block] = await sql`
    INSERT INTO blocks (professional_id, start_dt, end_dt, reason)
    VALUES (${session.pid}, ${start.toISOString()}, ${end.toISOString()}, ${reason})
    RETURNING id`;
  return json({ ok: true, id: block.id });
}

// DELETE /api/panel/blocchi?id=3 — rimuove un blocco
export async function DELETE({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);

  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);

  await sql`DELETE FROM blocks WHERE id = ${id} AND professional_id = ${session.pid}`;
  return json({ ok: true });
}
