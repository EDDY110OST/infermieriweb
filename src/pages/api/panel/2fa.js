export const prerender = false;

import QRCode from "qrcode";
import { sql } from "../../../lib/db.js";
import { sessionFromRequest, verifyPassword, createSession, sessionCookie } from "../../../lib/auth.js";
import { generaSegreto, verificaCodice, urlOtpauth } from "../../../lib/totp.js";

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });

// Sessione rifatta dopo aver acceso o spento la 2FA, con il ruolo VERO preso dal database
const sessioneNuova = async (uid, tfa) => {
  const [u] = await sql`SELECT id, name, role, professional_id FROM professional_users WHERE id = ${uid}`;
  return sessionCookie(createSession({ uid: u.id, pid: u.professional_id, role: u.role, name: u.name, tfa }));
};

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
    // ha appena dimostrato il codice: la sessione diventa «con 2FA» (un admin entra subito
    // nell'amministrazione senza rifare l'accesso)
    return json({ ok: true, enabled: true }, 200, { "Set-Cookie": await sessioneNuova(session.uid, true) });
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
    // senza 2FA un admin perde subito l'accesso all'amministrazione
    return json({ ok: true, enabled: false }, 200, { "Set-Cookie": await sessioneNuova(session.uid, false) });
  }

  return json({ error: "Azione sconosciuta" }, 400);
}
