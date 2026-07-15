// Dati strutturati schema.org condivisi tra le pagine.

export const SITE_URL = "https://infermieriweb.it";

export const medicalBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: "Infermieri Web",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.jpeg`,
  image: `${SITE_URL}/logo.jpeg`,
  email: "infermieri.ef@gmail.com",
  medicalSpecialty: "Nursing",
  areaServed: [
    { "@type": "City", name: "Lucca" },
    { "@type": "City", name: "Capannori" },
    { "@type": "City", name: "Porcari" },
    { "@type": "City", name: "Altopascio" },
    { "@type": "City", name: "Montecarlo" },
  ],
  serviceType: [
    "Medicazioni a domicilio",
    "ECG a domicilio",
    "Prelievi a domicilio",
    "Iniezioni a domicilio",
    "Flebo a domicilio",
    "Cateteri vescicali",
    "Gestione stomie",
    "Assistenza infermieristica personalizzata",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lucca",
    addressCountry: "IT",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "07:00",
    closes: "22:00",
  },
  // aggregateRating solo dove le recensioni sono davvero visibili (scheda del
  // professionista), mai nello schema globale: Google penalizza i rating "orfani".
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
