-- Indirizzo della sede/studio del professionista: viene geocodificato
-- automaticamente in lat/lng per il segnaposto sulla mappa.
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
