// Appellativo dei professionisti (scelta dei soci, 7/10/26): «Inf.» per tutti,
// uomini e donne — è l'abbreviazione dell'albo e non ha genere. «Infermiere /
// Infermiera» resta nel campo `profession`, mostrato sotto il nome.
// Prima era «Dott. / Dott.ssa» (legittimo per i laureati, ma i soci hanno preferito
// il titolo professionale). Il titolo vive SOLO qui: nessun altro file lo scrive.

export const APPELLATIVO = "Inf.";

// Anche i titoli vecchi, per leggere nomi già salvati o scritti a mano
const RE_TITOLO = /^(Dott\.(ssa)?|Inf\.|Dr\.(ssa)?)\s+/i;

// Stessa regola in SQL (ORDER BY sul nome senza titolo, così gli uomini non
// finivano tutti prima delle donne quando il titolo era diverso)
export const SQL_RE_TITOLO = "^(Dott\\.(ssa)?|Inf\\.)\\s+";

export const senzaTitolo = (name) => String(name || "").trim().replace(RE_TITOLO, "");

export const conTitolo = (name) => `${APPELLATIVO} ${senzaTitolo(name)}`;

// Nome pubblico «Inf. Nome I.» dal nome completo: il cognome resta riservato
// (va solo nell'email di conferma al paziente prenotato).
export function nomePubblico(fullName) {
  const parti = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parti.length) return APPELLATIVO;
  const cognome = parti.length > 1 ? parti[parti.length - 1] : "";
  const nomi = parti.length > 1 ? parti.slice(0, -1).join(" ") : parti[0];
  return `${APPELLATIVO} ${nomi}${cognome ? " " + cognome[0].toUpperCase() + "." : ""}`;
}
