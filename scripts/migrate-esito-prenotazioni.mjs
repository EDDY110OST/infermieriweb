// Migrazione 14/10/2026 — «completata» solo su conferma dell'infermiere (audit L10, F4).
//  - bookings.esito_chiesto_at: guardia «una volta sola» dell'email «Com'è andata?» che
//    il cron manda all'infermiere 3 ore dopo la fine dell'appuntamento.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE.
// VA LANCIATA PRIMA del deploy: il cron nuovo legge questa colonna.
//   DATABASE_URL="postgres://…" node scripts/migrate-esito-prenotazioni.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

try {
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS esito_chiesto_at timestamp with time zone`;
  console.log("✅ bookings.esito_chiesto_at");
} catch (e) {
  console.error(`❌ bookings.esito_chiesto_at: ${e.message}`);
  process.exit(1);
}
const col = new Set((await sql`
  SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'`).map((x) => x.column_name));
console.log("bookings → esito_chiesto_at:", col.has("esito_chiesto_at") ? "ok" : "MANCA");
const [n] = await sql`SELECT COUNT(*)::int AS n FROM bookings WHERE status = 'active' AND end_dt < now()`;
console.log(`appuntamenti passati ancora «attivi» (riceveranno la domanda se finiti da meno di 30 giorni): ${n.n}`);
