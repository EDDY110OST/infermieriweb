export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const dataValida = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? s : null);

// GET /api/admin/prenotazioni-per-infermiere?da=YYYY-MM-DD&a=YYYY-MM-DD&su=created|start
// Per ogni infermiere: quante richieste ha ricevuto e come sono finite. Serve a capire
// se la piattaforma gli porta lavoro. Periodo sulla data di RICHIESTA (created, default)
// o di APPUNTAMENTO (start). "Da chi" è annullata lo sappiamo solo dal 7/10/26
// (cancelled_by); prima = "non noto".
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const da = dataValida(url.searchParams.get("da"));
  const a = dataValida(url.searchParams.get("a"));
  const su = url.searchParams.get("su") === "start" ? "start" : "created";
  // fine periodo inclusa: < giorno dopo
  const aDopo = a ? new Date(new Date(a + "T00:00:00Z").getTime() + 86400000).toISOString().slice(0, 10) : null;

  const righe = su === "start"
    ? await sql`
        SELECT p.id, p.name, p.slug, p.status, p.city,
               COUNT(b.id)::int AS richieste,
               COUNT(b.id) FILTER (WHERE b.status IN ('pending', 'expired'))::int AS mai_convalidate,
               COUNT(b.id) FILTER (WHERE b.status = 'active')::int AS confermate,
               COUNT(b.id) FILTER (WHERE b.accepted_at IS NOT NULL)::int AS accettate,
               COUNT(b.id) FILTER (WHERE b.status = 'done')::int AS completate,
               COUNT(b.id) FILTER (WHERE b.status = 'noshow')::int AS no_show,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by = 'paziente')::int AS annullate_paziente,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by = 'professionista')::int AS annullate_professionista,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by NOT IN ('paziente', 'professionista'))::int AS annullate_altro,
               MAX(b.created_at) AS ultima_richiesta
        FROM professionals p
        LEFT JOIN bookings b ON b.professional_id = p.id
          AND (${da}::timestamptz IS NULL OR b.start_dt >= ${da}::timestamptz)
          AND (${aDopo}::timestamptz IS NULL OR b.start_dt < ${aDopo}::timestamptz)
        WHERE p.status <> 'deleted'
        GROUP BY p.id ORDER BY richieste DESC, p.name`
    : await sql`
        SELECT p.id, p.name, p.slug, p.status, p.city,
               COUNT(b.id)::int AS richieste,
               COUNT(b.id) FILTER (WHERE b.status IN ('pending', 'expired'))::int AS mai_convalidate,
               COUNT(b.id) FILTER (WHERE b.status = 'active')::int AS confermate,
               COUNT(b.id) FILTER (WHERE b.accepted_at IS NOT NULL)::int AS accettate,
               COUNT(b.id) FILTER (WHERE b.status = 'done')::int AS completate,
               COUNT(b.id) FILTER (WHERE b.status = 'noshow')::int AS no_show,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by = 'paziente')::int AS annullate_paziente,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by = 'professionista')::int AS annullate_professionista,
               COUNT(b.id) FILTER (WHERE b.status = 'cancelled' AND b.cancelled_by NOT IN ('paziente', 'professionista'))::int AS annullate_altro,
               MAX(b.created_at) AS ultima_richiesta
        FROM professionals p
        LEFT JOIN bookings b ON b.professional_id = p.id
          AND (${da}::timestamptz IS NULL OR b.created_at >= ${da}::timestamptz)
          AND (${aDopo}::timestamptz IS NULL OR b.created_at < ${aDopo}::timestamptz)
        WHERE p.status <> 'deleted'
        GROUP BY p.id ORDER BY richieste DESC, p.name`;

  return json({ righe, da, a, su });
}
