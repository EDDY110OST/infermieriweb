import { sql } from "./db.js";
import { SEME_TRATTAMENTI, SEME_VIOLAZIONI } from "../data/registri-privacy-seme.js";

/**
 * Registri privacy tenuti nel pannello di amministrazione (12/11/2026):
 *  - registro dei trattamenti (art. 30 GDPR)
 *  - registro delle violazioni (art. 33.5 GDPR)
 *
 * Una riga di `privacy_voci` = un trattamento oppure un incidente: un titolo e un elenco
 * ordinato di coppie «voce → contenuto» (jsonb), così le voci si possono aggiungere senza
 * cambiare lo schema. NIENTE si cancella: un trattamento non più in uso si archivia, un
 * incidente si può solo correggere. Ogni scrittura lascia una riga in `privacy_storico`
 * con chi, quando, il prima e il dopo: è questo che dimostra che il registro è tenuto.
 *
 * Le tabelle si creano da sole al primo uso (CREATE TABLE IF NOT EXISTS) e si riempiono
 * con le bozze del 12/11/2026: il database di Render non è raggiungibile da fuori, quindi
 * niente migrazione a mano. Lo stesso schema è scritto in db/schema.sql.
 */

export const REGISTRI = ["trattamenti", "violazioni"];
export const MAX_VOCI = 40;
export const MAX_TITOLO = 200;
export const MAX_VOCE = 140;
export const MAX_CONTENUTO = 8000;

let pronte = null;

