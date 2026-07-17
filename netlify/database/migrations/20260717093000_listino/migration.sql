-- Ogni prestazione si aggancia al listino ufficiale (per il prezzo minimo)
ALTER TABLE services ADD COLUMN IF NOT EXISTS catalog_key TEXT NOT NULL DEFAULT '';
