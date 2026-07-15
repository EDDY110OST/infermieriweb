export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/panel/push {subscription} — registra il dispositivo per le notifiche
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return json({ error: "Sottoscrizione incompleta" }, 400);
  }

  await sql`
    INSERT INTO push_subscriptions (professional_id, endpoint, p256dh, auth)
    VALUES (${session.pid}, ${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE
    SET professional_id = ${session.pid}, p256dh = ${sub.keys.p256dh}, auth = ${sub.keys.auth}`;
  return json({ ok: true });
}

// DELETE /api/panel/push {endpoint} — disattiva le notifiche del dispositivo
export async function DELETE({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }
  await sql`
    DELETE FROM push_subscriptions
    WHERE endpoint = ${String(body.endpoint || "")} AND professional_id = ${session.pid}`;
  return json({ ok: true });
}
