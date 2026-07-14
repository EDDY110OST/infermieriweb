// Seed del primo professionista: Eduard (dati reali dal suo sito vetrina).
// Eseguire con: npx netlify dev:exec node scripts/seed.mjs
import { neon } from "@neondatabase/serverless";
import { scryptSync, randomBytes } from "node:crypto";

const sql = neon(process.env.NETLIFY_DATABASE_URL);

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

// prezzo "Da € 50,00" -> 5000
const cents = (s) => Math.round(parseFloat(s.replace(/[^\d,]/g, "").replace(",", ".")) * 100);

const SERVIZI = [
  ["ECG - Elettrocardiogramma", 30, "Da € 50,00"],
  ["Medicazioni", 30, "Da € 30,00"],
  ["Prelievi ematici", 20, "Da € 20,00"],
  ["Iniezioni", 15, "Da € 20,00"],
  ["Flebo - Terapie infusionali", 60, "Da € 35,00"],
  ["Rimozione punti di sutura", 30, "Da € 30,00"],
  ["Cateteri vescicali", 45, "Da € 40,00"],
  ["Holter pressorio", 30, "Da € 80,00"],
  ["Holter cardiaco", 30, "Da € 100,00"],
  ["Sondini naso gastrici", 45, "Da € 60,00"],
  ["Gestione PEG", 45, "Da € 50,00"],
  ["Terapia orale", 20, "Da € 25,00"],
  ["Parametri vitali", 20, "Da € 25,00"],
  ["Clisteri evacuativi", 45, "Da € 40,00"],
  ["Gestione stomie", 45, "Da € 40,00"],
  ["Educazione terapeutica", 60, "Da € 80,00"],
];

const ZONE = ["Lucca", "Capannori", "Porcari", "Altopascio", "Montecarlo"];

const esiste = await sql`SELECT id FROM professionals WHERE slug = 'eduard'`;
if (esiste.length) {
  console.log("Eduard già presente (id", esiste[0].id + "), niente da fare.");
  process.exit(0);
}

const [prof] = await sql`
  INSERT INTO professionals (slug, name, profession, albo_number, bio, photo_url, region, province, city, phone, email, lat, lng, status, google_rating, google_reviews_url)
  VALUES (
    'eduard',
    'Dott. Eduard G.D.',
    'infermiere',
    'Iscritto OPI Lucca',
    'Infermiere libero professionista specializzato in Wound Care. Assistenza infermieristica a domicilio a Lucca e provincia, 7 giorni su 7: medicazioni semplici e complesse, ECG, prelievi, terapie iniettive e infusionali, gestione cateteri e stomie.',
    '/professionisti-foto/eduard.webp',
    'Toscana', 'Lucca', 'Lucca',
    '3313139220', 'infermieri.ef@gmail.com',
    43.8429, 10.5027,
    'active',
    '5,0 su Google · 35 recensioni',
    'https://g.page/r/CblrQcuM1y1GEBM/review'
  ) RETURNING id`;

for (let i = 0; i < SERVIZI.length; i++) {
  const [nome, durata, prezzo] = SERVIZI[i];
  await sql`INSERT INTO services (professional_id, name, duration_min, price_cents, active, sort) VALUES (${prof.id}, ${nome}, ${durata}, ${cents(prezzo)}, true, ${i})`;
}

for (let weekday = 0; weekday < 7; weekday++) {
  await sql`INSERT INTO opening_hours (professional_id, weekday, start_min, end_min) VALUES (${prof.id}, ${weekday}, ${7 * 60}, ${22 * 60})`;
}

for (const city of ZONE) {
  await sql`INSERT INTO coverage_areas (professional_id, city, province, region) VALUES (${prof.id}, ${city}, 'Lucca', 'Toscana')`;
}

const passwordTemporanea = "Eduard-InfWeb-2026!";
await sql`INSERT INTO professional_users (professional_id, email, pass_hash, name) VALUES (${prof.id}, 'infermieri.ef@gmail.com', ${hashPassword(passwordTemporanea)}, 'Eduard')`;

console.log(`Seed completato: professionista id ${prof.id}, ${SERVIZI.length} servizi, orari 7-22 x7gg, ${ZONE.length} zone.`);
console.log(`Password temporanea pannello Eduard: ${passwordTemporanea}`);
