// PROVA ESAUSTIVA DELLA RICERCA (7/10/2026)
// ----------------------------------------------------------------------------
// La ricerca è LA funzione del sito: se un comune o una prestazione non si
// trovano, l'infermiere non lavora. Qui si prova src/lib/ricerca.js (lo stesso
// modulo che usano elenco, mappa, server) contro i dati veri e contro migliaia
// di comuni italiani simulati. Nessuna dipendenza: si rilancia quando si vuole.
//
//   node scripts/test-ricerca.mjs                 → usa i dati salvati (anche senza rete)
//   DATABASE_URL="postgres://…" node scripts/test-ricerca.mjs --aggiorna
//        → rilegge da Neon con SOLE SELECT e risalva scripts/test-ricerca.dati.json
//
// Gruppi: A comuni veri · B comuni italiani difficili (simulati) · C prestazioni
//         D combinazioni · E regole che non devono cambiare · F suggerimenti.
// Esce con codice 1 se anche un solo caso non passa.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  filtraProfessionisti, localitaCercate, comuneFraCercati, comuniFuoriRete, formeComune, SINONIMI,
} from "../src/lib/ricerca.js";

const qui = path.dirname(fileURLToPath(import.meta.url));
const FILE_DATI = path.join(qui, "test-ricerca.dati.json");
const ISTAT = JSON.parse(readFileSync(path.join(qui, "../src/data/comuni.json"), "utf8"));

// ---------------------------------------------------------------- dati veri
// Le stesse regole di /api/professionisti: attivo e con almeno una prestazione
// a domicilio attiva (catalog_key che non comincia per "consulenza-"). Gli
// eliminati hanno status 'deleted' e restano fuori da soli.
async function leggiDaNeon() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("❌ Per --aggiorna serve DATABASE_URL"); process.exit(2); }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  const professionisti = await sql`
    SELECT p.id, p.slug, p.name, p.profession, p.city, p.province, p.region,
           COALESCE(c.zone, '[]'::json) AS zone,
           COALESCE(sv.servizi, '[]'::json) AS servizi
    FROM professionals p
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('city', city, 'province', province, 'region', region) ORDER BY city) AS zone
      FROM coverage_areas WHERE professional_id = p.id
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('name', name, 'catalog_key', catalog_key) ORDER BY sort) AS servizi
      FROM services WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%'
    ) sv ON TRUE
    WHERE p.status = 'active'
      AND EXISTS (SELECT 1 FROM services WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%')
    ORDER BY p.id`;
  const listino = await sql`
    SELECT key, nome FROM catalog_services
    WHERE categoria = 'domicilio' AND active AND professional_id IS NULL ORDER BY sort, id`;
  const dati = { letti_il: new Date().toISOString(), professionisti, listino };
  writeFileSync(FILE_DATI, JSON.stringify(dati, null, 1) + "\n");
  console.log(`✅ dati riletti da Neon (${professionisti.length} professionisti visibili) → ${path.basename(FILE_DATI)}`);
  return dati;
}

const dati = process.argv.includes("--aggiorna") || !existsSync(FILE_DATI)
  ? await leggiDaNeon()
  : JSON.parse(readFileSync(FILE_DATI, "utf8"));

// come arrivano dall'API: coverage = nomi dei comuni, servizi = nomi delle prestazioni
const VISIBILI = dati.professionisti.map((p) => ({
  ...p,
  coverage: p.zone.map((z) => z.city),
  servizi: p.servizi.map((s) => s.name),
  chiavi: new Set(p.servizi.map((s) => s.catalog_key)),
}));

// ------------------------------------------------- oracolo indipendente
// Un confronto semplice e scritto a parte, per non provare il codice con se stesso.
const minuscolo = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const COLLEGAMENTI = new Set("a ad al allo alla ai agli alle all di d de del dello della dei degli delle dell da dal dallo dalla dai dagli dalle dall in nel nello nella nei negli nelle nell ne su sul sullo sulla sui sugli sulle sull e ed con".split(" "));
const pulito = (s) => {
  const w = minuscolo(s).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  const x = w.filter((p) => !COLLEGAMENTI.has(p));
  return (x.length ? x : w).join(" ");
};
const stessoNome = (a, b) => pulito(a) === pulito(b);

// tutte le forme dei comuni italiani: il server le usa per i comuni fuori rete
// ("lucca" ≠ Lucca Sicula, "san giovanni rotondo" ≠ San Giovanni Teatino)
const FORME_VERE = [...new Set(ISTAT.flatMap(([nome]) => formeComune(nome)))];
const opzioniPer = (lista) => ({ comuniFuoriRete: comuniFuoriRete(lista, FORME_VERE) });

