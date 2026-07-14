export const prerender = false;

import { randomBytes } from "node:crypto";
import { sql } from "../../lib/db.js";
import { sendEmail, emailConfermaPaziente, emailNotificaProfessionista } from "../../lib/mailer.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/prenota — crea una prenotazione (paziente, senza account)
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const professionalId = Number(body.professional_id);
  const serviceId = Number(body.service_id);
  const start = new Date(body.start || "");
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const address = String(body.address || "").trim();
  const city = String(body.city || "").trim();

  if (!professionalId || !serviceId || isNaN(start.getTime())) return json({ error: "Dati prenotazione incompleti" }, 400);
  if (name.length < 2 || phone.length < 6) return json({ error: "Nome e telefono sono obbligatori" }, 400);
  if (!email.includes("@") || email.length < 6) return json({ error: "Serve una email valida: riceverai lì la conferma e il link per disdire" }, 400);
  if (!body.privacy) return json({ error: "Serve il consenso al trattamento dei dati" }, 400);

  const [service] = await sql`
    SELECT s.duration_min, s.name AS service_name, s.price_cents,
           p.lead_minutes, p.cancel_hours, p.name AS professional_name, p.email AS professional_email,
           p.slug AS professional_slug, p.status
    FROM services s JOIN professionals p ON p.id = s.professional_id
    WHERE s.id = ${serviceId} AND s.professional_id = ${professionalId} AND s.active`;
  if (!service || service.status !== "active") return json({ error: "Servizio non disponibile" }, 404);

  if (start.getTime() < Date.now() + service.lead_minutes * 60000) {
    return json({ error: "Orario non più disponibile: scegli uno slot successivo" }, 409);
  }

  const end = new Date(start.getTime() + service.duration_min * 60000);
  const cancelToken = randomBytes(24).toString("hex");

  // Inserimento atomico: fallisce se lo slot è stato preso nel frattempo
  const inserted = await sql`
    INSERT INTO bookings (professional_id, service_id, start_dt, end_dt, customer_name, customer_phone, customer_email, address, city, status, source, cancel_token)
    SELECT ${professionalId}, ${serviceId}, ${start.toISOString()}, ${end.toISOString()},
           ${name}, ${phone}, ${email}, ${address}, ${city}, 'active', 'online', ${cancelToken}
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE professional_id = ${professionalId} AND status = 'active'
        AND start_dt < ${end.toISOString()} AND end_dt > ${start.toISOString()}
    ) AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE professional_id = ${professionalId}
        AND start_dt < ${end.toISOString()} AND end_dt > ${start.toISOString()}
    )
    RETURNING id`;

  if (!inserted.length) return json({ error: "Ops: qualcun altro ha appena prenotato questo orario. Scegline un altro." }, 409);

  // Email stile Prenotazioni Sbarba, con reply-to incrociato:
  // al paziente (risposte -> professionista) e al professionista (risposte -> paziente)
  const booking = { name, phone, email, address, city, start: start.toISOString() };
  const professional = {
    name: service.professional_name,
    email: service.professional_email,
    slug: service.professional_slug,
    cancel_hours: service.cancel_hours,
  };
  const svc = { name: service.service_name };

  const conferma = emailConfermaPaziente({ booking, professional, service: svc, cancelToken });
  const emailedPaziente = await sendEmail({
    to: email, toName: name, replyTo: professional.email || undefined, ...conferma,
  });

  if (professional.email) {
    const notifica = emailNotificaProfessionista({ booking, service: svc });
    await sendEmail({ to: professional.email, toName: professional.name, replyTo: email, ...notifica });
  }

  return json({
    ok: true,
    booking_id: inserted[0].id,
    emailed: emailedPaziente,
    cancel_token: emailedPaziente ? undefined : cancelToken, // fallback finché le email non sono attive
    professional: service.professional_name,
    service: service.service_name,
    start: start.toISOString(),
  });
}
