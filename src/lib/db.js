import { creaSql } from "./pg-sql.js";

// Connessione al database (Render Postgres; prima Neon). L'indirizzo è nella variabile
// DATABASE_URL del servizio su Render.
const url = (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) || process.env.DATABASE_URL;
if (!url) {
  throw new Error("NETLIFY_DATABASE_URL non impostata: imposta DATABASE_URL nelle variabili d'ambiente (Render).");
}

export const sql = creaSql(url);
