-- Schema REALE del database InfermieriWeb (Postgres / Neon, Francoforte).
-- Rigenerato automaticamente dallo stato di produzione il 2026-07-19 (introspezione diretta di Neon, validata ricreando lo schema da zero).
-- Fonte di verità dello schema: questo file rispecchia le migrazioni + gli
-- aggiustamenti applicati a mano su Neon. Le prenotazioni NON contengono dati
-- clinici (GDPR art. 9): solo nome, contatti e indirizzo di visita.

CREATE TABLE IF NOT EXISTS applications (
  id SERIAL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT ''::text,
  profession text NOT NULL DEFAULT 'infermiere'::text,
  albo_number text NOT NULL DEFAULT ''::text,
  city text NOT NULL DEFAULT ''::text,
  province text NOT NULL DEFAULT ''::text,
  message text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  albo_name text NOT NULL DEFAULT ''::text,
  albo_date text NOT NULL DEFAULT ''::text,
  vat_number text NOT NULL DEFAULT ''::text,
  address text NOT NULL DEFAULT ''::text,
  pass_hash text NOT NULL DEFAULT ''::text,
  gender text NOT NULL DEFAULT ''::text,
  CONSTRAINT applications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL,
  slug text NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT ''::text,
  excerpt text NOT NULL DEFAULT ''::text,
  image text NOT NULL DEFAULT ''::text,
  reading_time text NOT NULL DEFAULT ''::text,
  body_raw text NOT NULL DEFAULT ''::text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text,
  published_at date,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  featured boolean NOT NULL DEFAULT false,
  cover_data text NOT NULL DEFAULT ''::text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL,
  professional_id integer NOT NULL,
  start_dt timestamp with time zone NOT NULL,
  end_dt timestamp with time zone NOT NULL,
  reason text NOT NULL DEFAULT ''::text,
  CONSTRAINT blocks_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_blocks_prof ON blocks USING btree (professional_id, start_dt);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL,
  professional_id integer NOT NULL,
  service_id integer NOT NULL,
  start_dt timestamp with time zone NOT NULL,
  end_dt timestamp with time zone NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL DEFAULT ''::text,
  address text NOT NULL DEFAULT ''::text,
  city text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'active'::text,
  source text NOT NULL DEFAULT 'online'::text,
  cancel_token text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reminded_at timestamp with time zone,
  CONSTRAINT bookings_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_bookings_prof_start ON bookings USING btree (professional_id, start_dt);

CREATE TABLE IF NOT EXISTS coverage_areas (
  id SERIAL,
  professional_id integer NOT NULL,
  city text NOT NULL,
  province text NOT NULL DEFAULT ''::text,
  region text NOT NULL DEFAULT ''::text,
  CONSTRAINT coverage_areas_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ux_coverage_prof_city ON coverage_areas USING btree (professional_id, lower(city));
CREATE INDEX ix_coverage_city ON coverage_areas USING btree (city);
CREATE INDEX ix_coverage_prof ON coverage_areas USING btree (professional_id);

CREATE TABLE IF NOT EXISTS day_overrides (
  professional_id integer NOT NULL,
  day date NOT NULL,
  fasce jsonb NOT NULL DEFAULT jsonb_build_array(),
  CONSTRAINT day_overrides_pkey PRIMARY KEY (professional_id, day)
);

CREATE TABLE IF NOT EXISTS opening_hours (
  id SERIAL,
  professional_id integer NOT NULL,
  weekday smallint NOT NULL,
  start_min smallint NOT NULL,
  end_min smallint NOT NULL,
  CONSTRAINT opening_hours_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_hours_prof ON opening_hours USING btree (professional_id, weekday);

CREATE TABLE IF NOT EXISTS professional_users (
  id SERIAL,
  professional_id integer NOT NULL,
  email text NOT NULL,
  pass_hash text NOT NULL,
  remember_token text NOT NULL DEFAULT ''::text,
  name text NOT NULL DEFAULT ''::text,
  role text NOT NULL DEFAULT 'professional'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  totp_secret text NOT NULL DEFAULT ''::text,
  totp_enabled boolean NOT NULL DEFAULT false,
  totp_pending text NOT NULL DEFAULT ''::text,
  CONSTRAINT professional_users_pkey PRIMARY KEY (id),
  CONSTRAINT professional_users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS professionals (
  id SERIAL,
  slug text NOT NULL,
  name text NOT NULL,
  profession text NOT NULL DEFAULT 'infermiere'::text,
  albo_number text NOT NULL DEFAULT ''::text,
  bio text NOT NULL DEFAULT ''::text,
  photo_url text NOT NULL DEFAULT ''::text,
  region text NOT NULL DEFAULT ''::text,
  province text NOT NULL DEFAULT ''::text,
  city text NOT NULL DEFAULT ''::text,
  phone text NOT NULL DEFAULT ''::text,
  email text NOT NULL DEFAULT ''::text,
  lat double precision,
  lng double precision,
  cancel_hours smallint NOT NULL DEFAULT 4,
  lead_minutes smallint NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending'::text,
  google_rating text NOT NULL DEFAULT ''::text,
  google_reviews_url text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  albo_name text NOT NULL DEFAULT ''::text,
  albo_date text NOT NULL DEFAULT ''::text,
  vat_number text NOT NULL DEFAULT ''::text,
  address text NOT NULL DEFAULT ''::text,
  photo_data text NOT NULL DEFAULT ''::text,
  gender text NOT NULL DEFAULT ''::text,
  full_name text NOT NULL DEFAULT ''::text,
  verified_piva_at timestamp with time zone,
  verified_albo_at timestamp with time zone,
  verified_by text NOT NULL DEFAULT ''::text,
  edited_by text NOT NULL DEFAULT ''::text,
  edited_at timestamp with time zone,
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS profile_views (
  professional_id integer NOT NULL,
  day date NOT NULL,
  views integer NOT NULL DEFAULT 0,
  CONSTRAINT profile_views_pkey PRIMARY KEY (professional_id, day)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL,
  professional_id integer NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);
CREATE INDEX ix_push_prof ON push_subscriptions USING btree (professional_id);

CREATE TABLE IF NOT EXISTS rate_events (
  key text NOT NULL,
  ts timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX ix_rate_events ON rate_events USING btree (key, ts);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL,
  professional_id integer NOT NULL,
  booking_id integer,
  rating smallint NOT NULL,
  text text NOT NULL DEFAULT ''::text,
  author_name text NOT NULL DEFAULT ''::text,
  review_token text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_reviews_prof ON reviews USING btree (professional_id, status);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL,
  professional_id integer NOT NULL,
  name text NOT NULL,
  duration_min smallint NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort smallint NOT NULL DEFAULT 0,
  catalog_key text NOT NULL DEFAULT ''::text,
  price_notte_cents integer,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_services_prof ON services USING btree (professional_id);

CREATE TABLE IF NOT EXISTS structure_leads (
  id SERIAL,
  name text NOT NULL,
  type text NOT NULL DEFAULT ''::text,
  city text NOT NULL DEFAULT ''::text,
  email text NOT NULL,
  phone text NOT NULL DEFAULT ''::text,
  message text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT structure_leads_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL,
  email text NOT NULL,
  zona text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_waitlist_zona ON waitlist USING btree (zona);

-- Richieste di informazioni dal form pubblico "Richiedi informazioni"
-- (paziente o professionista). Nessun dato clinico: solo contatti e messaggio.
CREATE TABLE IF NOT EXISTS info_requests (
  id SERIAL,
  reason text NOT NULL DEFAULT ''::text,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT ''::text,
  city text NOT NULL DEFAULT ''::text,
  message text NOT NULL DEFAULT ''::text,
  newsletter boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT info_requests_pkey PRIMARY KEY (id)
);

-- Iscritti che hanno spuntato "Desidero ricevere comunicazioni": consenso
-- registrato con data (GDPR). Email univoca: un consenso aggiorna la data.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL,
  email text NOT NULL,
  source text NOT NULL DEFAULT ''::text,
  consent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

-- DIARIO INFERMIERISTICO — dati sanitari del paziente (GDPR art. 9, categoria
-- particolare). I contenuti clinici sono CIFRATI a riposo (AES-256-GCM):
-- data_enc = blob cifrato, iv + tag = vettore e tag di autenticazione. Il DB
-- non vede mai i dati in chiaro. Accesso ristretto al SOLO professionista
-- titolare (professional_id dalla sessione, mai override admin). Il consenso
-- del paziente è obbligatorio (consent + consent_at) prima di salvare.
CREATE TABLE IF NOT EXISTS patient_records (
  id SERIAL,
  professional_id integer NOT NULL,
  data_enc text NOT NULL,
  iv text NOT NULL,
  tag text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  consent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_records_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_patient_records_prof ON patient_records USING btree (professional_id);

-- Registro accessi al diario (audit trail: chi ha fatto cosa e quando).
CREATE TABLE IF NOT EXISTS diario_audit (
  id SERIAL,
  professional_id integer NOT NULL,
  record_id integer,
  action text NOT NULL DEFAULT ''::text,
  at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT diario_audit_pkey PRIMARY KEY (id)
);
CREATE INDEX ix_diario_audit_prof ON diario_audit USING btree (professional_id, at);

-- Chiavi esterne (in fondo per non dipendere dall'ordine delle tabelle)
ALTER TABLE blocks ADD CONSTRAINT blocks_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id);
ALTER TABLE bookings ADD CONSTRAINT bookings_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE coverage_areas ADD CONSTRAINT coverage_areas_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE day_overrides ADD CONSTRAINT day_overrides_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE opening_hours ADD CONSTRAINT opening_hours_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE professional_users ADD CONSTRAINT professional_users_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE profile_views ADD CONSTRAINT profile_views_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE reviews ADD CONSTRAINT reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE services ADD CONSTRAINT services_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
ALTER TABLE patient_records ADD CONSTRAINT patient_records_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE;
