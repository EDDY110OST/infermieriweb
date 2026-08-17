// Migrazione 17/8/2026 — consulenze, tipo attività, eliminazione morbida
// prestazioni, recensioni Google tolte dalla scheda di Eduard.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. Idempotente.
//   DATABASE_URL="postgres://…" node scripts/migrate-2026-08-17.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  // 3) eliminazione morbida: una prestazione con prenotazioni nello storico non si
  //    può cancellare (FK bookings.service_id) → si "archivia" e sparisce dal pannello
  ["services.deleted_at", () => sql`ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone`],
  // 7) tipo di attività scelto dal professionista: '' = non ancora scelto
  //    (si comporta come domicilio), 'domicilio' | 'consulenza' | 'entrambi'
  ["professionals.tipo", () => sql`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT ''`],
  ["applications.tipo", () => sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT ''`],
  // 2) recensioni Google via dalla scheda di Eduard (richiesta sua, 17/8/26).
  //    Valori precedenti: google_rating='5,0 su Google · 50 recensioni',
  //    google_reviews_url='https://g.page/r/CblrQcuM1y1GEBM/review'
  ["google reviews Eduard", () => sql`UPDATE professionals SET google_rating = '', google_reviews_url = '' WHERE id = 1 AND slug = 'eduard'`],
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

const [c1] = await sql`SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'deleted_at'`;
const [c2] = await sql`SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'tipo'`;
const [c3] = await sql`SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'tipo'`;
const [e] = await sql`SELECT google_rating, google_reviews_url FROM professionals WHERE id = 1`;
console.log("Verifica:", { services_deleted_at: c1.n, professionals_tipo: c2.n, applications_tipo: c3.n, eduard_google: e });
