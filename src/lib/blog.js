import { etichettaAlbo } from "./articoli-regole.js";

// Utilità del blog: dal testo dell'editor alle sezioni renderizzate.
// Formato editor (volutamente semplice):
//   ## Titolo di sezione
//   paragrafo... (riga vuota = nuovo paragrafo, "- " = voce di elenco)

export const slugifyTitolo = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 80);

export function parseBody(bodyRaw, titoloArticolo) {
  const sezioni = [];
  let corrente = null;

  const apri = (titolo) => {
    corrente = { id: slugifyTitolo(titolo) || `sezione-${sezioni.length + 1}`, title: titolo, content: [] };
    // id univoci dentro l'articolo
    if (sezioni.some((s) => s.id === corrente.id)) corrente.id += `-${sezioni.length + 1}`;
    sezioni.push(corrente);
  };

  for (const blocco of String(bodyRaw).replace(/\r/g, "").split(/\n\s*\n/)) {
    const testo = blocco.trim();
    if (!testo) continue;
    if (testo.startsWith("## ")) {
      const [prima, ...resto] = testo.split("\n");
      apri(prima.slice(3).trim());
      const coda = resto.join("\n").trim();
      if (coda) corrente.content.push(coda);
    } else {
      if (!corrente) apri(titoloArticolo);
      corrente.content.push(testo);
    }
  }
  return sezioni;
}

export const readingTime = (bodyRaw) =>
  `${Math.max(1, Math.round(String(bodyRaw).split(/\s+/).length / 200))} min`;

const giorno = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
// Giorno di un istante (timestamp) nell'ora italiana
const giornoRoma = (d) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date(d)) : "");

// Autore di un articolo scritto da un infermiere (8/10/26). Serve una SELECT con
//   LEFT JOIN professionals p ON p.id = a.author_professional_id
// e le colonne p.name AS autore_nome, p.slug AS autore_slug, p.photo_url AS autore_foto,
// p.albo_name AS autore_albo, p.albo_number AS autore_numero, p.status AS autore_stato.
// null = articolo della redazione (firmato come sempre). Un autore eliminato non firma mai.
export function autoreArticolo(r) {
  if (!r.author_professional_id || !r.autore_slug || r.autore_stato === "deleted") return null;
  return {
    nome: r.autore_nome,
    slug: r.autore_slug,
    foto: r.autore_foto || "/avatar-infermiere.svg",
    albo: etichettaAlbo(r.autore_albo, r.autore_numero),
    // sospeso: la firma resta, ma senza link (la scheda non è pubblica)
    attivo: r.autore_stato === "active",
  };
}

// Riga di SELECT condivisa: la forma che si aspettano viste, SEO e schema
export const mapArticolo = (r) => ({
  id: r.slug,
  slug: r.slug,
  title: r.title,
  category: r.category,
  excerpt: r.excerpt,
  image: r.image || undefined,
  readingTime: r.reading_time,
  date: giorno(r.published_at),
  sections: r.sections || [],
  featured: !!r.featured,
  fonti: Array.isArray(r.sources) ? r.sources : [],
  rivisto: giornoRoma(r.reviewed_at),
  autore: autoreArticolo(r),
});
