export const prerender = false;

import { sql } from "../lib/db.js";
import { SITE_URL } from "../data/schema.js";
import { servicesData } from "../data/services.js";

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['\s]+/g, "-").replace(/[^a-z0-9-]/g, "");

// Sitemap delle pagine che nascono dal database (schede professionisti +
// pagine geografiche): quelle fisse stanno in sitemap-index.xml (build).
export async function GET() {
  const professionisti = await sql`
    SELECT slug, created_at FROM professionals WHERE status = 'active'`;

  const zone = await sql`
    SELECT DISTINCT z.region, z.province, z.city
    FROM (
      SELECT region, province, city, professional_id FROM coverage_areas
      UNION
      SELECT region, province, city, id FROM professionals WHERE status = 'active'
    ) z
    JOIN professionals p ON p.id = z.professional_id AND p.status = 'active'
    WHERE z.region <> '' AND z.city <> ''`;

  const articoli = await sql`
    SELECT slug FROM articles WHERE status = 'published'`;

  const urls = [];
  for (const p of professionisti) {
    urls.push({ loc: `${SITE_URL}/p/${p.slug}`, priority: "0.9" });
  }
  for (const a of articoli) {
    urls.push({ loc: `${SITE_URL}/articoli/${a.slug}`, priority: "0.7" });
  }
  for (const serviceId of Object.keys(servicesData)) {
    urls.push({ loc: `${SITE_URL}/servizio/${serviceId}`, priority: "0.8" });
  }

  // Conto i figli di ogni livello: una regione/provincia con UN solo figlio
  // fa 301 verso il figlio (vedi [...area].astro), quindi NON va messa in sitemap
  // (altrimenti Google segnala redirect e spreca crawl budget).
  const provPerRegione = {}, cittaPerProv = {}, citta = new Set();
  for (const z of zone) {
    const r = slugify(z.region), p = `${r}/${slugify(z.province)}`;
    (provPerRegione[r] ||= new Set()).add(p);
    (cittaPerProv[p] ||= new Set()).add(`${p}/${slugify(z.city)}`);
    citta.add(`${p}/${slugify(z.city)}`);
  }
  for (const [r, prov] of Object.entries(provPerRegione)) {
    if (prov.size > 1) urls.push({ loc: `${SITE_URL}/professionisti/${r}`, priority: "0.6" });
  }
  for (const [p, cit] of Object.entries(cittaPerProv)) {
    if (cit.size > 1) urls.push({ loc: `${SITE_URL}/professionisti/${p}`, priority: "0.6" });
  }
  for (const c of citta) urls.push({ loc: `${SITE_URL}/professionisti/${c}`, priority: "0.8" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
