export const prerender = false;

import { sql } from "../../lib/db.js";
import { sendEmail, emailDisdettaProfessionista } from "../../lib/mailer.js";
import { pushToProfessional } from "../../lib/push.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/disdetta?token=... — dati della prenotazione (per la pagina di disdetta)
export async function GET({ url }) {
  const token = url.searchParams.get("token") || "";
  if (token.length < 20) return json({ error: "Link non valido" }, 400);

  const [booking] = await sql`
    SELECT b.id, b.start_dt, b.status, s.name AS service_name, p.name AS professional_name, p.cancel_hours
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.cancel_token = ${token}`;
  if (!booking) return json({ error: "Prenotazione non trovata" }, 404);

  const deadline = new Date(booking.start_dt).getTime() - booking.cancel_hours * 3600000;
  return json({
    booking: {
      id: booking.id,
      start: booking.start_dt,
      status: booking.status,
      service: booking.service_name,
      professional: booking.professional_name,
      cancellable: booking.status === "active" && Date.now() < deadline,
      cancel_hours: booking.cancel_hours,
    },
  });
}

// POST /api/disdetta {token} — annulla la prenotazione
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  const token = String(body.token || "");
  if (token.length < 20) return json({ error: "Link non valido" }, 400);

  const updated = await sql`
    UPDATE bookings b
    SET status = 'cancelled'
    FROM professionals p, services s
    WHERE b.professional_id = p.id AND s.id = b.service_id
      AND b.cancel_token = ${token}
      AND b.status = 'active'
      AND b.start_dt > now() + (p.cancel_hours || ' hours')::interval
    RETURNING b.customer_name, b.customer_email, b.start_dt,
              s.name AS service_name, p.name AS professional_name, p.email AS professional_email`;

  if (!updated.length) return json({ error: "Disdetta non più possibile online: contatta direttamente il professionista." }, 409);

  // Avvisa il professionista (risposte -> paziente)
  const b = updated[0];
  const quando = new Date(b.start_dt).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
  await pushToProfessional(
    (await sql`SELECT professional_id FROM bookings WHERE cancel_token = ${token}`)[0].professional_id,
    { title: "❌ Disdetta paziente", body: `${b.service_name} · ${quando} — ${b.customer_name}. Lo slot è tornato libero.` }
  );
  if (b.professional_email) {
    const avviso = emailDisdettaProfessionista({
      booking: { name: b.customer_name, start: b.start_dt },
      service: { name: b.service_name },
    });
    await sendEmail({
      to: b.professional_email, toName: b.professional_name,
      replyTo: b.customer_email || undefined, ...avviso,
    });
  }

  return json({ ok: true });
}
