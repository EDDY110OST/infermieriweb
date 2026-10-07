// Migrazione 7/10/2026 — editor articoli con formattazione, cancellazione infermiere
// (lapide anonima), bio per le consulenze, appellativo «Inf.», specializzazioni,
// accetta/cambio infermiere, contatori (chi ha annullato).
// Render NON esegue le migrazioni: si lancia a mano contro Neon. IDEMPOTENTE (si può
// rilanciare). Provata sull'ambiente locale PGlite (scripts/prova-locale) prima di Neon.
//   DATABASE_URL="postgres://…" node scripts/migrate-2026-10-07.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

// Seme delle specializzazioni (lista di partenza da far validare a Eduard; si gestisce
// poi dall'admin → Infermieri → Specializzazioni). La chiave non cambia mai.
export const SPECIALIZZAZIONI_SEME = [
  ["wound-care", "Wound care (lesioni cutanee)"],
  ["stomie", "Stomie"],
  ["cure-palliative", "Cure palliative"],
  ["accessi-venosi-picc", "Accessi venosi e PICC"],
  ["diabete", "Diabete"],
  ["geriatria", "Geriatria"],
  ["pediatria", "Pediatria"],
  ["oncologia", "Oncologia"],
  ["dialisi", "Dialisi"],
  ["nutrizione-artificiale", "Nutrizione artificiale (PEG, sondino)"],
  ["cardiologia", "Cardiologia (ECG, Holter)"],
  ["riabilitazione", "Riabilitazione"],
  ["salute-mentale", "Salute mentale"],
  ["post-operatorio", "Assistenza post-operatoria"],
  ["formazione", "Formazione e consulenza ai colleghi"],
];

