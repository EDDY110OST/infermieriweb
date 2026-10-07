// SOLO LETTURE su Neon: copia le tabelle che servono alle prove in scripts/prova-locale/seed.json
// (in .gitignore: contiene i dati dei professionisti). I dati dei PAZIENTI e degli autori delle
// recensioni vengono anonimizzati qui, prima di scrivere il file.
//   DATABASE_URL="postgres://…" node scripts/prova-locale/dump-seed.mjs
import { neon } from "@neondatabase/serverless";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);
const destinazione = process.env.IW_SEED_JSON || path.join(path.dirname(fileURLToPath(import.meta.url)), "seed.json");

const out = {};
out.professionals = await sql`SELECT * FROM professionals ORDER BY id`;
out.professional_users = await sql`SELECT * FROM professional_users ORDER BY id`;
out.catalog_services = await sql`SELECT * FROM catalog_services ORDER BY id`;
out.services = await sql`SELECT * FROM services ORDER BY id`;
out.articles = await sql`SELECT * FROM articles ORDER BY id`;
out.coverage_areas = await sql`SELECT * FROM coverage_areas ORDER BY id`;
out.opening_hours = await sql`SELECT * FROM opening_hours ORDER BY id`;
out.day_overrides = await sql`SELECT * FROM day_overrides ORDER BY professional_id, day`;
out.blocks = await sql`SELECT * FROM blocks ORDER BY id`;
out.bookings = (await sql`SELECT * FROM bookings ORDER BY id`).map((b) => ({
  ...b, customer_name: `Paziente ${b.id}`, customer_phone: `3330000${String(b.id).padStart(3, "0")}`,
  customer_email: b.customer_email ? `paziente${b.id}@example.invalid` : "", address: b.address ? "Via di Prova 1" : "",
  cancel_token: b.cancel_token ? `tok${b.id}` : "", consent_text: "",
}));
out.reviews = (await sql`SELECT * FROM reviews ORDER BY id`).map((r) => ({
  ...r, author_name: `Autore ${r.id}`, text: r.text ? "Recensione di prova." : "", review_token: "",
}));

for (const k in out) console.log(`${k}: ${out[k].length}`);
writeFileSync(destinazione, JSON.stringify(out));
console.log("✅ seed scritto in", destinazione);
