export const prerender = false;

import { clearSessionCookie } from "../../../lib/auth.js";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Set-Cookie": clearSessionCookie },
  });
}
