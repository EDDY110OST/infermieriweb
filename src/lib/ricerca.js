// Come si cerca un professionista su InfermieriWeb.
//
// LA REGOLA: se il paziente scrive una LOCALITÀ, devono uscire soltanto i
// professionisti che hanno quella località tra le zone che coprono. Mai per
// somiglianza, mai per provincia o regione, mai perché il nome ci assomiglia.
// Chi non ci va, non esce: il paziente prenoterebbe una visita che non riceverà.
//
// Il confronto è sul nome intero e in un senso solo: la zona deve cominciare
// con quello che si è scritto ("cremo" → Cremona mentre si scrive, ma "crema"
// non pesca Cremona). Se quello che si è scritto è già il nome COMPLETO di un
// comune, vale solo quel comune: "lucca" non pesca Lucca Sicula, "roma" non
// pesca Romano di Lombardia.
//
// COMUNI DI PIÙ PAROLE (7/10/26). "Francavilla al Mare", "Città Sant'Angelo",
// "San Giovanni Teatino" si leggono come UNA località, non come parole sciolte.
// Le parole di collegamento (al, di, nell', sul, e…) non contano, su tutti e due
// i lati: "francavilla a mare" = "francavilla al mare" = "francavilla mare".
// L'apostrofo si può anche saltare: "santangelo" = "sant'angelo".
// L'ultima parola può essere ancora a metà ("francavilla al m") e vince il
// comune più lungo che combacia. I comuni si ricavano dalle zone della rete di
// quel momento: niente elenchi scritti a mano, vale anche per i comuni futuri.
//
// COMUNI FUORI RETE. Il server aggiunge (opzioni.comuniFuoriRete) i comuni veri
// NON coperti che si potrebbero confondere con la rete: i gemelli ("San Giovanni
// Rotondo" accanto a San Giovanni Teatino), quelli il cui nome è l'inizio di un
// comune coperto ("Roma" per Romano di Lombardia), quelli che per caso
// somigliano al nome di un infermiere o a una provincia ("Pisa" con un
// infermiere della provincia di Pisa che non copre Pisa). Chi li scrive ha
// scritto una località: escono solo quelli che la coprono, cioè nessuno.
//
// Le altre parole (prestazioni, nomi) restano morbide: "prelievo" deve trovare
// "prelievi", "puntura" deve trovare "iniezioni".
//
// Lo stesso modulo lo usano l'elenco dei risultati, i segnaposti della mappa,
// l'avviso del modulo di prenotazione e la scelta del sostituto: così non
// possono mai dire cose diverse.

// Parole di collegamento dentro i nomi dei comuni: non contano nel confronto.
const COLLEGAMENTO = new Set([
  "a", "ad", "al", "allo", "alla", "ai", "agli", "alle", "all",
  "di", "d", "de", "del", "dello", "della", "dei", "degli", "delle", "dell",
  "da", "dal", "dallo", "dalla", "dai", "dagli", "dalle", "dall",
  "in", "nel", "nello", "nella", "nei", "negli", "nelle", "nell", "ne",
  "su", "sul", "sullo", "sulla", "sui", "sugli", "sulle", "sull",
  "e", "ed", "con",
]);

// Parole che da sole non dicono niente su cosa o dove si cerca.
const STOPWORD = new Set([
  ...COLLEGAMENTO,
  "per", "il", "lo", "la", "i", "gli", "le", "l", "un", "uno", "una",
  "vicino", "zona", "casa", "domicilio",
]);

// La ricerca deve capire il paziente, non pretendere la parola esatta del listino:
// "prelievo"≈"prelievi" (radice), "puntura"→iniezioni (sinonimo), "analisi"→prelievi.
export const SINONIMI = {
  puntura: "iniezioni", punture: "iniezioni", iniezione: "iniezioni",
  intramuscolo: "im", intramuscolare: "im", intramuscolari: "im",
  sottocute: "sc", sottocutanea: "sc", sottocutanee: "sc", sottocutaneo: "sc", sottocutanei: "sc",
  sangue: "prelievi", analisi: "prelievi", prelievo: "prelievi",
  medicazione: "medicazioni", ferita: "medicazioni", ferite: "medicazioni", piaga: "medicazioni", piaghe: "medicazioni",
  picc: "cvc",
  elettrocardiogramma: "ecg", catetere: "cateteri", vescicale: "cateteri", stomia: "stomie",
  sutura: "punti", suture: "punti", nasogastrico: "sondino",
  oraria: "ora", orario: "ora",
  infermiera: "infermiere", infermieri: "infermiere", flebo: "flebo", fleboclisi: "flebo",
};

