export const prerender = false;

import { sql } from "../../lib/db.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/lista-attesa {email, zona} — zona non ancora coperta
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const email = String(body.email || "").trim().toLowerCase();
  const zona = String(body.zona || "").trim().slice(0, 80);
  if (!email.includes("@") || email.length < 6) return json({ error: "Inserisci una email valida" }, 400);

  if (!(await consenti(`waitlist:${ipDa(request)}`, 5, 60))) {
    return json({ error: "Troppe richieste: riprova più tardi" }, 429);
  }

  const gia = await sql`
    SELECT id FROM waitlist WHERE email = ${email} AND zona = ${zona}`;
  if (!gia.length) {
    await sql`INSERT INTO waitlist (email, zona) VALUES (${email}, ${zona})`;
  }
  return json({ ok: true });
}
