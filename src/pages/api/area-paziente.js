export const prerender = false;

import { sql } from "../../lib/db.js";
import { sendEmail } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";
import { createSession } from "../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/area-paziente {email} — manda il link magico per l'area
// "Le mie prenotazioni". Niente password: l'email È l'identità.
// Risponde SEMPRE ok (niente enumerazione email).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) return json({ error: "Inserisci un'email valida" }, 400);

  if (!(await consenti(`area-paziente:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  const [esiste] = await sql`
    SELECT 1 FROM bookings WHERE lower(customer_email) = ${email} LIMIT 1`;

  if (esiste) {
    // 30 giorni: stesso livello di fiducia dei link di gestione già in uso
    const token = createSession({ scope: "paziente", email }, 60 * 60 * 24 * 30);
    const link = `https://infermieriweb.it/le-mie-prenotazioni?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Il tuo accesso a Le mie prenotazioni — InfermieriWeb",
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Le tue prenotazioni, a portata di click</h2>
        <p>Ecco il tuo link personale: dentro trovi tutte le tue prenotazioni su InfermieriWeb,
        con la possibilità di gestirle, disdirle o riprenotare lo stesso professionista in due tocchi.</p>
        <p style="text-align: center; margin: 22px 0;">
          <a href="${link}" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Apri le mie prenotazioni</a>
        </p>
        <p style="color: #7b909b; font-size: 13px;">Il link è personale e vale 30 giorni: non condividerlo.
        Se non hai richiesto tu questo accesso, ignora questa email.</p>
      </div>`,
    });
  }

  return json({ ok: true });
}
