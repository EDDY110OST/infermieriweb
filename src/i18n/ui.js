// Dizionari dell'interfaccia (testo fisso del sito), IT + EN tradotti a mano.
// I contenuti "vivi" (bio, recensioni, articoli) NON stanno qui: quelli li
// traduce in automatico src/lib/traduci.js.
//
// Uso lato pagina/astro:
//   import { risolviLang, t } from "../i18n/ui.js";
//   const lang = risolviLang(Astro);
//   t(lang, "nav.trova")

export const LINGUE = ["it", "en"];

export const dict = {
  "nav.trova":        { it: "Trova un infermiere",   en: "Find a nurse" },
  "nav.comeFunziona": { it: "Come funziona",         en: "How it works" },
  "nav.prestazioni":  { it: "Prestazioni",           en: "Services" },
  "nav.blog":         { it: "Blog",                  en: "Blog" },
  "nav.area":         { it: "Area professionisti",   en: "Professionals area" },
  "cta.prenota":      { it: "Prenota",               en: "Book now" },
  "cta.richiediInfo": { it: "Richiedi informazioni", en: "Request info" },

  "footer.tagline":   { it: "La rete italiana degli infermieri a domicilio: cresce una città alla volta, con professionisti verificati uno per uno.",
                        en: "The Italian network of home-care nurses: growing one town at a time, with professionals verified one by one." },
  "footer.pazienti":  { it: "Per i pazienti",        en: "For patients" },
  "footer.trovaPro":  { it: "Trova un professionista", en: "Find a professional" },
  "footer.tutteProt": { it: "Tutte le prestazioni",  en: "All services" },
  "footer.zone":      { it: "Zone coperte",          en: "Covered areas" },
  "footer.blogSalute":{ it: "Blog salute",           en: "Health blog" },
  "footer.gestisci":  { it: "Gestisci una prenotazione", en: "Manage a booking" },
  "footer.miePren":   { it: "Le mie prenotazioni",   en: "My bookings" },
  "footer.professionisti": { it: "Per i professionisti", en: "For professionals" },
  "footer.perche":    { it: "Perché iscriverti",     en: "Why join" },
  "footer.unisciti":  { it: "Unisciti alla piattaforma", en: "Join the platform" },
  "footer.areaPro":   { it: "Area professionisti",   en: "Professionals area" },
  "footer.strutture": { it: "Per le strutture sanitarie", en: "For healthcare facilities" },
  "footer.doveSiamo": { it: "Dove siamo",            en: "Where we are" },
  "footer.infermiereA": { it: "Infermiere a",        en: "Nurse in" },
  "footer.tutteZone": { it: "Tutte le zone →",       en: "All areas →" },
  "footer.info":      { it: "Informazioni",          en: "Information" },
  "footer.chiSiamo":  { it: "Chi siamo",             en: "About us" },
  "footer.recensioni":{ it: "Recensioni",            en: "Reviews" },
  "footer.contatti":  { it: "Contatti e assistenza", en: "Contact & support" },
  "footer.privacy":   { it: "Privacy e cookie",      en: "Privacy & cookies" },
  "footer.legal":     { it: "La prenotazione è gratuita per il paziente. Il compenso della prestazione viene regolato direttamente con il professionista. InfermieriWeb non fornisce prestazioni sanitarie: mette in contatto pazienti e professionisti abilitati.",
                        en: "Booking is free for the patient. The fee for the service is settled directly with the professional. InfermieriWeb does not provide healthcare services: it connects patients with licensed professionals." },

  "lang.altra":       { it: "English",               en: "Italiano" },
  "lang.switchTo":    { it: "Switch to English",     en: "Passa all'italiano" },
};

// Traduzione di una chiave dell'interfaccia (fallback: italiano, poi la chiave)
export function t(lang, key) {
  const voce = dict[key];
  if (!voce) return key;
  return voce[lang] || voce.it || key;
}

// Risolve la lingua richiesta: ?lang=en/it la imposta (cookie 1 anno),
// altrimenti si legge il cookie; default italiano.
export function risolviLang(Astro) {
  const param = Astro.url.searchParams.get("lang");
  if (param === "en" || param === "it") {
    Astro.cookies.set("iw_lang", param, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return param;
  }
  const c = Astro.cookies.get("iw_lang")?.value;
  return c === "en" ? "en" : "it";
}
