export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/servizi — catalogo prestazioni di tutta la rete
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const servizi = await sql`
    SELECT s.id, s.name, s.duration_min, s.price_cents, s.active,
           p.name AS professional_name, p.slug, p.city,
           COALESCE(b.n, 0) AS prenotazioni
    FROM services s
    JOIN professionals p ON p.id = s.professional_id
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM bookings WHERE service_id = s.id) b ON TRUE
    ORDER BY p.name, s.sort`;

  return json({ servizi });
}
