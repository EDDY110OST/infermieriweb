export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { chiaveSpecializzazioneLibera } from "../../../lib/specializzazioni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const s = sessionFromRequest(request);
  return s && s.role === "admin" ? s : null;
};

const pulisciNome = (v) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 80);

// GET /api/admin/specializzazioni — tutta la lista (anche le ritirate) con
// quanti professionisti hanno spuntato ciascuna voce
export async function GET({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const voci = await sql`
    SELECT c.*, p.name AS professional_name,
           (SELECT COUNT(*)::int FROM professional_specializations ps
             WHERE ps.key = c.key AND (c.professional_id IS NULL OR ps.professional_id = c.professional_id)) AS in_uso
    FROM catalog_specializations c LEFT JOIN professionals p ON p.id = c.professional_id
    ORDER BY (c.professional_id IS NOT NULL), c.sort, c.nome`;
  return json({ voci });
}

// POST /api/admin/specializzazioni {nome, professional_id?} — voce nuova
// (professional_id valorizzato = su misura, la vede solo quel professionista)
export async function POST({ request }) {
  const admin = soloAdmin(request);
  if (!admin) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const nome = pulisciNome(body.nome);
  if (nome.length < 3) return json({ error: "Il nome della specializzazione è obbligatorio (almeno 3 caratteri)" }, 400);
  const pid = Number(body.professional_id) || null;
  if (pid) {
    const [esiste] = await sql`SELECT id FROM professionals WHERE id = ${pid}`;
    if (!esiste) return json({ error: "Professionista non trovato" }, 404);
  }
  const [doppione] = await sql`
    SELECT id FROM catalog_specializations
    WHERE lower(nome) = lower(${nome}) AND (professional_id IS NULL OR professional_id = ${pid || 0})`;
  if (doppione) return json({ error: `"${nome}" c'è già nella lista` }, 409);

  const key = await chiaveSpecializzazioneLibera(nome, pid);
  const [nuova] = await sql`
    INSERT INTO catalog_specializations (key, nome, sort, professional_id, created_by)
    SELECT ${key}, ${nome}, COALESCE(MAX(sort), 0) + 1, ${pid}, ${admin.name || "admin"}
    FROM catalog_specializations
    RETURNING id, key`;
  return json({ ok: true, id: nuova.id, key: nuova.key });
}

// PATCH /api/admin/specializzazioni {id, nome?, active?}
export async function PATCH({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);
  const [attuale] = await sql`SELECT * FROM catalog_specializations WHERE id = ${id}`;
  if (!attuale) return json({ error: "Specializzazione non trovata" }, 404);

  const nome = body.nome !== undefined ? pulisciNome(body.nome) : attuale.nome;
  if (nome.length < 3) return json({ error: "Il nome è obbligatorio (almeno 3 caratteri)" }, 400);
  const active = body.active !== undefined ? !!body.active : attuale.active;
  await sql`UPDATE catalog_specializations SET nome = ${nome}, active = ${active} WHERE id = ${id}`;
  return json({ ok: true });
}

// DELETE /api/admin/specializzazioni?id=3 — via del tutto, anche dalle schede che l'avevano
export async function DELETE({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);
  const [voce] = await sql`SELECT * FROM catalog_specializations WHERE id = ${id}`;
  if (!voce) return json({ error: "Specializzazione non trovata" }, 404);

  const tolte = voce.professional_id
    ? await sql`DELETE FROM professional_specializations WHERE key = ${voce.key} AND professional_id = ${voce.professional_id} RETURNING professional_id`
    : await sql`DELETE FROM professional_specializations WHERE key = ${voce.key} RETURNING professional_id`;
  await sql`DELETE FROM catalog_specializations WHERE id = ${id}`;
  return json({ ok: true, tolte_da: tolte.length });
}
