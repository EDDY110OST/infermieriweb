// Migrazione 17/8/2026 (sera) — il LISTINO diventa gestibile dall'admin.
// Prima era scritto nel codice (src/data/listino.js): ora vive nella tabella
// catalog_services, così Bruno ed Eduard aggiungono/ritirano prestazioni dal
// pannello. Le voci con professional_id valorizzato sono "su misura": le vede e
// le usa SOLO quel professionista.
// Render NON esegue le migrazioni: si lancia a mano. Idempotente.
//   DATABASE_URL="postgres://…" node scripts/migrate-listino-db.mjs
import { neon } from "@neondatabase/serverless";
import { LISTINO, LISTINO_CONSULENZA } from "../src/data/listino.js";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["tabella catalog_services", () => sql`
    CREATE TABLE IF NOT EXISTS catalog_services (
      id SERIAL,
      key text NOT NULL,
      nome text NOT NULL,
      categoria text NOT NULL DEFAULT 'domicilio',   -- domicilio | consulenza
      min_cents integer NOT NULL DEFAULT 0,          -- prezzo minimo invalicabile
      sugg_cents integer NOT NULL DEFAULT 0,         -- prezzo consigliato
      durata_min smallint NOT NULL DEFAULT 30,
      icona text NOT NULL DEFAULT 'croce',
      sort smallint NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,          -- false = ritirata dal listino
      professional_id integer,                       -- NULL = per tutti; valorizzato = su misura
      created_by text NOT NULL DEFAULT ''::text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT catalog_services_pkey PRIMARY KEY (id))`],
  // Una chiave sola per le voci globali; per le voci su misura una sola per professionista.
  ["indice voci globali", () => sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_catalog_key_globale
    ON catalog_services (key) WHERE professional_id IS NULL`],
  ["indice voci su misura", () => sql`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_catalog_key_prof
    ON catalog_services (professional_id, key) WHERE professional_id IS NOT NULL`],
  ["chiave esterna professionista", async () => {
    try {
      await sql`ALTER TABLE catalog_services ADD CONSTRAINT catalog_services_professional_id_fkey
        FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE`;
    } catch (e) { if (!/already exists|esiste già/i.test(e.message)) throw e; }
  }],
];

for (const [nome, passo] of passi) {
  try { await passo(); console.log(`✅ ${nome}`); }
  catch (e) { console.error(`❌ ${nome}: ${e.message}`); process.exit(1); }
}

// Semina il listino attuale (quello finora nel codice). Non sovrascrive nulla:
// se una chiave c'è già, la lascia com'è — l'admin è la fonte di verità.
let inseriti = 0;
const voci = [
  ...LISTINO.map((v, i) => ({ ...v, categoria: "domicilio", sort: i + 1 })),
  ...LISTINO_CONSULENZA.map((v, i) => ({ ...v, categoria: "consulenza", sort: 100 + i })),
];
for (const v of voci) {
  const r = await sql`
    INSERT INTO catalog_services (key, nome, categoria, min_cents, sugg_cents, durata_min, icona, sort, created_by)
    SELECT ${v.key}, ${v.nome}, ${v.categoria}, ${v.min * 100}, ${v.consigliato * 100}, ${v.durata}, ${v.icona}, ${v.sort}, 'seed'
    WHERE NOT EXISTS (SELECT 1 FROM catalog_services WHERE key = ${v.key} AND professional_id IS NULL)
    RETURNING id`;
  if (r.length) inseriti++;
}
console.log(`✅ listino seminato: ${inseriti} voci nuove su ${voci.length}`);

const righe = await sql`
  SELECT categoria, COUNT(*) FILTER (WHERE active) AS attive, COUNT(*) AS totali
  FROM catalog_services WHERE professional_id IS NULL GROUP BY categoria ORDER BY categoria`;
console.table(righe);
// Prestazioni già inserite dai professionisti che NON hanno più una voce di listino
// (non dovrebbe succedere adesso, ma è il controllo che conta dopo i ritiri).
const orfane = await sql`
  SELECT s.catalog_key, COUNT(*) AS n FROM services s
  WHERE s.deleted_at IS NULL AND NOT EXISTS (
    SELECT 1 FROM catalog_services c WHERE c.key = s.catalog_key AND (c.professional_id IS NULL OR c.professional_id = s.professional_id))
  GROUP BY 1`;
console.log("prestazioni senza voce di listino:", orfane.length ? orfane : "nessuna ✅");
