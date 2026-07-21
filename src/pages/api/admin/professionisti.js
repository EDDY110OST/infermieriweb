export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  return session && session.role === "admin" ? session : null;
};

// GET /api/admin/professionisti — elenco completo con dati operativi
export async function GET({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);

  const professionisti = await sql`
    SELECT p.id, p.slug, p.name, p.profession, p.city, p.province, p.status,
           p.albo_name, p.albo_number, p.albo_date, p.vat_number, p.phone, p.email,
           p.photo_url, p.lat, p.lng, p.created_at,
           COALESCE(s.n, 0) AS servizi,
           COALESCE(b.n, 0) AS prenotazioni_totali,
           COALESCE(b30.n, 0) AS prenotazioni_30gg,
           COALESCE(r.media, 0) AS rating,
           COALESCE(r.n, 0) AS recensioni,
           COALESCE(z.zone, ARRAY[]::text[]) AS zone
    FROM professionals p
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM services WHERE professional_id = p.id AND active) s ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM bookings WHERE professional_id = p.id) b ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM bookings WHERE professional_id = p.id AND created_at > now() - interval '30 days') b30 ON TRUE
    LEFT JOIN LATERAL (SELECT ROUND(AVG(rating)::numeric,1) AS media, COUNT(*) AS n FROM reviews WHERE professional_id = p.id AND status = 'published') r ON TRUE
    LEFT JOIN LATERAL (SELECT array_agg(city ORDER BY city) AS zone FROM coverage_areas WHERE professional_id = p.id) z ON TRUE
    ORDER BY p.created_at DESC`;

  return json({ professionisti });
}

// PATCH /api/admin/professionisti {id, status} — attiva / sospende
export async function PATCH({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  let status = String(body.status || "");
  if (!id || !["active", "suspended", "pending", "network"].includes(status)) return json({ error: "Dati non validi" }, 400);

  // Riattivare un professionista SENZA P.IVA non deve renderlo pubblicamente prenotabile:
  // torna a "network" (non attivo) invece che ad "active".
  if (status === "active") {
    const [p] = await sql`SELECT vat_number FROM professionals WHERE id = ${id}`;
    if (p && !p.vat_number) status = "network";
  }

  const updated = await sql`UPDATE professionals SET status = ${status} WHERE id = ${id} RETURNING id`;
  if (!updated.length) return json({ error: "Professionista non trovato" }, 404);
  return json({ ok: true, status });
}
