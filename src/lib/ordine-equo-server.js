// L'ordine equo (lib/ordine-equo.js) con il primo orario libero letto dal database.
//
// Il primo orario libero viene da prenotabilitaTutti (lib/prenotabilita.js): 6 query per
// TUTTA la rete, non una per infermiere, e lo stesso calcolo delle schede. Il risultato
// resta in memoria per pochi minuti: la ricerca e le liste lo riusano senza rifare le query.
// Qui si cambia solo l'ordine, mai chi esce.
import { prenotabilitaTutti, GIORNI_FINESTRA } from "./prenotabilita.js";
import { giornoRoma, ordinaEquo } from "./ordine-equo.js";

const DURATA_CACHE_MS = 3 * 60 * 1000;
const DURATA_SE_ERRORE_MS = 15 * 1000;
let memoria = null; // { giorno, scade, promessa }

async function calcola(now) {
  const oggi = giornoRoma(now);
  let prenotabilita = {}, riuscito = true;
  try {
    prenotabilita = await prenotabilitaTutti({ giorni: GIORNI_FINESTRA, now });
  } catch (e) {
    // senza orari l'ordine resta a turno: nessuno sparisce, si riprova fra poco
    console.error("[ordine-equo] primo orario libero non calcolato:", e.message);
    riuscito = false;
  }
  // id → giorno (ora di Roma) del primo orario libero nei prossimi 30 giorni, o null
  const primo = new Map(Object.entries(prenotabilita).map(([id, r]) => [Number(id), r.prima ? giornoRoma(r.prima.start) : null]));
  return {
    oggi,
    primo,
    riuscito,
    /** La lista nell'ordine equo di oggi (turno fra quelli della lista). */
    ordina: (lista, chiave = "") => ordinaEquo(lista, { oggi, primo: (p) => primo.get(Number(p.id)) ?? null, chiave }),
  };
}

/** { oggi, primo, ordina } — ricalcolati al massimo ogni 3 minuti, e sempre al cambio di giorno. */
export async function ordineEquoDiOggi() {
  const now = new Date();
  const giorno = giornoRoma(now);
  if (memoria && memoria.giorno === giorno && memoria.scade > now.getTime()) return memoria.promessa;
  const promessa = calcola(now);
  const voce = { giorno, scade: now.getTime() + DURATA_CACHE_MS, promessa };
  memoria = voce;
  const dati = await promessa;
  if (!dati.riuscito) voce.scade = now.getTime() + DURATA_SE_ERRORE_MS;
  return dati;
}

/** La lista nell'ordine equo di oggi. */
export async function ordinaOggi(lista, chiave = "") {
  if (lista.length < 2) return lista; // niente da ordinare: niente query
  return (await ordineEquoDiOggi()).ordina(lista, chiave);
}
