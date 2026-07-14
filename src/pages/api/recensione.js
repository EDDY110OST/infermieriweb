export const prerender = false;

import { sql } from "../../lib/db.js";
import { leggiTokenRecensione as leggiToken } from "../../lib/recensioni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/recensione?token=... — info per la pagina di recensione
export async function GET({ url }) {
  const bookingId = leggiToken(url.searchParams.get("token") || "");
  if (!bookingId) return json({ error: "Link non valido o scaduto" }, 400);

  const [info] = await sql`
    SELECT b.id, b.status, b.customer_name, b.start_dt,
           s.name AS service_name, p.name AS professional_name, p.slug
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.id = ${bookingId}`;
  if (!info) return json({ error: "Prenotazione non trovata" }, 404);
  if (info.status !== "done") return json({ error: "Questa prestazione non risulta completata" }, 400);

  const [esistente] = await sql`SELECT id FROM reviews WHERE booking_id = ${bookingId}`;
  return json({
    prestazione: info.service_name,
    professionista: info.professional_name,
    slug: info.slug,
    nome: info.customer_name,
    quando: info.start_dt,
    giaRecensita: !!esistente,
  });
}

// POST /api/recensione {token, rating, text, author_name}
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const bookingId = leggiToken(String(body.token || ""));
  if (!bookingId) return json({ error: "Link non valido o scaduto" }, 400);

  const rating = Number(body.rating);
  const text = String(body.text || "").trim().slice(0, 1000);
  const author = String(body.author_name || "").trim().slice(0, 80);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Scegli da 1 a 5 stelle" }, 400);

  const [booking] = await sql`
    SELECT professional_id, status FROM bookings WHERE id = ${bookingId}`;
  if (!booking || booking.status !== "done") return json({ error: "Prestazione non trovata o non completata" }, 400);

  // una sola recensione per prenotazione (inserimento atomico)
  const inserted = await sql`
    INSERT INTO reviews (professional_id, booking_id, rating, text, author_name, status)
    SELECT ${booking.professional_id}, ${bookingId}, ${rating}, ${text}, ${author}, 'pending'
    WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE booking_id = ${bookingId})
    RETURNING id`;
  if (!inserted.length) return json({ error: "Hai già lasciato una recensione per questa prestazione" }, 409);

  return json({ ok: true });
}
