export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { chiaveLibera } from "../../../lib/listino.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const s = sessionFromRequest(request);
  return s && s.role === "admin" ? s : null;
};

const CATEGORIE = ["domicilio", "consulenza"];
const num = (v) => Math.round(Number(v));

// Controlli comuni a creazione e modifica. I prezzi arrivano in centesimi.
const valida = (body, attuale = {}) => {
  const nome = body.nome !== undefined ? String(body.nome).trim().slice(0, 120) : attuale.nome;
  if (!nome || nome.length < 3) return { error: "Il nome della prestazione è obbligatorio (almeno 3 caratteri)" };
  const categoria = body.categoria !== undefined ? String(body.categoria) : attuale.categoria;
  if (!CATEGORIE.includes(categoria)) return { error: "Categoria non valida (domicilio o consulenza)" };
  const min = body.min_cents !== undefined ? num(body.min_cents) : attuale.min_cents;
  const sugg = body.sugg_cents !== undefined ? num(body.sugg_cents) : attuale.sugg_cents;
  if (!Number.isFinite(min) || min < 0 || min > 100000000) return { error: "Prezzo minimo non valido" };
  if (!Number.isFinite(sugg) || sugg < 0 || sugg > 100000000) return { error: "Prezzo consigliato non valido" };
  if (sugg < min) return { error: "Il prezzo consigliato non può essere inferiore al minimo" };
  // Le consulenze sono "a ora": durata fissa 60 minuti.
  const durata = categoria === "consulenza" ? 60 : (body.durata_min !== undefined ? num(body.durata_min) : attuale.durata_min);
  if (!Number.isFinite(durata) || durata < 5 || durata > 480) return { error: "Durata non valida (5-480 minuti)" };
  const icona = body.icona !== undefined ? String(body.icona).trim().slice(0, 40) : attuale.icona;
  return { nome, categoria, min, sugg, durata, icona: icona || "croce" };
};

