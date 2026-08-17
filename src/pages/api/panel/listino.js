export const prerender = false;

import { sessionFromRequest, pidBersaglio } from "../../../lib/auth.js";
import { listinoPerProfessionista } from "../../../lib/listino.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/listino[?pid=12] — le prestazioni che il professionista può
// scegliere: quelle del listino generale (decise dagli amministratori) più le
// eventuali voci create su misura per lui. Non può aggiungerne di sue.
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  const url = new URL(request.url);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const voci = await listinoPerProfessionista(pid);
  return json({ voci });
}
