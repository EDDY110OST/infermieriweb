-- Prezzo notturno (22:00-07:00) per prestazione: NULL = quella prestazione di notte non si fa
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_notte_cents INT;
