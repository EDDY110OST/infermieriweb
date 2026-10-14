export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/condizioni — il professionista loggato accetta le Condizioni d'uso e
// dichiara l'assicurazione RC (14/10/26). Solo per sé: un admin non accetta per altri.
// La prima data resta: rimandarla non la sposta.
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  if (!body.condizioni) return json({ error: "Per continuare devi accettare le Condizioni d'uso" }, 400);
  if (!body.rc) return json({ error: "Serve la dichiarazione sull'assicurazione professionale" }, 400);

  const [p] = await sql`
    UPDATE professionals
    SET condizioni_accettate_at = COALESCE(condizioni_accettate_at, now()),
        rc_dichiarata_at = COALESCE(rc_dichiarata_at, now())
    WHERE id = ${session.pid}
    RETURNING condizioni_accettate_at`;
  if (!p) return json({ error: "Profilo non trovato" }, 404);
  return json({ ok: true, condizioni_accettate_at: p.condizioni_accettate_at });
}
