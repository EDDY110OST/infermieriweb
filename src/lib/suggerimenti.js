// Suggerimenti mentre si scrive nei campi di ricerca (7/10/26).
//
// Il paziente scrive «Franc» e sotto il campo compare «Francavilla al Mare (CH)
// · 1 infermiere»; scrive «prel» e compare «Prelievo». Si suggerisce SOLO quello
// che la rete serve davvero: i comuni coperti dai professionisti visibili e le
// prestazioni che offrono (anche passando dai sinonimi: «punt» → Iniezione).
//
// Il suggerimento è solo una scorciatoia per scrivere: chi esce lo decide
// sempre lib/ricerca.js. Scegliere una voce sostituisce il pezzo che si sta
// scrivendo e lascia il resto: «prelievo franc» → «prelievo Francavilla al Mare».
import { chiave, formeComune, radice, SINONIMI } from "./ricerca.js";

const MASSIMO = 8;

/**
 * L'indice dei suggerimenti, piccolo e serializzabile (la home lo riceve già
 * pronto nella pagina). `lista` = professionisti visibili con coverage (nomi
 * dei comuni), sigle ({comune: "CH"}) e servizi (nomi delle prestazioni).
 */
export function indiceSuggerimenti(lista) {
  const comuni = new Map();
  const prestazioni = new Map();
  for (const p of lista) {
    for (const c of p.coverage || []) {
      const sigla = (p.sigle && p.sigle[c]) || "";
      const k = `${formeComune(c)[0] || chiave(c)}|${sigla}`;
      if (!comuni.has(k)) comuni.set(k, { nome: c, sigla, chi: new Set() });
      comuni.get(k).chi.add(p.id);
    }
    for (const s of p.servizi || []) {
      const k = chiave(s);
      if (!k) continue;
      if (!prestazioni.has(k)) prestazioni.set(k, { nome: s, chi: new Set() });
      prestazioni.get(k).chi.add(p.id);
    }
  }
  const ordina = (a, b) => a.nome.localeCompare(b.nome, "it");
  return {
    comuni: [...comuni.values()].map(({ nome, sigla, chi }) => ({ nome, sigla, n: chi.size })).sort(ordina),
    prestazioni: [...prestazioni.values()].map(({ nome, chi }) => ({ nome, n: chi.size })).sort(ordina),
  };
}

// le forme confrontabili di ogni voce, calcolate una volta per indice
const PRONTE = new WeakMap();
function pronto(indice) {
  let x = PRONTE.get(indice);
  if (!x) {
    x = {
      comuni: (indice.comuni || []).map((v) => ({ v, forme: formeComune(v.nome) })),
      prestazioni: (indice.prestazioni || []).map((v) => {
        const forme = formeComune(v.nome); // senza parole di collegamento, anche senza apostrofo
        return { v, forme, radici: new Set(forme.flatMap((f) => f.split(" ")).map(radice)) };
      }),
    };
    PRONTE.set(indice, x);
  }
  return x;
}

// Quanto combacia una voce con quello che si è scritto: 0 = il nome intero
// comincia così, 1 = comincia così una parola del nome («mare» → Francavilla
// al Mare), -1 = no.
function quanto(forme, scritte) {
  let meglio = -1;
  for (const f of forme) {
    for (const s of scritte) {
      if (f.startsWith(s)) return 0;
      if (meglio < 0 && (" " + f).includes(" " + s)) meglio = 1;
    }
  }
  return meglio;
}

// Per le prestazioni anche i sinonimi («punt» → puntura → Iniezione) e il
// plurale («prelievi» → Prelievo): valgono dopo le altre.
function quantoPrestazione(voce, scritte, parolaSola) {
  const q = quanto(voce.forme, scritte);
  if (q >= 0 || !parolaSola) return q;
  if (parolaSola.length >= 4) {
    const r = radice(parolaSola);
    if (r.length >= 3 && [...voce.radici].some((x) => x.startsWith(r))) return 2;
  }
  for (const [chiaveSin, verso] of Object.entries(SINONIMI)) {
    if (chiaveSin.startsWith(parolaSola) && voce.radici.has(radice(verso))) return 2;
  }
  return -1;
}

// la misura interna (q) non esce dal modulo
const pulita = (v) => { delete v.q; return v; };

const etichettaComune = (v) =>
  `${v.nome}${v.sigla ? ` (${v.sigla})` : ""} · ${v.n} ${v.n === 1 ? "infermiere" : "infermieri"}`;

/**
 * I suggerimenti per il testo scritto finora.
 * Il «pezzo» è la coda del testo che si sta scrivendo: la più lunga che
 * combacia con qualcosa («francavilla al m», ma «franc» in «prelievo franc»).
 * opzioni.verifica(testoNuovo): se c'è, si tengono solo le voci che, scelte,
 * danno almeno un risultato (su /cerca la lista è già caricata).
 * Ritorna { pezzo: { inizio } | null, comuni: [...], prestazioni: [...] }.
 */
export function suggerisci(indice, testo, opzioni = {}) {
  const vuoto = { pezzo: null, comuni: [], prestazioni: [] };
  if (!indice) return vuoto;
  const grezzo = String(testo || "").replace(/\s+$/, "");
  const parole = [...grezzo.matchAll(/\S+/g)];
  const { comuni, prestazioni } = pronto(indice);

  for (let j = 0; j < parole.length; j++) {
    const inizio = parole[j].index;
    const pezzo = grezzo.slice(inizio);
    const scritte = formeComune(pezzo);
    // dal 2° carattere (spazi esclusi)
    if (!scritte.length || scritte[0].replace(/ /g, "").length < 2) continue;
    const parolaSola = scritte[0].includes(" ") ? "" : scritte[0];

    const prova = (elenco, misura, tipo) => elenco
      .map((x) => ({ x, q: misura(x) }))
      .filter(({ q }) => q >= 0)
      .map(({ x, q }) => ({ ...x.v, tipo, q }))
      .filter((s) => !opzioni.verifica || opzioni.verifica(applicaSuggerimento(grezzo, { inizio }, s)))
      .sort((a, b) => a.q - b.q || b.n - a.n || a.nome.localeCompare(b.nome, "it"));
    const c = prova(comuni, (x) => quanto(x.forme, scritte), "comune");
    const p = prova(prestazioni, (x) => quantoPrestazione(x, scritte, parolaSola), "prestazione");
    if (!c.length && !p.length) continue;

    // al massimo 8 voci, e se ci sono tutti e due i gruppi almeno 4 per gruppo
    const nC = Math.min(c.length, Math.max(MASSIMO - p.length, MASSIMO / 2));
    const nP = Math.min(p.length, MASSIMO - nC);
    return {
      pezzo: { inizio },
      comuni: c.slice(0, nC).map((v) => pulita({ ...v, etichetta: etichettaComune(v) })),
      prestazioni: p.slice(0, nP).map((v) => pulita({ ...v, etichetta: v.nome })),
    };
  }
  return vuoto;
}

/** Il testo dopo aver scelto un suggerimento: cambia solo il pezzo che si stava scrivendo. */
export function applicaSuggerimento(testo, pezzo, voce) {
  const grezzo = String(testo || "").replace(/\s+$/, "");
  return pezzo ? grezzo.slice(0, pezzo.inizio) + voce.nome : voce.nome;
}
