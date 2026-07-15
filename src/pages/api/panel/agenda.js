export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { romeDateTime } from "../../../lib/slots.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/agenda?from=2026-07-14&days=7 — prenotazioni e blocchi del professionista loggato
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const days = Math.min(Number(url.searchParams.get("days")) || 7, 31);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return json({ error: "Data non valida" }, 400);

  const start = romeDateTime(from, 0);
  const end = new Date(start.getTime() + days * 24 * 3600000);

  const bookings = await sql`
    SELECT b.id, b.start_dt, b.end_dt, b.customer_name, b.customer_phone, b.customer_email,
           b.address, b.city, b.status, b.source, s.name AS service_name
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE b.professional_id = ${session.pid}
      AND b.start_dt >= ${start.toISOString()} AND b.start_dt < ${end.toISOString()}
    ORDER BY b.start_dt`;

  const blocks = await sql`
    SELECT id, start_dt, end_dt, reason FROM blocks
    WHERE professional_id = ${session.pid}
      AND start_dt < ${end.toISOString()} AND end_dt > ${start.toISOString()}
    ORDER BY start_dt`;

  return json({ bookings, blocks });
}
