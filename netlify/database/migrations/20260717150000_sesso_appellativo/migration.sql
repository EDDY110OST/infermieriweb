-- Sesso in candidatura -> appellativo Dott./Dott.ssa; cognome puntato in pubblico,
-- nome completo riservato all'email di conferma del paziente
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
