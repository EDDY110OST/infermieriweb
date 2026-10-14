// Migrazione 14/10/2026 — Condizioni d'uso e assicurazione RC anche sulla scheda del
// professionista (decisione di Bruno, scelta «B»).
//  - professionals.condizioni_accettate_at / rc_dichiarata_at: arrivano dalla candidatura
//    all'approvazione; chi è entrato prima le spunta al primo accesso al pannello.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE.
// VA LANCIATA PRIMA del deploy: il pannello nuovo legge queste colonne.
//   DATABASE_URL="postgres://…" node scripts/migrate-professionisti-condizioni.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["professionals.condizioni_accettate_at", () => sql`
    ALTER TABLE professionals ADD COLUMN IF NOT EXISTS condizioni_accettate_at timestamp with time zone`],
  ["professionals.rc_dichiarata_at", () => sql`
    ALTER TABLE professionals ADD COLUMN IF NOT EXISTS rc_dichiarata_at timestamp with time zone`],
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

const col = new Set((await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = 'professionals'`).map((x) => x.column_name));
console.log("professionals →", ["condizioni_accettate_at", "rc_dichiarata_at"].map((n) => `${n}:${col.has(n) ? "ok" : "MANCA"}`).join(" "));
const [n] = await sql`SELECT COUNT(*)::int AS n FROM professionals WHERE status IN ('active','network') AND condizioni_accettate_at IS NULL`;
console.log(`professionisti attivi o in rete che dovranno accettare al prossimo accesso: ${n.n}`);
