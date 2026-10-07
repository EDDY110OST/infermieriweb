export const prerender = false;

import { sql } from "../../../lib/db.js";
import { readSession, hashPassword, improntaPassword } from "../../../lib/auth.js";
import { consenti, ipDa } from "../../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/reset {token, password} — imposta la nuova password
// col token ricevuto via email (60 minuti dal recupero, 72 ore dal benvenuto rimandato).
// Se il token porta l'impronta della password (fp), vale una volta sola: dopo il cambio
// l'impronta non corrisponde più. I token vecchi senza impronta restano validi fino a scadenza.
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

  const [utente] = await sql`SELECT id, pass_hash FROM professional_users WHERE lower(email) = ${sessione.email}`;
  if (!utente) return json({ error: "Account non trovato: forse l'email per entrare è cambiata. Usa «Password dimenticata?» nella pagina di accesso." }, 404);
  if (sessione.fp && sessione.fp !== improntaPassword(utente.pass_hash)) {
    return json({ error: "Questo link è già stato usato. Se ti serve, chiedine uno nuovo con «Password dimenticata?» nella pagina di accesso." }, 400);
  }

  await sql`UPDATE professional_users SET pass_hash = ${hashPassword(password)} WHERE id = ${utente.id}`;

  return json({ ok: true });
}
