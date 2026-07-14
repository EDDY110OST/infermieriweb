-- Contatore eventi per i limiti anti-bot (login, prenotazioni, candidature)
CREATE TABLE IF NOT EXISTS rate_events (
  key TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_rate_events ON rate_events (key, ts);
