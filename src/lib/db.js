import { neon } from "@neondatabase/serverless";

// Connessione al database Netlify DB (Neon). La variabile è iniettata
// automaticamente dalle funzioni Netlify; in locale da `netlify dev`.
const url = (process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL) || process.env.DATABASE_URL;
if (!url) {
  throw new Error("NETLIFY_DATABASE_URL non impostata: imposta DATABASE_URL nelle variabili d'ambiente (Render).");
}

export const sql = neon(url);
