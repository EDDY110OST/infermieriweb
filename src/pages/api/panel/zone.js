export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { trovaComune } from "../../../data/comuni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const MAX_ZONE = 30;

// Nome comune scritto bene: "borgo a mozzano" -> "Borgo a Mozzano"
const MINUSCOLE = new Set(["a", "al", "dei", "del", "della", "delle", "di", "e", "in", "la", "le", "lo", "sul", "sulla"]);
const bello = (testo) =>
  String(testo).trim().replace(/\s+/g, " ").toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && MINUSCOLE.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");

// GET — le zone coperte del professionista loggato
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autorizzato" }, 401);

  const zone = await sql`
    SELECT id, city, province, region FROM coverage_areas
    WHERE professional_id = ${session.pid} ORDER BY city`;
  return json({ zone });
}

// POST {city, province} — aggiunge una zona (la regione si ricava dalla provincia)
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autorizzato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const scritto = bello(body.city || "");
  if (scritto.length < 2) return json({ error: "Scrivi il nome del comune" }, 400);

  // Il comune deve esistere nell'elenco ufficiale ISTAT: niente zone inventate
  // tipo "Lucca e dintorni", che poi sulla mappa non si possono collocare.
  const comune = trovaComune(scritto, body.sigla || null) || trovaComune(scritto);
  if (!comune) {
    return json({ error: `"${scritto}" non è un comune italiano: scegli il comune dalla tendina dei suggerimenti` }, 400);
  }
  const city = comune.nome;
  const provinciaNome = comune.provincia;
  const region = comune.regione;

  const [{ n }] = await sql`
    SELECT COUNT(*)::int AS n FROM coverage_areas WHERE professional_id = ${session.pid}`;
  if (n >= MAX_ZONE) return json({ error: `Puoi coprire al massimo ${MAX_ZONE} comuni` }, 400);

  // indice UNIQUE (professional_id, lower(city)): il doppione lo blocca il DB,
  // anche con due richieste simultanee
  let zona;
  try {
    [zona] = await sql`
      INSERT INTO coverage_areas (professional_id, city, province, region)
      VALUES (${session.pid}, ${city}, ${provinciaNome}, ${region})
      RETURNING id, city, province, region`;
  } catch (err) {
    if (String(err?.code) === "23505") return json({ error: `${city} è già tra le tue zone` }, 400);
    throw err;
  }
  return json({ ok: true, zona });
}

// DELETE {id} — toglie una zona (mai l'ultima: la scheda deve restare trovabile)
export async function DELETE({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autorizzato" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Zona non indicata" }, 400);

  // atomica: cancella solo se dopo resta almeno una zona (niente race)
  const cancellate = await sql`
    DELETE FROM coverage_areas
    WHERE id = ${id} AND professional_id = ${session.pid}
      AND (SELECT COUNT(*) FROM coverage_areas WHERE professional_id = ${session.pid}) > 1
    RETURNING id`;
  if (!cancellate.length) {
    const [esiste] = await sql`
      SELECT 1 FROM coverage_areas WHERE id = ${id} AND professional_id = ${session.pid}`;
    if (esiste) return json({ error: "Devi coprire almeno un comune: aggiungine un altro prima di togliere questo" }, 400);
    return json({ error: "Zona non trovata" }, 404);
  }
  return json({ ok: true });
}
