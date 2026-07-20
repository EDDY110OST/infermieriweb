export const prerender = false;

import { sql } from "../../lib/db.js";
import { sendEmail } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// POST /api/richiedi-informazioni — richiesta di informazioni dal form pubblico
// (paziente o professionista). Registriamo la richiesta, avvisiamo gli admin via
// email (replyTo = chi scrive, così si risponde direttamente) e, se ha dato il
// consenso, lo aggiungiamo alla lista newsletter.
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const reason = String(body.reason || "").trim().slice(0, 80);
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const city = String(body.city || "").trim().slice(0, 80);
  const message = String(body.message || "").trim().slice(0, 2000);
  const newsletter = body.newsletter === true;

  if (name.length < 2 || !email.includes("@")) {
    return json({ error: "Servono almeno il nome e un'email valida" }, 400);
  }
  if (!(await consenti(`info:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  await sql`
    INSERT INTO info_requests (reason, name, email, phone, city, message, newsletter)
    VALUES (${reason}, ${name}, ${email}, ${phone}, ${city}, ${message}, ${newsletter})`;

  if (newsletter) {
    // Consenso registrato con data: se l'email c'è già, aggiorniamo solo la data.
    await sql`
      INSERT INTO newsletter_subscribers (email, source, consent_at)
      VALUES (${email}, 'richiedi-informazioni', now())
      ON CONFLICT (email) DO UPDATE SET consent_at = now()`;
  }

  try {
    await sendEmail({
      to: process.env.EMAIL_ASSISTENZA || "info@infermieriweb.it",
      replyTo: email,
      subject: `✉️ Richiesta informazioni: ${name}${reason ? ` — ${reason}` : ""}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Nuova richiesta di informazioni</h2>
        <table style="width: 100%; font-size: 15px;">
          <tr><td style="padding: 4px 0; color: #7b909b;">Motivo</td><td style="font-weight: bold;">${esc(reason) || "—"}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Nome</td><td style="font-weight: bold;">${esc(name)}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Contatti</td><td>${esc(email)}${phone ? " · " + esc(phone) : ""}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Città</td><td>${esc(city) || "—"}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Newsletter</td><td>${newsletter ? "Sì, ha dato il consenso" : "No"}</td></tr>
        </table>
        ${message ? `<p style="background: #f6f9f9; padding: 12px 14px; border-radius: 10px;">${esc(message)}</p>` : ""}
        <p style="color: #7b909b; font-size: 13px;">Rispondendo a questa email scrivi direttamente a chi ha fatto la richiesta.</p>
      </div>`,
    });
  } catch { /* la richiesta è comunque salvata */ }

  return json({ ok: true });
}
