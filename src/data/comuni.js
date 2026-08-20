// Elenco ufficiale dei comuni italiani (fonte: codici ISTAT, 7.904 comuni).
// Il file comuni.json è compatto: [nome, siglaProvincia, provincia, regione, popolazione, lat, lng].
// Sta SOLO sul server: al browser arrivano i pochi suggerimenti chiesti, non 520 KB.
// Le coordinate le genera scripts/coordinate-comuni.mjs e servono a mettere sulla
// mappa un segnaposto per ogni zona coperta da un professionista.
import GREZZO from "./comuni.json";

export const COMUNI = GREZZO.map(([nome, sigla, provincia, regione, popolazione, lat, lng]) => ({
  nome,
  sigla,
  provincia,
  regione,
  popolazione,
  lat,
  lng,
  etichetta: `${nome} (${sigla})`,
}));

export const REGIONI = [...new Set(COMUNI.map((c) => c.regione))].sort();

// Chiave di confronto: minuscolo, senza accenti, senza punteggiatura.
// Serve perché la gente scrive "forte dei marmi", "Sant Angelo", "reggio emilia".
export function normalizza(testo) {
  return (testo || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const INDICE = COMUNI.map((c) => ({ c, k: normalizza(c.nome), kp: normalizza(c.provincia) }));
const PER_CHIAVE = new Map();
for (const v of INDICE) if (!PER_CHIAVE.has(v.k)) PER_CHIAVE.set(v.k, v.c);

// Il comune esiste davvero? (validazione lato server: niente zone inventate)
export function trovaComune(nome, sigla) {
  const k = normalizza(nome);
  const candidati = INDICE.filter((v) => v.k === k).map((v) => v.c);
  if (!candidati.length) return null;
  if (sigla) return candidati.find((c) => c.sigla.toUpperCase() === sigla.toUpperCase()) || null;
  // omonimi senza sigla (es. Castro BG/LE): scegli il più popoloso, è il più probabile
  return candidati.sort((a, b) => b.popolazione - a.popolazione)[0];
}

// Tabella pronta delle coordinate: le zone coperte sono tante (fino a 30 per
// professionista) e vanno risolte a ogni chiamata dell'API della mappa, meglio
// una ricerca immediata che una scansione dell'elenco per ogni zona.
const COORDINATE = new Map();
const COORDINATE_PER_NOME = new Map();
for (const c of [...COMUNI].sort((a, b) => b.popolazione - a.popolazione)) {
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
  const punto = { lat: c.lat, lng: c.lng };
  const k = normalizza(c.nome);
  COORDINATE.set(`${k}|${normalizza(c.sigla)}`, punto);
  COORDINATE.set(`${k}|${normalizza(c.provincia)}`, punto);
  // omonimi (Castro BG/LE): senza provincia vince il più popoloso, come trovaComune
  if (!COORDINATE_PER_NOME.has(k)) COORDINATE_PER_NOME.set(k, punto);
}

// Coordinate del centro di un comune, o null se non lo conosciamo.
// `provincia` accetta sia il nome ("Lucca") sia la sigla ("LU"): nel database le
// zone coperte hanno il nome per esteso, le candidature a volte la sigla.
export function coordinateComune(nome, provincia) {
  const k = normalizza(nome);
  if (!k) return null;
  if (provincia) {
    const preciso = COORDINATE.get(`${k}|${normalizza(provincia)}`);
    if (preciso) return preciso;
  }
  return COORDINATE_PER_NOME.get(k) || null;
}

// Suggerimenti per la tendina: prima chi inizia con quello che si sta scrivendo,
// poi chi lo contiene; a parità vince il comune più popoloso (più probabile).
export function cercaComuni(query, limite = 8) {
  const q = normalizza(query);
  if (q.length < 2) return [];
  const iniziano = [];
  const contengono = [];
  for (const v of INDICE) {
    if (v.k.startsWith(q)) iniziano.push(v.c);
    else if (v.k.includes(q) || v.kp.startsWith(q)) contengono.push(v.c);
    if (iniziano.length >= limite * 4) break;
  }
  const ordina = (a, b) => b.popolazione - a.popolazione;
  return [...iniziano.sort(ordina), ...contengono.sort(ordina)].slice(0, limite);
}
