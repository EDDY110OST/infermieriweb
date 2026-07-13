-- Schema motore prenotazioni InfermieriWeb (Postgres / Netlify DB)
-- Porta la logica del motore Prenotazioni Sbarba (shops -> nurses) con le
-- aggiunte per gli infermieri: iscrizione OPI, zone di copertura a domicilio,
-- candidature. Le prenotazioni NON contengono dati clinici (GDPR art. 9).

CREATE TABLE IF NOT EXISTS nurses (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  opi_number TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  cancel_hours SMALLINT NOT NULL DEFAULT 4,
  lead_minutes SMALLINT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|active|suspended
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nurse_users (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  remember_token TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min SMALLINT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_services_nurse ON services (nurse_id);

-- Comuni serviti a domicilio: la vera differenza rispetto ai barbieri
CREATE TABLE IF NOT EXISTS coverage_areas (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_coverage_city ON coverage_areas (city);
CREATE INDEX IF NOT EXISTS ix_coverage_nurse ON coverage_areas (nurse_id);

CREATE TABLE IF NOT EXISTS opening_hours (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL, -- 0=lunedì ... 6=domenica
  start_min SMALLINT NOT NULL, -- minuti da mezzanotte
  end_min SMALLINT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_hours_nurse ON opening_hours (nurse_id, weekday);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  start_dt TIMESTAMPTZ NOT NULL,
  end_dt TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_blocks_nurse ON blocks (nurse_id, start_dt);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  nurse_id INT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
  service_id INT NOT NULL REFERENCES services(id),
  start_dt TIMESTAMPTZ NOT NULL,
  end_dt TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '', -- indirizzo della visita a domicilio
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- active|cancelled|noshow|done
  source TEXT NOT NULL DEFAULT 'online', -- online|manual
  cancel_token TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_bookings_nurse_start ON bookings (nurse_id, start_dt);

-- Candidature dal form "Lavora con noi" (approvazione manuale)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  opi_number TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new', -- new|approved|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
