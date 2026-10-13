// Migrazione 13/10/2026 — prestazioni già nel modulo di candidatura + promemoria
// a chi non completa la scheda (decisione di Bruno, scelta «A»).
//  - applications.prestazioni: le prestazioni a domicilio scelte dal candidato con il
//    prezzo proposto ([{key, nome, price_cents}]); all'approvazione diventano righe `services`.
//  - professionals.promemoria_profilo_3_at / _10_at: guardie «una sola volta» dei due
//    promemoria automatici (3 e 10 giorni dopo l'approvazione) a chi è ancora senza
//    prestazioni o senza orari.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE (si può
// rilanciare). Provata sull'ambiente locale PGlite (scripts/prova-locale) prima di Neon.
//   DATABASE_URL="postgres://…" node scripts/migrate-candidatura-prestazioni.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["applications.prestazioni", () => sql`
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS prestazioni jsonb NOT NULL DEFAULT '[]'::jsonb`],
  ["professionals.promemoria_profilo_3_at", () => sql`
    ALTER TABLE professionals ADD COLUMN IF NOT EXISTS promemoria_profilo_3_at timestamp with time zone`],
  ["professionals.promemoria_profilo_10_at", () => sql`
    ALTER TABLE professionals ADD COLUMN IF NOT EXISTS promemoria_profilo_10_at timestamp with time zone`],
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
const colonne = async (tabella) => new Set((await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = ${tabella}`).map((x) => x.column_name));
const app = await colonne("applications");
const prof = await colonne("professionals");
console.log("applications →", ["prestazioni"].map((n) => `${n}:${app.has(n) ? "ok" : "MANCA"}`).join(" "));
console.log("professionals →", ["promemoria_profilo_3_at", "promemoria_profilo_10_at"].map((n) => `${n}:${prof.has(n) ? "ok" : "MANCA"}`).join(" "));
const [n] = await sql`SELECT COUNT(*)::int AS n FROM applications WHERE jsonb_array_length(prestazioni) > 0`;
console.log(`candidature con prestazioni già scelte: ${n.n}`);
