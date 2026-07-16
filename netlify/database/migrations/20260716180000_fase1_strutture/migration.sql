-- Fase 1 "infermieri senza P.IVA + vetrina strutture"
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS vat_number TEXT NOT NULL DEFAULT '';

-- Richieste dalle strutture sanitarie (misura della domanda B2B)
CREATE TABLE IF NOT EXISTS structure_leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
