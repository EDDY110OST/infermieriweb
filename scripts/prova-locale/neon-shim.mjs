// Sostituto LOCALE di @neondatabase/serverless: stessa interfaccia (tagged template +
// .query), ma dietro c'è PGlite (Postgres in memoria). Lo schema viene da db/schema.sql
// e i dati da seed.json (copia anonimizzata di produzione, vedi dump-seed.mjs).
// Vedi hook.mjs per l'uso. Niente tocca Neon.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const qui = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = process.env.IW_SCHEMA_SQL || path.resolve(qui, "../../db/schema.sql");
const SEED = process.env.IW_SEED_JSON || path.join(qui, "seed.json");
// ordine di inserimento = ordine delle chiavi esterne
const ORDINE = ["professionals", "professional_users", "catalog_services", "services", "articles", "coverage_areas",
  "opening_hours", "day_overrides", "blocks", "bookings", "reviews"];

let pronto = null;

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
  if (process.env.IW_SHIM_LOG === "2") console.log("[sql]", testo.replace(/\s+/g, " ").slice(0, 160), params || "");
  return (await db.query(testo, (params || []).map(serializza))).rows;
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
