// REGISTRO DEGLI ACCESSI — la parte che scrive e legge il database (vedi lib/accessi.js).
// Regole:
//  - niente indirizzo IP e niente user-agent: solo il tipo di dispositivo;
//  - l'email si salva SOLO quando non corrisponde a nessun account (serve a capire chi
//    sbaglia indirizzo, es. «gmail.co»); negli altri casi basta l'id del professionista;
//  - scrivere nel registro non deve MAI far fallire un accesso: ogni errore finisce nel
//    log del server e basta;
//  - le righe durano 12 mesi (lib/pulizia.js), come dice l'informativa privacy.
import { sql } from "./db.js";
import { EVENTI, dispositivoDa } from "./accessi.js";

const dispositivoDi = (request) => dispositivoDa(request?.headers?.get("user-agent"));
const emailScritta = (email) => String(email || "").trim().toLowerCase().slice(0, 120);

// «Ha aperto il pannello»: al massimo una riga all'ora per utente. La mappa evita anche la
// query quando l'ultima riga l'ha scritta questo stesso processo (su Render è uno solo).
const UN_ORA = 60 * 60 * 1000;
const ultimoIngresso = new Map(); // uid → millisecondi

// Una riga nel registro. uid/pid restano null per i tentativi con un'email senza account.
export async function registraAccesso({ evento, request, uid = null, pid = null, email = "" }) {
  if (!EVENTI[evento]) return;
  try {
    if (evento === "accesso" && uid) ultimoIngresso.set(Number(uid), Date.now());
    await sql`
      INSERT INTO access_log (evento, user_id, professional_id, email, dispositivo)
      VALUES (${evento}, ${uid}, ${pid}, ${emailScritta(email)}, ${dispositivoDi(request)})`;
  } catch (err) {
    console.error("[accessi] riga non scritta:", err.message);
  }
}

// Chi ha la sessione ancora valida non passa dal login per 30 giorni: senza questa riga
// sembrerebbe sparito. La chiama l'agenda (la prima cosa che il pannello carica, con
// qualunque versione dell'app). NON si aspetta: la risposta al professionista parte subito.
export function registraPresenza(session, request) {
  const uid = Number(session?.uid);
  if (!uid) return;
  const adesso = Date.now();
  if (adesso - (ultimoIngresso.get(uid) || 0) < UN_ORA) return;
  ultimoIngresso.set(uid, adesso);
  sql`
    INSERT INTO access_log (evento, user_id, professional_id, email, dispositivo)
    SELECT 'pannello', ${uid}::int, ${session.pid || null}::int, '', ${dispositivoDi(request)}::text
    WHERE NOT EXISTS (
      SELECT 1 FROM access_log
      WHERE user_id = ${uid}::int AND evento IN ('accesso', 'pannello')
        AND created_at > now() - interval '60 minutes')`
    .catch((err) => console.error("[accessi] presenza non scritta:", err.message));
}

// Per ogni professionista che ha almeno una riga: primo e ultimo ingresso, quante volte ha
// scritto la password, in quanti giorni diversi è entrato, con che dispositivo l'ultima
// volta e l'ultimo tentativo fallito. Torna { [professional_id]: riga }.
export async function riepilogoAccessi() {
  const righe = await sql`
    SELECT professional_id AS id,
           MIN(created_at) FILTER (WHERE evento IN ('accesso', 'pannello')) AS primo,
           MAX(created_at) FILTER (WHERE evento IN ('accesso', 'pannello')) AS ultimo,
           COUNT(*) FILTER (WHERE evento = 'accesso')::int AS accessi,
           COUNT(DISTINCT (created_at AT TIME ZONE 'Europe/Rome')::date) FILTER (WHERE evento IN ('accesso', 'pannello'))::int AS giorni,
           (array_agg(dispositivo ORDER BY created_at DESC) FILTER (WHERE evento IN ('accesso', 'pannello')))[1] AS dispositivo,
           MAX(created_at) FILTER (WHERE evento IN ('password_sbagliata', 'codice_sbagliato')) AS ultimo_fallito,
           COUNT(*) FILTER (WHERE evento IN ('password_sbagliata', 'codice_sbagliato'))::int AS falliti
    FROM access_log
    WHERE professional_id IS NOT NULL
    GROUP BY professional_id`;
  return Object.fromEntries(righe.map((r) => [r.id, r]));
}
