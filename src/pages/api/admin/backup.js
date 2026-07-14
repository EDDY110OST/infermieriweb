export const prerender = false;

import { sessionFromRequest } from "../../../lib/auth.js";
import { eseguiBackup } from "../../../lib/backup.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/admin/backup — backup immediato via email (oltre a quello notturno)
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const esito = await eseguiBackup();
  return json(esito, esito.ok ? 200 : 502);
}
