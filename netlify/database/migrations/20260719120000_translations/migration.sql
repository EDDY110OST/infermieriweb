-- Cache delle traduzioni automatiche dei contenuti "vivi" (bio, recensioni, articoli).
-- Chiave = hash del testo italiano + lingua. Si popola alla prima richiesta in quella
-- lingua e non ritraduce mai più lo stesso testo (veloce + costo minimo sul motore).
CREATE TABLE IF NOT EXISTS translations (
  source_hash TEXT NOT NULL,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, lang)
);
