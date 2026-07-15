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
  to: "torino", mi: "milano", lu: "lucca", pt: "pistoia", fi: "firenze", pi: "pisa",
  li: "livorno", ms: "massa-carrara", ar: "arezzo", si: "siena", gr: "grosseto", po: "prato",
  rm: "roma", na: "napoli", ba: "bari", pa: "palermo", ge: "genova", bo: "bologna", ve: "venezia",
};

export function regioneDaProvincia(provincia) {
  const chiave = String(provincia || "").trim().toLowerCase();
  if (!chiave) return "";
  if (MAPPA[chiave]) return MAPPA[chiave];
  if (SIGLE[chiave] && MAPPA[SIGLE[chiave]]) return MAPPA[SIGLE[chiave]];
  return "";
}

// "LU"/"lu" -> "Lucca"; "lucca" -> "Lucca". Vuoto se sconosciuta.
export function provinciaEstesa(provincia) {
  const chiave = String(provincia || "").trim().toLowerCase();
  if (!chiave) return "";
  const nome = SIGLE[chiave] || (MAPPA[chiave] ? chiave : "");
  if (!nome) return "";
  return nome.split(" ").map((p) => p.split("-").map((q) => q.charAt(0).toUpperCase() + q.slice(1)).join("-")).join(" ");
}
