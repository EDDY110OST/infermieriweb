// Traduzione automatica dei contenuti "vivi" (bio, recensioni, articoli) con cache su DB.
// Motore: DeepL (ottimo IT<->EN). Senza la chiave DEEPL_API_KEY restituisce il testo
// originale: il sito NON si rompe, e appena la chiave è presente le traduzioni partono da sole.
import crypto from "node:crypto";
import { sql } from "./db.js";

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
