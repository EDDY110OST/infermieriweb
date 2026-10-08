// Testi dei blocchi dell'agenda (8/10/26). Caso vero: un'infermiera aveva tre blocchi di
// mesi (ottobre→dicembre, tutto il 2027) e nel pannello si leggeva solo «🔒 Orario
// bloccato fino alle 00:00»: sembrava una pausa di poche ore. Da qui in poi un blocco si
// descrive SEMPRE con le date complete e la durata. Questo file non tocca il database:
// lo usano sia il server sia il browser (pannello e admin).

const ROMA = "Europe/Rome";

const fmtData = new Intl.DateTimeFormat("it-IT", { timeZone: ROMA, weekday: "short", day: "numeric", month: "long", year: "numeric" });
const fmtOra = new Intl.DateTimeFormat("it-IT", { timeZone: ROMA, hour: "2-digit", minute: "2-digit" });
const fmtGiorno = new Intl.DateTimeFormat("en-CA", { timeZone: ROMA });

// «lun 5 ottobre 2026»
export const dataEstesa = (d) => fmtData.format(new Date(d));
// «14:00»
export const oraRoma = (d) => fmtOra.format(new Date(d));
// «2026-10-05» (giorno di Roma)
export const giornoRoma = (d) => fmtGiorno.format(new Date(d));

// Giorni interi coperti da un blocco (almeno 1). Un blocco che finisce a mezzanotte
// NON conta il giorno dopo: dal 5 alle 00:00 al 6 alle 00:00 = 1 giorno.
export function giorniBlocco(start, end) {
  const s = new Date(start).getTime(), e = new Date(end).getTime();
  if (!(e > s)) return 0;
  const primo = giornoRoma(s);
  const ultimo = giornoRoma(e - 60000); // l'ultimo minuto coperto
  const [y1, m1, d1] = primo.split("-").map(Number);
  const [y2, m2, d2] = ultimo.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
}

// Vero se il blocco copre giorni interi (dalle 00:00 alle 00:00 del giorno dopo, o alle 23:59)
export function bloccoGiorniInteri(start, end) {
  return oraRoma(start) === "00:00" && (oraRoma(end) === "00:00" || oraRoma(end) === "23:59");
}

// Descrizione completa, con le date per esteso e la durata:
//  - «dal lun 5 ottobre 2026 al gio 31 dicembre 2026 (88 giorni)»
//  - «lun 5 ottobre 2026 dalle 14:00 alle 16:00»
//  - «dal lun 5 ottobre 2026 alle 14:00 al mar 6 ottobre 2026 alle 10:00 (2 giorni)»
export function descriviBlocco(start, end) {
  const giorni = giorniBlocco(start, end);
  const s = new Date(start), e = new Date(end);
  const ultimoMinuto = new Date(e.getTime() - 60000);
  if (bloccoGiorniInteri(s, e)) {
    if (giorni === 1) return `${dataEstesa(s)}, tutto il giorno`;
    return `dal ${dataEstesa(s)} al ${dataEstesa(ultimoMinuto)} (${giorni} giorni)`;
  }
  if (giornoRoma(s) === giornoRoma(ultimoMinuto)) {
    return `${dataEstesa(s)} dalle ${oraRoma(s)} alle ${oraRoma(e)}`;
  }
  return `dal ${dataEstesa(s)} alle ${oraRoma(s)} al ${dataEstesa(e)} alle ${oraRoma(e)} (${giorni} giorni)`;
}

// Riga sotto la descrizione: durata (solo se la descrizione non la dice già) e motivo.
// «2 ore · pausa» · «ferie» · «1 giorno»
export function sottotitoloBlocco(start, end, reason = "") {
  const giorni = giorniBlocco(start, end);
  const durataGiaDetta = bloccoGiorniInteri(start, end) && giorni > 1;
  return [durataGiaDetta ? "" : durataBlocco(start, end), String(reason || "").trim()].filter(Boolean).join(" · ");
}

// Etichetta corta per la durata: «2 ore», «1 giorno», «88 giorni»
export function durataBlocco(start, end) {
  const giorni = giorniBlocco(start, end);
  const ore = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  if (ore < 24 && giornoRoma(start) === giornoRoma(new Date(end).getTime() - 60000)) {
    const h = Math.floor(ore), m = Math.round((ore - h) * 60);
    if (h === 0) return `${m} minuti`;
    return m ? `${h} ore e ${m} minuti` : h === 1 ? "1 ora" : `${h} ore`;
  }
  return giorni === 1 ? "1 giorno" : `${giorni} giorni`;
}
