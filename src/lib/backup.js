import { sql } from "./db.js";
import { sendEmail } from "./mailer.js";

const TABELLE = [
  "professionals", "professional_users", "services", "coverage_areas",
  "opening_hours", "blocks", "bookings", "applications", "reviews",
  "articles", "profile_views", "push_subscriptions",
];

const EMAIL_BACKUP = process.env.BACKUP_EMAIL || "brunoieppariello83@gmail.com";

/**
 * Esporta tutto il database in JSON, lo comprime e lo spedisce via email:
 * la copia vive FUORI dal fornitore (regola R12 del Manuale Anti-Fallimento).
 */
export async function eseguiBackup() {
  const dump = { creato: new Date().toISOString(), tabelle: {} };
  const conteggi = {};

  for (const tabella of TABELLE) {
    try {
      const righe = await sql.query(`SELECT * FROM ${tabella}`);
      dump.tabelle[tabella] = righe;
      conteggi[tabella] = righe.length;
    } catch (err) {
      dump.tabelle[tabella] = { errore: err.message };
      conteggi[tabella] = `ERRORE: ${err.message}`;
    }
  }

  const json = JSON.stringify(dump);
  const contenuto = Buffer.from(json);
  const data = new Date().toISOString().slice(0, 10);

  const righeTabella = Object.entries(conteggi)
    .map(([t, n]) => `<tr><td style="padding:3px 10px;color:#7b909b;">${t}</td><td style="font-weight:bold;">${n}</td></tr>`)
    .join("");

  const inviata = await sendEmailConAllegato({
    to: EMAIL_BACKUP,
    subject: `Backup InfermieriWeb — ${data} (${Math.round(contenuto.length / 1024)} KB)`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 520px;">
  <h2 style="color:#0b3954;">Backup giornaliero del database 🗄️</h2>
  <p>In allegato la copia completa (JSON compresso). Conservane sempre almeno le ultime due.</p>
  <table style="font-size:14px;">${righeTabella}</table>
  <p style="color:#7b909b;font-size:12px;">Contiene dati personali e credenziali cifrate: non inoltrare. Ripristino: vedi README nel repository.</p>
</div>`,
    attachmentName: `infermieriweb-backup-${data}.json`,
    attachmentBase64: contenuto.toString("base64"),
  });

  return { ok: inviata, dimensioneKB: Math.round(contenuto.length / 1024), conteggi };
}

// Variante di sendEmail con allegato (API Brevo)
async function sendEmailConAllegato({ to, subject, html, attachmentName, attachmentBase64 }) {
  const API_KEY = process.env.BREVO_API_KEY || "";
  if (!API_KEY) {
    console.log("[backup] BREVO_API_KEY assente: backup non spedito");
    return false;
  }
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM || "prenotazioni@infermieriweb.it", name: "InfermieriWeb Backup" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      attachment: [{ name: attachmentName, content: attachmentBase64 }],
    }),
  });
  if (!r.ok) console.error("[backup] Brevo:", r.status, await r.text());
  return r.ok;
}
