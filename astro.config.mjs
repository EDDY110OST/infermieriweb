import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://infermieriweb.it",
  trailingSlash: "never",
  build: { format: "file" },
  // Statico di default; le pagine/API con `export const prerender = false`
  // girano come funzioni server su Netlify (motore prenotazioni).
  adapter: node({ mode: "standalone" }),
  integrations: [react(), sitemap({
    // pagine riservate o strumentali: fuori dalla sitemap (sono anche noindex).
    // Confronto sul percorso esatto: "includes" escludeva per sbaglio /recensioni.
    filter: (page) => {
      const path = new URL(page).pathname.replace(/\/$/, "");
      const esatte = ["/prenotazione", "/recensione", "/cerca", "/le-mie-prenotazioni", "/strutture"];
      const prefissi = ["/admin", "/area-professionisti", "/struttura/"];
      return !esatte.includes(path) && !prefissi.some((p) => path.startsWith(p));
    },
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
