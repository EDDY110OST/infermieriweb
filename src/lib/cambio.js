// Cambio infermiere (7/10/26). Quando l'infermiere non conferma entro 24 ore (2 ore se
// l'appuntamento è vicino) o annulla, il paziente riceve un link per scegliere un altro
// infermiere che copre ESATTAMENTE il suo comune e fa la stessa prestazione (stessa regola
// di src/lib/ricerca.js: niente somiglianze, niente provincia o regione). La prenotazione
// vecchia resta valida finché il paziente non ne convalida una nuova (double opt-in come
// sempre): solo allora si annulla da sola e il vecchio infermiere viene avvisato.
import { sql } from "./db.js";
import { createSession, readSession } from "./auth.js";
import { nextAvailability } from "./slots.js";
import { sendEmail, emailCambiaInfermiere } from "./mailer.js";

export const SITE = "https://infermieriweb.it";

// Link firmati (HMAC, come la convalida): il token contiene solo l'id della prenotazione
export const tokenCambio = (bid) => createSession({ scope: "cambio", bid }, 60 * 60 * 24 * 14);
export const tokenAccetta = (bid) => createSession({ scope: "accetta", bid }, 60 * 60 * 24 * 30);
export const linkCambio = (bid) => `${SITE}/cambia-infermiere?token=${encodeURIComponent(tokenCambio(bid))}`;
export const linkAccetta = (bid) => `${SITE}/accetta?token=${encodeURIComponent(tokenAccetta(bid))}`;

export function leggiToken(token, scope) {
  const s = readSession(String(token || ""));
  return s && s.scope === scope && s.bid ? s : null;
}

// Prenotazioni create prima di questa data non entrano nel giro "non ha confermato":
// i loro infermieri non hanno mai visto il tasto Accetta. (Variabile d'ambiente solo
// per l'ambiente di prova, che lavora su dati copiati.)
export const DAL_GIORNO_ACCETTA = process.env.IW_DAL_GIORNO_ACCETTA || "2026-10-08";

export async function prenotazionePerCambio(bid) {
  const [b] = await sql`
    SELECT b.id, b.status, b.start_dt, b.city, b.customer_name, b.customer_email, b.professional_id,
           b.service_id, b.accepted_at, b.cambio_inviato_at, b.replaced_by, b.cancelled_by,
           s.name AS service_name, s.catalog_key,
           p.name AS professional_name, p.slug AS professional_slug, p.email AS professional_email, p.status AS professional_status
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.id = ${bid}`;
  return b || null;
}

// Chi può prendere il posto: attivo, con la STESSA prestazione attiva e, per le
// prestazioni a domicilio, il comune della prenotazione fra le zone coperte (confronto
// sul nome intero). Le consulenze sono online: basta la stessa consulenza.
export async function alternativePer(b) {
  const consulenza = String(b.catalog_key || "").startsWith("consulenza-");
  const righe = consulenza
    ? await sql`
        SELECT p.id, p.slug, p.name, p.city, p.province, p.photo_url, s.id AS service_id, s.price_cents, s.duration_min
        FROM professionals p
        JOIN services s ON s.professional_id = p.id AND s.active AND s.deleted_at IS NULL AND s.catalog_key = ${b.catalog_key}
        WHERE p.status = 'active' AND p.id <> ${b.professional_id}
        ORDER BY p.name`
    : await sql`
        SELECT p.id, p.slug, p.name, p.city, p.province, p.photo_url, s.id AS service_id, s.price_cents, s.duration_min
        FROM professionals p
        JOIN services s ON s.professional_id = p.id AND s.active AND s.deleted_at IS NULL AND s.catalog_key = ${b.catalog_key}
        WHERE p.status = 'active' AND p.id <> ${b.professional_id}
          AND ${b.city || ""} <> ''
          AND EXISTS (SELECT 1 FROM coverage_areas c WHERE c.professional_id = p.id AND lower(c.city) = lower(${b.city || ""}))
        ORDER BY p.name`;
  return Promise.all(righe.map(async (p) => ({ ...p, prossima: await nextAvailability(p.id) })));
}

// Manda al paziente l'email con il link; segna cambio_inviato_at solo se è partita davvero.
// motivo: 'non-risposta' (l'infermiere non ha confermato) | 'annullata' (l'infermiere ha annullato)
export async function inviaEmailCambio(bid, motivo) {
  const b = await prenotazionePerCambio(bid);
  if (!b || !b.customer_email) return false;
  const alternative = await alternativePer(b);
  const mail = emailCambiaInfermiere({
    booking: { name: b.customer_name, start: b.start_dt, city: b.city },
    professional: { name: b.professional_name, slug: b.professional_slug },
    service: { name: b.service_name },
    link: linkCambio(b.id),
    motivo,
    quante: alternative.length,
  });
  const ok = await sendEmail({ to: b.customer_email, toName: b.customer_name, ...mail });
  if (ok) await sql`UPDATE bookings SET cambio_inviato_at = now() WHERE id = ${b.id}`;
  return ok;
}
