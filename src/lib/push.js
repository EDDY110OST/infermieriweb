import webpush from "web-push";
import { sql } from "./db.js";

// Notifiche push al pannello del professionista (modello Prenotazioni Sbarba).
// Se le chiavi VAPID mancano, il flusso non si rompe: si logga e si prosegue.

const PUB = process.env.VAPID_PUBLIC_KEY || "";
const PRIV = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:prenotazioni@infermieriweb.it";

let configured = false;
if (PUB && PRIV) {
  webpush.setVapidDetails(SUBJECT, PUB, PRIV);
  configured = true;
}

export async function pushToProfessional(professionalId, { title, body, url, tag }) {
  if (!configured) {
    console.log("[push] chiavi VAPID assenti: notifica non inviata");
    return 0;
  }
  const subs = await sql`
    SELECT id, endpoint, p256dh, auth FROM push_subscriptions
    WHERE professional_id = ${professionalId}`;

  let inviate = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, url: url || "/area-professionisti", tag }),
        { TTL: 3600 }
      );
      inviate++;
    } catch (err) {
      // 404/410 = sottoscrizione morta (app disinstallata): si pulisce da sola
      if (err.statusCode === 404 || err.statusCode === 410) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${s.id}`;
      } else {
        console.error("[push] errore invio:", err.statusCode || err.message);
      }
    }
  }));
  return inviate;
}
