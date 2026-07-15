export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/pazienti — anagrafica ricavata dalle prenotazioni
// (nessun account paziente per scelta: il telefono è la chiave)
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const pazienti = await sql`
    SELECT customer_phone AS telefono,
           (array_agg(customer_name ORDER BY created_at DESC))[1] AS nome,
           (array_agg(customer_email ORDER BY created_at DESC))[1] AS email,
           (array_agg(city ORDER BY created_at DESC))[1] AS citta,
           COUNT(*) AS prenotazioni,
           COUNT(*) FILTER (WHERE status = 'done') AS completate,
           COUNT(*) FILTER (WHERE status = 'noshow') AS noshow,
           MAX(start_dt) AS ultima,
           array_agg(DISTINCT professional_id) AS professionisti
    FROM bookings
    GROUP BY customer_phone
    ORDER BY MAX(created_at) DESC
    LIMIT 500`;

  return json({ pazienti });
}
