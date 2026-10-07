export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, pidBersaglio, adminSuAltro } from "../../../lib/auth.js";
import { specializzazioniPerProfessionista, scelteDi, MAX_SPECIALIZZAZIONI } from "../../../lib/specializzazioni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/specializzazioni[?pid=12] — le voci fra cui scegliere + quelle già spuntate
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  const url = new URL(request.url);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  if (!pid) return json({ error: "Non autenticato" }, 401);
  const [voci, scelte] = await Promise.all([specializzazioniPerProfessionista(pid), scelteDi(pid)]);
  return json({ voci, scelte, massimo: MAX_SPECIALIZZAZIONI });
}

// PUT /api/panel/specializzazioni {keys: [...], pid?} — sostituisce tutte le scelte
export async function PUT({ request }) {
  const session = sessionFromRequest(request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const pid = pidBersaglio(session, body.pid);
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const richieste = [...new Set((Array.isArray(body.keys) ? body.keys : []).map((k) => String(k).trim()).filter(Boolean))];
  if (richieste.length > MAX_SPECIALIZZAZIONI) {
    return json({ error: `Puoi indicare al massimo ${MAX_SPECIALIZZAZIONI} specializzazioni` }, 400);
  }
  const ammesse = new Set((await specializzazioniPerProfessionista(pid)).map((v) => v.key));
  const nonValide = richieste.filter((k) => !ammesse.has(k));
  if (nonValide.length) return json({ error: "Una delle specializzazioni scelte non è (più) nella lista" }, 400);

  await sql`DELETE FROM professional_specializations WHERE professional_id = ${pid}`;
  for (const key of richieste) {
    await sql`INSERT INTO professional_specializations (professional_id, key) VALUES (${pid}, ${key}) ON CONFLICT DO NOTHING`;
  }
  if (adminSuAltro(session, body.pid)) {
    await sql`UPDATE professionals SET edited_by = ${session.name || "admin"}, edited_at = now() WHERE id = ${pid}`;
  }
  return json({ ok: true, scelte: richieste });
}
