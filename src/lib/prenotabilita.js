// «Si può prenotare questo professionista nei prossimi N giorni?» e, se no, PERCHÉ (8/10/26).
// Caso vero: un'infermiera aveva aggiornato gli orari ma nessun paziente vedeva orari
// liberi: tre blocchi lunghi mesi e decine di giorni chiusi uno a uno, invisibili nel
// pannello. Qui c'è UN solo calcolo, lo stesso del sito pubblico (slots.js): orario
// settimanale, eccezioni del giorno (day_overrides), blocchi, prenotazioni, anticipo
// minimo e regola della notte. Lo usano: la prima disponibilità sulle schede pubbliche
// (nextAvailability), l'avviso in cima al pannello e l'etichetta nell'elenco admin.
import { sql } from "./db.js";
import { romeDateTime, romeWeekday } from "./slots.js";
import { eNotte } from "../data/listino.js";
import { descriviBlocco, dataEstesa } from "./blocchi-testo.js";

export const GIORNI_FINESTRA = 30;
const STEP_MIN = 30;
const dataRoma = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(d);

// Tutti i dati dell'agenda di UN professionista (pid) o di TUTTI (pid = null), in 6 query.
export async function caricaAgende({ pid = null, giorni = GIORNI_FINESTRA, now = new Date() } = {}) {
  const fine = new Date(now.getTime() + giorni * 86400000);
  const daGiorno = dataRoma(now), aGiorno = dataRoma(fine);
  const [professionisti, servizi, orari, eccezioni, blocchi, prenotazioni] = await Promise.all([
    sql`SELECT id, status, lead_minutes FROM professionals
        WHERE status <> 'deleted' AND (${pid}::int IS NULL OR id = ${pid}::int)`,
    sql`SELECT professional_id, id, duration_min, price_notte_cents FROM services
        WHERE active AND (${pid}::int IS NULL OR professional_id = ${pid}::int)`,
    sql`SELECT professional_id, weekday, start_min, end_min FROM opening_hours
        WHERE (${pid}::int IS NULL OR professional_id = ${pid}::int) ORDER BY start_min`,
    sql`SELECT professional_id, day::text AS day, fasce FROM day_overrides
        WHERE day >= ${daGiorno} AND day <= ${aGiorno} AND (${pid}::int IS NULL OR professional_id = ${pid}::int)`,
    sql`SELECT professional_id, id, start_dt, end_dt, reason FROM blocks
        WHERE start_dt < ${fine.toISOString()} AND end_dt > ${now.toISOString()}
          AND (${pid}::int IS NULL OR professional_id = ${pid}::int) ORDER BY start_dt`,
    sql`SELECT professional_id, start_dt, end_dt FROM bookings
        WHERE (status = 'active' OR (status = 'pending' AND created_at > now() - interval '60 minutes'))
          AND start_dt < ${fine.toISOString()} AND end_dt > ${now.toISOString()}
          AND (${pid}::int IS NULL OR professional_id = ${pid}::int)`,
  ]);
  const perProf = (righe) => righe.reduce((acc, r) => ((acc[r.professional_id] ||= []).push(r), acc), {});
  return { professionisti, servizi: perProf(servizi), orari: perProf(orari), eccezioni: perProf(eccezioni), blocchi: perProf(blocchi), prenotazioni: perProf(prenotazioni), now, giorni };
}

// «oggi alle 9:00» | «domani alle 9:00» | «gio 17 lug alle 9:00»
function testoQuando(start, dateStr, t, now) {
  const ora = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  const oggi = dataRoma(now), domani = dataRoma(new Date(now.getTime() + 86400000));
  if (dateStr === oggi) return `oggi alle ${ora}`;
  if (dateStr === domani) return `domani alle ${ora}`;
  return `${new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short" }).format(start)} alle ${ora}`;
}

