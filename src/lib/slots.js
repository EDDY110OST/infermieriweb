import { sql } from "./db.js";
import { eNotte } from "../data/listino.js";

// Tutta l'agenda ragiona nel fuso di Roma, il database salva in UTC.

export function romeOffsetMinutes(date) {
  const rome = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const asUTC = Date.UTC(rome.year, rome.month - 1, rome.day, rome.hour % 24, rome.minute, rome.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

// "2026-07-15" + minuti da mezzanotte (ora di Roma) -> Date UTC
export function romeDateTime(dateStr, minutes) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const naive = new Date(Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60));
  const offset = romeOffsetMinutes(naive);
  return new Date(naive.getTime() - offset * 60000);
}

// Giorno della settimana a Roma: 0=lunedì ... 6=domenica (come nel DB)
export function romeWeekday(dateStr) {
  const noon = romeDateTime(dateStr, 12 * 60);
  const jsDay = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", weekday: "short" }).format(noon);
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[jsDay];
}

const STEP_MIN = 30;

/**
 * Slot liberi per un professionista/servizio in una data (YYYY-MM-DD).
 * Ritorna array di { start (ISO), label ("09:30") }.
 */
export async function availableSlots(professionalId, serviceId, dateStr) {
  const [service] = await sql`
    SELECT duration_min, price_cents, price_notte_cents FROM services
    WHERE id = ${serviceId} AND professional_id = ${professionalId} AND active`;
  if (!service) return [];

  const [prof] = await sql`
    SELECT lead_minutes FROM professionals
    WHERE id = ${professionalId} AND status = 'active'`;
  if (!prof) return [];

  // Eccezione per questo giorno preciso? Se esiste, VINCE sull'orario fisso:
  // fasce = [] -> giorno chiuso; fasce con orari -> quelli valgono solo per oggi.
  const [override] = await sql`
    SELECT fasce FROM day_overrides
    WHERE professional_id = ${professionalId} AND day = ${dateStr}`;

  let hours;
  if (override) {
    hours = (override.fasce || []).map(([start_min, end_min]) => ({ start_min, end_min }));
  } else {
    const weekday = romeWeekday(dateStr);
    hours = await sql`
      SELECT start_min, end_min FROM opening_hours
      WHERE professional_id = ${professionalId} AND weekday = ${weekday}
      ORDER BY start_min`;
  }
  if (!hours.length) return [];

  const dayStart = romeDateTime(dateStr, 0);
  const dayEnd = romeDateTime(dateStr, 24 * 60);

  const busy = await sql`
    SELECT start_dt, end_dt FROM bookings
    WHERE professional_id = ${professionalId}
      AND (status = 'active' OR (status = 'pending' AND created_at > now() - interval '60 minutes'))
      AND start_dt < ${dayEnd.toISOString()} AND end_dt > ${dayStart.toISOString()}
    UNION ALL
    SELECT start_dt, end_dt FROM blocks
    WHERE professional_id = ${professionalId}
      AND start_dt < ${dayEnd.toISOString()} AND end_dt > ${dayStart.toISOString()}`;

  const busyRanges = busy.map((b) => [new Date(b.start_dt).getTime(), new Date(b.end_dt).getTime()]);
  const notBefore = Date.now() + prof.lead_minutes * 60000;
  const slots = [];

  for (const window of hours) {
    for (let t = window.start_min; t + service.duration_min <= window.end_min; t += STEP_MIN) {
      const start = romeDateTime(dateStr, t);
      const end = new Date(start.getTime() + service.duration_min * 60000);
      if (start.getTime() < notBefore) continue;
      const overlaps = busyRanges.some(([bs, be]) => start.getTime() < be && end.getTime() > bs);
      if (overlaps) continue;
      const notte = eNotte(t);
      // di notte si prenota solo se il professionista ha impostato un prezzo notturno
      if (notte && !service.price_notte_cents) continue;
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        label: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
        notte,
        price_cents: notte ? service.price_notte_cents : service.price_cents,
      });
    }
  }
  return slots;
}

// Prima disponibilità reale di un professionista nei prossimi 14 giorni.
// Ritorna { start: ISO, testo: "oggi alle 18:00" | "domani alle 9:00" | "gio 17 lug alle 9:00" } o null.
export async function nextAvailability(professionalId) {
  const [service] = await sql`
    SELECT id, duration_min FROM services
    WHERE professional_id = ${professionalId} AND active
    ORDER BY duration_min ASC LIMIT 1`;
  const [prof] = await sql`
    SELECT lead_minutes FROM professionals
    WHERE id = ${professionalId} AND status = 'active'`;
  if (!service || !prof) return null;

  const hours = await sql`
    SELECT weekday, start_min, end_min FROM opening_hours
    WHERE professional_id = ${professionalId}
    ORDER BY start_min`;
  if (!hours.length) return null;

  const now = new Date();
  const fine = new Date(now.getTime() + 14 * 86400000);
  const busy = await sql`
    SELECT start_dt, end_dt FROM bookings
    WHERE professional_id = ${professionalId}
      AND (status = 'active' OR (status = 'pending' AND created_at > now() - interval '60 minutes'))
      AND start_dt < ${fine.toISOString()} AND end_dt > ${now.toISOString()}
    UNION ALL
    SELECT start_dt, end_dt FROM blocks
    WHERE professional_id = ${professionalId}
      AND start_dt < ${fine.toISOString()} AND end_dt > ${now.toISOString()}`;
  const busyRanges = busy.map((b) => [new Date(b.start_dt).getTime(), new Date(b.end_dt).getTime()]);
  const notBefore = now.getTime() + prof.lead_minutes * 60000;

  const dataRoma = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(d);
  const oggi = dataRoma(now);
  const domani = dataRoma(new Date(now.getTime() + 86400000));

  for (let g = 0; g < 14; g++) {
    const dateStr = dataRoma(new Date(now.getTime() + g * 86400000));
    const weekday = romeWeekday(dateStr);
    const finestre = hours.filter((h) => h.weekday === weekday);
    for (const w of finestre) {
      for (let t = w.start_min; t + service.duration_min <= w.end_min; t += STEP_MIN) {
        const start = romeDateTime(dateStr, t);
        if (start.getTime() < notBefore) continue;
        const end = new Date(start.getTime() + service.duration_min * 60000);
        if (busyRanges.some(([bs, be]) => start.getTime() < be && end.getTime() > bs)) continue;
        const ora = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
        let quando;
        if (dateStr === oggi) quando = `oggi alle ${ora}`;
        else if (dateStr === domani) quando = `domani alle ${ora}`;
        else quando = `${new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short" }).format(start)} alle ${ora}`;
        return { start: start.toISOString(), testo: quando };
      }
    }
  }
  return null;
}