// ------------------------------------------------------------- registro
const esiti = {};
const fallimenti = [];
const eccezioniDati = [];
function verifica(gruppo, descr, ottenuti, attesi) {
  esiti[gruppo] ||= { casi: 0, ok: 0 };
  esiti[gruppo].casi++;
  const o = [...new Set(ottenuti)].sort();
  const a = [...new Set(attesi)].sort();
  if (o.length === a.length && o.every((x, i) => x === a[i])) { esiti[gruppo].ok++; return true; }
  fallimenti.push(`[${gruppo}] ${descr}\n      attesi:  ${a.join(", ") || "nessuno"}\n      ottenuti: ${o.join(", ") || "nessuno"}`);
  return false;
}
const nomi = (l) => l.map((p) => p.name);
const cerca = (lista, q, opz = opzioniPer(lista)) => nomi(filtraProfessionisti(lista, q, opz));

// La mappa: dei risultati si vedono solo i segnaposti dei comuni cercati
// (se si è cercato un comune). Ritorna chi ha almeno un segnaposto e le città dei segnaposti.
function mappa(lista, q, opz = opzioniPer(lista)) {
  const risultati = filtraProfessionisti(lista, q, opz);
  const loc = localitaCercate(lista, q, opz);
  const pins = risultati.flatMap((p) => p.coverage.map((city) => ({ p, city })));
  const suComune = pins.filter(({ city }) => comuneFraCercati(city, loc));
  const mostrati = suComune.length ? suComune : pins;
  return { chi: nomi([...new Set(mostrati.map((x) => x.p))]), citta: [...new Set(mostrati.map((x) => x.city))] };
}

// =============================================================== A — comuni veri
const comuniVeri = [...new Map(VISIBILI.flatMap((p) => p.zone).map((z) => [z.city, z])).values()]
  .sort((a, b) => a.city.localeCompare(b.city));
