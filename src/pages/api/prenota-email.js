export const prerender = false;

import { sql } from "../../lib/db.js";
import { createSession } from "../../lib/auth.js";
import { sendEmail, emailConvalidaPrenotazione } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";
import { leggiToken } from "../../lib/cambio.js";
import { avvisoEmail, emailValida, normalizzaEmail } from "../../lib/email.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/prenota-email {token, email} — il paziente ha sbagliato a scrivere la sua email
// (caso vero 22/10/26: «olli_comdino» invece di «olli_condino»: la convalida è rimbalzata,
// la prenotazione è scaduta e l'infermiere non ha mai saputo nulla). Dalla schermata
// «Quasi fatto» corregge l'indirizzo e gli rimandiamo la convalida. Serve il token che
// /api/prenota ha dato SOLO a chi ha appena prenotato; vale finché la prenotazione è in
// attesa di convalida (60 minuti dalla richiesta, poi scade come sempre).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const sessione = leggiToken(body.token, "correggi");
  if (!sessione) return json({ error: "Il tempo per correggere è scaduto: rifai la prenotazione con l'email giusta" }, 400);
  const email = normalizzaEmail(body.email);
  if (!emailValida(email)) return json({ error: "Email non valida: controlla che ci siano la @ e il dominio completo (es. nome@gmail.com)" }, 400);
  if (!(await consenti(`prenota-email:${ipDa(request)}`, 5, 60))) {
    return json({ error: "Troppi tentativi ravvicinati: riprova tra poco" }, 429);
  }

  const [b] = await sql`
    UPDATE bookings SET customer_email = ${email}
    WHERE id = ${sessione.bid} AND status = 'pending' AND created_at > now() - interval '60 minutes'
    RETURNING id, customer_name, customer_phone, address, city, start_dt, service_id, professional_id`;
  if (!b) return json({ error: "Questa prenotazione non è più in attesa (già convalidata o scaduta): se serve, rifalla con l'email giusta" }, 409);
  const [s] = await sql`
    SELECT s.name AS service_name, p.name AS professional_name, p.email AS professional_email,
           p.slug AS professional_slug, p.cancel_hours
    FROM services s JOIN professionals p ON p.id = s.professional_id WHERE s.id = ${b.service_id}`;

  const confermaToken = createSession({ scope: "conferma", bid: b.id }, 60 * 60);
  const confermaLink = `https://infermieriweb.it/conferma?token=${encodeURIComponent(confermaToken)}`;
  const convalida = emailConvalidaPrenotazione({
    booking: { name: b.customer_name, phone: b.customer_phone, email, address: b.address, city: b.city, start: new Date(b.start_dt).toISOString() },
    professional: { name: s.professional_name, email: s.professional_email, slug: s.professional_slug, cancel_hours: s.cancel_hours },
    service: { name: s.service_name },
    confermaLink,
  });
  const inviata = await sendEmail({ to: email, toName: b.customer_name, ...convalida });
  if (!inviata) return json({ error: "Non siamo riusciti a inviare la mail: riprova tra un momento" }, 502);
  return json({ ok: true, email, avviso_email: avvisoEmail(email) });
}
