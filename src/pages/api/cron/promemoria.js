export const prerender = false;

// Endpoint richiamato dal cron (Render Cron Job o servizio esterno).
// Protetto da CRON_SECRET: senza il segreto giusto non fa nulla.
export async function GET({ request, url }) {
  const segreto = process.env.CRON_SECRET || "";
  const dato = url.searchParams.get("key") || (request.headers.get("authorization") || "").replace("Bearer ", "");
  if (!segreto || dato !== segreto) return new Response("no", { status: 401 });
  const esito = await esegui();
  return esito instanceof Response ? esito : new Response("ok");
}

// Promemoria 24 ore prima dell'appuntamento (stile Prenotazioni Sbarba).
// Funzione schedulata: gira ogni ora e avvisa i pazienti con appuntamento
// tra 24 e 25 ore, una sola volta (guardia reminded_at).
import { neon } from "@neondatabase/serverless";

const SITE = "https://infermieriweb.it";
const API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "prenotazioni@infermieriweb.it";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "InfermieriWeb";

const dataEstesa = (iso) =>
  new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });

async function esegui() {
  const sql = neon((process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL));

  // Le prenotazioni mai convalidate scadono da sole (double opt-in, finestra 60')
  try {
    await sql`UPDATE bookings SET status = 'expired' WHERE status = 'pending' AND created_at < now() - interval '60 minutes'`;
  } catch { /* la pulizia riprova alla prossima ora */ }

  if (!API_KEY) {
    console.log("[promemoria] BREVO_API_KEY assente: salto il giro.");
    return new Response("no-key");
  }

  const inScadenza = await sql`
    SELECT b.id, b.start_dt, b.customer_name, b.customer_email, b.cancel_token, b.address, b.city,
           s.name AS service_name, p.name AS professional_name, p.email AS professional_email, p.cancel_hours
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.status = 'active'
      AND b.reminded_at IS NULL
      AND b.customer_email <> ''
      AND b.start_dt >= now() + interval '24 hours'
      AND b.start_dt <  now() + interval '25 hours'`;

  let inviati = 0;
  for (const b of inScadenza) {
    const link = `${SITE}/prenotazione?token=${b.cancel_token}`;
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: b.customer_email, name: b.customer_name }],
        replyTo: { email: b.professional_email },
        subject: `Promemoria: domani ${b.service_name} — ${dataEstesa(b.start_dt)}`,
        htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
  <h2 style="color: #0b3954;">Ci vediamo domani 👋</h2>
  <p>Ciao ${b.customer_name}, ti ricordiamo l'appuntamento:</p>
  <p style="font-size: 16px;"><strong>${b.service_name}</strong> con <strong>${b.professional_name}</strong><br/>
  <strong style="text-transform: capitalize;">${dataEstesa(b.start_dt)}</strong>
  ${b.address ? `<br/>${b.address}${b.city ? ", " + b.city : ""}` : ""}</p>
  <p>Se non puoi più essere presente, disdici (è gratuito fino a ${b.cancel_hours} ore prima):</p>
  <p style="text-align:center; margin: 22px 0;">
    <a href="${link}" style="background:#00897b;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold;">Gestisci o disdici la prenotazione</a>
  </p>
  <p style="color:#7b909b;font-size:13px;">Rispondendo a questa email scrivi direttamente al professionista.
  Per assistenza sulla piattaforma: <a href="mailto:info@infermieriweb.it" style="color:#00897b;">info@infermieriweb.it</a></p>
</div>`,
      }),
    });
    if (r.ok) {
      await sql`UPDATE bookings SET reminded_at = now() WHERE id = ${b.id}`;
      inviati++;
    } else {
      console.error("[promemoria] Brevo errore", r.status, await r.text());
    }
  }
  console.log(`[promemoria] ${inviati}/${inScadenza.length} promemoria inviati.`);
  return new Response(`ok ${inviati}`);
};

