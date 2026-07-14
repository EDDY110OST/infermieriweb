-- Piattaforma InfermieriWeb: schema motore prenotazioni multi-professione.
-- Porta la logica collaudata del motore Prenotazioni Sbarba, generalizzata
-- (professionals con campo profession) per l'ampliamento futuro a medici,
-- fisioterapisti ecc. Le prenotazioni NON contengono dati clinici (GDPR art. 9).

DROP TABLE IF EXISTS planets;

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  profession TEXT NOT NULL DEFAULT 'infermiere',
  albo_number TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  cancel_hours SMALLINT NOT NULL DEFAULT 4,
  lead_minutes SMALLINT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|active|suspended
  google_rating TEXT NOT NULL DEFAULT '',
  google_reviews_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS professional_users (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  remember_token TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'professional', -- professional|admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_min SMALLINT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_services_prof ON services (professional_id);

-- Comuni serviti a domicilio
CREATE TABLE IF NOT EXISTS coverage_areas (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_coverage_city ON coverage_areas (city);
CREATE INDEX IF NOT EXISTS ix_coverage_prof ON coverage_areas (professional_id);

CREATE TABLE IF NOT EXISTS opening_hours (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL, -- 0=lunedì ... 6=domenica
  start_min SMALLINT NOT NULL,
  end_min SMALLINT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_hours_prof ON opening_hours (professional_id, weekday);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_dt TIMESTAMPTZ NOT NULL,
  end_dt TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_blocks_prof ON blocks (professional_id, start_dt);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id INT NOT NULL REFERENCES services(id),
  start_dt TIMESTAMPTZ NOT NULL,
  end_dt TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active', -- active|cancelled|noshow|done
  source TEXT NOT NULL DEFAULT 'online', -- online|manual
  cancel_token TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_bookings_prof_start ON bookings (professional_id, start_dt);

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  profession TEXT NOT NULL DEFAULT 'infermiere',
  albo_number TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new', -- new|approved|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recensioni verificate: solo dal link inviato dopo una prenotazione
-- completata; pubblicazione dopo moderazione.
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  booking_id INT REFERENCES bookings(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  review_token TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', -- pending|published|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_reviews_prof ON reviews (professional_id, status);
