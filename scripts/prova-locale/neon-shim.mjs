// Sostituto LOCALE di @neondatabase/serverless: stessa interfaccia (tagged template +
// .query), ma dietro c'è PGlite (Postgres in memoria). Lo schema viene da db/schema.sql
// e i dati da seed.json (copia anonimizzata di produzione, vedi dump-seed.mjs).
// Vedi hook.mjs per l'uso. Niente tocca Neon.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import http from "node:http";

const qui = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = process.env.IW_SCHEMA_SQL || path.resolve(qui, "../../db/schema.sql");
const SEED = process.env.IW_SEED_JSON || path.join(qui, "seed.json");
// ordine di inserimento = ordine delle chiavi esterne
const ORDINE = ["applications", "professionals", "professional_users", "catalog_services", "services", "articles", "coverage_areas",
  "opening_hours", "day_overrides", "blocks", "bookings", "reviews"];

let pronto = null;
// Migrazione di prova: con IW_SHIM_MIGRAZIONE=<script .mjs> lo script gira sullo STESSO
// Postgres in memoria subito dopo il seed (tutte le neon() condividono il DB).
let statoMigrazione = process.env.IW_SHIM_MIGRAZIONE ? "da-fare" : "no";

const serializza = (v) => {
  if (v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === "object") return JSON.stringify(v); // jsonb
  return v;
};

async function prepara() {
  const pg = new PGlite();
  await pg.exec(readFileSync(SCHEMA, "utf8"));
  const seed = JSON.parse(readFileSync(SEED, "utf8"));
  for (const t of ORDINE) {
    const righe = seed[t] || [];
    for (const r of righe) {
      const cols = Object.keys(r);
      await pg.query(`INSERT INTO ${t} (${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})`, cols.map((c) => serializza(r[c])));
    }
    if (righe.length && righe[0].id !== undefined) {
      await pg.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), (SELECT MAX(id) FROM ${t}))`);
    }
  }
  if (process.env.IW_SHIM_LOG) console.log("[neon-shim] PGlite pronto con seed:", ORDINE.map((t) => `${t}=${(seed[t] || []).length}`).join(" "));
  return pg;
}

async function esegui(testo, params) {
  if (!pronto) pronto = prepara();
  const db = await pronto;
  if (statoMigrazione === "da-fare") {
    statoMigrazione = "in-corso"; // le query della migrazione stessa passano di qui senza aspettare
    await import(pathToFileURL(path.resolve(process.env.IW_SHIM_MIGRAZIONE)).href);
    statoMigrazione = "fatta";
    if (process.env.IW_SHIM_LOG) console.log("[neon-shim] migrazione di prova eseguita:", process.env.IW_SHIM_MIGRAZIONE);
  }
  if (process.env.IW_SHIM_LOG === "2") console.log("[sql]", testo.replace(/\s+/g, " ").slice(0, 160), params || "");
  // Parametri delle query come fa il driver Neon vero: un elenco JS diventa un ARRAY
  // Postgres (serve a «id = ANY(${ids})»), un oggetto diventa JSON. Prima anche gli
  // elenchi diventavano testo JSON e la pagina comune dava 500 solo in prova (9/10/26).
  const param = (v) => (Array.isArray(v) ? v : serializza(v));
  return (await db.query(testo, (params || []).map(param))).rows;
}

export function neon() {
  const sql = (strings, ...values) => {
    if (!Array.isArray(strings) || !strings.raw) throw new Error("neon-shim: usa il tagged template");
    let testo = "";
    strings.forEach((s, i) => { testo += s; if (i < values.length) testo += `$${i + 1}`; });
    return esegui(testo, values);
  };
  sql.query = (testo, params = []) => esegui(testo, params);
  sql.unsafe = (testo) => esegui(testo, []);
  return sql;
}

export const neonConfig = {};
export default { neon, neonConfig };

// Canale SQL per i COLLAUDI (solo ambiente di prova): con IW_SHIM_SQLPORT=4398 i test
// possono leggere/scrivere il DB in memoria del server (es. retrodatare una prenotazione
// per far scattare il giro delle 24 ore). Risponde solo su 127.0.0.1.
if (process.env.IW_SHIM_SQLPORT) {
  http.createServer(async (req, res) => {
    let corpo = "";
    req.on("data", (c) => { corpo += c; });
    req.on("end", async () => {
      try {
        const { query, params } = JSON.parse(corpo || "{}");
        const rows = await esegui(String(query), params || []);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ rows }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }).listen(Number(process.env.IW_SHIM_SQLPORT), "127.0.0.1");
}
