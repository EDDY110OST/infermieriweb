export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/statistiche — i numeri della dashboard admin
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const utente = { nome: session.name || "Admin", ruolo: session.role };

  const [kpi] = await sql`
    SELECT
      (SELECT COUNT(*) FROM bookings WHERE created_at::date = (now() AT TIME ZONE 'Europe/Rome')::date) AS richieste_oggi,
      (SELECT COUNT(*) FROM bookings WHERE status = 'active' AND start_dt > now()) AS prenotate_future,
      (SELECT COUNT(*) FROM bookings WHERE created_at > now() - interval '7 days') AS richieste_7gg,
      (SELECT COUNT(*) FROM bookings WHERE status = 'done') AS completate_totali,
      (SELECT COUNT(*) FROM professionals WHERE status = 'active') AS professionisti_attivi,
      (SELECT COUNT(*) FROM professionals WHERE created_at > now() - interval '30 days') AS professionisti_nuovi_30gg,
      (SELECT COUNT(*) FROM applications WHERE status = 'new') AS candidature_in_attesa,
      (SELECT COUNT(*) FROM reviews WHERE status = 'pending') AS recensioni_da_moderare,
      (SELECT COUNT(*) FROM reviews WHERE status = 'published') AS recensioni_pubblicate,
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE status = 'published') AS media_recensioni,
      (SELECT COUNT(DISTINCT customer_phone) FROM bookings) AS pazienti_unici,
      (SELECT COUNT(*) FROM articles WHERE status = 'published') AS articoli_online`;

  const perStato = await sql`
    SELECT status, COUNT(*) AS n FROM bookings GROUP BY status`;

  const ultime = await sql`
    SELECT b.id, b.start_dt, b.status, b.customer_name, s.name AS service_name, p.name AS professional_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    ORDER BY b.created_at DESC LIMIT 8`;

  // task in sospeso per la dashboard
  const task = [];
  if (Number(kpi.candidature_in_attesa) > 0) task.push({ testo: `${kpi.candidature_in_attesa} candidatura/e da esaminare`, sezione: "inf-verifica" });
  if (Number(kpi.recensioni_da_moderare) > 0) task.push({ testo: `${kpi.recensioni_da_moderare} recensione/i da moderare`, sezione: "rec-moderazione" });

  return json({ utente, kpi, perStato, ultime, task });
}
