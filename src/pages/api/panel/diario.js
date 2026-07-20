export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { cifra, decifra, diarioConfigurato } from "../../../lib/diario.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Accesso al diario: SOLO il professionista titolare, via session.pid.
// Nessun override admin (pidBersaglio): i dati clinici sono strettamente
// need-to-know, nemmeno gli amministratori li leggono.
function titolare(request) {
  const session = sessionFromRequest(request);
  return session?.pid ? Number(session.pid) : null;
}

const traccia = (pid, action, recordId = null) =>
  sql`INSERT INTO diario_audit (professional_id, record_id, action) VALUES (${pid}, ${recordId}, ${action})`
    .catch(() => { /* l'audit non deve bloccare l'operazione clinica */ });

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

// Dai campi grezzi al blob in chiaro che viene poi cifrato.
function componiDati(body) {
  return {
    nome: clean(body.nome, 160),
    telefono: clean(body.telefono, 40),
    terapia: clean(body.terapia, 4000),
    patologie: clean(body.patologie, 4000),
    intolleranze: clean(body.intolleranze, 2000),
    allergie: clean(body.allergie, 2000),
    parametri: clean(body.parametri, 2000),
    note: clean(body.note, 4000),
  };
}

// GET ?id=  -> singolo record decifrato (+ audit view)
// GET       -> elenco pazienti (solo id + nome + data aggiornamento)
export async function GET({ request }) {
  const pid = titolare(request);
  if (!pid) return json({ error: "Non autenticato" }, 401);
  if (!diarioConfigurato()) return json({ error: "Il diario non è ancora attivo.", configured: false }, 503);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id")) || null;

  if (id) {
    const [row] = await sql`
      SELECT id, data_enc, iv, tag, consent, consent_at, updated_at
      FROM patient_records WHERE id = ${id} AND professional_id = ${pid}`;
    if (!row) return json({ error: "Scheda non trovata" }, 404);
    let dati;
    try { dati = decifra({ data: row.data_enc, iv: row.iv, tag: row.tag }); }
    catch { return json({ error: "Impossibile decifrare la scheda" }, 500); }
    await traccia(pid, "view", id);
    return json({ record: { id: row.id, consent: row.consent, consent_at: row.consent_at, updated_at: row.updated_at, ...dati } });
  }

  const righe = await sql`
    SELECT id, data_enc, iv, tag, updated_at
    FROM patient_records WHERE professional_id = ${pid} ORDER BY updated_at DESC`;
  const pazienti = righe.map((r) => {
    let nome = "(scheda)";
    try { nome = decifra({ data: r.data_enc, iv: r.iv, tag: r.tag }).nome || "(senza nome)"; } catch { /* salta */ }
    return { id: r.id, nome, updated_at: r.updated_at };
  });
  await traccia(pid, "list");
  return json({ pazienti });
}

// POST -> crea (senza id) o aggiorna (con id) una scheda del titolare.
export async function POST({ request }) {
  const pid = titolare(request);
  if (!pid) return json({ error: "Non autenticato" }, 401);
  if (!diarioConfigurato()) return json({ error: "Il diario non è ancora attivo.", configured: false }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const dati = componiDati(body);
  if (dati.nome.length < 2) return json({ error: "Inserisci almeno il nome del paziente" }, 400);
  if (body.consent !== true) {
    return json({ error: "Per registrare dati sanitari serve il consenso del paziente" }, 400);
  }

  let enc;
  try { enc = cifra(dati); }
  catch { return json({ error: "Il diario non è ancora attivo.", configured: false }, 503); }

  const id = Number(body.id) || null;
  if (id) {
    const [own] = await sql`SELECT id FROM patient_records WHERE id = ${id} AND professional_id = ${pid}`;
    if (!own) return json({ error: "Scheda non trovata" }, 404);
    await sql`
      UPDATE patient_records
      SET data_enc = ${enc.data}, iv = ${enc.iv}, tag = ${enc.tag},
          consent = true, consent_at = COALESCE(consent_at, now()), updated_at = now()
      WHERE id = ${id} AND professional_id = ${pid}`;
    await traccia(pid, "update", id);
    return json({ ok: true, id });
  }

  const [creato] = await sql`
    INSERT INTO patient_records (professional_id, data_enc, iv, tag, consent, consent_at)
    VALUES (${pid}, ${enc.data}, ${enc.iv}, ${enc.tag}, true, now())
    RETURNING id`;
  await traccia(pid, "create", creato.id);
  return json({ ok: true, id: creato.id });
}

// DELETE ?id= -> elimina una scheda del titolare.
export async function DELETE({ request }) {
  const pid = titolare(request);
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id")) || null;
  if (!id) return json({ error: "Manca l'id della scheda" }, 400);

  const res = await sql`DELETE FROM patient_records WHERE id = ${id} AND professional_id = ${pid}`;
  await traccia(pid, "delete", id);
  return json({ ok: true });
}
