// Dati strutturati schema.org condivisi tra le pagine.
import { senzaTitolo, titoloDi } from "../lib/appellativo.js";

export const SITE_URL = "https://infermieriweb.it";

// Il professionista come persona (9/10/26): nome e cognome per intero, come sulla scheda;
// il titolo «Inf.» va in honorificPrefix. Si parte SEMPRE dal nome pubblico (mai da
// full_name): se per gravi motivi di sicurezza la scheda mostra solo l'iniziale del
// cognome, anche qui esce solo l'iniziale. Stesso @id sulla scheda e negli articoli firmati.
export function personaSchema({ nome, slug, foto, professione = "Infermiere", conId = true }) {
  const n = String(nome || "").trim();
  const titolo = titoloDi(n);
  return {
    "@type": "Person",
    name: senzaTitolo(n),
    ...(titolo && { honorificPrefix: titolo }),
    jobTitle: professione,
    ...(conId && slug && { url: `${SITE_URL}/p/${slug}`, "@id": `${SITE_URL}/p/${slug}#persona` }),
    ...(foto && !foto.startsWith("data:") && { image: new URL(foto, SITE_URL).href }),
  };
}

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
    ? personaSchema({ nome: a.nome, slug: a.slug, foto: a.foto, conId: a.attivo })
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
