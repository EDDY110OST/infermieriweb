// Provincia → Regione (per completare i dati dei nuovi professionisti
// senza chiedere la regione in candidatura). Chiavi in minuscolo.

const MAPPA = {
  // Piemonte
  torino: "Piemonte", vercelli: "Piemonte", novara: "Piemonte", cuneo: "Piemonte",
  asti: "Piemonte", alessandria: "Piemonte", biella: "Piemonte", "verbano-cusio-ossola": "Piemonte", verbania: "Piemonte",
  // Valle d'Aosta
  aosta: "Valle d'Aosta",
  // Lombardia
  varese: "Lombardia", como: "Lombardia", sondrio: "Lombardia", milano: "Lombardia",
  bergamo: "Lombardia", brescia: "Lombardia", pavia: "Lombardia", cremona: "Lombardia",
  mantova: "Lombardia", lecco: "Lombardia", lodi: "Lombardia", "monza e brianza": "Lombardia", monza: "Lombardia",
  // Trentino-Alto Adige
  bolzano: "Trentino-Alto Adige", trento: "Trentino-Alto Adige",
  // Veneto
  verona: "Veneto", vicenza: "Veneto", belluno: "Veneto", treviso: "Veneto",
  venezia: "Veneto", padova: "Veneto", rovigo: "Veneto",
  // Friuli-Venezia Giulia
  udine: "Friuli-Venezia Giulia", gorizia: "Friuli-Venezia Giulia", trieste: "Friuli-Venezia Giulia", pordenone: "Friuli-Venezia Giulia",
  // Liguria
  imperia: "Liguria", savona: "Liguria", genova: "Liguria", "la spezia": "Liguria",
  // Emilia-Romagna
  piacenza: "Emilia-Romagna", parma: "Emilia-Romagna", "reggio emilia": "Emilia-Romagna",
  modena: "Emilia-Romagna", bologna: "Emilia-Romagna", ferrara: "Emilia-Romagna",
  ravenna: "Emilia-Romagna", "forlì-cesena": "Emilia-Romagna", forlì: "Emilia-Romagna",
  cesena: "Emilia-Romagna", rimini: "Emilia-Romagna",
  // Toscana
  "massa-carrara": "Toscana", "massa carrara": "Toscana", massa: "Toscana", lucca: "Toscana",
  pistoia: "Toscana", firenze: "Toscana", livorno: "Toscana", pisa: "Toscana",
  arezzo: "Toscana", siena: "Toscana", grosseto: "Toscana", prato: "Toscana",
  // Umbria
  perugia: "Umbria", terni: "Umbria",
  // Marche
  "pesaro e urbino": "Marche", pesaro: "Marche", ancona: "Marche", macerata: "Marche",
  "ascoli piceno": "Marche", fermo: "Marche",
  // Lazio
  viterbo: "Lazio", rieti: "Lazio", roma: "Lazio", latina: "Lazio", frosinone: "Lazio",
  // Abruzzo
  "l'aquila": "Abruzzo", aquila: "Abruzzo", teramo: "Abruzzo", pescara: "Abruzzo", chieti: "Abruzzo",
  // Molise
  campobasso: "Molise", isernia: "Molise",
  // Campania
  caserta: "Campania", benevento: "Campania", napoli: "Campania", avellino: "Campania", salerno: "Campania",
  // Puglia
  foggia: "Puglia", bari: "Puglia", taranto: "Puglia", brindisi: "Puglia", lecce: "Puglia",
  "barletta-andria-trani": "Puglia", barletta: "Puglia",
  // Basilicata
  potenza: "Basilicata", matera: "Basilicata",
  // Calabria
  cosenza: "Calabria", catanzaro: "Calabria", "reggio calabria": "Calabria",
  crotone: "Calabria", "vibo valentia": "Calabria",
  // Sicilia
  trapani: "Sicilia", palermo: "Sicilia", messina: "Sicilia", agrigento: "Sicilia",
  caltanissetta: "Sicilia", enna: "Sicilia", catania: "Sicilia", ragusa: "Sicilia", siracusa: "Sicilia",
  // Sardegna
  sassari: "Sardegna", nuoro: "Sardegna", cagliari: "Sardegna", oristano: "Sardegna", "sud sardegna": "Sardegna",
};

