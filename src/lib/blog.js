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

// Riga di SELECT condivisa: la forma che si aspettano viste, SEO e schema
export const mapArticolo = (r) => ({
  id: r.slug,
  slug: r.slug,
  title: r.title,
  category: r.category,
  excerpt: r.excerpt,
  image: r.image || undefined,
  readingTime: r.reading_time,
  date: r.published_at ? new Date(r.published_at).toISOString().slice(0, 10) : "",
  sections: r.sections || [],
});
