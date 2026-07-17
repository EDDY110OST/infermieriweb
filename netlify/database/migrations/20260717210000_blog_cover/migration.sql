-- Copertina caricata dal pannello admin: l'immagine (base64) vive nel DB come per le foto
-- dei professionisti; il campo `image` contiene poi l'URL dell'endpoint che la serve.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_data TEXT NOT NULL DEFAULT '';
