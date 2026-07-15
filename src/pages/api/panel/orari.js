export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/orari — orari settimanali (0=lunedì ... 6=domenica)
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const orari = await sql`
    SELECT weekday, start_min, end_min FROM opening_hours
    WHERE professional_id = ${session.pid} ORDER BY weekday, start_min`;
  return json({ orari });
}

// PUT /api/panel/orari — sostituisce l'intera settimana
// body: { orari: [{weekday, start_min, end_min}, ...] } (giorni assenti = chiuso)
export async function PUT({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const righe = Array.isArray(body.orari) ? body.orari : null;
  if (!righe) return json({ error: "Formato orari non valido" }, 400);
  if (righe.length > 21) return json({ error: "Troppe fasce orarie" }, 400);

  for (const r of righe) {
    const wd = Number(r.weekday), da = Number(r.start_min), a = Number(r.end_min);
    if (!Number.isInteger(wd) || wd < 0 || wd > 6) return json({ error: "Giorno non valido" }, 400);
    if (!Number.isInteger(da) || !Number.isInteger(a) || da < 0 || a > 1440 || a <= da) {
      return json({ error: "Fascia oraria non valida: l'orario di fine deve essere dopo l'inizio" }, 400);
    }
  }
  // fasce sovrapposte nello stesso giorno
  for (const r of righe) {
    const stesse = righe.filter((x) => x.weekday === r.weekday && x !== r);
    if (stesse.some((x) => r.start_min < x.end_min && r.end_min > x.start_min)) {
      return json({ error: "Due fasce dello stesso giorno si sovrappongono" }, 400);
    }
  }

  await sql`DELETE FROM opening_hours WHERE professional_id = ${session.pid}`;
  for (const r of righe) {
    await sql`
      INSERT INTO opening_hours (professional_id, weekday, start_min, end_min)
      VALUES (${session.pid}, ${Number(r.weekday)}, ${Number(r.start_min)}, ${Number(r.end_min)})`;
  }
  return json({ ok: true, salvate: righe.length });
}