async function crea() {
  await sql`
    CREATE TABLE IF NOT EXISTS privacy_voci (
      id SERIAL PRIMARY KEY,
      registro text NOT NULL,
      ordine integer NOT NULL DEFAULT 0,
      titolo text NOT NULL,
      voci jsonb NOT NULL DEFAULT '[]'::jsonb,
      stato text NOT NULL DEFAULT 'attivo',
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      created_by text NOT NULL DEFAULT '',
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_by text NOT NULL DEFAULT ''
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS privacy_storico (
      id BIGSERIAL PRIMARY KEY,
      at timestamp with time zone NOT NULL DEFAULT now(),
      admin text NOT NULL DEFAULT '',
      registro text NOT NULL,
      voce_id integer,
      titolo text NOT NULL DEFAULT '',
      azione text NOT NULL,
      prima jsonb,
      dopo jsonb
    )`;
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM privacy_voci`;
  if (n > 0) return;
  const semi = [["trattamenti", SEME_TRATTAMENTI], ["violazioni", SEME_VIOLAZIONI]];
  for (const [registro, righe] of semi) {
    let ordine = 0;
    for (const r of righe) {
      ordine += 10;
      await sql`
        INSERT INTO privacy_voci (registro, ordine, titolo, voci, created_by, updated_by)
        VALUES (${registro}, ${ordine}, ${r.titolo}, ${JSON.stringify(r.voci)}::jsonb, 'bozza del 12/11/2026', 'bozza del 12/11/2026')`;
    }
    await sql`
      INSERT INTO privacy_storico (admin, registro, azione, titolo)
      VALUES ('sistema', ${registro}, 'avviato', ${`Registro avviato con ${righe.length} ${righe.length === 1 ? "riga" : "righe"} dalla bozza del 12/11/2026`})`;
  }
}

// Una sola creazione per processo; se fallisce (database non pronto) si riprova alla
// richiesta successiva invece di restare rotti fino al riavvio.
export function assicuraRegistri() {
  if (!pronte) pronte = crea().catch((e) => { pronte = null; throw e; });
  return pronte;
}

/** Ripulisce quello che arriva dal modulo. Ritorna { errore } oppure { titolo, voci }. */
export function validaRiga({ titolo, voci }) {
  const t = String(titolo || "").replace(/\s+/g, " ").trim();
  if (t.length < 2) return { errore: "Scrivi un titolo" };
  if (t.length > MAX_TITOLO) return { errore: `Il titolo è troppo lungo (massimo ${MAX_TITOLO} caratteri)` };
  if (!Array.isArray(voci)) return { errore: "Dati non validi" };
  const pulite = [];
  for (const v of voci) {
    const voce = String(v?.voce || "").replace(/\s+/g, " ").trim();
    const contenuto = String(v?.contenuto || "").replace(/\r\n/g, "\n").trim();
    if (!voce && !contenuto) continue; // riga lasciata vuota: si ignora
    if (!voce) return { errore: "C'è una riga con il testo ma senza il nome della voce" };
    if (voce.length > MAX_VOCE) return { errore: `«${voce.slice(0, 30)}…»: il nome della voce è troppo lungo` };
    if (contenuto.length > MAX_CONTENUTO) return { errore: `«${voce}»: il testo è troppo lungo (massimo ${MAX_CONTENUTO} caratteri)` };
    pulite.push({ voce, contenuto });
  }
  // Una voce col nome ma senza testo si tiene (in un incidente «Rimedi definitivi» si
  // scrive dopo): però almeno una deve dire qualcosa, altrimenti la riga è vuota.
  if (!pulite.some((x) => x.contenuto)) return { errore: "Compila almeno una voce" };
  if (pulite.length > MAX_VOCI) return { errore: `Troppe voci (massimo ${MAX_VOCI})` };
  return { titolo: t, voci: pulite };
}

/** Numero del prossimo incidente: «3/2026». Si conta sull'anno in corso (ora italiana). */
export async function prossimoNumeroViolazione() {
  const anno = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric" }).format(new Date());
  const righe = await sql`SELECT titolo FROM privacy_voci WHERE registro = 'violazioni'`;
  let max = 0;
  for (const r of righe) {
    const m = String(r.titolo).match(/^(\d+)\/(\d{4})\b/);
    if (m && m[2] === anno) max = Math.max(max, Number(m[1]));
  }
  return `${max + 1}/${anno}`;
}

export async function leggiRegistro(registro) {
  await assicuraRegistri();
  return sql`
    SELECT id, registro, ordine, titolo, voci, stato, created_at, created_by, updated_at, updated_by
    FROM privacy_voci WHERE registro = ${registro}
    ORDER BY ordine, id`;
}

export async function leggiStorico(registro, limite = 60) {
  await assicuraRegistri();
  return sql`
    SELECT id, at, admin, voce_id, titolo, azione
    FROM privacy_storico WHERE registro = ${registro}
    ORDER BY id DESC LIMIT ${limite}::int`;
}

/** Crea (id assente) o corregge una riga. Ritorna { errore, status } oppure { riga }. */
export async function salvaRiga({ registro, id, titolo, voci, admin }) {
  await assicuraRegistri();
  if (!REGISTRI.includes(registro)) return { errore: "Registro sconosciuto", status: 400 };
  const v = validaRiga({ titolo, voci });
  if (v.errore) return { errore: v.errore, status: 400 };

  if (!id) {
    let tit = v.titolo;
    if (registro === "violazioni") tit = `${await prossimoNumeroViolazione()} — ${tit.replace(/^\d+\/\d{4}\s*[—-]\s*/, "")}`;
    const [{ m }] = await sql`SELECT COALESCE(MAX(ordine), 0)::int AS m FROM privacy_voci WHERE registro = ${registro}`;
    const [riga] = await sql`
      INSERT INTO privacy_voci (registro, ordine, titolo, voci, created_by, updated_by)
      VALUES (${registro}, ${m + 10}, ${tit}, ${JSON.stringify(v.voci)}::jsonb, ${admin}, ${admin})
      RETURNING id, titolo`;
    await sql`
      INSERT INTO privacy_storico (admin, registro, voce_id, titolo, azione, dopo)
      VALUES (${admin}, ${registro}, ${riga.id}, ${riga.titolo}, 'creata', ${JSON.stringify({ titolo: riga.titolo, voci: v.voci })}::jsonb)`;
    return { riga };
  }

  const [prima] = await sql`SELECT id, titolo, voci FROM privacy_voci WHERE id = ${Number(id)} AND registro = ${registro}`;
  if (!prima) return { errore: "Riga non trovata", status: 404 };
  // Il numero di un incidente («1/2026») non si cambia: resta quello assegnato alla nascita.
  let tit = v.titolo;
  if (registro === "violazioni") {
    const numero = String(prima.titolo).match(/^\d+\/\d{4}/)?.[0];
    if (numero) tit = `${numero} — ${tit.replace(/^\d+\/\d{4}\s*[—-]\s*/, "")}`;
  }
  if (tit === prima.titolo && JSON.stringify(prima.voci) === JSON.stringify(v.voci)) return { riga: prima, invariata: true };
  const [riga] = await sql`
    UPDATE privacy_voci SET titolo = ${tit}, voci = ${JSON.stringify(v.voci)}::jsonb, updated_at = now(), updated_by = ${admin}
    WHERE id = ${prima.id} RETURNING id, titolo`;
  await sql`
    INSERT INTO privacy_storico (admin, registro, voce_id, titolo, azione, prima, dopo)
    VALUES (${admin}, ${registro}, ${riga.id}, ${riga.titolo}, 'modificata',
            ${JSON.stringify({ titolo: prima.titolo, voci: prima.voci })}::jsonb,
            ${JSON.stringify({ titolo: tit, voci: v.voci })}::jsonb)`;
  return { riga };
}

/** Archivia o rimette in uso un trattamento. Gli incidenti non si archiviano mai. */
export async function cambiaStato({ id, stato, admin }) {
  await assicuraRegistri();
  if (!["attivo", "archiviato"].includes(stato)) return { errore: "Stato non valido", status: 400 };
  const [prima] = await sql`SELECT id, titolo, stato, registro FROM privacy_voci WHERE id = ${Number(id)}`;
  if (!prima) return { errore: "Riga non trovata", status: 404 };
  if (prima.registro !== "trattamenti") return { errore: "Un incidente non si archivia: resta nel registro", status: 400 };
  if (prima.stato === stato) return { riga: prima };
  await sql`UPDATE privacy_voci SET stato = ${stato}, updated_at = now(), updated_by = ${admin} WHERE id = ${prima.id}`;
  await sql`
    INSERT INTO privacy_storico (admin, registro, voce_id, titolo, azione)
    VALUES (${admin}, 'trattamenti', ${prima.id}, ${prima.titolo}, ${stato === "archiviato" ? "archiviata" : "rimessa in uso"})`;
  return { riga: { ...prima, stato } };
}
