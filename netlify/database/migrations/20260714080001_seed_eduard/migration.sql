-- Primo professionista della piattaforma: Eduard (dati reali della sua vetrina).
-- Idempotente: non fa nulla se lo slug esiste già.

INSERT INTO professionals (slug, name, profession, albo_number, bio, photo_url, region, province, city, phone, email, lat, lng, status, google_rating, google_reviews_url)
SELECT
  'eduard',
  'Dott. Eduard G.D.',
  'infermiere',
  'Iscritto OPI Lucca',
  'Infermiere libero professionista specializzato in Wound Care. Assistenza infermieristica a domicilio a Lucca e provincia, 7 giorni su 7: medicazioni semplici e complesse, ECG, prelievi, terapie iniettive e infusionali, gestione cateteri e stomie.',
  '/professionisti-foto/eduard.webp',
  'Toscana', 'Lucca', 'Lucca',
  '', 'infermieri.ef@gmail.com',
  43.8429, 10.5027,
  'active',
  '5,0 su Google · 50 recensioni',
  'https://g.page/r/CblrQcuM1y1GEBM/review'
WHERE NOT EXISTS (SELECT 1 FROM professionals WHERE slug = 'eduard');

INSERT INTO services (professional_id, name, duration_min, price_cents, active, sort)
SELECT p.id, s.nome, s.durata, s.prezzo, TRUE, s.ordine
FROM professionals p,
  (VALUES
    ('ECG - Elettrocardiogramma', 30, 5000, 0),
    ('Medicazioni', 30, 3000, 1),
    ('Prelievi ematici', 20, 2000, 2),
    ('Iniezioni', 15, 2000, 3),
    ('Flebo - Terapie infusionali', 60, 3500, 4),
    ('Rimozione punti di sutura', 30, 3000, 5),
    ('Cateteri vescicali', 45, 4000, 6),
    ('Holter pressorio', 30, 8000, 7),
    ('Holter cardiaco', 30, 10000, 8),
    ('Sondini naso gastrici', 45, 6000, 9),
    ('Gestione PEG', 45, 5000, 10),
    ('Terapia orale', 20, 2500, 11),
    ('Parametri vitali', 20, 2500, 12),
    ('Clisteri evacuativi', 45, 4000, 13),
    ('Gestione stomie', 45, 4000, 14),
    ('Educazione terapeutica', 60, 8000, 15)
  ) AS s(nome, durata, prezzo, ordine)
WHERE p.slug = 'eduard'
  AND NOT EXISTS (SELECT 1 FROM services WHERE professional_id = p.id);

INSERT INTO opening_hours (professional_id, weekday, start_min, end_min)
SELECT p.id, g.weekday, 420, 1320
FROM professionals p, generate_series(0, 6) AS g(weekday)
WHERE p.slug = 'eduard'
  AND NOT EXISTS (SELECT 1 FROM opening_hours WHERE professional_id = p.id);

INSERT INTO coverage_areas (professional_id, city, province, region)
SELECT p.id, z.citta, 'Lucca', 'Toscana'
FROM professionals p,
  (VALUES ('Lucca'), ('Capannori'), ('Porcari'), ('Altopascio'), ('Montecarlo')) AS z(citta)
WHERE p.slug = 'eduard'
  AND NOT EXISTS (SELECT 1 FROM coverage_areas WHERE professional_id = p.id);

INSERT INTO professional_users (professional_id, email, pass_hash, name, role)
SELECT p.id, 'infermieri.ef@gmail.com',
  'scrypt$12eb9c88374e164fc6bb4ac2a3344d65$ee0f61c02e3fce5526f90fe6faac1fc74c478dc6cbdfe2696365cc4592a9741a83c62ebaa55769554f1d25bcfafcc1f458505bcd8a8dd25cfc14cd62662eb23d',
  'Eduard', 'admin'
FROM professionals p
WHERE p.slug = 'eduard'
  AND NOT EXISTS (SELECT 1 FROM professional_users WHERE email = 'infermieri.ef@gmail.com');
