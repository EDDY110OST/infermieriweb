// Listino prestazioni: la fonte di verità è la tabella `catalog_services` su Neon,
// che Bruno ed Eduard gestiscono dal pannello admin (prima era scritto nel codice).
// Una voce con professional_id NULL vale per tutti; una con professional_id
// valorizzato è "su misura": la vede e la può usare SOLO quel professionista.
// La convenzione delle chiavi resta quella storica: le consulenze per i colleghi
// iniziano per "consulenza-" — su quel prefisso si regge il resto del sito
// (ricerca pazienti, pagine geografiche, sitemap), quindi le chiavi nuove le
// generiamo noi da nome + categoria e non si toccano più.
import { sql } from "./db.js";
import { eConsulenza } from "../data/listino.js";

export { eConsulenza };

// Tutte le voci che un professionista può scegliere: le globali attive + le sue
// su misura. Ordinate come le vede in pannello.
export async function listinoPerProfessionista(pid) {
  return sql`
    SELECT id, key, nome, categoria, min_cents, sugg_cents, durata_min, icona, sort,
           (professional_id IS NOT NULL) AS su_misura
    FROM catalog_services
    WHERE active AND (professional_id IS NULL OR professional_id = ${pid || 0})
    ORDER BY categoria, sort, nome`;
}

// La voce che autorizza una prestazione: globale attiva, oppure su misura per
// QUESTO professionista. Chi non ha diritto alla voce non può inserirla.
export async function voceDiListino(key, pid) {
  const [voce] = await sql`
    SELECT id, key, nome, categoria, min_cents, sugg_cents, durata_min, icona,
           (professional_id IS NOT NULL) AS su_misura
    FROM catalog_services
    WHERE key = ${String(key || "")} AND active
      AND (professional_id IS NULL OR professional_id = ${pid || 0})
    ORDER BY professional_id NULLS LAST LIMIT 1`;
  return voce || null;
}

// Chiave tecnica a partire dal nome scelto dall'admin. Le consulenze tengono il
// prefisso "consulenza-" perché è il segnale che le distingue in tutto il sito.
export function chiaveDaNome(nome, categoria, suffisso = "") {
  const base = String(nome || "")
    .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "prestazione";
  const conPrefisso = categoria === "consulenza" && !base.startsWith("consulenza-")
    ? `consulenza-${base}`.slice(0, 60)
    : base;
  return suffisso ? `${conPrefisso}-${suffisso}`.slice(0, 60) : conPrefisso;
}

// Chiave libera (non già usata da una voce globale o dello stesso professionista)
export async function chiaveLibera(nome, categoria, pid = null) {
  const base = chiaveDaNome(nome, categoria);
  for (let n = 0; n < 50; n++) {
    const key = n === 0 ? base : chiaveDaNome(nome, categoria, String(n + 1));
    const [occupata] = await sql`
      SELECT id FROM catalog_services
      WHERE key = ${key} AND (professional_id IS NULL OR professional_id = ${pid || 0})`;
    if (!occupata) return key;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 60);
}