// GET /api/admin/listino[?pid=12] — il listino completo (anche le voci ritirate),
// con quante prestazioni sono già state inserite dai professionisti su ogni voce.
// Con ?pid=  → solo le voci su misura di quel professionista.
export async function GET({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const pid = Number(url.searchParams.get("pid")) || null;

  const voci = pid
    ? await sql`
        SELECT c.*, (SELECT COUNT(*) FROM services s WHERE s.catalog_key = c.key AND s.professional_id = c.professional_id AND s.deleted_at IS NULL) AS in_uso
        FROM catalog_services c WHERE c.professional_id = ${pid} ORDER BY c.categoria, c.sort, c.nome`
    : await sql`
        SELECT c.*, p.name AS professional_name,
               (SELECT COUNT(*) FROM services s WHERE s.catalog_key = c.key AND s.deleted_at IS NULL
                  AND (c.professional_id IS NULL OR s.professional_id = c.professional_id)) AS in_uso
        FROM catalog_services c LEFT JOIN professionals p ON p.id = c.professional_id
        ORDER BY (c.professional_id IS NOT NULL), c.categoria, c.sort, c.nome`;

  return json({ voci });
}

// POST /api/admin/listino — nuova voce di listino.
// {nome, categoria, min_cents, sugg_cents, durata_min, icona, professional_id?}
// professional_id valorizzato = prestazione su misura, visibile solo a lui.
export async function POST({ request }) {
  const admin = soloAdmin(request);
  if (!admin) return json({ error: "Riservato agli amministratori" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const v = valida(body, { durata_min: 30, icona: "croce" });
  if (v.error) return json(v, 400);

  const pid = Number(body.professional_id) || null;
  if (pid) {
    const [esiste] = await sql`SELECT id FROM professionals WHERE id = ${pid}`;
    if (!esiste) return json({ error: "Professionista non trovato" }, 404);
  }

  const key = await chiaveLibera(v.nome, v.categoria, pid);
  const [nuova] = await sql`
    INSERT INTO catalog_services (key, nome, categoria, min_cents, sugg_cents, durata_min, icona, sort, professional_id, created_by)
    SELECT ${key}, ${v.nome}, ${v.categoria}, ${v.min}, ${v.sugg}, ${v.durata}, ${v.icona},
           COALESCE(MAX(sort), 0) + 1, ${pid}, ${admin.name || "admin"}
    FROM catalog_services WHERE categoria = ${v.categoria}
    RETURNING id, key`;
  return json({ ok: true, id: nuova.id, key: nuova.key });
}

// PATCH /api/admin/listino — modifica una voce {id, ...campi, active?}
// Il nome nuovo si propaga alle prestazioni già inserite dai professionisti,
// così le schede pubbliche non restano con la dicitura vecchia.
export async function PATCH({ request }) {
  const admin = soloAdmin(request);
  if (!admin) return json({ error: "Riservato agli amministratori" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [attuale] = await sql`SELECT * FROM catalog_services WHERE id = ${id}`;
  if (!attuale) return json({ error: "Voce di listino non trovata" }, 404);

  // La categoria non si cambia: la chiave (e con essa il comportamento nel sito)
  // dipende dal prefisso, e le prestazioni già inserite la userebbero a sproposito.
  if (body.categoria !== undefined && body.categoria !== attuale.categoria) {
    return json({ error: "La categoria non si può cambiare: ritira questa voce e creane una nuova nell'altra categoria." }, 400);
  }
  const v = valida({ ...body, categoria: attuale.categoria }, attuale);
  if (v.error) return json(v, 400);
  const active = body.active !== undefined ? !!body.active : attuale.active;

  await sql`
    UPDATE catalog_services
    SET nome = ${v.nome}, min_cents = ${v.min}, sugg_cents = ${v.sugg},
        durata_min = ${v.durata}, icona = ${v.icona}, active = ${active}
    WHERE id = ${id}`;

  let rinominate = 0;
  if (v.nome !== attuale.nome) {
    const r = attuale.professional_id
      ? await sql`UPDATE services SET name = ${v.nome} WHERE catalog_key = ${attuale.key} AND professional_id = ${attuale.professional_id} RETURNING id`
      : await sql`UPDATE services SET name = ${v.nome} WHERE catalog_key = ${attuale.key} RETURNING id`;
    rinominate = r.length;
  }
  return json({ ok: true, rinominate });
}

// DELETE /api/admin/listino?id=3[&anche_dalle_schede=1]
// Cancellazione definitiva: possibile solo se nessuno la sta usando. Se è in uso
// si risponde 409 (l'admin la ritira, oppure passa anche_dalle_schede=1 per
// toglierla anche dalle schede di chi ce l'ha).
export async function DELETE({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);

  const [voce] = await sql`SELECT * FROM catalog_services WHERE id = ${id}`;
  if (!voce) return json({ error: "Voce di listino non trovata" }, 404);

  const inUso = voce.professional_id
    ? await sql`SELECT id, professional_id FROM services WHERE catalog_key = ${voce.key} AND professional_id = ${voce.professional_id} AND deleted_at IS NULL`
    : await sql`SELECT id, professional_id FROM services WHERE catalog_key = ${voce.key} AND deleted_at IS NULL`;

  if (inUso.length && url.searchParams.get("anche_dalle_schede") !== "1") {
    return json({
      error: `"${voce.nome}" è nella scheda di ${inUso.length} professionist${inUso.length === 1 ? "a" : "i"}: ritirala dal listino (nessuno potrà più aggiungerla) oppure conferma per toglierla anche dalle loro schede.`,
      in_uso: inUso.length,
    }, 409);
  }

  // Toglie la prestazione dalle schede: archiviata se ha prenotazioni nello
  // storico (il vincolo bookings.service_id non permette di cancellarla),
  // cancellata del tutto se non ne ha.
  let archiviate = 0, cancellate = 0;
  for (const s of inUso) {
    const [prenotata] = await sql`SELECT id FROM bookings WHERE service_id = ${s.id} LIMIT 1`;
    if (prenotata) { await sql`UPDATE services SET active = FALSE, deleted_at = now() WHERE id = ${s.id}`; archiviate++; }
    else { await sql`DELETE FROM services WHERE id = ${s.id}`; cancellate++; }
  }
  await sql`DELETE FROM catalog_services WHERE id = ${id}`;
  return json({ ok: true, archiviate, cancellate });
}
