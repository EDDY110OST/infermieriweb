import { cercaComuni } from "../../data/comuni.js";

export const prerender = false;

// Suggerimenti per la tendina dei comuni (iscrizione e scheda "Zone servite").
// Pubblica e in sola lettura: nessun dato sensibile, solo l'elenco ISTAT.
export async function GET({ url }) {
  const q = url.searchParams.get("q") || "";
  const risultati = cercaComuni(q, 8);
  return new Response(JSON.stringify({ comuni: risultati }), {
    headers: {
      "Content-Type": "application/json",
      // l'elenco dei comuni non cambia mai: la cache evita di rifare il lavoro a ogni lettera
      "Cache-Control": "public, max-age=86400",
    },
  });
}
