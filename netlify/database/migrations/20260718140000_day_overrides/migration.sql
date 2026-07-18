-- Eccezioni di disponibilità per singolo giorno (turnisti: aprono/chiudono il giorno preciso).
-- La presenza di una riga per (professionista, giorno) fa sì che quel giorno IGNORI
-- l'orario fisso settimanale e segua SOLO le fasce qui indicate.
--   fasce = []                       -> giorno CHIUSO
--   fasce = [[540,780],[900,1140]]   -> aperto 09:00-13:00 e 15:00-19:00 (minuti da mezzanotte)
CREATE TABLE IF NOT EXISTS day_overrides (
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  fasce JSONB NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (professional_id, day)
);
