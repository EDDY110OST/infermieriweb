export const prerender = false;

import { sql } from "../../lib/db.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/newsletter — iscrizione a una lista di comunicazioni (consenso GDPR
// con data). Usato dal box "tienimi aggiornato" (es. reclutamento infermieri).
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const email = String(body.email || "").trim().slice(0, 160);
  const source = String(body.source || "newsletter").trim().slice(0, 60);

  if (!email.includes("@")) return json({ error: "Inserisci un'email valida" }, 400);
  if (!(await consenti(`nl:${ipDa(request)}`, 5, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  await sql`
    INSERT INTO newsletter_subscribers (email, source, consent_at)
    VALUES (${email}, ${source}, now())
    ON CONFLICT (email) DO UPDATE SET consent_at = now()`;

  return json({ ok: true });
}
