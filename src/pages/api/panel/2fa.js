export const prerender = false;

import QRCode from "qrcode";
import { sql } from "../../../lib/db.js";
import { sessionFromRequest, verifyPassword } from "../../../lib/auth.js";
import { generaSegreto, verificaCodice, urlOtpauth } from "../../../lib/totp.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/2fa — stato 2FA dell'utente loggato
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const [u] = await sql`SELECT totp_enabled FROM professional_users WHERE id = ${session.uid}`;
  return json({ enabled: !!u?.totp_enabled });
}

// POST /api/panel/2fa — {action: "setup" | "enable" | "disable", code?, password?}
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const action = String(body.action || "");

  const [user] = await sql`
    SELECT email, pass_hash, totp_secret, totp_enabled, totp_pending
    FROM professional_users WHERE id = ${session.uid}`;
  if (!user) return json({ error: "Utente non trovato" }, 404);

  if (action === "setup") {
    // genera un segreto "in attesa": diventa attivo solo dopo la verifica del primo codice
    const segreto = generaSegreto();
    await sql`UPDATE professional_users SET totp_pending = ${segreto} WHERE id = ${session.uid}`;
    const otpauth = urlOtpauth(segreto, user.email);
    const qr = await QRCode.toDataURL(otpauth, { margin: 1, width: 220 });
    return json({ ok: true, secret: segreto, otpauth, qr });
  }

  if (action === "enable") {
    if (!user.totp_pending) return json({ error: "Prima genera il codice QR (setup)" }, 400);
    if (!verificaCodice(user.totp_pending, body.code)) {
      return json({ error: "Codice non valido: controlla l'app e riprova" }, 400);
    }
    await sql`
      UPDATE professional_users
      SET totp_secret = totp_pending, totp_enabled = TRUE, totp_pending = ''
      WHERE id = ${session.uid}`;
    return json({ ok: true, enabled: true });
  }

  if (action === "disable") {
    // per spegnere servono SIA la password SIA un codice valido (anti-furto di sessione)
    if (!verifyPassword(String(body.password || ""), user.pass_hash)) {
      return json({ error: "Password non corretta" }, 401);
    }
    if (!verificaCodice(user.totp_secret, body.code)) {
      return json({ error: "Codice 2FA non valido" }, 400);
    }
    await sql`
      UPDATE professional_users
      SET totp_secret = '', totp_enabled = FALSE, totp_pending = ''
      WHERE id = ${session.uid}`;
    return json({ ok: true, enabled: false });
  }

  return json({ error: "Azione sconosciuta" }, 400);
}
