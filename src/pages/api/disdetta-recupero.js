export const prerender = false;

import { sql } from "../../lib/db.js";
import { sendEmail } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const dataEstesa = (iso) =>
  new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

// POST /api/disdetta-recupero {email} — rimanda il link di gestione a chi
// ha perso l'email di conferma. Risponde SEMPRE ok (niente enumerazione email).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) return json({ error: "Inserisci un'email valida" }, 400);

  if (!(await consenti(`recupero:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  const prenotazioni = await sql`
    SELECT b.start_dt, b.cancel_token, s.name AS service_name, p.name AS professional_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE lower(b.customer_email) = ${email} AND b.status = 'active' AND b.start_dt > now()
    ORDER BY b.start_dt LIMIT 10`;

  if (prenotazioni.length) {
    const righe = prenotazioni.map((b) => `
      <p style="margin: 10px 0; padding: 10px 14px; background: #f6f9f9; border-radius: 10px;">
        <strong>${b.service_name}</strong> con ${b.professional_name}<br/>
        <span style="text-transform: capitalize;">${dataEstesa(b.start_dt)}</span><br/>
        <a href="https://infermieriweb.it/prenotazione?token=${b.cancel_token}">Gestisci o disdici questa prenotazione</a>
      </p>`).join("");
    await sendEmail({
      to: email,
      subject: "Le tue prenotazioni su InfermieriWeb",
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Le tue prenotazioni attive</h2>
        ${righe}
        <p style="color: #7b909b; font-size: 13px;">Hai ricevuto questa email perché è stato richiesto il recupero
        dei link di gestione dal sito. Se non sei stato tu, ignorala.</p>
      </div>`,
    });
  }

  // sempre ok: chi chiede per un'email senza prenotazioni non deve poterlo capire
  return json({ ok: true });
}
