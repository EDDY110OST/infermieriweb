export const prerender = false;

import { SITE_URL } from "../data/schema.js";

// Indice unico: la sitemap di build (pagine fisse) + quella dinamica (schede,
// articoli, zone). È QUESTO l'indirizzo da dare a Search Console.
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemap-0.xml</loc></sitemap>
  <sitemap><loc>${SITE_URL}/sitemap-dinamica.xml</loc></sitemap>
</sitemapindex>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
