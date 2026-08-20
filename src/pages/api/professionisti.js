export const prerender = false;

import { sql } from "../../lib/db.js";
import { coordinateComune, normalizza } from "../../data/comuni.js";
import { jitterPerId } from "../../lib/geocode.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Un segnaposto per ogni zona coperta: il professionista va a domicilio in tutti
// i comuni che ha indicato, non solo dove abita. Le coordinate escono dall'elenco
// dei comuni (sono comuni ISTAT validati in fase di inserimento), quindi nessuna
// chiamata esterna: la mappa è pronta subito.
// Dove più professionisti coprono lo stesso comune i segnaposti si scostano di
// qualche centinaio di metri, altrimenti si coprirebbero a vicenda e se ne
// vedrebbe uno solo.
export function segnapostiPerZona(righe) {
  const quantiSulComune = new Map();
  for (const p of righe) {
    for (const z of p.zone || []) {
      const k = normalizza(z.city);
      quantiSulComune.set(k, (quantiSulComune.get(k) || 0) + 1);
    }
  }

  for (const p of righe) {
    const pins = [];
    for (const z of p.zone || []) {
      const punto = coordinateComune(z.city, z.province);
      if (!punto) continue;
      const affollato = (quantiSulComune.get(normalizza(z.city)) || 0) > 1;
      const { lat, lng } = affollato ? jitterPerId(punto.lat, punto.lng, p.id) : punto;
      pins.push({ city: z.city, lat, lng });
    }
    // ripiego: comune sconosciuto all'elenco → resta il punto geocodificato del
    // profilo, così dalla mappa non sparisce nessuno
    if (!pins.length && p.lat != null && p.lng != null) {
      pins.push({ city: p.city, lat: Number(p.lat), lng: Number(p.lng) });
    }
    p.pins = pins;
    delete p.zone;
  }
  return righe;
}

// GET /api/professionisti?q=lucca — elenco professionisti attivi per ricerca/mappa.
// Conta SOLO chi offre prestazioni a domicilio: chi fa solo consulenze per
// colleghi (chiavi "consulenza-*") non è un infermiere da prenotare a casa,
// e si trova da /consulenza.
export async function GET({ url }) {
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const rows = await sql`
    SELECT p.id, p.slug, p.name, p.profession, p.city, p.province, p.region,
           p.photo_url, p.lat, p.lng, p.bio, p.google_rating,
           COALESCE(r.avg_rating, 0) AS avg_rating,
           COALESCE(r.review_count, 0) AS review_count,
           COALESCE(s.min_price, 0) AS min_price_cents,
           COALESCE(c.cities, ARRAY[]::text[]) AS coverage,
           COALESCE(c.zone, '[]'::json) AS zone,
           COALESCE(sv.nomi, ARRAY[]::text[]) AS servizi
    FROM professionals p
    LEFT JOIN LATERAL (
      SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
      FROM reviews WHERE professional_id = p.id AND status = 'published'
    ) r ON TRUE
    LEFT JOIN LATERAL (
      SELECT MIN(price_cents) AS min_price FROM services
      WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%'
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT array_agg(city ORDER BY city) AS cities,
             json_agg(json_build_object('city', city, 'province', province) ORDER BY city) AS zone
      FROM coverage_areas WHERE professional_id = p.id
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT array_agg(name ORDER BY sort) AS nomi FROM services
      WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%'
    ) sv ON TRUE
    WHERE p.status = 'active' AND EXISTS (SELECT 1 FROM services WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%')
    ORDER BY p.name`;

  segnapostiPerZona(rows);

  const results = q
    ? rows.filter((p) =>
        [p.name, p.city, p.province, p.region, p.profession, ...(p.coverage || []), ...(p.servizi || [])]
          .join(" ").toLowerCase().includes(q))
    : rows;

  return json({ professionisti: results });
}
