// Aggiunge le coordinate (lat, lng) a src/data/comuni.json.
//
// Serve per mettere sulla mappa un segnaposto per ogni zona coperta da un
// professionista: le zone sono comuni ISTAT validati, quindi il punto si può
// risolvere in casa, senza chiamare Nominatim a ogni caricamento della mappa.
//
// Si lancia UNA VOLTA (o quando cambia l'elenco dei comuni):
//   node scripts/coordinate-comuni.mjs
//
// Fonti:
//  - codice ISTAT per ogni comune: matteocontrini/comuni-json (stessa fonte da
//    cui nasce comuni.json, quindi nome e sigla combaciano sempre)
//  - coordinate per codice ISTAT: MatteoHenryChinaski/Comuni-Italiani-2018
//  - i comuni nati da fusioni dopo il 2018 non stanno nel secondo elenco:
//    quei pochi li risolve Nominatim (OpenStreetMap), una richiesta al secondo
//    come chiede la policy d'uso.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const FILE_COMUNI = path.join(QUI, "..", "src", "data", "comuni.json");

const URL_CODICI = "https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json";
const URL_COORDINATE = "https://raw.githubusercontent.com/MatteoHenryChinaski/Comuni-Italiani-2018-Sql-Json-excel/master/italy_geo.json";
const UA = "InfermieriWeb.it/1.0 (contatto: info@infermieriweb.it)";

// Confini dell'Italia, con un margine: serve a scartare coordinate palesemente
// sbagliate (uno zero di troppo, latitudine e longitudine invertite...).
const ITALIA = { latMin: 35.2, latMax: 47.3, lngMin: 6.5, lngMax: 18.6 };

const normalizza = (testo) =>
  (testo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

async function scarica(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

// Un comune per volta, un secondo di pausa: policy Nominatim.
async function daNominatim(nome, provincia) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${nome}, ${provincia}, Italia`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "it");
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "it" } });
  if (!r.ok) return null;
  const risultati = await r.json();
  if (!risultati.length) return null;
  return { lat: Number(risultati[0].lat), lng: Number(risultati[0].lon) };
}

const dentroItalia = ({ lat, lng }) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= ITALIA.latMin && lat <= ITALIA.latMax && lng >= ITALIA.lngMin && lng <= ITALIA.lngMax;

const comuni = JSON.parse(fs.readFileSync(FILE_COMUNI, "utf8"));
console.log(`Comuni da completare: ${comuni.length}`);

console.log("Scarico i codici ISTAT...");
const conCodice = await scarica(URL_CODICI);
console.log("Scarico le coordinate...");
const conCoordinate = await scarica(URL_COORDINATE);

const codicePerComune = new Map(conCodice.map((c) => [`${normalizza(c.nome)}|${c.sigla}`, c.codice]));
// nell'elenco delle coordinate il codice ISTAT è senza zeri iniziali ("1001")
const coordinatePerCodice = new Map(
  conCoordinate.map((g) => [String(Number(g.istat)), { lat: Number(g.lat), lng: Number(g.lng) }]),
);

const daRisolvere = [];
const risultato = comuni.map((riga) => {
  const [nome, sigla, provincia] = riga;
  const codice = codicePerComune.get(`${normalizza(nome)}|${sigla}`);
  const punto = codice ? coordinatePerCodice.get(String(Number(codice))) : null;
  if (punto && dentroItalia(punto)) {
    return [...riga.slice(0, 5), +punto.lat.toFixed(5), +punto.lng.toFixed(5)];
  }
  daRisolvere.push({ nome, provincia, riga });
  return riga.slice(0, 5);
});

console.log(`Agganciati dagli elenchi: ${comuni.length - daRisolvere.length}`);

if (daRisolvere.length) {
  console.log(`Da chiedere a Nominatim (fusioni recenti): ${daRisolvere.length} — circa ${Math.ceil(daRisolvere.length * 1.1)} secondi`);
  for (const [i, voce] of daRisolvere.entries()) {
    const punto = await daNominatim(voce.nome, voce.provincia);
    if (punto && dentroItalia(punto)) {
      const posizione = comuni.indexOf(voce.riga);
      risultato[posizione] = [...voce.riga.slice(0, 5), +punto.lat.toFixed(5), +punto.lng.toFixed(5)];
      console.log(`  ${i + 1}/${daRisolvere.length} ${voce.nome} (${voce.provincia}) → ${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}`);
    } else {
      console.log(`  ${i + 1}/${daRisolvere.length} ${voce.nome} (${voce.provincia}) → NON TROVATO`);
    }
    await attendi(1100);
  }
}

const scoperti = risultato.filter((r) => r.length < 7).map((r) => `${r[0]} (${r[1]})`);
if (scoperti.length) {
  console.error(`\n⚠️  ${scoperti.length} comuni senza coordinate: ${scoperti.join(", ")}`);
  console.error("Il file NON è stato scritto: risolvili a mano prima di rilanciare.");
  process.exit(1);
}

// una riga per comune: il file resta leggibile in diff senza pesare
fs.writeFileSync(FILE_COMUNI, `[\n${risultato.map((r) => JSON.stringify(r)).join(",\n")}\n]\n`);
console.log(`\n✅ Scritto ${FILE_COMUNI} — ${risultato.length} comuni, tutti con coordinate.`);
