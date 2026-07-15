export const prerender = false;

import { sql } from "../../../lib/db.js";
import { verifyPassword, createSession, sessionCookie } from "../../../lib/auth.js";
import { consenti, ipDa } from "../../../lib/ratelimit.js";
import { verificaCodice } from "../../../lib/totp.js";

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json({ error: "Email e password obbligatorie" }, 400);

  if (!(await consenti(`login:${email}:${ipDa(request)}`, 5, 15))) {
    return json({ error: "Troppi tentativi: riprova tra 15 minuti" }, 429);
  }
  // Tetto globale per IP: blocca il password-spraying (1 password su tante email)
  if (!(await consenti(`login-ip:${ipDa(request)}`, 20, 15))) {
    return json({ error: "Troppi tentativi da questa rete: riprova tra 15 minuti" }, 429);
  }

  const [user] = await sql`
    SELECT u.id, u.email, u.pass_hash, u.name, u.role, u.professional_id, u.totp_enabled, u.totp_secret,
           p.slug, p.name AS professional_name
    FROM professional_users u JOIN professionals p ON p.id = u.professional_id
    WHERE lower(u.email) = ${email}`;

  if (!user || !verifyPassword(password, user.pass_hash)) {
    return json({ error: "Credenziali non corrette" }, 401);
  }

  // Autenticazione a due fattori: dopo la password serve il codice dell'app
  if (user.totp_enabled) {
    const codice = String(body.totp || "");
    if (!codice) return json({ need_totp: true, error: "Inserisci il codice a 6 cifre dell'app di autenticazione" }, 401);
    if (!verificaCodice(user.totp_secret, codice)) {
      return json({ need_totp: true, error: "Codice 2FA non valido" }, 401);
    }
  }

  const token = createSession({
    uid: user.id,
    pid: user.professional_id,
    role: user.role,
    name: user.name,
  });

  return json(
    { ok: true, name: user.name, professional: user.professional_name, role: user.role },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
