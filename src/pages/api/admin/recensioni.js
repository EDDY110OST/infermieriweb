export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  return session && session.role === "admin" ? session : null;
};

// GET /api/admin/recensioni — in attesa di moderazione
export async function GET({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const recensioni = await sql`
    SELECT r.id, r.rating, r.text, r.author_name, r.created_at, p.name AS professional_name
    FROM reviews r JOIN professionals p ON p.id = r.professional_id
    WHERE r.status = 'pending' ORDER BY r.created_at`;
  return json({ recensioni });
}

// POST /api/admin/recensioni {id, action: "publish"|"reject"}
export async function POST({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const id = Number(body.id);
  const action = String(body.action || "");
  if (!id || !["publish", "reject"].includes(action)) return json({ error: "Dati non validi" }, 400);

  const status = action === "publish" ? "published" : "rejected";
  const updated = await sql`
    UPDATE reviews SET status = ${status} WHERE id = ${id} AND status = 'pending' RETURNING id`;
  if (!updated.length) return json({ error: "Recensione non trovata o già moderata" }, 404);
  return json({ ok: true });
}
