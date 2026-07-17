export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, pidBersaglio, adminSuAltro } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/foto { data: "data:image/jpeg;base64,..." }
// La foto arriva già ridimensionata dal browser (~400px): pochi KB.
export async function POST({ request }) {
  const session = sessionFromRequest(request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const pid = pidBersaglio(session, body.pid);
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const data = String(body.data || "");
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data)) {
    return json({ error: "Formato immagine non valido" }, 400);
  }
  if (data.length > 400_000) return json({ error: "Immagine troppo pesante: riprova" }, 413);

  const [prof] = await sql`SELECT slug FROM professionals WHERE id = ${pid}`;
  if (!prof) return json({ error: "Profilo non trovato" }, 404);

  // photo_url punta all'endpoint pubblico: tutte le pagine esistenti
  // (scheda, ricerca, mappa) la usano senza modifiche
  const nuovoUrl = `/api/foto/${prof.slug}?v=${Date.now()}`;
  await sql`
    UPDATE professionals SET photo_data = ${data}, photo_url = ${nuovoUrl}
    WHERE id = ${pid}`;
  if (adminSuAltro(session, body.pid)) {
    await sql`UPDATE professionals SET edited_by = ${session.name || "admin"}, edited_at = now() WHERE id = ${pid}`;
  }

  return json({ ok: true, photo_url: nuovoUrl });
}
