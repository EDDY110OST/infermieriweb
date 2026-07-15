export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/admin/contatti — richieste dal sito: lista d'attesa zone scoperte
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const listaAttesa = await sql`
    SELECT id, email, zona, created_at FROM waitlist ORDER BY created_at DESC LIMIT 300`;

  const perZona = await sql`
    SELECT zona, COUNT(*) AS n FROM waitlist GROUP BY zona ORDER BY n DESC LIMIT 20`;

  return json({ listaAttesa, perZona });
}
