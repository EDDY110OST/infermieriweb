import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://infermieriweb.it",
  trailingSlash: "never",
  build: { format: "file" },
  // Statico di default; le pagine/API con `export const prerender = false`
  // girano come funzioni server su Netlify (motore prenotazioni).
  adapter: netlify(),
  integrations: [react(), sitemap({
    // pagine riservate o strumentali: fuori dalla sitemap (sono anche noindex)
    filter: (page) => !["/admin", "/area-professionisti", "/prenotazione", "/recensione"].some((p) => page.includes(p)),
  })],
  vite: {
    resolve: {
      alias: {
        // Le viste usano gli import di react-router-dom: su un sito statico
        // li serve solo come <a> reali, forniti dallo shim.
        "react-router-dom": fileURLToPath(new URL("./src/lib/router-shim.jsx", import.meta.url)),
      },
    },
  },
});
