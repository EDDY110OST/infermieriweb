// Prestazioni scelte GIÀ nel modulo di candidatura (13/10/26, decisione di Bruno).
// Perché: 8 infermieri approvati su 32 avevano la scheda vuota (zero prestazioni) e
// quindi erano invisibili in ricerca e sulla mappa, perché dopo l'email di benvenuto
// non tornavano nel pannello. Ora il candidato spunta le prestazioni a domicilio con
// il prezzo proposto, e all'approvazione la scheda nasce già con quelle righe.
//
// Qui ci sono le due metà del flusso: il controllo delle scelte (api/candidatura.js)
// e la creazione delle righe `services` (api/admin/candidature.js). La logica è la
// stessa del pannello (api/panel/servizi.js): nome e durata li detta il listino
// (catalog_services, voci globali attive di categoria domicilio), prezzo mai sotto il
// minimo, niente prezzo notturno (lo aggiunge lui dal pannello se vuole).
import { sql } from "./db.js";

export const MAX_PRESTAZIONI_CANDIDATURA = 40;
const PREZZO_MAX_CENTS = 100000000; // stesso tetto del pannello

export const euroTesto = (cents) => `${(Math.round(Number(cents) || 0) / 100).toFixed(2).replace(".", ",")} €`;

// Le voci che un candidato può scegliere: globali, attive, a domicilio. Niente dati
// personali: è ciò che espone /api/listino-pubblico.
export async function listinoDomicilioPubblico() {
  return sql`
    SELECT key, nome, min_cents, sugg_cents, durata_min, sort
    FROM catalog_services
    WHERE active AND professional_id IS NULL AND categoria = 'domicilio'
    ORDER BY sort, nome`;
}

// Controlla le prestazioni mandate dal modulo: [{key, price_cents}] →
// { prestazioni: [{key, nome, price_cents}] } oppure { error }.
// Il nome lo salviamo come fotografia del listino di quel giorno (serve all'admin per
// leggere la candidatura anche se una voce venisse ritirata): all'approvazione si rilegge.
export async function validaPrestazioniCandidatura(grezze) {
  if (!Array.isArray(grezze)) return { error: "Prestazioni non valide: ricarica la pagina e riprova" };
  if (grezze.length > MAX_PRESTAZIONI_CANDIDATURA) return { error: `Puoi scegliere al massimo ${MAX_PRESTAZIONI_CANDIDATURA} prestazioni` };
  const listino = new Map((await listinoDomicilioPubblico()).map((v) => [v.key, v]));
  const viste = new Set();
  const prestazioni = [];
  for (const p of grezze) {
    const key = String(p?.key || "").trim();
    const voce = listino.get(key);
    if (!voce) return { error: "Una prestazione scelta non è (più) nel listino: ricarica la pagina e scegli di nuovo" };
    if (viste.has(key)) return { error: `«${voce.nome}» è indicata due volte` };
    viste.add(key);
    const price = Math.round(Number(p?.price_cents));
    if (!Number.isFinite(price) || price > PREZZO_MAX_CENTS) return { error: `Prezzo non valido per «${voce.nome}»` };
    if (price < voce.min_cents) {
      return { error: `Per «${voce.nome}» il prezzo minimo è ${euroTesto(voce.min_cents)} (consigliato ${euroTesto(voce.sugg_cents)})` };
    }
    prestazioni.push({ key, nome: voce.nome, price_cents: price });
  }
  return { prestazioni };
}

// All'approvazione: crea le righe `services` del nuovo professionista a partire dalle
// prestazioni scelte in candidatura. Rilegge il listino DI OGGI: una voce ritirata nel
// frattempo si salta (e si segnala), un prezzo finito sotto il nuovo minimo si alza al
// minimo (e si segnala). Vale anche per chi è `network` (senza P.IVA): le righe sono
// pronte per quando aprirà la partita IVA. Ritorna { create, saltate, alzate }.
export async function creaServiziDaCandidatura(pid, prestazioni) {
  const esito = { create: [], saltate: [], alzate: [] };
  if (!pid || !Array.isArray(prestazioni) || !prestazioni.length) return esito;
  const listino = new Map((await listinoDomicilioPubblico()).map((v) => [v.key, v]));
  const viste = new Set();
  for (const p of prestazioni) {
    const key = String(p?.key || "").trim();
    if (!key || viste.has(key)) continue;
    viste.add(key);
    const voce = listino.get(key);
    if (!voce) { esito.saltate.push({ key, nome: p?.nome || key, motivo: "non è più nel listino" }); continue; }
    let price = Math.round(Number(p?.price_cents));
    if (!Number.isFinite(price) || price > PREZZO_MAX_CENTS) { esito.saltate.push({ key, nome: voce.nome, motivo: "prezzo non valido" }); continue; }
    if (price < voce.min_cents) {
      esito.alzate.push({ key, nome: voce.nome, da_cents: price, a_cents: voce.min_cents });
      price = voce.min_cents;
    }
    // doppione di sicurezza: se la riga esiste già (ri-approvazione manuale) non si duplica
    const [gia] = await sql`SELECT id FROM services WHERE professional_id = ${pid} AND catalog_key = ${key} AND deleted_at IS NULL`;
    if (gia) { esito.saltate.push({ key, nome: voce.nome, motivo: "già presente nella scheda" }); continue; }
    // stessa INSERT del pannello (api/panel/servizi.js): sort progressivo, attiva, niente notte
    await sql`
      INSERT INTO services (professional_id, name, duration_min, price_cents, price_notte_cents, active, sort, catalog_key)
      SELECT ${pid}, ${voce.nome}, ${voce.durata_min}, ${price}, NULL, TRUE, COALESCE(MAX(sort), 0) + 1, ${key}
      FROM services WHERE professional_id = ${pid}`;
    esito.create.push({ key, nome: voce.nome, price_cents: price, durata_min: voce.durata_min });
  }
  return esito;
}
