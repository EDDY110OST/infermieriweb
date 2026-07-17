export const prerender = false;

import { sql } from "../../lib/db.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";
import { sendEmail } from "../../lib/mailer.js";
import { hashPassword } from "../../lib/auth.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Escape SOLO per l'HTML dell'email (mai per le query: sono già parametrizzate)
const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// POST /api/candidatura — form "Lavora con noi" (approvazione manuale)
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const profession = String(body.profession || "infermiere").trim();
  const alboName = String(body.albo_name || "").trim();
  const alboNumber = String(body.albo_number || "").trim();
  const alboDate = String(body.albo_date || "").trim();
  const vatNumber = String(body.vat_number || "").replace(/\D/g, "");
  const city = String(body.city || "").trim();
  const address = String(body.address || "").trim().slice(0, 200);
  const province = String(body.province || "").trim();
  const message = String(body.message || "").trim().slice(0, 2000);
  const password = String(body.password || "");

  if (name.length < 2 || !email.includes("@") || phone.length < 6 || city.length < 2) {
    return json({ error: "Compila nome, email, telefono e città" }, 400);
  }
  if (alboName.length < 3 || !alboNumber || !alboDate) {
    return json({ error: "Servono albo di appartenenza, numero e data di iscrizione" }, 400);
  }
  if (vatNumber && vatNumber.length !== 11) {
    return json({ error: "La partita IVA, se indicata, deve avere 11 cifre" }, 400);
  }
  if (password.length < 8) return json({ error: "Scegli una password di almeno 8 caratteri" }, 400);
  if (!body.privacy) return json({ error: "Serve il consenso al trattamento dei dati" }, 400);

  if (!(await consenti(`candidatura:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste ravvicinate: riprova più tardi" }, 429);
  }

  const recente = await sql`
    SELECT id FROM applications WHERE email = ${email} AND created_at > now() - interval '1 day'`;
  if (recente.length) return json({ error: "Candidatura già ricevuta: ti ricontatteremo a breve." }, 429);

  await sql`
    INSERT INTO applications (name, email, phone, profession, albo_name, albo_number, albo_date, vat_number, city, province, address, message, pass_hash)
    VALUES (${name}, ${email}, ${phone}, ${profession}, ${alboName}, ${alboNumber}, ${alboDate}, ${vatNumber}, ${city}, ${province}, ${address}, ${message}, ${hashPassword(password)})`;

  // Avviso immediato agli admin: una candidatura che aspetta giorni è un
  // professionista perso. L'invio non deve mai bloccare la risposta al candidato.
  try {
    await sendEmail({
      to: "infermieri.ef@gmail.com",
      subject: `Nuova candidatura: ${esc(name)} (${esc(profession)}, ${esc(city)})`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Nuova candidatura da verificare 🩺</h2>
        <table style="width: 100%; font-size: 15px;">
          <tr><td style="padding: 4px 0; color: #7b909b;">Nome</td><td style="font-weight: bold;">${esc(name)}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Professione</td><td>${esc(profession)}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Zona</td><td>${esc(city)}${province ? " (" + province + ")" : ""}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Albo</td><td>${esc(alboName)} n. ${esc(alboNumber)} (dal ${esc(alboDate)})</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">P.IVA</td><td>${vatNumber ? esc(vatNumber) : "<strong>assente</strong> — profilo per la vetrina strutture (non prenotabile dai pazienti)"}</td></tr>
          <tr><td style="padding: 4px 0; color: #7b909b;">Contatti</td><td>${esc(email)} · ${esc(phone)}</td></tr>
        </table>
        ${message ? `<p style="background: #f6f9f9; padding: 12px 14px; border-radius: 10px;">${esc(message)}</p>` : ""}
        <p style="margin: 20px 0;">
          <a href="https://infermieriweb.it/admin" style="background: #00897b; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: bold;">Verifica e approva in admin</a>
        </p>
        <p style="color: #7b909b; font-size: 13px;">Prima di approvare: controlla l'iscrizione all'albo sul portale FNOPI e la P.IVA.</p>
      </div>`,
    });
  } catch { /* la candidatura è salvata comunque: si vede in /admin */ }

  // Ricevuta al candidato: deve sapere che è andata a buon fine e cosa succede ora
  try {
    await sendEmail({
      to: email, toName: name,
      subject: "Candidatura ricevuta ✅ — ecco cosa succede ora",
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Candidatura ricevuta, ${esc(name)}!</h2>
        <p>Grazie per aver scelto InfermieriWeb. Ecco come funziona da qui in poi:</p>
        <p style="margin: 6px 0;">1️⃣ <strong>Verifichiamo la tua iscrizione all'albo</strong> (${esc(alboName)} n. ${esc(alboNumber)}): è la verifica che facciamo per ogni professionista della rete, ed è ciò che dà valore anche alla tua scheda.</p>
        <p style="margin: 6px 0;">2️⃣ <strong>Entro pochi giorni ricevi la nostra risposta</strong> a questa email.</p>
        <p style="margin: 6px 0;">3️⃣ Se è tutto in regola, nella stessa email troverai <strong>le credenziali di accesso</strong> ${vatNumber ? "alla tua agenda e i passi per completare la scheda (foto, prestazioni, prezzi, orari e zone coperte)" : "al tuo profilo. Non avendo la P.IVA, il tuo profilo non sarà prenotabile dai pazienti ma entrerà nella <strong>vetrina riservata alle strutture sanitarie</strong> (in preparazione): appena aprirai la P.IVA, attiveremo anche le prenotazioni a domicilio"}.</p>
        <p style="color: #7b909b; font-size: 13px; margin-top: 18px;">Non devi fare nulla nel frattempo. Se hai domande, rispondi pure a questa email.</p>
      </div>`,
    });
  } catch { /* la candidatura è comunque registrata */ }

  return json({ ok: true });
}
