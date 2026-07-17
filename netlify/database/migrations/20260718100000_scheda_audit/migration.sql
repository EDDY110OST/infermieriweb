-- Traccia di chi ha modificato la scheda di un professionista dal pannello admin.
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS edited_by TEXT NOT NULL DEFAULT '';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
