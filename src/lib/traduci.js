// Traduzione automatica dei contenuti "vivi" (bio, recensioni, articoli) con cache su DB.
// Motore: DeepL (ottimo IT<->EN). Senza la chiave DEEPL_API_KEY restituisce il testo
// originale: il sito NON si rompe, e appena la chiave è presente le traduzioni partono da sole.
import crypto from "node:crypto";

// db importato in modo "pigro": così caricare questo modulo (es. dal middleware in
// fase di build) NON richiede la connessione al database, che serve solo a runtime.
async function getSql() {
  const { sql } = await import("./db.js");
  return sql;
}

const KEY = process.env.DEEPL_API_KEY || "";
// le chiavi del piano gratuito finiscono con ":fx" e usano un endpoint diverso
const ENDPOINT = KEY.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

const hash = (t) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 32);

/**
 * Traduce un testo italiano nella lingua richiesta ("en"), con cache.
 * lang "it" o testo vuoto -> ritorna il testo così com'è.
 */
export async function traduci(testo, lang) {
  if (!testo || lang === "it") return testo;
  const h = hash(testo);
  const sql = await getSql();
  try {
    const [c] = await sql`SELECT text FROM translations WHERE source_hash = ${h} AND lang = ${lang}`;
    if (c) return c.text;
  } catch { return testo; } // se il DB non risponde, meglio l'italiano che una pagina rotta
  if (!KEY) return testo; // nessun motore configurato: graceful
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: testo, source_lang: "IT", target_lang: lang.toUpperCase(), tag_handling: "html" }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return testo;
    const d = await r.json();
    const tradotto = d.translations?.[0]?.text || testo;
    await sql`
      INSERT INTO translations (source_hash, lang, text) VALUES (${h}, ${lang}, ${tradotto})
      ON CONFLICT (source_hash, lang) DO UPDATE SET text = EXCLUDED.text`;
    return tradotto;
  } catch { return testo; }
}

// Traduce una lista di testi in parallelo (bio/recensioni di una pagina).
export async function traduciTutti(testi, lang) {
  if (lang === "it") return testi;
  return Promise.all(testi.map((x) => traduci(x, lang)));
}

// Traduce automaticamente il CORPO della pagina (solo <main>...</main>): header e
// footer sono già tradotti a mano dai dizionari, qui si copre tutto il resto senza
// keyare file uno per uno. Con cache: ogni contenuto si traduce una volta sola.
// Senza chiave DeepL o se il <main> è enorme, restituisce l'HTML originale (graceful).
export async function traduciHtmlMain(fullHtml, lang) {
  if (lang === "it" || !KEY) return fullHtml;
  const m = fullHtml.match(/(<main[^>]*>)([\s\S]*?)(<\/main>)/i);
  if (!m) return fullHtml;
  const inner = m[2];
  if (inner.length > 90000) return fullHtml; // oltre il limite pratico di DeepL: lascio l'italiano
  const tradotto = await traduci(inner, lang);
  if (tradotto === inner) return fullHtml;
  return fullHtml.slice(0, m.index) + m[1] + tradotto + m[3] + fullHtml.slice(m.index + m[0].length);
}
