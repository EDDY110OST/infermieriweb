export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, verifyPassword, hashPassword } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/password {attuale, nuova}
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const attuale = String(body.attuale || "");
  const nuova = String(body.nuova || "");
  if (nuova.length < 10) return json({ error: "La nuova password deve avere almeno 10 caratteri" }, 400);
  if (nuova === attuale) return json({ error: "La nuova password è uguale a quella attuale" }, 400);

  const [utente] = await sql`SELECT pass_hash FROM professional_users WHERE id = ${session.uid}`;
  if (!utente || !verifyPassword(attuale, utente.pass_hash)) {
    return json({ error: "La password attuale non è corretta" }, 401);
  }

  await sql`UPDATE professional_users SET pass_hash = ${hashPassword(nuova)} WHERE id = ${session.uid}`;
  return json({ ok: true });
}
