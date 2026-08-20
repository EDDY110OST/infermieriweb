// Come si cerca un professionista su InfermieriWeb.
//
// LA REGOLA: se il paziente scrive una LOCALITÀ, devono uscire soltanto i
// professionisti che hanno quella località tra le zone che coprono. Mai per
// somiglianza, mai per provincia o regione, mai perché il nome ci assomiglia.
// Chi non ci va, non esce: il paziente prenoterebbe una visita che non riceverà.
//
// Le altre parole (prestazioni, nomi) restano morbide: "prelievo" deve trovare
// "prelievi", "puntura" deve trovare "iniezioni".
//
// Lo stesso modulo lo usano l'elenco dei risultati e i segnaposti della mappa,
// così non possono mai dire due cose diverse.

const STOPWORD = new Set(["a", "ad", "di", "da", "in", "per", "il", "lo", "la", "un", "uno", "una", "vicino", "zona", "casa", "domicilio", "e"]);

// La ricerca deve capire il paziente, non pretendere la parola esatta del listino:
// "prelievo"≈"prelievi" (radice), "puntura"→iniezioni (sinonimo), "analisi"→prelievi.
const SINONIMI = {
  puntura: "iniezioni", punture: "iniezioni", iniezione: "iniezioni",
  sangue: "prelievi", analisi: "prelievi", prelievo: "prelievi",
  medicazione: "medicazioni", ferita: "medicazioni", ferite: "medicazioni", piaga: "medicazioni", piaghe: "medicazioni",
  elettrocardiogramma: "ecg", catetere: "cateteri", stomia: "stomie",
  infermiera: "infermiere", infermieri: "infermiere", flebo: "flebo",
};

// Nome confrontabile: minuscolo, senza accenti né punteggiatura.
// "Sant'Angelo" e "sant angelo" devono essere la stessa cosa.
export const chiave = (testo) =>
  (testo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

// Radice: toglie le vocali finali, così singolare e plurale combaciano.
export const radice = (parola) =>
  parola.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[aeiou]+$/, "");

export const parole = (q) =>
  (q || "").trim().toLowerCase().split(/\s+/).filter((t) => t && !STOPWORD.has(t));

const aPezzi = (testo) =>
  chiave(testo).split(" ").filter(Boolean);

// I comuni davvero coperti da qualcuno della rete. Serve a capire se la parola
// scritta è una località (allora vale la regola dura) o dell'altro.
const comuniDellaRete = (lista) => {
  const insieme = new Set();
  for (const p of lista) for (const c of p.coverage || []) insieme.add(chiave(c));
  return insieme;
};

// La parola scritta punta a un comune della rete? Basta l'inizio, così la
// ricerca funziona anche mentre si sta ancora scrivendo ("cremo" → Cremona).
// Il confronto è sul nome intero, non sulla radice: "crema" non deve pescare
// Cremona, e "cremona" non deve pescare Crema.
const puntaAUnComune = (n, comuni) => {
  for (const c of comuni) if (c.startsWith(n)) return true;
  return false;
};

const zonaCombacia = (zone, n) => zone.some((z) => z.startsWith(n));

/**
 * Le parole della ricerca che sono località coperte dalla rete.
 * La mappa la usa per mostrare i segnaposti del solo comune cercato.
 */
export function localitaCercate(lista, q) {
  const comuni = comuniDellaRete(lista);
  return parole(q).map(chiave).filter((n) => n && puntaAUnComune(n, comuni));
}

/** Il comune di un segnaposto è fra quelli cercati? */
export function comuneFraCercati(citta, localita) {
  const n = chiave(citta);
  return localita.some((l) => n.startsWith(l));
}

/**
 * I professionisti che rispondono alla ricerca. Tutte le parole devono
 * combaciare (chi scrive "prelievi lucca" vuole tutte e due le cose).
 */
export function filtraProfessionisti(lista, q) {
  const termini = parole(q);
  if (!termini.length) return lista;
  const comuni = comuniDellaRete(lista);

  // deciso una volta per tutte: questa parola è una località o no?
  const cercate = termini.map((t) => {
    const n = chiave(t);
    return { n, localita: puntaAUnComune(n, comuni), rt: radice(SINONIMI[t] || t) };
  });

  return lista.filter((p) => {
    const zone = (p.coverage || []).map(chiave);
    return cercate.every((t) => {
      // LA REGOLA: località → o è fra le sue zone, o non esce. Punto.
      if (t.localita) return zonaCombacia(zone, t.n);
      // non è una località: può essere una provincia, una regione,
      // una prestazione o il nome del professionista
      const area = [p.province, p.region].map(chiave);
      if (area.some((a) => a.startsWith(t.n))) return true;
      const altro = [p.name, p.profession, ...(p.servizi || [])].flatMap(aPezzi).map(radice);
      // confronto in un senso solo: l'iniziale del cognome ("B.") non deve
      // agganciare tutto ciò che comincia per B (Brescia, Bologna, Bari...)
      return altro.some((w) => w.startsWith(t.rt));
    });
  });
}
