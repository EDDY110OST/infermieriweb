export const prerender = false;

import { sql } from "../../lib/db.js";
import { sendEmail } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// POST /api/strutture-lead — richiesta di contatto da una struttura sanitaria.
// Fase 1: registriamo la domanda e avvisiamo gli admin (il canale B2B si
// costruisce solo se queste richieste arrivano davvero).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const name = String(body.name || "").trim().slice(0, 120);
  const type = String(body.type || "").trim().slice(0, 60);
  const city = String(body.city || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const message = String(body.message || "").trim().slice(0, 2000);

  if (name.length < 2 || !email.includes("@")) {
    return json({ error: "Servono almeno il nome della struttura e un'email" }, 400);
  }
  if (!(await consenti(`strutture:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  await sql`
    INSERT INTO structure_leads (name, type, city, email, phone, message)
    VALUES (${name}, ${type}, ${city}, ${email}, ${phone}, ${message})`;

  try {
    await sendEmail({
      to: "infermieri.ef@gmail.com",
      subject: `🏥 Richiesta da una STRUTTURA: ${name}${city ? ` (${city})` : ""}`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Una struttura cerca infermieri</h2>
        <table style="width: 100%; font-size: 15px;">
          <tr><td style="padding: 4px 0; color: #7b909b;">Struttura</td><td style="font-weight: bold;">${esc(name)}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Tipo</td><td>${esc(type) || "—"}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Città</td><td>${esc(city) || "—"}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Contatti</td><td>${esc(email)}${phone ? " · " + esc(phone) : ""}</td></tr>
        </table>
        ${message ? `<p style="background: #f6f9f9; padding: 12px 14px; border-radius: 10px;">${esc(message)}</p>` : ""}
        <p style="color: #7b909b; font-size: 13px;">Richiesta ricevuta dal modulo strutture.</p>
      </div>`,
    });
  } catch { /* il lead è comunque salvato */ }

  return json({ ok: true });
}
