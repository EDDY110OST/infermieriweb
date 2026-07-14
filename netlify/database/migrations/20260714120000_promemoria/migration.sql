-- Promemoria 24h: tiene traccia dell'invio per non mandarlo due volte
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;
