// Migrazione 7/10/2026 (b) — «✉️ Scrivi agli infermieri»: storico delle comunicazioni
// mandate dall'admin a tutti gli infermieri (una email per persona).
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE (si può
// rilanciare). Provata sull'ambiente locale PGlite (scripts/prova-locale) prima di Neon.
//   DATABASE_URL="postgres://…" node scripts/migrate-2026-10-07b.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["admin_broadcasts", () => sql`
    CREATE TABLE IF NOT EXISTS admin_broadcasts (
      id SERIAL PRIMARY KEY,
      chiave text NOT NULL,
      oggetto text NOT NULL,
      html text NOT NULL,
      destinatari integer NOT NULL DEFAULT 0,
      riuscite integer NOT NULL DEFAULT 0,
      non_riuscite integer NOT NULL DEFAULT 0,
      elenco_non_riuscite jsonb NOT NULL DEFAULT '[]'::jsonb,
      destinatari_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      inviati_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      stato text NOT NULL DEFAULT 'in_corso',
      mandata_da text NOT NULL DEFAULT '',
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      aggiornata_at timestamp with time zone NOT NULL DEFAULT now(),
      finita_at timestamp with time zone
    )`],
  // la chiave anti-doppio-invio è unica: due clic (o una pagina ricaricata) = un invio solo
  ["admin_broadcasts.chiave unica", () => sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_broadcasts_chiave ON admin_broadcasts (chiave)`],
  ["admin_broadcasts per data", () => sql`CREATE INDEX IF NOT EXISTS ix_admin_broadcasts_created ON admin_broadcasts (created_at DESC)`],
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
const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_broadcasts'`;
const have = new Set(r.map((x) => x.column_name));
const attese = ["id", "chiave", "oggetto", "html", "destinatari", "riuscite", "non_riuscite", "elenco_non_riuscite",
  "destinatari_ids", "inviati_ids", "stato", "mandata_da", "created_at", "aggiornata_at", "finita_at"];
console.log("admin_broadcasts →", attese.map((n) => `${n}:${have.has(n) ? "ok" : "MANCA"}`).join(" "));
const [n] = await sql`SELECT COUNT(*)::int AS n FROM admin_broadcasts`;
console.log(`comunicazioni nello storico: ${n.n}`);
