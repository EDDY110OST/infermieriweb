-- Contatore visite alla scheda pubblica (per le statistiche del pannello)
CREATE TABLE IF NOT EXISTS profile_views (
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  PRIMARY KEY (professional_id, day)
);
