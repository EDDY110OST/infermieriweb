// Prove dell'ORDINE EQUO (lib/ordine-equo.js): nessun database, solo calcoli.
//   node scripts/test-ordine-equo.mjs
// La prova principale: su 300 giorni simulati ognuno è primo circa lo stesso numero di volte.
import { ordinaEquo, turniDelGiorno, giornoRoma } from "../src/lib/ordine-equo.js";

let ok = 0, ko = 0;
const t = (nome, cond, extra = "") => { if (cond) ok++; else { ko++; console.log("KO", nome, extra); } };

// gli id veri degli infermieri attivi a domicilio il 9/10/26 (solo numeri, nessun dato personale)
const IDS = [1, 3, 4, 9, 12, 13, 14, 15, 16, 17, 23, 24, 26, 27];
const GIORNI = 300;
const PRIMO_GIORNO = "2026-10-09";
const giornoN = (n) => { const d = new Date(`${PRIMO_GIORNO}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// tutti liberi lo stesso giorno: conta solo il turno
const tuttiDomani = (ids, oggi) => ids.map((id) => ({ id, prossima: { start: `${oggi}T08:00:00Z` } }));
const ordineIds = (lista) => lista.map((p) => p.id);

// ---------------------------------------------------------------- regole di base
{
  const oggi = "2026-10-09";
  const lista = [
    { id: 3, prossima: { start: "2026-10-11T07:00:00Z" } },   // dopodomani
    { id: 1, prossima: null },                               // nessun orario in 30 giorni
    { id: 4, prossima: { start: "2026-10-09T15:00:00Z" } },   // oggi
    { id: 9, prossima: { start: "2026-10-09T08:00:00Z" } },   // oggi, più presto: stesso GIORNO, conta il turno
    { id: 12, prossima: { start: "2026-10-10T07:00:00Z" } },  // domani
    { id: 13, prossima: null },
  ];
  const r = ordinaEquo(lista, { oggi });
  const ids = ordineIds(r);
  t("non toglie e non aggiunge nessuno", ids.length === lista.length && [...ids].sort().join() === lista.map((p) => p.id).sort().join(), ids);
  t("prima chi è libero oggi", [4, 9].includes(ids[0]) && [4, 9].includes(ids[1]), ids);
  t("poi domani, poi dopodomani", ids[2] === 12 && ids[3] === 3, ids);
  t("in fondo chi non ha orari", [1, 13].includes(ids[4]) && [1, 13].includes(ids[5]), ids);
  t("stesso giorno = stesso ordine (ripetibile)", JSON.stringify(ordineIds(ordinaEquo(lista, { oggi }))) === JSON.stringify(ids));
  t("l'ordine d'arrivo non conta", JSON.stringify(ordineIds(ordinaEquo([...lista].reverse(), { oggi }))) === JSON.stringify(ids));
  // il giorno è quello di Roma: 23:30 del 9 e 00:30 del 10 (ora di Roma) sono giorni diversi
  const notte = [
    { id: 1, prossima: { start: "2026-10-09T22:30:00Z" } }, // 00:30 del 10 a Roma
    { id: 2, prossima: { start: "2026-10-09T21:30:00Z" } }, // 23:30 del 9 a Roma
  ];
  t("giorno di Roma, non UTC", ordineIds(ordinaEquo(notte, { oggi }))[0] === 2);
  t("giornoRoma", giornoRoma("2026-10-09T22:30:00Z") === "2026-10-10" && giornoRoma("2026-10-09T21:30:00Z") === "2026-10-09");
  // il primo orario può arrivare anche come giorno («AAAA-MM-GG», come da /api/professionisti)
  const comeGiorno = ordineIds(ordinaEquo([{ id: 1, g: null }, { id: 2, g: "2026-10-12" }, { id: 3, g: "2026-10-10" }], { oggi, primo: (p) => p.g }));
  t("primo orario come giorno", comeGiorno.join() === "3,2,1", comeGiorno);
  // il turno si fa fra quelli della lista: stessa lista = stesso ordine in ogni pagina
  t("stessa lista, stesso ordine", JSON.stringify([...turniDelGiorno([26, 3, 4], oggi)].sort()) === JSON.stringify([...turniDelGiorno([3, 4, 26], oggi)].sort()));
  // chiavi diverse (es. pagine di comuni diversi) = turni diversi
  const diversi = Array.from({ length: 20 }, (_, i) => giornoN(i)).filter((g) =>
    JSON.stringify([...turniDelGiorno(IDS, g, "lucca|lucca").entries()].sort()) !== JSON.stringify([...turniDelGiorno(IDS, g, "").entries()].sort())).length;
  t("chiave diversa → turno diverso", diversi >= 18, diversi);
  t("lista vuota", ordinaEquo([], { oggi }).length === 0);
  t("uno solo", ordinaEquo([{ id: 5 }], { oggi })[0].id === 5);
}

// ---------------------------------------------------------------- 300 giorni: chi è primo?
function primiSuGiorni(ids, giorni = GIORNI, chiave = "") {
  const primi = new Map(ids.map((id) => [id, 0]));
  const posizioni = new Map(ids.map((id) => [id, new Array(ids.length).fill(0)]));
  let ugualeAlGiornoPrima = 0, prec = null;
  for (let g = 0; g < giorni; g++) {
    const oggi = giornoN(g);
    const ordine = ordineIds(ordinaEquo(tuttiDomani(ids, oggi), { oggi, chiave }));
    primi.set(ordine[0], primi.get(ordine[0]) + 1);
    ordine.forEach((id, pos) => posizioni.get(id)[pos]++);
    if (prec && prec === ordine.join()) ugualeAlGiornoPrima++;
    prec = ordine.join();
  }
  return { primi, posizioni, ugualeAlGiornoPrima };
}

console.log(`\nChi è primo, su ${GIORNI} giorni dal ${PRIMO_GIORNO} (tutti liberi lo stesso giorno):`);
for (const n of [2, 3, 7, IDS.length, 24]) {
  const ids = n === IDS.length ? IDS : Array.from({ length: n }, (_, i) => 100 + i * 7);
  const { primi, posizioni, ugualeAlGiornoPrima } = primiSuGiorni(ids);
  const v = [...primi.values()];
  const min = Math.min(...v), max = Math.max(...v), atteso = GIORNI / n;
  // ognuno è primo una volta per giro di n giorni: differenza massima 2 (inizio/fine dei giri)
  t(`${n} infermieri: primi tra ${min} e ${max} (atteso ${atteso.toFixed(1)})`, max - min <= 2, JSON.stringify([...primi]));
  t(`${n} infermieri: nessun posto fisso (ognuno passa da tutte le posizioni)`, [...posizioni.values()].every((p) => p.every((c) => c > 0)) || GIORNI < n * n,
    JSON.stringify([...posizioni].map(([id, p]) => [id, p.filter((c) => c === 0).length])));
  t(`${n} infermieri: l'ordine cambia ogni giorno`, ugualeAlGiornoPrima === 0, ugualeAlGiornoPrima);
  console.log(`  ${String(n).padStart(2)} infermieri → volte primo: min ${min}, max ${max}, atteso ${atteso.toFixed(1)}`);
  if (n === IDS.length) console.log(`     per id: ${[...primi].map(([id, c]) => `${id}:${c}`).join("  ")}`);
}

// ---------------------------------------------------------------- pareggi dentro una lista lunga
// Nella lista di tutta la rete (14) solo 3 hanno il primo orario oggi, gli altri più
// avanti: fra quei 3 ognuno deve essere primo circa un terzo delle volte, per QUALSIASI
// terzetto (il turno si fa sui 14, quindi qui conta come si mescolano le posizioni).
{
  let peggiore = { scarto: 0 }, terzetti = 0, somma = 0;
  for (let a = 0; a < IDS.length; a++) for (let b = a + 1; b < IDS.length; b++) for (let c = b + 1; c < IDS.length; c++) {
    const tre = new Set([IDS[a], IDS[b], IDS[c]]);
    const primi = new Map([...tre].map((id) => [id, 0]));
    for (let g = 0; g < GIORNI; g++) {
      const oggi = giornoN(g);
      const lista = IDS.map((id) => ({ id, prossima: { start: tre.has(id) ? `${oggi}T08:00:00Z` : `${giornoN(g + 3)}T08:00:00Z` } }));
      const primo = ordinaEquo(lista, { oggi })[0].id;
      primi.set(primo, primi.get(primo) + 1);
    }
    const v = [...primi.values()];
    const scarto = Math.max(...v.map((x) => Math.abs(x - GIORNI / 3))) / (GIORNI / 3);
    somma += scarto;
    if (scarto > peggiore.scarto) peggiore = { scarto, tre: [...tre], v };
    terzetti++;
  }
  t(`terzetti (${terzetti}): nessuno lontano più del 35% dal giusto`, peggiore.scarto <= 0.35, JSON.stringify(peggiore));
  console.log(`  pareggio di 3 su 14, tutti i ${terzetti} terzetti → caso peggiore ${peggiore.v.join("/")} su ${GIORNI} (giusto: 100 ciascuno; scarto massimo ${(peggiore.scarto * 100).toFixed(0)}%, medio ${(somma / terzetti * 100).toFixed(0)}%)`);
}

// ---------------------------------------------------------------- giorni misti, come nella realtà
// Ogni giorno ognuno ha il primo orario oggi, domani, fra 2-6 giorni o nessuno (a caso):
// a parità di occasioni (essere fra i più vicini) ognuno deve vincere circa lo stesso.
// Qui la disponibilità è tirata a sorte ogni giorno, quindi serve un periodo più lungo
// (3.000 giorni) perché il caso si compensi.
{
  const GIORNI_MISTI = 3000;
  let s = 12345;
  const caso = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  const vinte = new Map(IDS.map((id) => [id, 0])), occasioni = new Map(IDS.map((id) => [id, 0]));
  for (let g = 0; g < GIORNI_MISTI; g++) {
    const oggi = giornoN(g);
    const lista = IDS.map((id) => {
      const x = caso();
      const tra = x < 0.35 ? 0 : x < 0.6 ? 1 : x < 0.85 ? 2 + Math.floor(caso() * 5) : null;
      if (tra === null) return { id, prossima: null };
      const d = new Date(`${oggi}T09:00:00Z`); d.setUTCDate(d.getUTCDate() + tra);
      return { id, prossima: { start: d.toISOString() } };
    });
    const ordine = ordinaEquo(lista, { oggi });
    const giornoPrimo = ordine[0].prossima?.start?.slice(0, 10);
    for (const p of lista) if (p.prossima?.start?.slice(0, 10) === giornoPrimo) occasioni.set(p.id, occasioni.get(p.id) + 1 / lista.filter((q) => q.prossima?.start?.slice(0, 10) === giornoPrimo).length);
    vinte.set(ordine[0].id, vinte.get(ordine[0].id) + 1);
    // chi è primo ha sempre il giorno più vicino
    const piuVicino = lista.map((p) => p.prossima?.start?.slice(0, 10)).filter(Boolean).sort()[0];
    if (giornoPrimo !== piuVicino) t(`giorno ${oggi}: il primo non ha l'orario più vicino`, false);
  }
  const rapporti = IDS.map((id) => vinte.get(id) / occasioni.get(id));
  const min = Math.min(...rapporti), max = Math.max(...rapporti);
  t(`giorni misti: vinte/attese fra 0,75 e 1,25 (${min.toFixed(2)}-${max.toFixed(2)})`, min >= 0.75 && max <= 1.25, JSON.stringify(rapporti));
  console.log(`  giorni misti a caso, ${GIORNI_MISTI} giorni → volte primo per id: ${IDS.map((id) => `${id}:${vinte.get(id)}`).join("  ")}`);
  console.log(`     rispetto a quanto spettava (1,00 = giusto): da ${min.toFixed(2)} a ${max.toFixed(2)}`);
}

console.log(`\nprove: ${ok} ok, ${ko} ko`);
process.exit(ko ? 1 : 0);
