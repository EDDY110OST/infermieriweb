export const prerender = false;

import { sql } from "../../lib/db.js";
import { readSession, createSession } from "../../lib/auth.js";
import { sendEmail, emailConfermaPaziente, emailNotificaProfessionista } from "../../lib/mailer.js";
import { pushToProfessional } from "../../lib/push.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/conferma {token} — convalida una prenotazione pending (double opt-in).
// Solo QUI il professionista viene avvisato (email + push): mai per prenotazioni fantasma.
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const sessione = readSession(body.token || "");
  if (sessione?.scope !== "conferma" || !sessione.bid) {
    return json({ error: "Link di convalida non valido o scaduto: se sono passati più di 60 minuti, la prenotazione si è annullata da sola. Puoi prenotare di nuovo." }, 400);
  }

  const [b] = await sql`
    SELECT b.id, b.status, b.created_at, b.start_dt, b.customer_name, b.customer_phone,
           b.customer_email, b.address, b.city, b.cancel_token, b.professional_id,
           s.name AS service_name, p.name AS professional_name, p.full_name AS professional_full_name, p.gender AS professional_gender, p.email AS professional_email,
           p.slug AS professional_slug, p.cancel_hours
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.id = ${sessione.bid}`;
  if (!b) return json({ error: "Prenotazione non trovata" }, 404);

  if (b.status === "active") return json({ ok: true, gia_convalidata: true, cancel_token: b.cancel_token });
  if (b.status === "cancelled" || b.status === "expired") {
    return json({ error: "Questa prenotazione è stata annullata: puoi prenotare di nuovo quando vuoi." }, 410);
  }

  // convalida atomica: solo se ancora pending e dentro la finestra dei 60 minuti
  const ok = await sql`
    UPDATE bookings SET status = 'active'
    WHERE id = ${b.id} AND status = 'pending' AND created_at > now() - interval '60 minutes'
    RETURNING id`;
  if (!ok.length) {
    await sql`UPDATE bookings SET status = 'expired' WHERE id = ${b.id} AND status = 'pending'`;
    return json({ error: "Sono passati più di 60 minuti: l'orario è tornato disponibile. Puoi prenotare di nuovo." }, 410);
  }

  const booking = {
    name: b.customer_name, phone: b.customer_phone, email: b.customer_email,
    address: b.address, city: b.city, start: new Date(b.start_dt).toISOString(),
  };
  // Nella conferma il paziente ha diritto al nome COMPLETO di chi verrà a casa
  const titoloProf = b.professional_gender === "f" ? "Dott.ssa" : "Dott.";
  const professional = {
    name: b.professional_full_name ? `${titoloProf} ${b.professional_full_name}` : b.professional_name,
    email: b.professional_email,
    slug: b.professional_slug, cancel_hours: b.cancel_hours,
  };
  const svc = { name: b.service_name };

  // al paziente: la conferma definitiva con link di gestione e area personale
  const areaToken = createSession({ scope: "paziente", email: String(b.customer_email).trim().toLowerCase() }, 60 * 60 * 24 * 30);
  const areaLink = `https://infermieriweb.it/le-mie-prenotazioni?token=${encodeURIComponent(areaToken)}`;
  const conferma = emailConfermaPaziente({ booking, professional, service: svc, cancelToken: b.cancel_token, areaLink });
  await sendEmail({ to: b.customer_email, toName: b.customer_name, replyTo: professional.email || undefined, ...conferma });

  // SOLO ORA il professionista: email + push
  if (professional.email) {
    const notifica = emailNotificaProfessionista({ booking, service: svc });
    await sendEmail({ to: professional.email, toName: professional.name, replyTo: b.customer_email, ...notifica });
  }
  const quando = new Date(b.start_dt).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  await pushToProfessional(b.professional_id, {
    title: "📅 Nuova prenotazione",
    body: `${b.service_name} · ${quando} — ${b.customer_name}`,
    tag: `booking-${b.id}`,
  });

  return json({ ok: true, cancel_token: b.cancel_token });
}
