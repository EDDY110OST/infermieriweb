// ORDINE EQUO degli infermieri, UNO SOLO per tutto il sito (9/10/2026).
// Regola di Bruno: «InfermieriWeb è una vetrina nazionale e tutti gli infermieri
// valgono allo stesso modo». Prima l'ordine era alfabetico: chi aveva il nome che
// veniva prima stava sempre in cima, ovunque.
//
//  1. prima chi ha il primo orario libero nel GIORNO più vicino (oggi, domani, …),
//     con lo stesso calcolo delle schede e del pannello (lib/prenotabilita.js);
//  2. a parità di giorno, A TURNO: l'ordine cambia ogni giorno, è lo stesso per
//     tutti i visitatori di quel giorno, nessuno ha un posto fisso;
//  3. chi non ha orari prenotabili nei prossimi 30 giorni va in fondo, anche lui a turno.
// Il nome, la data d'iscrizione o il prezzo non contano. Nessuno paga per stare in alto.
//
// IL TURNO si fa fra gli infermieri della lista che il paziente VEDE (i 3 di Lucca, i 14
// di tutta la rete…). Il tempo è diviso in giri di n giorni (n = quanti sono): in ogni
// giro ognuno è primo ESATTAMENTE un giorno e passa una volta da ogni posizione; chi è
// primo cambia tutti i giorni, anche a cavallo fra due giri. Dentro il giro l'ordine è
// mescolato a caso (ma ripetibile), e a ogni giro si rimescola: così nessuno ha sempre
// gli stessi vicini. Tutto dipende solo dal giorno (ora di Roma) e dagli id della lista:
// nessun dato salvato, stesso ordine per tutti i visitatori dello stesso giorno, e la
// stessa lista dà lo stesso ordine in ogni pagina (ricerca, comune, prestazione…).
//
// Funzioni PURE (nessuna query): le usano /api/professionisti, /cerca (nel browser, dopo
// il filtro della ricerca), le liste delle pagine (lib/ordine-equo-server.js) e la prova
// scripts/test-ordine-equo.mjs. La pagina di un comune (ramo prova-pagine-comune) può
// usarla così com'è: ordinaEquo(infermieri, { oggi }) — p.prossima.start è il primo
// orario. Con la chiave vuota (consigliato) il comune ha lo stesso ordine di /cerca;
// con { chiave: comune.chiave } ogni comune avrebbe un turno suo.

const GIORNO_MS = 86400000;
// chi non ha orari liberi nella finestra: in fondo (dopo qualsiasi data vera)
const NESSUN_ORARIO = "9999-12-31";

/** «2026-10-09»: il giorno di calendario a Roma di una data (Date o ISO). */
let formatoRoma = null;
export function giornoRoma(data = new Date()) {
  formatoRoma ||= new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" });
  return formatoRoma.format(new Date(data));
}

// «2026-10-09» → numero del giorno dal 1/1/1970 (aritmetica su UTC: niente ora legale)
function numeroGiorno(giorno) {
  const [a, m, g] = String(giorno).split("-").map(Number);
  return Math.floor(Date.UTC(a, m - 1, g) / GIORNO_MS);
}

// Testo → numero «a caso ma ripetibile» (FNV-1a con rimescolamento finale murmur3,
// lo stesso di Ettore in lib/pagina-comune.js)
export function sorteggio(testo) {
  let h = 2166136261;
  for (let i = 0; i < testo.length; i++) { h ^= testo.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

// Generatore di numeri casuali da un seme (mulberry32): stessa sequenza per lo stesso seme
function generatore(seme) {
  let s = seme >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mescola (Fisher-Yates) con il generatore dato
function mescola(elenco, caso) {
  const a = [...elenco];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(caso() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Il turno di oggi: Map id → posizione 0..n-1 (0 = primo), fra gli id dati.
 * @param ids     chi partecipa al turno (l'ordine in cui arrivano non conta)
 * @param oggi    «AAAA-MM-GG» (ora di Roma)
 * @param chiave  turni diversi per elenchi uguali (di solito "")
 */
export function turniDelGiorno(ids, oggi = giornoRoma(), chiave = "") {
  const tutti = [...new Set(ids.map(Number))].sort((a, b) => a - b);
  const n = tutti.length;
  const turni = new Map();
  if (n === 0) return turni;
  if (n === 1) return turni.set(tutti[0], 0);

  const d = numeroGiorno(oggi);
  const giro = Math.floor(d / n), k = d % n; // k = giorno dentro il giro
  const seme = (cosa, g) => sorteggio(`${chiave}|${tutti.join(",")}|${cosa} ${g}`);
  // chi apre ogni giro (in due si alternano e basta)
  const apre = (g) => (n === 2 ? tutti[0] : tutti[seme("apre", g) % n]);

  // primi[k] = chi è primo il giorno k del giro: ognuno una volta. Chi chiude il giro
  // non è chi apre il giro dopo, così il primo cambia anche a cavallo fra due giri.
  const caso = generatore(seme("giro", giro));
  const a = apre(giro), dopo = apre(giro + 1);
  const altri = mescola(tutti.filter((id) => id !== a), caso);
  if (altri.length > 1 && altri[altri.length - 1] === dopo) [altri[0], altri[altri.length - 1]] = [altri[altri.length - 1], altri[0]];
  const primi = [a, ...altri];

  // Le altre posizioni: la «fase» di ognuno avanza di uno al giorno (fase 0 = primo) e
  // ogni fase ha una posizione mescolata. In un giro ognuno passa da tutte le posizioni.
  const posto = [0, ...mescola(Array.from({ length: n - 1 }, (_, i) => i + 1), caso)];
  primi.forEach((id, x) => turni.set(id, posto[(x - k + n) % n]));
  return turni;
}

const giornoDi = (v) => (!v ? NESSUN_ORARIO : /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : giornoRoma(v));

/**
 * Ordina una lista di infermieri con l'ordine equo. Non toglie e non aggiunge nessuno.
 * @param lista           oggetti con `id`
 * @param opzioni.oggi    «AAAA-MM-GG» (di default oggi a Roma)
 * @param opzioni.primo   (p) → primo orario libero (ISO o «AAAA-MM-GG») o null;
 *                        di default p.prossima?.start
 * @param opzioni.chiave  vedi turniDelGiorno
 */
export function ordinaEquo(lista, { oggi = giornoRoma(), primo = (p) => p.prossima?.start, chiave = "" } = {}) {
  const turni = turniDelGiorno(lista.map((p) => p.id), oggi, chiave);
  return lista
    .map((p) => ({ p, giorno: giornoDi(primo(p)), turno: turni.get(Number(p.id)) ?? Infinity }))
    .sort((a, b) => (a.giorno < b.giorno ? -1 : a.giorno > b.giorno ? 1 : 0) || a.turno - b.turno || Number(a.p.id) - Number(b.p.id))
    .map((x) => x.p);
}

// Il testo che spiega l'ordine ai pazienti (sotto «Ordina per» in /cerca)
export const SPIEGAZIONE_ORDINE = "Prima chi ha il primo orario libero più vicino; a parità di giorno l'ordine cambia ogni giorno.";
