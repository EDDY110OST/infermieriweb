// Articoli con formattazione (7/10/26): l'editor visuale (TipTap, pannello admin) manda
// HTML; QUI, lato server, passa dalla lista bianca prima di essere salvato. Tutto quello
// che non è in lista sparisce (script, iframe, immagini, stili inline, on*, data:).
// I colori non sono stili ma classi di una tavolozza chiusa (col-navy, col-verde…).
import sanitizeHtml from "sanitize-html";
import { parseBody, slugifyTitolo } from "./blog.js";

// Tavolozza del marchio: le uniche classi colore ammesse (CSS in App.css e platform.css)
export const TONI = [
  { key: "navy", nome: "Blu", hex: "#0b3954" },
  { key: "verde", nome: "Verde", hex: "#00897b" },
  { key: "rosso", nome: "Rosso", hex: "#b91c1c" },
  { key: "ambra", nome: "Ambra", hex: "#b45309" },
  { key: "grigio", nome: "Grigio", hex: "#5c7280" },
];

export function sanificaHtml(html) {
  let pulito = sanitizeHtml(String(html || ""), {
    allowedTags: ["p", "h2", "h3", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "a", "br", "blockquote", "span"],
    allowedAttributes: { a: ["href", "rel", "target"], span: ["class"] },
    allowedClasses: { span: TONI.map((t) => `col-${t.key}`) },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https", "mailto"] },
    allowProtocolRelative: false,
    transformTags: {
      b: "strong",
      i: "em",
      a: (tagName, attribs) => ({ tagName: "a", attribs: { href: attribs.href || "", rel: "noopener noreferrer", target: "_blank" } }),
    },
    // un link senza href valido diventa testo semplice
    exclusiveFilter: (frame) => frame.tag === "a" && !frame.attribs.href,
  });
  // uno <span> rimasto senza colore (es. incollato da Word) si toglie ma il testo resta
  let prima;
  do { prima = pulito; pulito = pulito.replace(/<span>([\s\S]*?)<\/span>/g, "$1"); } while (pulito !== prima);
  return pulito.replace(/<p>\s*<\/p>/g, "").trim();
}

const decodifica = (s) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export const testoNudo = (html) => decodifica(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// Dall'HTML alle sezioni (stesso jsonb di sempre: indice laterale, correlati, SEO).
// Ogni <h2> apre una sezione; quello che precede il primo <h2> prende il titolo dell'articolo.
export function sezioniDaHtml(html, titoloArticolo) {
  const sezioni = [];
  const pezzi = String(html || "").split(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const apri = (titolo, contenuto) => {
    const corpo = String(contenuto || "").trim();
    if (!corpo && sezioni.length) return;
    let id = slugifyTitolo(testoNudo(titolo)) || `sezione-${sezioni.length + 1}`;
    if (sezioni.some((s) => s.id === id)) id += `-${sezioni.length + 1}`;
    sezioni.push({ id, title: testoNudo(titolo), html: corpo });
  };
  if (pezzi[0] && pezzi[0].trim()) apri(titoloArticolo, pezzi[0]);
  for (let i = 1; i < pezzi.length; i += 2) apri(pezzi[i], pezzi[i + 1]);
  if (!sezioni.length) apri(titoloArticolo, html);
  return sezioni;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const URL_RE = /(https?:\/\/[^\s)]+)/g;
const linkify = (testo) => esc(testo).replace(URL_RE, (u) => `<a href="${u}">${u.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>`);

// Conversione di un articolo «raw» (## Titolo, - elenco, > nota) in HTML per l'editor
// visuale. I marcatori [!sintesi] [!fonti] [!documento] non hanno un equivalente in
// fase 1: vengono tolti e il contenuto resta come testo normale (l'articolo si può
// comunque lasciare «raw»).
export function rawToHtml(bodyRaw, titoloArticolo) {
  const out = [];
  for (const sez of parseBody(bodyRaw, titoloArticolo)) {
    if (sez.title && sez.title !== titoloArticolo) out.push(`<h2>${esc(sez.title)}</h2>`);
    let lista = null;
    const chiudi = () => { if (lista) { out.push(`<ul>${lista.join("")}</ul>`); lista = null; } };
    for (const blocco of sez.content) {
      const righe = String(blocco).replace(/^\[!\w+\]\s*/, "").split("\n");
      for (const riga of righe) {
        const t = riga.trim();
        if (!t) continue;
        if (t.startsWith("- ")) { (lista ||= []).push(`<li>${linkify(t.slice(2))}</li>`); continue; }
        chiudi();
        if (t.startsWith("> ")) out.push(`<blockquote><p>${linkify(t.slice(2))}</p></blockquote>`);
        else out.push(`<p>${linkify(t)}</p>`);
      }
      chiudi();
    }
  }
  return sanificaHtml(out.join("\n"));
}
