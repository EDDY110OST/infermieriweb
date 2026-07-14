export const prerender = false;

import { sql } from "../../lib/db.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/professionisti?q=lucca — elenco professionisti attivi per ricerca/mappa
export async function GET({ url }) {
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const rows = await sql`
    SELECT p.id, p.slug, p.name, p.profession, p.city, p.province, p.region,
           p.photo_url, p.lat, p.lng, p.bio, p.google_rating,
           COALESCE(r.avg_rating, 0) AS avg_rating,
           COALESCE(r.review_count, 0) AS review_count,
           COALESCE(s.min_price, 0) AS min_price_cents,
           COALESCE(c.cities, ARRAY[]::text[]) AS coverage,
           COALESCE(sv.nomi, ARRAY[]::text[]) AS servizi
    FROM professionals p
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
      FROM reviews WHERE professional_id = p.id AND status = 'published'
    ) r ON TRUE
    LEFT JOIN LATERAL (
      SELECT MIN(price_cents) AS min_price FROM services
      WHERE professional_id = p.id AND active
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT array_agg(city ORDER BY city) AS cities FROM coverage_areas
      WHERE professional_id = p.id
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT array_agg(name ORDER BY sort) AS nomi FROM services
      WHERE professional_id = p.id AND active
    ) sv ON TRUE
    WHERE p.status = 'active'
    ORDER BY p.name`;

  const results = q
    ? rows.filter((p) =>
        [p.name, p.city, p.province, p.region, p.profession, ...(p.coverage || []), ...(p.servizi || [])]
          .join(" ").toLowerCase().includes(q))
    : rows;

  return json({ professionisti: results });
}
