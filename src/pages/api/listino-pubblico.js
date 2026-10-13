export const prerender = false;

import { listinoDomicilioPubblico } from "../../lib/servizi.js";

// GET /api/listino-pubblico — le prestazioni a domicilio del listino (voci globali
// attive), per il passo «Le tue prestazioni» del modulo di candidatura.
// Solo chiave, nome, prezzo minimo, prezzo consigliato, durata e ordine: nessun dato
// personale. Cache breve: il listino cambia di rado, ma una voce nuova deve comparire
// entro pochi minuti.
export async function GET() {
  const voci = await listinoDomicilioPubblico();
  return new Response(JSON.stringify({ voci }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
