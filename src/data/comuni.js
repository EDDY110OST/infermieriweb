// Elenco ufficiale dei comuni italiani (fonte: codici ISTAT, 7.904 comuni).
// Il file comuni.json è compatto: [nome, siglaProvincia, provincia, regione, popolazione].
// Sta SOLO sul server: al browser arrivano i pochi suggerimenti chiesti, non 375 KB.
import GREZZO from "./comuni.json";

export const COMUNI = GREZZO.map(([nome, sigla, provincia, regione, popolazione]) => ({
  nome,
  sigla,
  provincia,
  regione,
  popolazione,
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
  return candidati[0]; // omonimi senza sigla: il primo in ordine alfabetico
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
