// Migrazione 13/10/2026 — «🔑 Registro accessi»: chi entra nell'area riservata, quando, e
// chi ci prova senza riuscirci (lib/accessi.js). Solo una tabella nuova: non tocca nessun
// dato esistente, si può lanciare PRIMA del deploy.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE (si può
// rilanciare). Provata sull'ambiente locale PGlite (scripts/prova-locale) prima di Neon.
//   DATABASE_URL="postgres://…" node scripts/migrate-registro-accessi.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["access_log", () => sql`
    CREATE TABLE IF NOT EXISTS access_log (
      id BIGSERIAL PRIMARY KEY,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      evento text NOT NULL,
      user_id integer,
      professional_id integer,
      email text NOT NULL DEFAULT '',
      dispositivo text NOT NULL DEFAULT ''
    )`],
  ["access_log per professionista", () => sql`CREATE INDEX IF NOT EXISTS ix_access_log_prof ON access_log (professional_id, created_at DESC)`],
  ["access_log per data", () => sql`CREATE INDEX IF NOT EXISTS ix_access_log_created ON access_log (created_at DESC)`],
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
const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'access_log'`;
const have = new Set(r.map((x) => x.column_name));
const attese = ["id", "created_at", "evento", "user_id", "professional_id", "email", "dispositivo"];
console.log("access_log →", attese.map((n) => `${n}:${have.has(n) ? "ok" : "MANCA"}`).join(" "));
const [n] = await sql`SELECT COUNT(*)::int AS n FROM access_log`;
console.log(`righe nel registro: ${n.n}`);
