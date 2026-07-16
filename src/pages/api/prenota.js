export const prerender = false;

import { randomBytes } from "node:crypto";
import { sql } from "../../lib/db.js";
import { createSession } from "../../lib/auth.js";
import { sendEmail, emailConvalidaPrenotazione } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

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

  if (!(await consenti(`prenota:${ipDa(request)}`, 10, 60))) {
    return json({ error: "Troppe prenotazioni ravvicinate: riprova più tardi o chiama il professionista" }, 429);
  }
  const [{ n: futureAttive }] = await sql`
    SELECT COUNT(*) AS n FROM bookings
    WHERE professional_id = ${professionalId} AND customer_phone = ${phone}
      AND status IN ('active', 'pending') AND start_dt > now()`;
  if (Number(futureAttive) >= 3) {
    return json({ error: "Hai già 3 prenotazioni future con questo professionista: gestiscile dai link ricevuti via email" }, 429);
  }

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
           ${name}, ${phone}, ${email}, ${address}, ${city}, 'pending', 'online', ${cancelToken}
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE professional_id = ${professionalId}
        AND (status = 'active' OR (status = 'pending' AND created_at > now() - interval '60 minutes'))
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

  // Double opt-in: al paziente va SOLO l'email di convalida (60 minuti).
  // Il professionista viene avvisato DOPO la convalida: mai disturbato da prenotazioni fantasma.
  const confermaToken = createSession({ scope: "conferma", bid: inserted[0].id }, 60 * 60);
  const confermaLink = `https://infermieriweb.it/conferma?token=${encodeURIComponent(confermaToken)}`;
  const convalida = emailConvalidaPrenotazione({ booking, professional, service: svc, confermaLink });
  const emailedPaziente = await sendEmail({ to: email, toName: name, ...convalida });

  return json({
    ok: true,
    pending: true, // in attesa di convalida via email entro 60 minuti
    booking_id: inserted[0].id,
    emailed: emailedPaziente,
    professional: service.professional_name,
    service: service.service_name,
    start: start.toISOString(),
  });
}
