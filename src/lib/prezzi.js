// Prezzi sul sito (9/10/26, decisione di Bruno, uguale per tutti gli infermieri).
//
// NIENTE PREZZO MINIMO PER INFERMIERE. Il «da X €» accanto a un nome metteva a
// confronto prestazioni diverse (il clistere di uno contro la medicazione di un
// altro) e spingeva a scegliere chi SEMBRA costare meno. Restano i prezzi delle
// singole prestazioni: nella scheda, e nei risultati della ricerca quando il
// paziente ha scelto o scritto una prestazione precisa («Iniezione IM: 30 €»).
// L'ordine «per prezzo» esiste solo in quel caso, e vale per quella prestazione.
//
// Formato unico in tutto il sito: «40 €», «40,50 €» (niente «,00»).
import { leggiRicerca, aParole, radice, SINONIMI } from "./ricerca.js";

export function euro(cents) {
  const c = Math.round(Number(cents) || 0);
  return `${c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")} €`;
}

// «di notte X €» si scrive SOLO se il prezzo di notte è diverso da quello di giorno
// (9/10/26): «Flebo 50 € · di notte 50 €» non dice niente e fa pensare a un errore.
// Vale ovunque: card della ricerca, scheda, modulo di prenotazione (🌙 e «tariffa notturna»).
// Ritorna il prezzo di notte da mostrare, o null.
export function notteDaMostrare(giornoCents, notteCents) {
  const g = Number(giornoCents), n = Number(notteCents);
  return n > 0 && n !== g ? n : null;
}

// Oltre questo numero di prestazioni diverse la ricerca non è «una prestazione
// precisa»: niente prezzi sulle card e niente ordine per prezzo.
const MASSIMO_PRESTAZIONI = 4;

const haSinonimo = (w) => Object.prototype.hasOwnProperty.call(SINONIMI, w);

// La prestazione è la stessa per tutti quando ha la stessa chiave del listino.
export const chiavePrestazione = (s) => s.k || `nome:${aParole(s.nome).join(" ")}`;

// Le parole del nome di una prestazione, intere e come radici
// («all'ora» vale anche «allora», come nella ricerca).
function paroleNome(nome) {
  const t = String(nome ?? "");
  const parole = [...new Set([t, t.replace(/['’‘`´]/g, "")].flatMap(aParole))].filter((w) => !/^\d+$/.test(w));
  return { parole: new Set(parole), radici: new Set(parole.map(radice)) };
}

// Una parola scritta dal paziente indica PROPRIO questa prestazione? Solo parole
// riconosciute per intero: un sinonimo («puntura» → iniezioni, «intramuscolo» →
// IM), una parola del nome («ecg», «im») o la stessa radice («prelievi» =
// Prelievo). Un pezzo a metà mentre si scrive («iniez») non basta ancora.
function indica(w, x) {
  if (haSinonimo(w)) return x.radici.has(radice(SINONIMI[w]));
  return x.parole.has(w) || (w.length >= 4 && x.radici.has(radice(w)));
}

/**
 * Le prestazioni che il paziente ha scelto o scritto, lette con la stessa
 * ricerca di lib/ricerca.js (le parole che non sono località). Ritorna
 * [{ chiave, nome }]: vuoto se non ha cercato una prestazione precisa.
 * «Iniezione IM» → solo IM; «iniezioni» → IM e SC; «prelievo ecg» → tutte e due;
 * «Pescara» o il nome di un infermiere → nessuna.
 * `lista` = i professionisti come li dà /api/professionisti (con `prezzi`).
 */
export function prestazioniCercate(lista, q, opzioni = {}) {
  const { morbide } = leggiRicerca(lista, q, opzioni);
  if (!morbide.length) return [];
  const rete = new Map();
  for (const p of lista) {
    for (const s of p.prezzi || []) {
      const chiave = chiavePrestazione(s);
      if (!rete.has(chiave)) rete.set(chiave, { chiave, nome: s.nome, ...paroleNome(s.nome) });
    }
  }
  // per ogni prestazione, quali parole scritte la indicano
  const conParole = [...rete.values()]
    .map((x) => ({ x, dette: morbide.filter((w) => indica(w, x)) }))
    .filter(({ dette }) => dette.length > 0);
  // vince la prestazione più precisa: con «Iniezione IM» la SC (che risponde
  // solo a «iniezione») esce, perché la IM risponde a tutte e due le parole
  const scelte = conParole.filter(({ dette }) =>
    !conParole.some((altra) => altra.dette.length > dette.length && dette.every((w) => altra.dette.includes(w))));
  if (scelte.length > MASSIMO_PRESTAZIONI) return [];
  return scelte.map(({ x }) => ({ chiave: x.chiave, nome: x.nome }));
}

/** Il prezzo che quel professionista chiede per quella prestazione, se la offre. */
export function prezzoPrestazione(p, chiave) {
  return (p.prezzi || []).find((s) => chiavePrestazione(s) === chiave) || null;
}