const optVeri = opzioniPer(VISIBILI);
for (const z of comuniVeri) {
  const attesi = nomi(VISIBILI.filter((p) => p.coverage.some((c) => stessoNome(c, z.city))));
  const varianti = new Set([
    z.city,
    minuscolo(z.city).replace(/['’]/g, " ").replace(/-/g, " ").replace(/\s+/g, " "),
    minuscolo(z.city).replace(/['’]/g, "").replace(/-/g, " "),
  ]);
  for (const q of varianti) {
    verifica("A", `elenco «${q}»`, cerca(VISIBILI, q, optVeri), attesi);
    const m = mappa(VISIBILI, q, optVeri);
    verifica("A", `mappa «${q}» (chi)`, m.chi, attesi);
    verifica("A", `mappa «${q}» (solo segnaposti di ${z.city})`, m.citta.map((c) => (stessoNome(c, z.city) ? z.city : c)), [z.city]);
  }
  // eccezioni dovute ai dati: il comune deve esistere nell'elenco ISTAT con quella provincia
  const istat = ISTAT.filter(([nome]) => nome === z.city);
  if (!istat.length) eccezioniDati.push(`zona «${z.city}» (${z.province}): nome non presente nell'elenco ISTAT → niente segnaposto e niente sigla`);
  else if (!istat.some(([, , prov]) => prov === z.province)) eccezioniDati.push(`zona «${z.city}»: provincia salvata «${z.province}», per l'ISTAT è ${istat.map((c) => c[2]).join("/")}`);
}

// ====================================================== B — comuni italiani difficili
// Per ogni comune: un professionista finto che copre SOLO quello, insieme ai suoi
// "gemelli" (tutti i comuni che cominciano con la stessa parola).
const CURATI = [
  // apostrofi
  "Sant'Agata de' Goti", "Sant'Agata di Militello", "Sant'Agata Bolognese", "Sant'Agata sul Santerno", "Sant'Agata li Battiati",
  "Sant'Antimo", "Sant'Anastasia", "Sant'Elpidio a Mare", "Porto Sant'Elpidio", "Città Sant'Angelo", "Monte Sant'Angelo",
  "Sant'Angelo Lodigiano", "Sant'Angelo in Vado", "Monticelli d'Ongina", "San Polo d'Enza", "Cassano d'Adda", "Canonica d'Adda",
  "Trezzo sull'Adda", "Vaprio d'Adda", "Castiglione d'Orcia", "Castiglione d'Adda", "L'Aquila", "Francavilla d'Ete", "Pieve d'Olmi",
  "Corte de' Frati", "Cava de' Tirreni", "Castell'Arquato", "Castelnovo ne' Monti", "Campo nell'Elba", "Canneto sull'Oglio", "Cassano all'Ionio", "Caldaro sulla strada del vino", "Sant'Ilario d'Enza", "Bosco Chiesanuova", "Reggio nell'Emilia", "Lecce nei Marsi",
  // trattini
  "Gadesco-Pieve Delmona", "Bellaria-Igea Marina", "Corigliano-Rossano", "Giardini-Naxos", "Gressoney-La-Trinité",
  "Gressoney-Saint-Jean", "Pré-Saint-Didier", "Saint-Vincent", "Antey-Saint-André", "Calatafimi-Segesta", "Cavallino-Treporti",
  "Laveno-Mombello", "Castello-Molina di Fiemme", "Casale Cremasco-Vidolasco",
  // di, del, della, al, sul, in, e, con, ed
  "Francavilla al Mare", "Francavilla Fontana", "Francavilla di Sicilia", "Francavilla in Sinni", "Francavilla Angitola",
  "San Giovanni Rotondo", "San Giovanni Teatino", "San Giovanni in Persiceto", "San Giovanni la Punta", "San Giovanni Valdarno",
  "San Giovanni a Piro", "San Giovanni al Natisone", "San Giovanni in Fiore", "San Giorgio a Cremano", "San Giorgio di Piano",
  "San Giorgio del Sannio", "San Giorgio Ionico", "Reggio di Calabria", "Castiglione del Lago", "Castiglione della Pescaia",
  "Castiglione delle Stiviere", "Castiglione dei Pepoli", "Castiglione di Sicilia", "Castiglion Fiorentino", "Castiglion Fibocchi",
  "Città di Castello", "Città della Pieve", "Cittadella", "Cittanova", "Borgo a Mozzano", "Bagno a Ripoli", "Bagni di Lucca",
  "Forte dei Marmi", "Pieve a Nievole", "Massa e Cozzile", "Massa Marittima", "Massa Lombarda", "Massa", "Massa d'Albe",
  "Santarcangelo di Romagna", "Savignano sul Rubicone", "Trezzano sul Naviglio", "Melito di Napoli", "Mugnano di Napoli",
  "Pozzaglio ed Uniti", "Vermezzo con Zelo", "Castelnuovo del Garda", "Castelnuovo di Garfagnana", "Montecatini-Terme",
  "Sesto San Giovanni", "Sesto Fiorentino", "Cassano delle Murge", "Gioia del Colle", "Isola del Gran Sasso d'Italia",
  "Sotto il Monte Giovanni XXIII", "San Valentino in Abruzzo Citeriore", "Castrocaro Terme e Terra del Sole",
  "Sant'Angelo a Fasanella", "Campiglia Marittima", "Monte San Savino", "Monte San Pietro", "Monte Argentario",
  // gemelli dove il nome di uno è l'inizio dell'altro
  "Lucca", "Lucca Sicula", "Calvi", "Calvi dell'Umbria", "Calvi Risorta", "Castro", "Castro dei Volsci", "Bolzano",
  "Bolzano Novarese", "Bolzano Vicentino", "Arena", "Arena Po", "Lodi", "Lodi Vecchio", "Roma", "Romano di Lombardia",
  "Pisa", "Pisano", "Bra", "Bracciano", "Salle", "La Salle", "La Spezia", "La Maddalena", "La Valle", "La Valle Agordina",
  // accenti, nomi corti e nomi che sono parole di collegamento
  "Forlì", "Cantù", "Canicattì", "Paternò", "Ne", "Dello", "Vo'", "Re", "Ala", "Alì", "Ora", "Naso", "Medicina", "Imola",
];
const istatPerNome = new Map();
for (const c of ISTAT) { if (!istatPerNome.has(c[0])) istatPerNome.set(c[0], []); istatPerNome.get(c[0]).push(c); }
const prima = (nome) => pulito(nome).split(" ")[0];
const perPrimaParola = new Map();
for (const [nome] of ISTAT) { const k = prima(nome); if (!perPrimaParola.has(k)) perPrimaParola.set(k, new Set()); perPrimaParola.get(k).add(nome); }
let idFinto = 100000;
const finto = (nome) => ({
  id: ++idFinto, slug: `finto-${idFinto}`, name: `Inf. Prova ${idFinto}`, profession: "Infermiere",
  province: "", region: "", coverage: [nome], servizi: ["Prelievo", "Flebo"],
});
const reteDi = (gruppo) => [...gruppo].map(finto);
const chiCopre = (rete, nome) => nomi(rete.filter((p) => stessoNome(p.coverage[0], nome)));
const varianti = (nome) => new Set([
  nome,
  minuscolo(nome),
  minuscolo(nome).replace(/['’]/g, " ").replace(/-/g, " "),
  minuscolo(nome).replace(/['’]/g, "").replace(/-/g, " "),
  pulito(nome), // senza parole di collegamento: "francavilla mare"
  minuscolo(nome).replace(/\b(al|allo|alla|ai|agli|alle)\b/g, "a"), // "francavilla a mare"
]);
const curatiMancanti = CURATI.filter((n) => !istatPerNome.has(n));
if (curatiMancanti.length) { console.error("❌ Nomi del gruppo B che non sono comuni ISTAT:", curatiMancanti); process.exit(2); }

for (const nome of CURATI) {
  const rete = reteDi(perPrimaParola.get(prima(nome)));
  const opz = opzioniPer(rete);
  const attesi = chiCopre(rete, nome);
  for (const q of varianti(nome)) {
    verifica("B", `«${q}» fra ${rete.length} gemelli`, cerca(rete, q, opz), attesi);
    verifica("B", `«prelievo ${q}» fra ${rete.length} gemelli`, cerca(rete, `prelievo ${q}`, opz), attesi);
  }
  verifica("B", `mappa «${nome}»`, mappa(rete, nome, opz).citta.map(pulito), [pulito(nome)]);
  // la prima parola da sola: tutti i gemelli che cominciano così, se non è già un comune intero
  const p1 = prima(nome);
  if (pulito(nome).includes(" ")) {
    // è già il nome di un comune? anche scritto senza apostrofo ("santarcangelo" = Sant'Arcangelo, PZ)
    const esiste = ISTAT.some(([n]) => pulito(n) === p1 || pulito(n.replace(/['’]/g, "")) === p1);
    const attesiP1 = nomi(rete.filter((p) => (esiste ? pulito(p.coverage[0]) === p1 : pulito(p.coverage[0]).startsWith(p1))));
    verifica("B", `prima parola «${p1}» (${esiste ? "è un comune intero" : "tutti i gemelli"})`, cerca(rete, p1, opz), attesiP1);
  }
  // il comune NON è nella rete, ci sono solo i gemelli: chi lo scrive non deve trovare nessuno
  const soloGemelli = rete.filter((p) => !stessoNome(p.coverage[0], nome));
  verifica("B", `«${nome}» con solo i gemelli in rete → nessuno`, cerca(soloGemelli, nome), []);
}

// controllo a tappeto: TUTTI i 7.904 comuni ISTAT, a gruppi per prima parola
for (const gruppo of perPrimaParola.values()) {
  const rete = reteDi(gruppo);
  const opz = opzioniPer(rete);
  for (const nome of gruppo) {
    const attesi = chiCopre(rete, nome);
    for (const q of [nome, minuscolo(nome).replace(/['’]/g, ""), minuscolo(nome).replace(/['’-]/g, " ")]) {
      verifica("B", `tappeto «${q}»`, cerca(rete, q, opz), attesi);
    }
  }
}

// ================================================================ C — prestazioni
// singolare e plurale scritti a mano: è il modo in cui li scrive la gente
const FORME_VOCI = {
  "iniezione-im": ["iniezioni IM", "iniezione intramuscolo", "iniezioni intramuscolari"],
  "iniezione-sc": ["iniezioni SC", "iniezione sottocute", "iniezioni sottocutanee"],
  flebo: ["flebo", "fleboclisi"],
  prelievo: ["prelievi", "prelievo del sangue", "prelievi di sangue"],
  "terapia-orale": ["somministrazioni terapie orali"],
  "medicazione-semplice": ["medicazioni semplici"],
  "medicazione-complessa": ["medicazioni complesse"],
  "sondino-ng": ["sondini naso-gastrici", "sondino naso gastrico", "sondino nasogastrico"],
  "rimozione-punti": ["rimozione punto", "rimozioni punti", "rimozione punti di sutura"],
  "posizionamento-catetere": ["posizionamenti cateteri", "posizionamento catetere vescicale"],
  "sostituzione-catetere": ["sostituzioni cateteri", "sostituzione catetere vescicale"],
  "gestione-stomia": ["gestione stomie", "gestioni stomie"],
  clistere: ["clisteri"],
  ecg: ["ECG", "elettrocardiogramma"],
  "holter-pressorio": ["holter pressori"],
  "holter-cardiaco": ["holter cardiaci"],
  "parametri-vitali": ["parametro vitale"],
  "gestione-peg": ["gestioni PEG", "PEG"],
  "educazione-terapeutica": ["educazioni terapeutiche"],
  "medicazione-cvc": ["medicazioni CVC", "CVC", "medicazione PICC"],
  "pianificazione-sanitaria": ["pianificazioni sanitarie"],
  "assistenza-oraria": ["assistenze personalizzate alle ore", "assistenza personalizzata a ore", "assistenza oraria"],
  "lavaggio-auricolare": ["lavaggi auricolari"],
};
// sinonimi e sigle → quali voci del listino deve trovare (oracolo scritto a mano)
const ATTESI_SINONIMI = {
  puntura: ["iniezione-im", "iniezione-sc"], punture: ["iniezione-im", "iniezione-sc"],
  iniezione: ["iniezione-im", "iniezione-sc"], iniezioni: ["iniezione-im", "iniezione-sc"],
  intramuscolo: ["iniezione-im"], intramuscolare: ["iniezione-im"], intramuscolari: ["iniezione-im"], IM: ["iniezione-im"],
  sottocute: ["iniezione-sc"], sottocutanea: ["iniezione-sc"], sottocutanee: ["iniezione-sc"], sottocutaneo: ["iniezione-sc"], sottocutanei: ["iniezione-sc"], SC: ["iniezione-sc"],
  sangue: ["prelievo"], analisi: ["prelievo"], prelievo: ["prelievo"],
  medicazione: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  medicazioni: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  ferita: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  ferite: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  piaga: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  piaghe: ["medicazione-semplice", "medicazione-complessa", "medicazione-cvc"],
  picc: ["medicazione-cvc"], PICC: ["medicazione-cvc"], CVC: ["medicazione-cvc"],
  elettrocardiogramma: ["ecg"], ECG: ["ecg"],
  catetere: ["posizionamento-catetere", "sostituzione-catetere"], cateteri: ["posizionamento-catetere", "sostituzione-catetere"],
  vescicale: ["posizionamento-catetere", "sostituzione-catetere"],
  stomia: ["gestione-stomia"], stomie: ["gestione-stomia"],
  sutura: ["rimozione-punti"], suture: ["rimozione-punti"], nasogastrico: ["sondino-ng"],
  oraria: ["assistenza-oraria"], orario: ["assistenza-oraria"],
  flebo: ["flebo"], fleboclisi: ["flebo"], PEG: ["gestione-peg"], holter: ["holter-pressorio", "holter-cardiaco"],
};
// ogni chiave di SINONIMI deve avere il suo oracolo (le sigle e le professioni a parte)
const PROFESSIONE = ["infermiera", "infermieri", "infermiere"];
for (const k of Object.keys(SINONIMI)) {
  if (!ATTESI_SINONIMI[k] && !PROFESSIONE.includes(k)) fallimenti.push(`[C] il sinonimo «${k}» non ha un oracolo in ATTESI_SINONIMI: aggiungilo`);
}
const offerte = dati.listino.filter((v) => VISIBILI.some((p) => p.chiavi.has(v.key)));
const chiOffre = (chiavi) => nomi(VISIBILI.filter((p) => chiavi.some((k) => p.chiavi.has(k))));
for (const v of offerte) {
  const attesi = chiOffre([v.key]);
  for (const q of new Set([v.nome, v.nome.toLowerCase(), minuscolo(v.nome).replace(/['’]/g, ""), ...(FORME_VOCI[v.key] || [])])) {
    verifica("C", `«${q}» (${v.key})`, cerca(VISIBILI, q, optVeri), attesi);
  }
  if (!FORME_VOCI[v.key]) fallimenti.push(`[C] la voce «${v.nome}» (${v.key}) non ha singolare/plurale in FORME_VOCI: aggiungili`);
}
for (const [q, chiavi] of Object.entries(ATTESI_SINONIMI)) {
  if (!chiavi.some((k) => offerte.some((v) => v.key === k))) continue; // nessuno la offre oggi
  verifica("C", `sinonimo «${q}»`, cerca(VISIBILI, q, optVeri), chiOffre(chiavi));
}
for (const q of PROFESSIONE) verifica("C", `«${q}» → tutti`, cerca(VISIBILI, q, optVeri), nomi(VISIBILI));

// ================================================================ D — combinazioni
for (const z of comuniVeri) {
  for (const v of offerte) {
    const attesi = nomi(VISIBILI.filter((p) => p.chiavi.has(v.key) && p.coverage.some((c) => stessoNome(c, z.city))));
    verifica("D", `«${v.nome} ${z.city}»`, cerca(VISIBILI, `${v.nome} ${z.city}`, optVeri), attesi);
    verifica("D", `«${z.city} ${v.nome}»`, cerca(VISIBILI, `${z.city} ${v.nome}`, optVeri), attesi);
  }
}
const copreEFa = (citta, chiavi) => nomi(VISIBILI.filter((p) => p.coverage.some((c) => stessoNome(c, citta)) && chiavi.some((k) => p.chiavi.has(k))));
const copre = (citta) => nomi(VISIBILI.filter((p) => p.coverage.some((c) => stessoNome(c, citta))));
const FRASI = [
  ["prelievo a domicilio francavilla al mare", copreEFa("Francavilla al Mare", ["prelievo"])],
  ["Prelievo a domicilio a Francavilla al Mare", copreEFa("Francavilla al Mare", ["prelievo"])],
  ["infermiere pescara", copre("Pescara")],
  ["infermiera a domicilio Pescara", copre("Pescara")],
  ["iniezioni a città sant'angelo", copreEFa("Città Sant'Angelo", ["iniezione-im", "iniezione-sc"])],
  ["puntura citta santangelo", copreEFa("Città Sant'Angelo", ["iniezione-im", "iniezione-sc"])],
  ["flebo san giovanni teatino", copreEFa("San Giovanni Teatino", ["flebo"])],
  ["medicazione complessa a borgo a mozzano", copreEFa("Borgo a Mozzano", ["medicazione-complessa"])],
  ["prelievo del sangue a Santarcangelo di Romagna", copreEFa("Santarcangelo di Romagna", ["prelievo"])],
  ["ecg savignano sul rubicone", copreEFa("Savignano sul Rubicone", ["ecg"])],
  ["catetere monticelli d'ongina", copreEFa("Monticelli d'Ongina", ["posizionamento-catetere", "sostituzione-catetere"])],
  ["catetere monticelli dongina", copreEFa("Monticelli d'Ongina", ["posizionamento-catetere", "sostituzione-catetere"])],
  ["iniezione IM gadesco pieve delmona", copreEFa("Gadesco-Pieve Delmona", ["iniezione-im"])],
  ["assistenza personalizzata all'ora milano", copreEFa("Milano", ["assistenza-oraria"])],
];
for (const [q, attesi] of FRASI) verifica("D", `frase «${q}»`, cerca(VISIBILI, q, optVeri), attesi);

// ======================================================== E — regole che non cambiano
const persona = (id) => VISIBILI.find((p) => p.id === id)?.name;
const IRENE = persona(23), ANDREA = persona(3);
const regole = [
  ["francavilla", copre("Francavilla al Mare")],
  ["francavilla al mare", copre("Francavilla al Mare")],
  ["Francavilla al Mare", copre("Francavilla al Mare")],
  ["francavilla a mare", copre("Francavilla al Mare")],
  ["francavilla al m", copre("Francavilla al Mare")],
  ["Città Sant'Angelo", copre("Città Sant'Angelo")],
  ["citta s", copre("Città Sant'Angelo")],
  ["san giovanni teatino", copre("San Giovanni Teatino")],
  ["san giovanni rotondo", []],
  ["francavilla fontana", []],
  ["brescia", copre("Brescia")],
  ["crema", copre("Crema")],
  ["cremona", copre("Cremona")],
  ["cremo", copre("Cremona")],
  ["prelievi lucca", copreEFa("Lucca", ["prelievo"])],
  ["toscana", nomi(VISIBILI.filter((p) => p.region === "Toscana"))],
  ["roma", copre("Roma")], // oggi Roma è coperta (Inf. Yvan Timothy N.)
  ["bari", []],
  ["palermo", []],
  ["irene", [IRENE]],
  ["iommarini", [IRENE]],
  ["andrea", [ANDREA]],
  ["casa lucca", copre("Lucca")],
  ["infermiere a domicilio", nomi(VISIBILI)],
];
for (const [q, attesi] of regole) verifica("E", `«${q}»`, cerca(VISIBILI, q, optVeri), attesi);
// «brescia» non deve MAI dare chi sta a Capannori senza coprire Brescia (l'iniziale «B.» non fa da jolly)
verifica("E", "«brescia» senza Andrea B. di Capannori", cerca(VISIBILI, "brescia", optVeri).filter((n) => n === ANDREA), []);
verifica("E", "«crema» ≠ «cremona»", [String(cerca(VISIBILI, "crema", optVeri).join() !== cerca(VISIBILI, "cremona", optVeri).join())], ["true"]);
verifica("E", "mappa «francavilla a mare» → segnaposto a Francavilla al Mare", mappa(VISIBILI, "francavilla a mare", optVeri).citta, ["Francavilla al Mare"]);
verifica("E", "mappa «Città Sant'Angelo» → segnaposto lì", mappa(VISIBILI, "Città Sant'Angelo", optVeri).citta, ["Città Sant'Angelo"]);

// conflitti prestazione/località, su una rete finta con i comuni "pericolosi"
const sim = (nome, comune, servizi) => ({ id: ++idFinto, slug: nome.toLowerCase(), name: `Inf. ${nome}`, profession: "Infermiere", province: "", region: "", coverage: [comune], servizi });
const RETE_CONFLITTI = [
  sim("Alfa", "Imola", ["Prelievo"]), sim("Beta", "Medicina", ["Flebo"]), sim("Gamma", "Lavagna", ["Clistere"]),
  sim("Delta", "Scandicci", ["Flebo"]), sim("Epsilon", "Oratino", ["Flebo"]), sim("Zeta", "Pegognaga", ["Flebo"]),
  sim("Eta", "Picciano", ["Flebo"]), sim("Theta", "Naso", ["Flebo"]), sim("Iota", "Ora", ["Flebo"]),
  sim("Kappa", "Romano di Lombardia", ["Flebo"]),
  sim("Lambda", "Pescara", ["Iniezione IM", "Iniezione SC", "Medicazione semplice", "Lavaggio auricolare", "Gestione PEG",
    "Medicazione CVC", "Assistenza personalizzata all'ora", "Sondino naso-gastrico"]),
];
const L = "Inf. Lambda";
const conflitti = [
  ["iniezione im", [L]], ["im", [L]], ["imola", ["Inf. Alfa"]], ["imo", ["Inf. Alfa"]],
  ["iniezione sc", [L]], ["sc", [L]], ["scandicci", ["Inf. Delta"]],
  ["gestione peg", [L]], ["peg", [L]], ["pegognaga", ["Inf. Zeta"]],
  ["picc", [L]], ["medicazione picc", [L]], ["picciano", ["Inf. Eta"]],
  ["medicazione", [L]], ["medicina", ["Inf. Beta"]], ["medic", ["Inf. Beta"]], // «medic» a metà: è l'inizio di Medicina
  ["lavaggio auricolare", [L]], ["lavaggio", [L]], ["lavagna", ["Inf. Gamma"]],
  ["assistenza personalizzata all'ora", [L]], ["assistenza oraria", [L]], ["ore", [L]],
  ["ora", ["Inf. Iota"]], ["oratino", ["Inf. Epsilon"]], // «ora» è il nome intero di un comune (Ora, BZ): resta località
  ["sondino naso-gastrico", [L]], ["sondino naso gastrico pescara", [L]],
  ["naso", ["Inf. Theta"]], ["flebo naso", ["Inf. Theta"]], // «naso» da solo è il comune di Naso (ME)
  ["roma", []], ["romano", ["Inf. Kappa"]], ["romano di lombardia", ["Inf. Kappa"]],
  ["flebo imola", []], ["prelievo imola", ["Inf. Alfa"]],
];
// cognomi e province che somigliano a un comune: chi scrive il comune non deve trovarli
const RETE_SOMIGLIANZE = [
  { ...sim("Mu", "Cascina", ["Flebo"]), province: "Pisa", region: "Toscana" },
  { ...sim("Nu", "San Giovanni Teatino", ["Flebo"]), slug: "lucia-bianco", name: "Inf. Lucia B." },
  { ...sim("Xi", "Francavilla al Mare", ["Flebo"]), slug: "anna-fontana", name: "Inf. Anna F." },
  { ...sim("Omicron", "Teramo", ["Flebo"]), slug: "rosa-romagnoli", name: "Inf. Rosa R." },
];
const somiglianze = [
  ["pisa", []], ["toscana", ["Inf. Mu"]], ["cascina", ["Inf. Mu"]], // provincia di Pisa ≠ comune di Pisa
  ["san giovanni bianco", []], ["san giovanni teatino", ["Inf. Lucia B."]], ["san giovanni", ["Inf. Lucia B."]],
  ["bianco", []], // Bianco (RC) è un comune: chi lo scrive cerca quello, non il cognome
  ["francavilla fontana", []], ["francavilla", ["Inf. Anna F."]], ["fontana", ["Inf. Anna F."]],
  ["roma", []], ["romagnoli", ["Inf. Rosa R."]],
  ["rosa", []], // Rosà (VI) è un comune: «rosa» è quel comune, non il nome dell'infermiera
  ["lucia", ["Inf. Lucia B."]], ["anna", ["Inf. Anna F."]],
];
for (const [q, attesi] of somiglianze) verifica("E", `somiglianza «${q}»`, cerca(RETE_SOMIGLIANZE, q), attesi);
for (const [q, attesi] of conflitti) verifica("E", `conflitto «${q}»`, cerca(RETE_CONFLITTI, q), attesi);

// ========================================================== F — suggerimenti (fase 2)
let suggerimenti = null;
try { suggerimenti = await import("../src/lib/suggerimenti.js"); } catch { /* fase 2 non ancora fatta */ }
if (suggerimenti) {
  const { indiceSuggerimenti, suggerisci, applicaSuggerimento } = suggerimenti;
  const sigle = new Map(ISTAT.map(([nome, sigla, prov]) => [`${nome}|${prov}`, sigla]));
  const conSigle = (lista) => lista.map((p) => ({ ...p, sigle: Object.fromEntries((p.zone || []).map((z) => [z.city, sigle.get(`${z.city}|${z.province}`) || ""])) }));
  const idx = indiceSuggerimenti(conSigle(VISIBILI));
  const etichette = (r, gruppo) => r[gruppo].map((s) => s.nome);
  const sugg = (testo, i = idx) => suggerisci(i, testo);
  // ogni comune coperto si suggerisce dal suo inizio, con sigla e numero di infermieri
  for (const z of comuniVeri) {
    const r = sugg(z.city.slice(0, 4));
    const voce = r.comuni.find((s) => s.nome === z.city);
    verifica("F", `«${z.city.slice(0, 4)}» suggerisce ${z.city}`, [String(Boolean(voce))], ["true"]);
    if (voce) verifica("F", `${z.city}: quanti infermieri`, [String(voce.n)], [String(copre(z.city).length)]);
  }
  for (const v of offerte) verifica("F", `«${v.nome.slice(0, 4)}» suggerisce ${v.nome}`, [String(etichette(sugg(v.nome.slice(0, 4)), "prestazioni").includes(v.nome))], ["true"]);
  const casiF = [
    ["Franc", "comuni", ["Francavilla al Mare"]],
    ["mare", "comuni", ["Francavilla al Mare"]],
    ["citta s", "comuni", ["Città Sant'Angelo"]],
    ["sant", "comuni", ["Sant'Antimo", "Santarcangelo di Romagna", "Città Sant'Angelo"].filter((c) => copre(c).length)],
    ["prel", "prestazioni", ["Prelievo"]],
    ["anali", "prestazioni", ["Prelievo"]],
    ["zzz", "comuni", []], ["zzz", "prestazioni", []],
    ["f", "comuni", []], // dal 2° carattere
  ];
  for (const [t, g, attesi] of casiF) verifica("F", `«${t}» → ${g}`, etichette(sugg(t), g), attesi);
  verifica("F", "«punt» → le iniezioni (puntura)", [String(etichette(sugg("punt"), "prestazioni").some((n) => /iniezione/i.test(n)))], ["true"]);
  verifica("F", "al massimo 8 voci", [String(sugg("a").comuni.length + sugg("a").prestazioni.length <= 8 && sugg("ca").comuni.length + sugg("ca").prestazioni.length <= 8)], ["true"]);
  verifica("F", "etichetta con sigla", [sugg("franc").comuni[0]?.etichetta || ""], ["Francavilla al Mare (CH) · 1 infermiere"]);
  // la ricerca combinata: il suggerimento sostituisce solo il pezzo che si sta scrivendo
  const combinata = (testo, scelta) => {
    const r = suggerisci(idx, testo);
    const s = [...r.comuni, ...r.prestazioni].find((x) => x.nome === scelta);
    return s ? applicaSuggerimento(testo, r.pezzo, s) : "(non suggerito)";
  };
  verifica("F", "«prelievo franc» + Francavilla al Mare", [combinata("prelievo franc", "Francavilla al Mare")], ["prelievo Francavilla al Mare"]);
  verifica("F", "«francavilla al m» + Francavilla al Mare", [combinata("francavilla al m", "Francavilla al Mare")], ["Francavilla al Mare"]);
  verifica("F", "«Pescara prel» + Prelievo", [combinata("Pescara prel", "Prelievo")], ["Pescara Prelievo"]);
  verifica("F", "«prelievo francavilla al mare» trova Irene", cerca(VISIBILI, combinata("prelievo franc", "Francavilla al Mare"), optVeri), copreEFa("Francavilla al Mare", ["prelievo"]));
  // con un secondo professionista su Francavilla Fontana escono tutte e due
  const due = conSigle([...VISIBILI, { ...finto("Francavilla Fontana"), zone: [{ city: "Francavilla Fontana", province: "Brindisi" }] }]);
  const r2 = suggerisci(indiceSuggerimenti(due), "Franc");
  verifica("F", "«Franc» con Francavilla Fontana in rete", r2.comuni.map((s) => s.nome), ["Francavilla al Mare", "Francavilla Fontana"]);
  // ogni suggerimento, scelto, dà dei risultati (mai un suggerimento che porta al vuoto)
  for (const t of ["fr", "ca", "san", "pre", "med", "ini", "punt", "mil", "cre", "ges"]) {
    const r = suggerisci(idx, t);
    for (const s of [...r.comuni, ...r.prestazioni]) {
      const q = applicaSuggerimento(t, r.pezzo, s);
      verifica("F", `scelgo «${s.nome}» da «${t}» → almeno un risultato`, [String(cerca(VISIBILI, q, optVeri).length > 0)], ["true"]);
    }
  }
}

// ================================================================== riepilogo
console.log(`\nPROVA DELLA RICERCA — dati letti il ${dati.letti_il?.slice(0, 16).replace("T", " ")} · ${VISIBILI.length} professionisti visibili · ${comuniVeri.length} comuni coperti`);
const titoli = { A: "comuni veri", B: "comuni italiani difficili (simulati)", C: "prestazioni", D: "combinazioni", E: "regole che non cambiano", F: "suggerimenti" };
let tot = 0, totOk = 0;
for (const g of Object.keys(titoli)) {
  if (!esiti[g]) continue;
  tot += esiti[g].casi; totOk += esiti[g].ok;
  console.log(`  ${g} — ${titoli[g].padEnd(38)} ${String(esiti[g].ok).padStart(6)} / ${String(esiti[g].casi).padEnd(6)} ${esiti[g].ok === esiti[g].casi ? "✅" : "❌"}`);
}
if (eccezioniDati.length) {
  console.log("\nEccezioni dovute ai dati (il DB non si tocca da qui):");
  for (const e of eccezioniDati) console.log("  ·", e);
}
if (fallimenti.length) {
  console.log(`\n❌ ${fallimenti.length} casi non passano:`);
  for (const f of fallimenti.slice(0, 60)) console.log("  ", f);
  if (fallimenti.length > 60) console.log(`   … e altri ${fallimenti.length - 60}`);
}
console.log(`\nTOTALE: ${totOk} / ${tot} casi passano${fallimenti.length ? "" : " ✅"}`);
process.exit(fallimenti.length ? 1 : 0);
