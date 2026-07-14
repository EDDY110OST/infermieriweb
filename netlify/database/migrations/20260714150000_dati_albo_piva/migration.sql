-- Dati richiesti da Bruno (14/7): albo di appartenenza, data e numero
-- di iscrizione, partita IVA — sia in candidatura che nel profilo.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS albo_name TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS albo_date TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS vat_number TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS albo_name TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS albo_date TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS vat_number TEXT NOT NULL DEFAULT '';