// Calcolo puro (nessuna query): torna { prenotabile, prima, motivi, giorni, conteggi }.
//  - prima: { start, testo } del primo orario libero, o null
//  - motivi: [{ tipo, testo, dove }] SOLO quando non è prenotabile; «dove» dice la scheda
//    del pannello in cui si corregge: profilo | servizi | orari | blocchi | agenda
export function calcolaPrenotabilita({ prof, servizi = [], orari = [], eccezioni = [], blocchi = [], prenotazioni = [], now = new Date(), giorni = GIORNI_FINESTRA }) {
  const motivi = [];
  const esito = (prenotabile, prima, conteggi = null) => ({ prenotabile, prima, motivi, giorni, conteggi });

  if (!prof || prof.status !== "active") {
    motivi.push({
      tipo: "non_attivo", dove: "profilo",
      testo: prof?.status === "network" ? "Senza partita IVA: la scheda non è prenotabile"
        : prof?.status === "suspended" ? "La scheda è sospesa"
        : "La scheda non è attiva",
    });
    return esito(false, null);
  }
  const servizio = servizi.slice().sort((a, b) => a.duration_min - b.duration_min)[0];
  if (!servizio) {
    motivi.push({ tipo: "nessuna_prestazione", dove: "servizi", testo: "Nessuna prestazione attiva" });
    return esito(false, null);
  }

  const fissoPerGiorno = {};
  for (const h of orari) (fissoPerGiorno[h.weekday] ||= []).push([Number(h.start_min), Number(h.end_min)]);
  const ecc = Object.fromEntries(eccezioni.map((o) => [String(o.day).slice(0, 10), (o.fasce || []).map((f) => f.map(Number))]));
  const busyBlocchi = blocchi.map((b) => [new Date(b.start_dt).getTime(), new Date(b.end_dt).getTime()]);
  const busyPren = prenotazioni.map((b) => [new Date(b.start_dt).getTime(), new Date(b.end_dt).getTime()]);
  const notBefore = now.getTime() + (Number(prof.lead_minutes) || 0) * 60000;
  const durata = Number(servizio.duration_min) || 30;

  const c = { giorniConFasce: 0, giorniChiusiAMano: 0, giorniSenzaOrarioFisso: 0, giorniFasceCorte: 0,
    persiBlocco: 0, persiPrenotazione: 0, persiNotte: 0, persiAnticipo: 0, chiusi: [] };
  let prima = null;

  for (let g = 0; g < giorni && !prima; g++) {
    const dateStr = dataRoma(new Date(now.getTime() + g * 86400000));
    const weekday = romeWeekday(dateStr);
    const fisse = fissoPerGiorno[weekday] || [];
    let fasce, fonte;
    if (dateStr in ecc) { fasce = ecc[dateStr]; fonte = "eccezione"; } else { fasce = fisse; fonte = "fisso"; }
    if (!fasce.length) {
      // un giorno chiuso a mano conta come causa solo se quel giorno avrebbe avuto orari fissi
      if (fonte === "eccezione" && fisse.length) { c.giorniChiusiAMano++; c.chiusi.push(dateStr); }
      else c.giorniSenzaOrarioFisso++;
      continue;
    }
    c.giorniConFasce++;
    let candidati = 0;
    for (const [da, a] of fasce) {
      for (let t = da; t + durata <= a; t += STEP_MIN) {
        candidati++;
        const start = romeDateTime(dateStr, t);
        const s = start.getTime(), e = s + durata * 60000;
        if (s < notBefore) { c.persiAnticipo++; continue; }
        if (eNotte(t) && !servizio.price_notte_cents) { c.persiNotte++; continue; }
        if (busyBlocchi.some(([bs, be]) => s < be && e > bs)) { c.persiBlocco++; continue; }
        if (busyPren.some(([bs, be]) => s < be && e > bs)) { c.persiPrenotazione++; continue; }
        prima = { start: start.toISOString(), testo: testoQuando(start, dateStr, t, now) };
        break;
      }
      if (prima) break;
    }
    if (!candidati) c.giorniFasceCorte++;
  }
  if (prima) return esito(true, prima, c);

  // ---- perché no: in ordine di importanza, solo le cause vere ----
  const haOrariFissi = orari.length > 0;
  const haGiorniApertiAMano = Object.values(ecc).some((f) => f.length);
  if (!haOrariFissi && !haGiorniApertiAMano) {
    motivi.push({ tipo: "nessun_orario", dove: "orari", testo: "Nessun orario settimanale" });
  }
  for (const b of blocchi) {
    motivi.push({ tipo: "blocco", dove: "blocchi", id: b.id, start_dt: b.start_dt, end_dt: b.end_dt,
      testo: `Blocco ${descriviBlocco(b.start_dt, b.end_dt)}${b.reason ? ` · ${b.reason}` : ""}` });
  }
  if (c.giorniChiusiAMano > 0) {
    const primo = dataEstesa(romeDateTime(c.chiusi[0], 12 * 60));
    const ultimo = dataEstesa(romeDateTime(c.chiusi[c.chiusi.length - 1], 12 * 60));
    motivi.push({ tipo: "giorni_chiusi", dove: "agenda", giorni: c.chiusi,
      testo: c.giorniChiusiAMano === 1 ? `1 giorno chiuso a mano (${primo})`
        : `${c.giorniChiusiAMano} giorni chiusi uno a uno (dal ${primo} al ${ultimo})` });
  }
  if (c.persiNotte > 0) {
    motivi.push({ tipo: "solo_notte", dove: "servizi", testo: "Gli orari di notte (22:00–7:00) non si prenotano senza il prezzo notturno" });
  }
  if (c.giorniFasceCorte > 0 && c.giorniFasceCorte === c.giorniConFasce) {
    motivi.push({ tipo: "fasce_corte", dove: "orari", testo: `Le fasce orarie sono più corte della prestazione più breve (${durata} minuti)` });
  }
  if (c.persiPrenotazione > 0 && !motivi.length) {
    motivi.push({ tipo: "tutto_prenotato", dove: "agenda", testo: `Tutti gli orari dei prossimi ${giorni} giorni sono già prenotati` });
  }
  if (c.persiAnticipo > 0 && !motivi.length) {
    motivi.push({ tipo: "anticipo", dove: "profilo", testo: `L'anticipo minimo di prenotazione (${prof.lead_minutes} minuti) copre tutti i ${giorni} giorni` });
  }
  if (!motivi.length) motivi.push({ tipo: "altro", dove: "orari", testo: `Nessun orario libero nei prossimi ${giorni} giorni` });
  return esito(false, null, c);
}

function calcolaDaAgende(dati, prof) {
  return calcolaPrenotabilita({
    prof, servizi: dati.servizi[prof.id] || [], orari: dati.orari[prof.id] || [], eccezioni: dati.eccezioni[prof.id] || [],
    blocchi: dati.blocchi[prof.id] || [], prenotazioni: dati.prenotazioni[prof.id] || [], now: dati.now, giorni: dati.giorni,
  });
}

// Un professionista
export async function prenotabilitaDi(pid, { giorni = GIORNI_FINESTRA, now = new Date() } = {}) {
  const dati = await caricaAgende({ pid: Number(pid) || 0, giorni, now });
  return calcolaDaAgende(dati, dati.professionisti[0] || null);
}

// Tutti i professionisti (non cancellati): { [id]: risultato }
export async function prenotabilitaTutti({ giorni = GIORNI_FINESTRA, now = new Date() } = {}) {
  const dati = await caricaAgende({ pid: null, giorni, now });
  return Object.fromEntries(dati.professionisti.map((p) => [p.id, calcolaDaAgende(dati, p)]));
}
