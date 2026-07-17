export const prerender = false;

import { sql } from "../../lib/db.js";

// GET /api/zone-coperte — le città della rete (per i suggerimenti di ricerca).
// Cache di un'ora: cambia solo quando entrano professionisti o zone nuove.
export async function GET() {
  const zone = await sql`
    SELECT DISTINCT c.city
    FROM coverage_areas c
    JOIN professionals p ON p.id = c.professional_id AND p.status = 'active'
    ORDER BY c.city`;
  return new Response(JSON.stringify({ citta: zone.map((z) => z.city) }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
