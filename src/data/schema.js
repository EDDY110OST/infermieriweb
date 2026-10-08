// Dati strutturati schema.org condivisi tra le pagine.

export const SITE_URL = "https://infermieriweb.it";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "InfermieriWeb",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo-512.png`,
  image: `${SITE_URL}/logo.jpeg`,
  email: "info@infermieriweb.it",
  description:
    "Piattaforma che mette in contatto pazienti e infermieri liberi professionisti per prestazioni a domicilio: prenotazione online gratuita, infermieri iscritti all'Albo (OPI), recensioni verificate. InfermieriWeb non fornisce prestazioni sanitarie.",
  areaServed: { "@type": "Country", name: "Italia" },
};

export function articleSchema(article, imageUrl) {
  const url = `${SITE_URL}/articoli/${article.slug}`;
  // Articolo scritto da un infermiere della rete (8/10/26): l'autore è una persona vera,
  // con la sua scheda. Gli articoli della redazione restano firmati come prima.
  const a = article.autore;
  const author = a
    ? {
        "@type": "Person",
        name: a.nome,
        jobTitle: "Infermiere",
        ...(a.attivo && { url: `${SITE_URL}/p/${a.slug}`, "@id": `${SITE_URL}/p/${a.slug}#persona` }),
        ...(a.foto && !a.foto.startsWith("data:") && { image: new URL(a.foto, SITE_URL).href }),
      }
    : { "@type": "Person", name: "InfermieriWeb" };
  const fonti = (article.fonti || []).map((f) => f.url || f.testo).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || "Scopri di più su InfermieriWeb.",
    image: [imageUrl],
    author,
    publisher: {
      "@type": "Organization",
      name: "InfermieriWeb",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-512.png` },
    },
    datePublished: article.date,
    dateModified: article.rivisto && article.rivisto > article.date ? article.rivisto : article.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(fonti.length > 0 && { citation: fonti }),
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