const SIGLE = {
  ag: "agrigento", al: "alessandria", an: "ancona", ao: "aosta", ar: "arezzo", ap: "ascoli piceno",
  at: "asti", av: "avellino", ba: "bari", bt: "barletta-andria-trani", bl: "belluno", bn: "benevento",
  bg: "bergamo", bi: "biella", bo: "bologna", bz: "bolzano", bs: "brescia", br: "brindisi",
  ca: "cagliari", cl: "caltanissetta", cb: "campobasso", ce: "caserta", ct: "catania", cz: "catanzaro",
  ch: "chieti", co: "como", cs: "cosenza", cr: "cremona", kr: "crotone", cn: "cuneo",
  en: "enna", fm: "fermo", fe: "ferrara", fi: "firenze", fg: "foggia", fc: "forlì-cesena",
  fr: "frosinone", ge: "genova", go: "gorizia", gr: "grosseto", im: "imperia", is: "isernia",
  aq: "l'aquila", sp: "la spezia", lt: "latina", le: "lecce", lc: "lecco", li: "livorno",
  lo: "lodi", lu: "lucca", mc: "macerata", mn: "mantova", ms: "massa-carrara", mt: "matera",
  me: "messina", mi: "milano", mo: "modena", mb: "monza e brianza", na: "napoli", no: "novara",
  nu: "nuoro", or: "oristano", pd: "padova", pa: "palermo", pr: "parma", pv: "pavia",
  pg: "perugia", pu: "pesaro e urbino", pe: "pescara", pc: "piacenza", pi: "pisa", pt: "pistoia",
  pn: "pordenone", pz: "potenza", po: "prato", rg: "ragusa", ra: "ravenna", rc: "reggio calabria",
  re: "reggio emilia", ri: "rieti", rn: "rimini", rm: "roma", ro: "rovigo", sa: "salerno",
  ss: "sassari", sv: "savona", si: "siena", sr: "siracusa", so: "sondrio", su: "sud sardegna",
  ta: "taranto", te: "teramo", tr: "terni", to: "torino", tp: "trapani", tn: "trento",
  tv: "treviso", ts: "trieste", ud: "udine", va: "varese", ve: "venezia", vb: "verbano-cusio-ossola",
  vc: "vercelli", vr: "verona", vv: "vibo valentia", vi: "vicenza", vt: "viterbo",
};

// Grafie diverse della stessa provincia → una sola chiave canonica
// (sennò "Massa Carrara" e "Massa-Carrara" diventano due pagine diverse)
const CANONICHE = {
  "massa carrara": "massa-carrara", massa: "massa-carrara",
  "forlì": "forlì-cesena", cesena: "forlì-cesena",
  monza: "monza e brianza", pesaro: "pesaro e urbino",
  verbania: "verbano-cusio-ossola", aquila: "l'aquila",
  barletta: "barletta-andria-trani", "reggio di calabria": "reggio calabria",
};

// Nomi da mostrare quando le maiuscole automatiche non bastano
const DISPLAY = {
  "l'aquila": "L'Aquila",
  "monza e brianza": "Monza e Brianza",
  "pesaro e urbino": "Pesaro e Urbino",
};

export function regioneDaProvincia(provincia) {
  const chiave = String(provincia || "").trim().toLowerCase();
  if (!chiave) return "";
  if (MAPPA[chiave]) return MAPPA[chiave];
  if (SIGLE[chiave] && MAPPA[SIGLE[chiave]]) return MAPPA[SIGLE[chiave]];
  return "";
}

// "LU"/"lu" -> "Lucca"; "lucca" -> "Lucca"; "massa carrara" -> "Massa-Carrara".
// Vuoto se sconosciuta.
export function provinciaEstesa(provincia) {
  let chiave = String(provincia || "").trim().toLowerCase();
  if (!chiave) return "";
  chiave = SIGLE[chiave] || chiave;
  chiave = CANONICHE[chiave] || chiave;
  if (!MAPPA[chiave]) return "";
  if (DISPLAY[chiave]) return DISPLAY[chiave];
  return chiave.split(" ").map((p) => p.split("-").map((q) => q.charAt(0).toUpperCase() + q.slice(1)).join("-")).join(" ");
}
