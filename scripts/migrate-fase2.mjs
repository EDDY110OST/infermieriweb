// Migrazione Fase 2 — crea le tabelle nuove su Neon (Render NON esegue le
// migrazioni: si lancia a mano). Idempotente: si può rilanciare senza danni.
//   DATABASE_URL="postgres://…" node scripts/migrate-fase2.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const passi = [
  ["info_requests", () => sql`
    CREATE TABLE IF NOT EXISTS info_requests (
      id SERIAL, reason text NOT NULL DEFAULT ''::text, name text NOT NULL, email text NOT NULL,
      phone text NOT NULL DEFAULT ''::text, city text NOT NULL DEFAULT ''::text,
      message text NOT NULL DEFAULT ''::text, newsletter boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'new'::text, created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT info_requests_pkey PRIMARY KEY (id))`],
  ["newsletter_subscribers", () => sql`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL, email text NOT NULL, source text NOT NULL DEFAULT ''::text,
      consent_at timestamp with time zone NOT NULL DEFAULT now(),
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id),
      CONSTRAINT newsletter_subscribers_email_key UNIQUE (email))`],
  ["patient_records", () => sql`
    CREATE TABLE IF NOT EXISTS patient_records (
      id SERIAL, professional_id integer NOT NULL, data_enc text NOT NULL, iv text NOT NULL, tag text NOT NULL,
      consent boolean NOT NULL DEFAULT false, consent_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT patient_records_pkey PRIMARY KEY (id))`],
  ["ix_patient_records_prof", () => sql`CREATE INDEX IF NOT EXISTS ix_patient_records_prof ON patient_records USING btree (professional_id)`],
  ["diario_audit", () => sql`
    CREATE TABLE IF NOT EXISTS diario_audit (
      id SERIAL, professional_id integer NOT NULL, record_id integer, action text NOT NULL DEFAULT ''::text,
      at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT diario_audit_pkey PRIMARY KEY (id))`],
  ["ix_diario_audit_prof", () => sql`CREATE INDEX IF NOT EXISTS ix_diario_audit_prof ON diario_audit USING btree (professional_id, at)`],
  ["fk patient_records", async () => {
    try {
      await sql`ALTER TABLE patient_records ADD CONSTRAINT patient_records_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE`;
    } catch (e) {
      if (String(e.message).includes("already exists")) return "(già presente)";
      throw e;
    }
  }],
];

for (const [nome, fn] of passi) {
  const nota = await fn();
  console.log(`✓ ${nome} ${nota || ""}`.trim());
}
console.log("✅ Migrazione Fase 2 completata.");
