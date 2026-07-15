export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/prenotazioni?stato=active|done|cancelled|noshow|tutte&limite=100
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const stato = url.searchParams.get("stato") || "tutte";
  const limite = Math.min(Number(url.searchParams.get("limite")) || 100, 300);

  const rows = ["active", "done", "cancelled", "noshow"].includes(stato)
    ? await sql`
        SELECT b.id, b.start_dt, b.end_dt, b.status, b.source, b.customer_name, b.customer_phone,
               b.customer_email, b.address, b.city, b.created_at,
               s.name AS service_name, s.price_cents, p.name AS professional_name, p.slug
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        WHERE b.status = ${stato}
        ORDER BY b.start_dt DESC LIMIT ${limite}`
    : await sql`
        SELECT b.id, b.start_dt, b.end_dt, b.status, b.source, b.customer_name, b.customer_phone,
               b.customer_email, b.address, b.city, b.created_at,
               s.name AS service_name, s.price_cents, p.name AS professional_name, p.slug
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        ORDER BY b.start_dt DESC LIMIT ${limite}`;

  return json({ prenotazioni: rows });
}
