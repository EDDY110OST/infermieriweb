export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// PATCH /api/panel/prenotazioni {id, status} — annulla / segna esito
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  const id = Number(body.id);
  const status = String(body.status || "");
  if (!id || !["cancelled", "done", "noshow", "active"].includes(status)) {
    return json({ error: "Dati non validi" }, 400);
  }

  const updated = await sql`
    UPDATE bookings SET status = ${status}
    WHERE id = ${id} AND professional_id = ${session.pid}
    RETURNING id`;
  if (!updated.length) return json({ error: "Prenotazione non trovata" }, 404);

  // TODO: avvisare il paziente via email quando il professionista disdice
  return json({ ok: true });
}
