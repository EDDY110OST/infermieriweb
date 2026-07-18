export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { romeWeekday, romeDateTime } from "../../../lib/slots.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// "2026-07-18" + n giorni -> "2026-07-25" (aritmetica su UTC mezzanotte: niente sorprese di ora legale)
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Fasce valide? (stesse regole dell'orario fisso settimanale)
function validaFasce(fasce) {
  if (!Array.isArray(fasce)) return "Formato non valido";
  if (fasce.length > 6) return "Massimo 6 fasce in un giorno";
  for (const f of fasce) {
    if (!Array.isArray(f) || f.length !== 2) return "Fascia non valida";
    const [da, a] = f.map(Number);
    if (!Number.isInteger(da) || !Number.isInteger(a) || da < 0 || a > 1440 || a <= da) {
      return "Orario non valido: la fine deve essere dopo l'inizio";
    }
  }
  for (const f of fasce) {
    if (fasce.some((x) => x !== f && f[0] < x[1] && f[1] > x[0])) {
      return "Due fasce dello stesso giorno si sovrappongono";
    }
  }
  return null;
}

// GET ?from=YYYY-MM-DD&days=42 — stato disponibilità giorno per giorno (per colorare il calendario)
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const from = url.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 42, 1), 62);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return json({ error: "Data non valida" }, 400);
  const to = addDays(from, days);

  const settimana = await sql`
    SELECT weekday, start_min, end_min FROM opening_hours
    WHERE professional_id = ${session.pid} ORDER BY weekday, start_min`;
  const fissoPerGiorno = {};
  for (const r of settimana) (fissoPerGiorno[r.weekday] ||= []).push([r.start_min, r.end_min]);

  const overrides = await sql`
    SELECT day::text AS day, fasce FROM day_overrides
    WHERE professional_id = ${session.pid} AND day >= ${from} AND day < ${to}`;
  const ecc = Object.fromEntries(overrides.map((o) => [o.day, o.fasce || []]));

  const giorni = [];
  for (let i = 0; i < days; i++) {
    const g = addDays(from, i);
    if (g in ecc) {
      const fasce = ecc[g];
      giorni.push({ day: g, stato: fasce.length ? "speciale" : "chiuso", fonte: "eccezione", fasce });
    } else {
      const fasce = fissoPerGiorno[romeWeekday(g)] || [];
      giorni.push({ day: g, stato: fasce.length ? "aperto" : "chiuso", fonte: "fisso", fasce });
    }
  }
  return json({ giorni });
}

// PUT { day, fasce } — imposta un'eccezione per quel giorno (fasce:[] = chiuso).
// Avvisa (non cancella) se restano prenotazioni fuori dalle nuove fasce.
export async function PUT({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const day = String(body.day || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Giorno non valido" }, 400);
  const fasce = Array.isArray(body.fasce) ? body.fasce.map((f) => f.map(Number)) : [];
  const errore = validaFasce(fasce);
  if (errore) return json({ error: errore }, 400);

  // Prenotazioni attive di quel giorno che rimarrebbero SCOPERTE dalle nuove fasce
  const dayStart = romeDateTime(day, 0);
  const dayEnd = romeDateTime(day, 24 * 60);
  const pren = await sql`
    SELECT b.id, b.start_dt, b.end_dt, b.customer_name, s.name AS service_name
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE b.professional_id = ${session.pid} AND b.status = 'active'
      AND b.start_dt < ${dayEnd.toISOString()} AND b.end_dt > ${dayStart.toISOString()}
    ORDER BY b.start_dt`;
  const coperta = (b) => {
    const s = new Date(b.start_dt).getTime(), e = new Date(b.end_dt).getTime();
    return fasce.some(([da, a]) => {
      const fs = romeDateTime(day, da).getTime(), fe = romeDateTime(day, a).getTime();
      return s >= fs && e <= fe;
    });
  };
  const scoperte = pren.filter((b) => !coperta(b)).map((b) => ({
    id: b.id, quando: b.start_dt, cliente: b.customer_name, servizio: b.service_name,
  }));

  await sql`
    INSERT INTO day_overrides (professional_id, day, fasce)
    VALUES (${session.pid}, ${day}, ${JSON.stringify(fasce)}::jsonb)
    ON CONFLICT (professional_id, day) DO UPDATE SET fasce = EXCLUDED.fasce`;

  return json({ ok: true, stato: fasce.length ? "speciale" : "chiuso", scoperte });
}

// DELETE { day } — toglie l'eccezione: il giorno torna a seguire l'orario fisso settimanale
export async function DELETE({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const day = String(body.day || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Giorno non valido" }, 400);

  await sql`DELETE FROM day_overrides WHERE professional_id = ${session.pid} AND day = ${day}`;
  return json({ ok: true });
}
