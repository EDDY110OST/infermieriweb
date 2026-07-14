export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { sendEmail, emailDisdettaPaziente } from "../../../lib/mailer.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// PATCH /api/panel/prenotazioni {id, status} — annulla / segna esito
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session) return json({ error: "Non autenticato" }, 401);

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

  // Se il professionista disdice, il paziente viene avvisato via email
  const b = updated[0];
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
