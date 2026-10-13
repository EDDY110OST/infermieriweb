export const prerender = false;

import { clearSessionCookie, sessionFromRequest } from "../../../lib/auth.js";
import { registraAccesso } from "../../../lib/accessi-server.js";

export async function POST({ request }) {
  // registro accessi: l'uscita si annota solo se c'era davvero una sessione
  const session = sessionFromRequest(request);
  if (session?.uid) await registraAccesso({ evento: "uscita", request, uid: session.uid, pid: session.pid });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie },
  });
}
