import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

export default defineConfig({
  site: "https://infermieriweb.it",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [react(), sitemap()],
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