const passi = [
  // 3) editor articoli: HTML sanificato accanto al testo «raw» (che resta)
  ["articles.body_html", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS body_html text NOT NULL DEFAULT ''`],
  ["articles.body_format", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS body_format text NOT NULL DEFAULT 'raw'`],

  // 4) cancellazione infermiere: lapide anonima + registro azioni admin senza dati personali
  ["professionals.deleted_at", () => sql`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone`],
  ["admin_audit", () => sql`
    CREATE TABLE IF NOT EXISTS admin_audit (
      id SERIAL PRIMARY KEY,
      at timestamp with time zone NOT NULL DEFAULT now(),
      admin text NOT NULL DEFAULT '',
      azione text NOT NULL,
      soggetto_id integer,
      dettagli jsonb NOT NULL DEFAULT '{}'::jsonb
    )`],

  // 5) presentazione per i colleghi (pagine /consulenza)
  ["professionals.bio_consulenza", () => sql`ALTER TABLE professionals ADD COLUMN IF NOT EXISTS bio_consulenza text NOT NULL DEFAULT ''`],

  // 6) appellativo «Inf.» per tutti (scelta soci 7/10/26) + le due anomalie di maiuscole
  ["nome pubblico Dott. → Inf.", () => sql`
    UPDATE professionals SET name = regexp_replace(name, '^Dott\\.(ssa)?\\s+', 'Inf. ')
    WHERE name ~ '^Dott\\.(ssa)?\\s'`],
  ["nomi tutti maiuscoli/minuscoli → iniziali maiuscole", () => sql`
    UPDATE professionals
    SET name = regexp_replace(name, '^Inf\\. (.*)$', 'Inf. ' || initcap(substring(name from '^Inf\\. (.*)$')))
    WHERE name ~ '^Inf\\. ' AND (substring(name from '^Inf\\. (.*)$') = upper(substring(name from '^Inf\\. (.*)$'))
                               OR substring(name from '^Inf\\. (.*)$') = lower(substring(name from '^Inf\\. (.*)$')))`],
  ["nome pubblico con iniziale minuscola (es. 'Inf. irene I.')", () => sql`
    UPDATE professionals
    SET name = 'Inf. ' || initcap(substring(name from '^Inf\\. (.*)$'))
    WHERE name ~ '^Inf\\. [a-z]'`],
  ["nome completo tutto maiuscolo/minuscolo → iniziali maiuscole", () => sql`
    UPDATE professionals SET full_name = initcap(full_name)
    WHERE full_name <> '' AND (full_name = upper(full_name) OR full_name = lower(full_name))`],
  ["nome completo con cognome minuscolo (es. 'Rita ceceri')", () => sql`
    UPDATE professionals SET full_name = initcap(full_name)
    WHERE full_name ~ '\\s[a-z]' AND full_name !~ '\\s(de|di|del|della|dei|degli|da|la|le|lo|von|van)\\s'`],

  // 7) specializzazioni: lista gestita + scelte del professionista
  ["catalog_specializations", () => sql`
    CREATE TABLE IF NOT EXISTS catalog_specializations (
      id SERIAL PRIMARY KEY,
      key text NOT NULL,
      nome text NOT NULL,
      sort smallint NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      professional_id integer REFERENCES professionals(id) ON DELETE CASCADE,
      created_by text NOT NULL DEFAULT '',
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )`],
  ["ux_spec_key_globale", () => sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_spec_key_globale ON catalog_specializations (key) WHERE professional_id IS NULL`],
  ["ux_spec_key_prof", () => sql`CREATE UNIQUE INDEX IF NOT EXISTS ux_spec_key_prof ON catalog_specializations (professional_id, key) WHERE professional_id IS NOT NULL`],
  ["professional_specializations", () => sql`
    CREATE TABLE IF NOT EXISTS professional_specializations (
      professional_id integer NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
      key text NOT NULL,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      PRIMARY KEY (professional_id, key)
    )`],
  ["seme specializzazioni", async () => {
    for (let i = 0; i < SPECIALIZZAZIONI_SEME.length; i++) {
      const [key, nome] = SPECIALIZZAZIONI_SEME[i];
      await sql`
        INSERT INTO catalog_specializations (key, nome, sort, created_by)
        SELECT ${key}, ${nome}, ${i + 1}, 'migrazione 7/10/26'
        WHERE NOT EXISTS (SELECT 1 FROM catalog_specializations WHERE key = ${key} AND professional_id IS NULL)`;
    }
  }],

  // 8) accetta + cambio infermiere
  ["bookings.accepted_at", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone`],
  ["bookings.cambio_inviato_at", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cambio_inviato_at timestamp with time zone`],
  ["bookings.replaces", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS replaces integer`],
  ["bookings.replaced_by", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS replaced_by integer`],

  // 9) contatori: chi ha annullato e quando ('' = non noto per le righe vecchie)
  ["bookings.cancelled_by", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by text NOT NULL DEFAULT ''`],
  ["bookings.cancelled_at", () => sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone`],
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
const colonne = async (tabella, nomi) => {
  const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${tabella}`;
  const have = new Set(r.map((x) => x.column_name));
  return nomi.map((n) => `${n}:${have.has(n) ? "ok" : "MANCA"}`).join(" ");
};
console.log("articles →", await colonne("articles", ["body_html", "body_format"]));
console.log("professionals →", await colonne("professionals", ["bio_consulenza", "deleted_at"]));
console.log("bookings →", await colonne("bookings", ["accepted_at", "cambio_inviato_at", "replaces", "replaced_by", "cancelled_by", "cancelled_at"]));
const [spec] = await sql`SELECT COUNT(*)::int AS n FROM catalog_specializations WHERE professional_id IS NULL`;
const [dott] = await sql`SELECT COUNT(*)::int AS n FROM professionals WHERE name ~ '^Dott'`;
const [inf] = await sql`SELECT COUNT(*)::int AS n FROM professionals WHERE name ~ '^Inf\\. '`;
const [audit] = await sql`SELECT COUNT(*)::int AS n FROM admin_audit`;
console.log(`specializzazioni nel listino: ${spec.n} · nomi con "Dott.": ${dott.n} · con "Inf.": ${inf.n} · righe admin_audit: ${audit.n}`);
