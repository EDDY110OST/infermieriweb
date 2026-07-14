export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/statistiche — il valore reso visibile: mese corrente vs precedente
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);
  const pid = session.pid;

  const [prenotazioni] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE start_dt >= date_trunc('month', now()) AND status <> 'cancelled') AS mese,
      COUNT(*) FILTER (WHERE start_dt >= date_trunc('month', now() - interval '1 month')
                         AND start_dt < date_trunc('month', now()) AND status <> 'cancelled') AS mese_prec,
      COUNT(*) FILTER (WHERE status = 'done') AS completate_totali
    FROM bookings WHERE professional_id = ${pid}`;

  const [visite] = await sql`
    SELECT
      COALESCE(SUM(views) FILTER (WHERE day >= date_trunc('month', now())), 0) AS mese,
      COALESCE(SUM(views) FILTER (WHERE day >= date_trunc('month', now() - interval '1 month')
                                    AND day < date_trunc('month', now())), 0) AS mese_prec
    FROM profile_views WHERE professional_id = ${pid}`;

  const [recensioni] = await sql`
    SELECT ROUND(AVG(rating)::numeric, 1) AS media, COUNT(*) AS totale
    FROM reviews WHERE professional_id = ${pid} AND status = 'published'`;

  return json({
    prenotazioni: { mese: Number(prenotazioni.mese), mesePrec: Number(prenotazioni.mese_prec), completateTotali: Number(prenotazioni.completate_totali) },
    visite: { mese: Number(visite.mese), mesePrec: Number(visite.mese_prec) },
    recensioni: { media: recensioni.media ? Number(recensioni.media) : null, totale: Number(recensioni.totale) },
  });
}
