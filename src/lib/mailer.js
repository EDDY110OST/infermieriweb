// Email transazionali via Brevo. Senza BREVO_API_KEY le email non partono
// (viene loggato) ma il flusso non si rompe: l'API risponde emailed=false.

const API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "prenotazioni@infermieriweb.it";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "InfermieriWeb";
const SITE = "https://infermieriweb.it";

export async function sendEmail({ to, toName, subject, html, replyTo }) {
  if (!API_KEY) {
    console.log(`[mailer] BREVO_API_KEY assente: email NON inviata a ${to} ("${subject}")`);
    return false;
  }
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: to, name: toName || undefined }],
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject,
        htmlContent: html,
      }),
    });
    if (!r.ok) console.error("[mailer] Brevo ha risposto", r.status, await r.text());
    return r.ok;
  } catch (err) {
    console.error("[mailer] errore invio:", err.message);
    return false;
  }
}

const layout = (contenuto) => `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
  <div style="background: linear-gradient(120deg, #0b3954, #00897b); border-radius: 14px 14px 0 0; padding: 22px 26px;">
    <span style="color: #fff; font-size: 20px; font-weight: bold;">InfermieriWeb.it</span>
  </div>
  <div style="border: 1px solid #e3ecec; border-top: none; border-radius: 0 0 14px 14px; padding: 26px;">
    ${contenuto}
    <p style="color: #7b909b; font-size: 12px; margin-top: 28px; border-top: 1px solid #e3ecec; padding-top: 14px;">
      InfermieriWeb.it — la piattaforma che mette in contatto pazienti e professionisti sanitari.
      La prenotazione è gratuita: il compenso si regola direttamente con il professionista.
    </p>
  </div>
</div>`;

const dataEstesa = (iso) =>
  new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export function emailConfermaPaziente({ booking, professional, service, cancelToken }) {
  const linkDisdetta = `${SITE}/prenotazione?token=${cancelToken}`;
  return {
    subject: `Prenotazione confermata: ${service.name} — ${dataEstesa(booking.start)}`,
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Prenotazione confermata ✅</h2>
      <p>Ciao ${booking.name},</p>
      <p>la tua prenotazione è stata registrata e il professionista è stato avvisato:</p>
      <table style="width: 100%; font-size: 15px; margin: 14px 0;">
        <tr><td style="padding: 5px 0; color: #7b909b;">Prestazione</td><td style="font-weight: bold;">${service.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Professionista</td><td style="font-weight: bold;">${professional.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Quando</td><td style="font-weight: bold; text-transform: capitalize;">${dataEstesa(booking.start)}</td></tr>
        ${booking.address ? `<tr><td style="padding: 5px 0; color: #7b909b;">Dove</td><td style="font-weight: bold;">${booking.address}${booking.city ? ", " + booking.city : ""}</td></tr>` : ""}
      </table>
      <p>Se non puoi più essere presente, ti chiediamo di disdire (è gratuito):</p>
      <p style="text-align: center; margin: 22px 0;">
        <a href="${linkDisdetta}" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Gestisci o disdici la prenotazione</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">La disdetta online è possibile fino a ${professional.cancel_hours || 4} ore prima dell'appuntamento. Per qualsiasi necessità puoi rispondere a questa email: arriverà direttamente al professionista.</p>
    `),
  };
}

export function emailNotificaProfessionista({ booking, service }) {
  return {
    subject: `Nuova prenotazione: ${service.name} — ${dataEstesa(booking.start)}`,
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Hai una nuova prenotazione 📅</h2>
      <table style="width: 100%; font-size: 15px; margin: 14px 0;">
        <tr><td style="padding: 5px 0; color: #7b909b;">Prestazione</td><td style="font-weight: bold;">${service.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Quando</td><td style="font-weight: bold; text-transform: capitalize;">${dataEstesa(booking.start)}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Paziente</td><td style="font-weight: bold;">${booking.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Telefono</td><td style="font-weight: bold;">${booking.phone}</td></tr>
        ${booking.email ? `<tr><td style="padding: 5px 0; color: #7b909b;">Email</td><td style="font-weight: bold;">${booking.email}</td></tr>` : ""}
        ${booking.address ? `<tr><td style="padding: 5px 0; color: #7b909b;">Indirizzo</td><td style="font-weight: bold;">${booking.address}${booking.city ? ", " + booking.city : ""}</td></tr>` : ""}
      </table>
      <p style="text-align: center; margin: 22px 0;">
        <a href="${SITE}/area-professionisti" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Apri la tua agenda</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">Rispondendo a questa email scrivi direttamente al paziente.</p>
    `),
  };
}

export function emailDisdettaProfessionista({ booking, service }) {
  return {
    subject: `Disdetta: ${service.name} — ${dataEstesa(booking.start)}`,
    html: layout(`
      <h2 style="color: #dc2626; margin-top: 0;">Prenotazione disdetta</h2>
      <p>Il paziente <strong>${booking.name}</strong> ha disdetto:</p>
      <table style="width: 100%; font-size: 15px; margin: 14px 0;">
        <tr><td style="padding: 5px 0; color: #7b909b;">Prestazione</td><td style="font-weight: bold;">${service.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Quando era</td><td style="font-weight: bold; text-transform: capitalize;">${dataEstesa(booking.start)}</td></tr>
      </table>
      <p style="color: #7b909b; font-size: 13px;">Lo slot è tornato automaticamente disponibile online.</p>
    `),
  };
}

export function emailDisdettaPaziente({ booking, professional, service }) {
  return {
    subject: `Il tuo appuntamento è stato annullato: ${service.name} — ${dataEstesa(booking.start)}`,
    html: layout(`
      <h2 style="color: #dc2626; margin-top: 0;">Appuntamento annullato</h2>
      <p>Ciao ${booking.name},</p>
      <p>purtroppo <strong>${professional.name}</strong> ha dovuto annullare l'appuntamento
      di <strong style="text-transform: capitalize;">${dataEstesa(booking.start)}</strong> (${service.name}).</p>
      <p>Puoi prenotare un nuovo orario in ogni momento:</p>
      <p style="text-align: center; margin: 22px 0;">
        <a href="${SITE}/p/${professional.slug}" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Prenota un nuovo orario</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">Rispondendo a questa email scrivi direttamente al professionista.</p>
    `),
  };
}
