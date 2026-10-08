export const prerender = false;

import { sessionFromRequest, pidBersaglio } from "../../../lib/auth.js";
import { prenotabilitaDi, GIORNI_FINESTRA } from "../../../lib/prenotabilita.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/prenotabilita — «nei prossimi 30 giorni qualcuno può prenotarmi?» e, se no,
// perché (blocchi, giorni chiusi, orari mancanti, prestazioni mancanti). Stesso calcolo
// del sito pubblico (lib/prenotabilita.js). Alimenta l'avviso in cima al pannello.
// Un admin può passare ?pid= per vedere la situazione di un altro professionista.
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  const esito = await prenotabilitaDi(pid, { giorni: GIORNI_FINESTRA });
  return json(esito);
}
