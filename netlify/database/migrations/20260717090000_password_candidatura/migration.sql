-- La password la sceglie il candidato in fase di registrazione (hash scrypt)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS pass_hash TEXT NOT NULL DEFAULT '';
