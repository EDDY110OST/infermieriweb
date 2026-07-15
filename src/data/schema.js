// Dati strutturati schema.org condivisi tra le pagine.

export const SITE_URL = "https://infermieriweb.it";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "InfermieriWeb",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.jpeg`,
  image: `${SITE_URL}/logo.jpeg`,
  email: "prenotazioni@infermieriweb.it",
  description:
    "Piattaforma che mette in contatto pazienti e infermieri liberi professionisti per prestazioni a domicilio: prenotazione online gratuita, professionisti verificati, recensioni vere. InfermieriWeb non fornisce prestazioni sanitarie.",
  areaServed: [
    { "@type": "City", name: "Lucca" },
    { "@type": "City", name: "Capannori" },
    { "@type": "City", name: "Porcari" },
    { "@type": "City", name: "Altopascio" },
    { "@type": "City", name: "Montecarlo" },
  ],
};

export function articleSchema(article, imageUrl) {
  const url = `${SITE_URL}/articoli/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt || "Scopri di più su InfermieriWeb.",
    image: [imageUrl],
    author: { "@type": "Person", name: "InfermieriWeb" },
    publisher: {
      "@type": "Organization",
      name: "InfermieriWeb",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpeg` },
    },
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
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
