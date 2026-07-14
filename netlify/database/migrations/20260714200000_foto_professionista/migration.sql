-- Foto del professionista caricata dal pannello (base64, ridimensionata
-- lato client a ~400px: pesa pochi KB). Servita da /api/foto/[slug].
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS photo_data TEXT NOT NULL DEFAULT '';
