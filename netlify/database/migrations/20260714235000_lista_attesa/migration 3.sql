-- Lista d'attesa: chi cerca in una zona non ancora coperta lascia la mail.
-- Serve a due cose: avvisarlo quando arriviamo e capire DOVE aprire per primi.
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  zona TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_waitlist_zona ON waitlist (zona);
