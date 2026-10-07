export const prerender = false;

import { datiSuggerimenti } from "../../lib/suggerimenti-server.js";

// GET /api/suggerimenti — comuni coperti (con sigla e numero di infermieri) e
// prestazioni offerte, per la tendina dei campi di ricerca. Pochi KB.
// Cache di 10 minuti: cambia solo quando entrano zone o prestazioni nuove.
export async function GET() {
  const indice = await datiSuggerimenti();
  return new Response(JSON.stringify(indice), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
  });
}