// "constructor" e simili non devono pescare nel prototipo dell'oggetto
const haSinonimo = (w) => Object.prototype.hasOwnProperty.call(SINONIMI, w);
export const sinonimo = (w) => (haSinonimo(w) ? SINONIMI[w] : w);

// Nome confrontabile: minuscolo, senza accenti né punteggiatura.
// "Sant'Angelo" e "sant angelo" devono essere la stessa cosa.
export const chiave = (testo) =>
  String(testo ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

// Radice: toglie le vocali finali, così singolare e plurale combaciano
// ("terapeutica"/"terapeutiche": anche la h del plurale in -che/-ghi).
export const radice = (parola) =>
  parola.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[aeiou]+$/, "").replace(/([cg])h$/, "$1");

export const aParole = (testo) => chiave(testo).split(" ").filter(Boolean);

const senzaCollegamenti = (p) => {
  const s = p.filter((w) => !COLLEGAMENTO.has(w));
  return s.length ? s : p; // "Ne" e "Dello" sono comuni veri: restano così
};

/**
 * Le forme confrontabili del nome di un comune: senza parole di collegamento,
 * e (se c'è un apostrofo) anche con l'apostrofo saltato.
 * "Città Sant'Angelo" → ["citta sant angelo", "citta santangelo"].
 */
