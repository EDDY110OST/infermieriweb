-- Audit trail della verifica obbligatoria (P.IVA su Agenzia Entrate + albo su FNOPI)
-- prima di attivare un professionista. È la traccia che tutela la piattaforma.
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS verified_piva_at TIMESTAMPTZ;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS verified_albo_at TIMESTAMPTZ;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS verified_by TEXT NOT NULL DEFAULT '';
