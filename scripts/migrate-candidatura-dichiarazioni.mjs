// Migrazione 14/10/2026 — modulo di candidatura: spunte obbligatorie «accetto le
// Condizioni d'uso» e «assicurazione RC professionale» (decisione di Bruno, scelta «C»).
//  - applications.condizioni_accettate_at / rc_dichiarata_at: data e ora delle due spunte,
//    come prova di cosa ha accettato il candidato. Le candidature vecchie restano vuote.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE (si può
// rilanciare). VA LANCIATA PRIMA del deploy: il modulo nuovo scrive queste colonne.
//   DATABASE_URL="postgres://…" node scripts/migrate-candidatura-dichiarazioni.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["applications.condizioni_accettate_at", () => sql`
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS condizioni_accettate_at timestamp with time zone`],
  ["applications.rc_dichiarata_at", () => sql`
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS rc_dichiarata_at timestamp with time zone`],
];

for (const [nome, passo] of passi) {
  try {
    await passo();
    console.log(`✅ ${nome}`);
  } catch (e) {
    console.error(`❌ ${nome}: ${e.message}`);
    process.exit(1);
  }
}

// Verifica finale
const app = new Set((await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = 'applications'`).map((x) => x.column_name));
console.log("applications →", ["condizioni_accettate_at", "rc_dichiarata_at"].map((n) => `${n}:${app.has(n) ? "ok" : "MANCA"}`).join(" "));