export function formeComune(nome) {
  const intera = senzaCollegamenti(aParole(nome)).join(" ");
  if (!intera) return [];
  const attaccata = senzaCollegamenti(aParole(String(nome).replace(/['’‘`´]/g, ""))).join(" ");
  return attaccata === intera ? [intera] : [intera, attaccata];
}

/** Due scritture dello stesso comune? ("Citta Sant'Angelo" = "Città Sant'Angelo") */
export function stessoComune(a, b) {
  const fa = formeComune(a);
  return fa.length > 0 && formeComune(b).some((f) => fa.includes(f));
}

// Le forme dei comuni davvero coperti da qualcuno della rete.
const formeDellaRete = (lista) => {
  const forme = new Set();
  for (const p of lista) for (const c of p.coverage || []) for (const f of formeComune(c)) forme.add(f);
  return forme;
};

// ---------------------------------------------------------------- parole morbide

// "all'ora" si scrive anche "allora": per le prestazioni valgono tutte e due
const conESenzaApostrofo = (testo) => {
  const t = String(testo ?? "");
  return /['’‘`´]/.test(t) ? [t, t.replace(/['’‘`´]/g, "")] : [t];
};

// pezzi di nome, slug, professione e prestazioni (niente numeri: "irene-iommarini-2")
const pezziMorbidi = (p) =>
  [p.name, p.slug, p.profession, ...(p.servizi || []).flatMap(conESenzaApostrofo)]
    .flatMap(aParole).filter((w) => !/^\d+$/.test(w)).map(radice);

// Come si confronta una parola morbida. Un sinonimo porta a una parola intera
// del listino ("oraria" → ora, non "orale"); il resto vale anche a metà
// ("prel" mentre si scrive "prelievo").
const TERMINI = new Map();
const termineMorbido = (w) => {
  let t = TERMINI.get(w);
  if (!t) {
    t = haSinonimo(w) ? { n: w, rt: radice(SINONIMI[w]), intero: true } : { n: w, rt: radice(w), intero: false };
    if (TERMINI.size < 50000) TERMINI.set(w, t);
  }
  return t;
};

// Una parola morbida combacia con il professionista? Provincia o regione per
// inizio; prestazioni e nome per radice, in un senso solo: l'iniziale del
// cognome ("B.") non deve agganciare tutto ciò che comincia per B.
function combaciaMorbido(area, pezzi, w) {
  const t = termineMorbido(w);
  if (area.some((a) => a.startsWith(t.n))) return true;
  return t.intero ? pezzi.includes(t.rt) : pezzi.some((x) => x.startsWith(t.rt));
}

const datiMorbidi = (p) => ({ area: [p.province, p.region].map(chiave), pezzi: pezziMorbidi(p) });

// Le prestazioni offerte dalla rete (e la professione): le radici delle loro
// parole e, per i nomi di più parole, la sequenza intera.
const prestazioniDellaRete = (lista) => {
  const parole = new Set();
  const radici = new Set();
  const nomi = new Map();
  for (const p of lista) {
    for (const s of [p.profession, ...(p.servizi || []).flatMap(conESenzaApostrofo)]) {
      const w = aParole(s).filter((x) => !COLLEGAMENTO.has(x));
      for (const x of w) { parole.add(x); radici.add(radice(x)); }
      if (w.length > 1) nomi.set(w.join(" "), w.map(radice));
    }
  }
  return { parole, radici, nomi: [...nomi.values()] };
};

// ---------------------------------------------------------- comuni fuori rete

/**
 * I comuni veri (forme dall'elenco ISTAT, le passa il server) che NON sono
 * coperti ma si potrebbero confondere con la rete: stessa prima parola di un
 * comune coperto, nome che è l'inizio di un comune coperto, oppure nome che
 * combacerebbe per caso con un professionista (nome, prestazioni, provincia).
 */
export function comuniFuoriRete(lista, formeVere) {
  const rete = formeDellaRete(lista);
  const primeParole = new Set([...rete].map((f) => f.split(" ")[0]));
  const inizi = new Set();
  for (const f of rete) for (let n = 1; n < f.length; n++) inizi.add(f.slice(0, n));
  const morbidi = lista.map(datiMorbidi);
  const tutti = { area: [...new Set(morbidi.flatMap((m) => m.area))], pezzi: [...new Set(morbidi.flatMap((m) => m.pezzi))] };
  const out = [];
  for (const { f, parole } of preparaForme(formeVere)) {
    if (rete.has(f)) continue;
    if (primeParole.has(parole[0]) || inizi.has(f)) { out.push(f); continue; }
    // controllo veloce su tutti i pezzi insieme, poi professionista per professionista
    if (!parole.every((w) => combaciaMorbido(tutti.area, tutti.pezzi, w))) continue;
    if (morbidi.some((m) => parole.every((w) => combaciaMorbido(m.area, m.pezzi, w)))) out.push(f);
  }
  return out.sort();
}

// l'elenco dei comuni italiani si spezza in parole una volta sola
const PREPARATE = new WeakMap();
function preparaForme(formeVere) {
  let p = PREPARATE.get(formeVere);
  if (!p) {
    p = [...new Set(formeVere)].map((f) => ({ f, parole: f.split(" ") }));
    PREPARATE.set(formeVere, p);
  }
  return p;
}

// ------------------------------------------------------------ lettura ricerca

// Prova a leggere un comune (le sue parole: `forma`) a partire dalla parola i
// della ricerca. Le parole di collegamento scritte dal paziente si saltano;
// l'ultima parola può essere ancora a metà. Ritorna fin dove arriva e le
// parole lette, oppure null.
function leggiComune(Q, i, forma) {
  let j = i, m = 0;
  const lette = [];
  while (j < Q.length && m < forma.length) {
    const w = Q[j];
    if (w === forma[m]) { lette.push(w); j++; m++; continue; }
    if (m > 0 && COLLEGAMENTO.has(w)) { j++; continue; }
    if (forma[m].startsWith(w)) { lette.push(w); j++; break; } // parola a metà: finisce qui
    break;
  }
  return lette.length ? { fine: j, lette } : null;
}

// Il nome INTERO di una prestazione di più parole scritto a partire dalla parola i
// ("sondino naso gastrico", "assistenza personalizzata all'ora"): le sue parole
// sono prestazione, anche se una è il nome di un comune (Naso, Ora).
function leggiPrestazione(Q, i, nome) {
  let j = i, m = 0;
  while (j < Q.length && m < nome.length) {
    if (radice(Q[j]) === nome[m]) { j++; m++; continue; }
    if (m > 0 && COLLEGAMENTO.has(Q[j])) { j++; continue; }
    return 0;
  }
  return m === nome.length ? j : 0;
}

const zonaCombacia = (formeZona, t) =>
  formeZona.some((f) => (t.esatta ? f === t.testo : f.startsWith(t.testo)));

/**
 * Legge la ricerca: quali pezzi sono località (regola dura) e quali parole
 * restano morbide (prestazione, nome, provincia, regione).
 * opzioni.comuniFuoriRete: vedi comuniFuoriRete (dal server).
 */
export function leggiRicerca(lista, q, opzioni = {}) {
  const Q = aParole(q);
  const rete = formeDellaRete(lista);
  const completi = new Set([...rete, ...(opzioni.comuniFuoriRete || [])]);
  const comuni = [...completi].map((f) => f.split(" "));
  const prestazioni = prestazioniDellaRete(lista);
  // ESATTAMENTE una parola di prestazione o un sinonimo ("im", "punti", "flebo"),
  // anche al plurale ("iniezioni"), ma non un pezzo: "imo" resta l'inizio di Imola
  const eDiPrestazione = (w) => haSinonimo(w) || prestazioni.parole.has(w)
    || (w.length >= 4 && prestazioni.radici.has(radice(w)));

  const localita = [];
  const morbide = [];
  let i = 0;
  while (i < Q.length) {
    const finePrestazione = Math.max(0, ...prestazioni.nomi.map((nome) => leggiPrestazione(Q, i, nome)));
    if (finePrestazione) {
      for (const w of Q.slice(i, finePrestazione)) if (!STOPWORD.has(w)) morbide.push(w);
      i = finePrestazione;
      continue;
    }
    let migliore = null; // vince il comune più lungo che combacia
    for (const forma of comuni) {
      const r = leggiComune(Q, i, forma);
      if (r && (!migliore || r.fine > migliore.fine)) migliore = r;
    }
    if (migliore) {
      const testo = migliore.lette.join(" ");
      const esatta = completi.has(testo);
      // Una parola sola che è solo l'INIZIO di un comune ma è una parola qualsiasi
      // ("casa" → Casalmaggiore) o esattamente una prestazione ("im" → Imola):
      // vale come parola morbida. Il nome intero di un comune resta sempre località.
      const nonLocalita = !esatta && migliore.lette.length === 1 && (STOPWORD.has(testo) || eDiPrestazione(testo));
      if (!nonLocalita) {
        localita.push({ testo, esatta });
        i = migliore.fine;
        continue;
      }
    }
    const w = Q[i++];
    if (!STOPWORD.has(w)) morbide.push(w);
  }
  return { localita, morbide };
}

/**
 * Le località scritte nella ricerca.
 * La mappa la usa per mostrare i segnaposti del solo comune cercato.
 */
export function localitaCercate(lista, q, opzioni = {}) {
  return leggiRicerca(lista, q, opzioni).localita;
}

/** Il comune di un segnaposto è fra quelli cercati? */
export function comuneFraCercati(citta, localita) {
  const forme = formeComune(citta);
  return localita.some((t) => zonaCombacia(forme, t));
}

/**
 * I professionisti che rispondono alla ricerca. Tutte le parti devono
 * combaciare (chi scrive "prelievi lucca" vuole tutte e due le cose).
 */
export function filtraProfessionisti(lista, q, opzioni = {}) {
  const { localita, morbide } = leggiRicerca(lista, q, opzioni);
  if (!localita.length && !morbide.length) return lista;

  return lista.filter((p) => {
    // LA REGOLA: località → o è fra le sue zone, o non esce. Punto.
    const zone = (p.coverage || []).map(formeComune);
    if (!localita.every((t) => zone.some((f) => zonaCombacia(f, t)))) return false;
    if (!morbide.length) return true;
    // non è una località: può essere una provincia, una regione,
    // una prestazione o il nome del professionista
    const { area, pezzi } = datiMorbidi(p);
    return morbide.every((w) => combaciaMorbido(area, pezzi, w));
  });
}
