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

// Il titolo con cui comincia il nome («Inf.», «Dott.»…), oppure "". Serve ai dati
// strutturati: il titolo va in honorificPrefix, non dentro il nome della persona.
export const titoloDi = (name) => (String(name || "").trim().match(RE_TITOLO) || [])[0]?.trim() || "";

// Particelle dei cognomi e dei nomi composti («Del Rio», «De Luca», «Lo Russo»)
export const PARTICELLE = new Set(["de", "del", "della", "dei", "degli", "delle", "di", "da", "dal", "dalla", "dallo", "lo", "la", "le", "van", "von"]);

const tuttoUguale = (s) => s === s.toUpperCase() || s === s.toLowerCase();

// Maiuscole giuste per nome e cognome (9/10/26). Si sistemano solo i pezzi scritti
// tutti maiuscoli o tutti minuscoli («ROSSI», «rossi» → «Rossi»); quelli già misti
// restano come li ha scritti la persona («McDonald»). Il pezzo si stacca anche su
// apostrofo e trattino: «d'amico» → «D'Amico», «DELL'ACQUA» → «Dell'Acqua»,
// «rossi-bianchi» → «Rossi-Bianchi». Le particelle prendono la maiuscola come di
// solito all'anagrafe («del rio» → «Del Rio»), ma una particella scritta apposta
// in minuscolo davanti a un cognome scritto bene resta così («Luca di Montezemolo»).
export function maiuscoleNome(testo) {
  const t = String(testo || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const parole = t.split(" ");
  return parole.map((parola, i) => {
    const dopo = parole[i + 1] || "";
    if (i > 0 && PARTICELLE.has(parola) && dopo && !tuttoUguale(dopo)) return parola;
    return parola.split(/(['’-])/).map((pezzo) => {
      if (!/\p{L}/u.test(pezzo) || !tuttoUguale(pezzo)) return pezzo;
      return pezzo.charAt(0).toUpperCase() + pezzo.slice(1).toLowerCase();
    }).join("");
  }).join(" ");
}

// Nome pubblico (decisione dei soci, 9/10/26): «Inf.» + nome e cognome PER INTERO,
// con le maiuscole giuste — «Inf. Laura Gilli», «Inf. Giovanni Del Rio». Regola
// uguale per tutti. Unica eccezione, a mano dall'admin in «Modifica scheda»: per
// gravi motivi di sicurezza il nome pubblico può avere solo l'iniziale del cognome.
export function nomePubblico(fullName) {
  const nome = maiuscoleNome(fullName);
  return nome ? `${APPELLATIVO} ${nome}` : APPELLATIVO;
}

// Il vecchio nome pubblico «Inf. Nome I.» (fino al 9/10/26: nomi + iniziale dell'ultima
// parola). Serve solo alla migrazione, per riconoscere i nomi nati in automatico.
export function nomeConIniziale(fullName) {
  const parti = maiuscoleNome(fullName).split(" ").filter(Boolean);
  if (!parti.length) return APPELLATIVO;
  const cognome = parti.length > 1 ? parti[parti.length - 1] : "";
  const nomi = parti.length > 1 ? parti.slice(0, -1).join(" ") : parti[0];
  return `${APPELLATIVO} ${nomi}${cognome ? " " + cognome[0].toUpperCase() + "." : ""}`;
}
