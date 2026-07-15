export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { sendEmail, emailDisdettaPaziente } from "../../../lib/mailer.js";
import { romeDateTime } from "../../../lib/slots.js";
import { tokenRecensione } from "../../../lib/recensioni.js";
import { emailRichiestaRecensione } from "../../../lib/mailer.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/prenotazioni — prenotazione MANUALE (presa al telefono)
// body: {service_id, date "YYYY-MM-DD", time "HH:MM", customer_name, customer_phone, address?, city?}
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const serviceId = Number(body.service_id);
  const date = String(body.date || "");
  const time = String(body.time || "");
  const nome = String(body.customer_name || "").trim();
  const telefono = String(body.customer_phone || "").trim();
  const indirizzo = String(body.address || "").trim();
  const citta = String(body.city || "").trim();

  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return json({ error: "Servizio, giorno e ora sono obbligatori" }, 400);
  }
  if (nome.length < 2) return json({ error: "Il nome del paziente è obbligatorio" }, 400);

  const [service] = await sql`
    SELECT duration_min FROM services
    WHERE id = ${serviceId} AND professional_id = ${session.pid}`;
  if (!service) return json({ error: "Prestazione non trovata" }, 404);

  const [h, m] = time.split(":").map(Number);
  const start = romeDateTime(date, h * 60 + m);
  const end = new Date(start.getTime() + service.duration_min * 60000);

  const inserted = await sql`
    INSERT INTO bookings (professional_id, service_id, start_dt, end_dt, customer_name, customer_phone, customer_email, address, city, status, source, cancel_token)
    SELECT ${session.pid}, ${serviceId}, ${start.toISOString()}, ${end.toISOString()},
           ${nome}, ${telefono}, '', ${indirizzo}, ${citta}, 'active', 'manual', ''
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE professional_id = ${session.pid} AND status = 'active'
        AND start_dt < ${end.toISOString()} AND end_dt > ${start.toISOString()}
    ) AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE professional_id = ${session.pid}
        AND start_dt < ${end.toISOString()} AND end_dt > ${start.toISOString()}
    )
    RETURNING id`;

  if (!inserted.length) return json({ error: "In quell'orario hai già un impegno in agenda" }, 409);
  return json({ ok: true, id: inserted[0].id });
}

// PATCH /api/panel/prenotazioni {id, status} — annulla / segna esito
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  const id = Number(body.id);
  const status = String(body.status || "");
  if (!id || !["cancelled", "done", "noshow", "active"].includes(status)) {
    return json({ error: "Dati non validi" }, 400);
  }

  const updated = await sql`
    UPDATE bookings b SET status = ${status}
    FROM professionals p, services s
    WHERE b.professional_id = p.id AND s.id = b.service_id
      AND b.id = ${id} AND b.professional_id = ${session.pid}
    RETURNING b.customer_name, b.customer_email, b.start_dt,
              s.name AS service_name, p.name AS professional_name, p.email AS professional_email, p.slug`;
  if (!updated.length) return json({ error: "Prenotazione non trovata" }, 404);

  // Se completata, il paziente riceve l'invito alla recensione verificata
  const b = updated[0];
  if (status === "done" && b.customer_email) {
    const invito = emailRichiestaRecensione({
      booking: { name: b.customer_name },
      professional: { name: b.professional_name },
      service: { name: b.service_name },
      reviewUrl: `https://infermieriweb.it/recensione?token=${tokenRecensione(id)}`,
    });
    await sendEmail({ to: b.customer_email, toName: b.customer_name, replyTo: b.professional_email || undefined, ...invito });
  }

  // Se il professionista disdice, il paziente viene avvisato via email
  if (status === "cancelled" && b.customer_email) {
    const avviso = emailDisdettaPaziente({
      booking: { name: b.customer_name, start: b.start_dt },
      professional: { name: b.professional_name, slug: b.slug },
      service: { name: b.service_name },
    });
    await sendEmail({
      to: b.customer_email, toName: b.customer_name,
      replyTo: b.professional_email || undefined, ...avviso,
    });
  }

  return json({ ok: true });
}
