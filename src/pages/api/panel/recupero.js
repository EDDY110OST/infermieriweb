export const prerender = false;

import { sql } from "../../../lib/db.js";
import { linkReimpostaPassword } from "../../../lib/auth.js";
import { sendEmail, emailRecuperoPasswordProfessionista } from "../../../lib/mailer.js";
import { consenti, ipDa } from "../../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/recupero {email} — invia il link per reimpostare la password.
// Risponde SEMPRE ok (niente enumerazione degli account).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) return json({ error: "Inserisci un'email valida" }, 400);

  if (!(await consenti(`recupero-pro:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  const [utente] = await sql`
    SELECT name, pass_hash FROM professional_users WHERE lower(email) = ${email}`;

  if (utente) {
    // vale 60 minuti e una volta sola (impronta della password attuale, vedi lib/auth.js)
    const resetLink = linkReimpostaPassword({ email, passHash: utente.pass_hash, secondi: 60 * 60 });
    const mail = emailRecuperoPasswordProfessionista({ name: utente.name, resetLink });
    await sendEmail({ to: email, toName: utente.name, ...mail });
  }

  return json({ ok: true });
}
