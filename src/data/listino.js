// Listino ufficiale delle prestazioni (deciso dai soci, 17/7/26).
// Il professionista sceglie da QUESTA lista: min = prezzo minimo invalicabile
// (anti-concorrenza sleale), consigliato = riferimento (sopra è libero).
// Prezzi in euro; durata_default in minuti.
export const LISTINO = [
  { key: "iniezione-im",        nome: "Iniezione intramuscolare",        min: 15,  consigliato: 30,  durata: 20, icona: "siringa" },
  { key: "iniezione-sc",        nome: "Iniezione sottocutanea",          min: 15,  consigliato: 30,  durata: 20, icona: "siringa" },
  { key: "flebo",               nome: "Flebo / terapia infusionale",     min: 30,  consigliato: 60,  durata: 60, icona: "goccia" },
  { key: "prelievo",            nome: "Prelievo del sangue",             min: 25,  consigliato: 40,  durata: 20, icona: "provetta" },
  { key: "terapia-orale",       nome: "Somministrazione terapia orale",  min: 20,  consigliato: 40,  durata: 20, icona: "pillola" },
  { key: "medicazione-semplice",nome: "Medicazione semplice",            min: 25,  consigliato: 40,  durata: 30, icona: "croce" },
  { key: "medicazione-complessa",nome: "Medicazione complessa",          min: 40,  consigliato: 70,  durata: 45, icona: "croce" },
  { key: "sondino-ng",          nome: "Sondino naso-gastrico",           min: 30,  consigliato: 60,  durata: 30, icona: "tubo" },
  { key: "rimozione-punti",     nome: "Rimozione punti di sutura",       min: 25,  consigliato: 40,  durata: 20, icona: "forbici" },
  { key: "posizionamento-catetere", nome: "Posizionamento catetere vescicale", min: 40, consigliato: 60, durata: 30, icona: "tubo" },
  { key: "sostituzione-catetere",   nome: "Sostituzione catetere vescicale",    min: 35, consigliato: 55, durata: 30, icona: "tubo" },
  { key: "gestione-stomia",     nome: "Gestione stomia",                 min: 35,  consigliato: 60,  durata: 30, icona: "croce" },
  { key: "clistere",            nome: "Clistere evacuativo",             min: 35,  consigliato: 60,  durata: 30, icona: "goccia" },
  { key: "ecg",                 nome: "ECG a domicilio",                 min: 40,  consigliato: 70,  durata: 30, icona: "attivita" },
  { key: "holter-pressorio",    nome: "Holter pressorio",                min: 70,  consigliato: 110, durata: 30, icona: "indicatore" },
  { key: "holter-cardiaco",     nome: "Holter cardiaco",                 min: 90,  consigliato: 150, durata: 30, icona: "cuore" },
  { key: "parametri-vitali",    nome: "Controllo parametri vitali",      min: 15,  consigliato: 30,  durata: 20, icona: "termometro" },
  { key: "gestione-peg",        nome: "Gestione PEG",                    min: 30,  consigliato: 60,  durata: 30, icona: "imbuto" },
  { key: "educazione-terapeutica", nome: "Educazione terapeutica",       min: 30,  consigliato: 80,  durata: 45, icona: "laurea" },
  { key: "medicazione-cvc",     nome: "Medicazione CVC",                 min: 30,  consigliato: 60,  durata: 30, icona: "croce" },
  { key: "pianificazione-sanitaria", nome: "Pianificazione sanitaria",   min: 50,  consigliato: 100, durata: 45, icona: "cartella" },
  { key: "assistenza-oraria",   nome: "Assistenza personalizzata (all'ora)", min: 20, consigliato: 40, durata: 60, icona: "cuore" },
  { key: "lavaggio-auricolare", nome: "Lavaggio auricolare",              min: 20,  consigliato: 40,  durata: 20, icona: "goccia" },
];

export const LISTINO_MAP = Object.fromEntries(LISTINO.map((p) => [p.key, p]));

// prezzo minimo (in centesimi) ammesso per una prestazione del listino
export function minCentsPerKey(key) {
  const p = LISTINO_MAP[key];
  return p ? p.min * 100 : 0;
}

// ---- Fascia notturna (decisa dai soci il 17/7/26): 22:00 -> 07:00 ----
export const NOTTE_DA = 22 * 60;   // 22:00 in minuti dalla mezzanotte
export const NOTTE_A = 7 * 60;     // 07:00

// Un orario (minuti dalla mezzanotte) cade nella fascia notturna?
export function eNotte(minutiDaMezzanotte) {
  return minutiDaMezzanotte >= NOTTE_DA || minutiDaMezzanotte < NOTTE_A;
}

// Fascia di appartenenza, per l'agenda del professionista
export function fasciaDi(minutiDaMezzanotte) {
  if (eNotte(minutiDaMezzanotte)) return "notte";
  if (minutiDaMezzanotte < 13 * 60) return "mattina";
  if (minutiDaMezzanotte < 18 * 60) return "pomeriggio";
  return "sera";
}

export const FASCE = {
  mattina:    { nome: "Mattina",    orario: "07:00-13:00", icona: "🌅" },
  pomeriggio: { nome: "Pomeriggio", orario: "13:00-18:00", icona: "☀️" },
  sera:       { nome: "Sera",       orario: "18:00-22:00", icona: "🌆" },
  notte:      { nome: "Notte",      orario: "22:00-07:00", icona: "🌙" },
};
