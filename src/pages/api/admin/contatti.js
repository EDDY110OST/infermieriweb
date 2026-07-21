export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/contatti — tutte le richieste raccolte dal sito:
// modulo "Richiedi informazioni", lead strutture, lista d'attesa zone, iscritti newsletter.
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const richieste = await sql`
    SELECT id, reason, name, email, phone, city, message, newsletter, status, created_at
    FROM info_requests ORDER BY created_at DESC LIMIT 300`;

  const leadStrutture = await sql`
    SELECT id, name, type, city, email, phone, message, created_at
    FROM structure_leads ORDER BY created_at DESC LIMIT 300`;

  const listaAttesa = await sql`
    SELECT id, email, zona, created_at FROM waitlist ORDER BY created_at DESC LIMIT 300`;
  const perZona = await sql`
    SELECT zona, COUNT(*) AS n FROM waitlist GROUP BY zona ORDER BY n DESC LIMIT 20`;

  const newsletter = await sql`
    SELECT id, email, source, consent_at FROM newsletter_subscribers ORDER BY consent_at DESC LIMIT 2000`;

  return json({ richieste, leadStrutture, listaAttesa, perZona, newsletter });
}
