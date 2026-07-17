-- Articolo "in evidenza" in cima al blog: flag opzionale, non intacca gli articoli esistenti.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
