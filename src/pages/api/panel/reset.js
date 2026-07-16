export const prerender = false;

import { sql } from "../../../lib/db.js";
import { readSession, hashPassword } from "../../../lib/auth.js";
import { consenti, ipDa } from "../../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/reset {token, password} — imposta la nuova password
// col token ricevuto via email (valido 60 minuti).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  if (!(await consenti(`reset-pro:${ipDa(request)}`, 5, 60))) {
    return json({ error: "Troppi tentativi: riprova più tardi" }, 429);
  }

  const sessione = readSession(body.token || "");
  if (sessione?.scope !== "reset-pro" || !sessione.email) {
    return json({ error: "Link scaduto o non valido: richiedi un nuovo reset dalla pagina di accesso." }, 400);
  }

  const password = String(body.password || "");
  if (password.length < 10) return json({ error: "La nuova password deve avere almeno 10 caratteri" }, 400);

  const aggiornati = await sql`
    UPDATE professional_users SET pass_hash = ${hashPassword(password)}
    WHERE lower(email) = ${sessione.email} RETURNING id`;
  if (!aggiornati.length) return json({ error: "Account non trovato" }, 404);

  return json({ ok: true });
}
