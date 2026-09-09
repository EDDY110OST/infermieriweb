import { gzipSync } from "node:zlib";
import { randomBytes, scryptSync, createCipheriv } from "node:crypto";
import { sql } from "./db.js";
import { eseguiPulizia, MESI_PRENOTAZIONI, MESI_CANDIDATURE } from "./pulizia.js";

const TABELLE = [
  "professionals", "professional_users", "services", "coverage_areas",
  "opening_hours", "blocks", "bookings", "applications", "reviews",
  "articles", "profile_views", "push_subscriptions",
  // aggiunte 19/7: disponibilità per giorno, lista d'attesa, lead e consensi newsletter
  "day_overrides", "waitlist", "info_requests", "newsletter_subscribers",
];

// Casella aziendale del dominio (Aruba), non una casella personale:
// la copia contiene dati personali di pazienti e professionisti.
const EMAIL_BACKUP = process.env.BACKUP_EMAIL || "info@infermieriweb.it";

/**
 * Cifra il dump con AES-256-GCM. La chiave si ricava da BACKUP_KEY (passphrase)
 * con scrypt e un sale casuale, scritto in testa al file:
 *   "IWBK1" | sale(16) | iv(12) | tag(16) | testo cifrato
 * Per rileggerlo: `node scripts/ripristina-backup.mjs <file>`.
 */
function cifra(buffer, passphrase) {
  const sale = randomBytes(16);
  const iv = randomBytes(12);
  const chiave = scryptSync(passphrase, sale, 32);
  const cipher = createCipheriv("aes-256-gcm", chiave, iv);
  const cifrato = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([Buffer.from("IWBK1"), sale, iv, cipher.getAuthTag(), cifrato]);
}

/**
 * Esporta tutto il database, lo comprime, lo CIFRA e lo spedisce via email:
 * la copia vive FUORI dal fornitore (regola R12 del Manuale Anti-Fallimento).
 *
 * Senza BACKUP_KEY il dump NON viene spedito: meglio un backup mancante che
 * l'intero archivio dei pazienti in chiaro dentro una casella di posta.
 * Prima del backup gira la pulizia dei dati scaduti (src/lib/pulizia.js).
 */
export async function eseguiBackup() {
  const passphrase = process.env.BACKUP_KEY || "";
  // Nessuna cancellazione senza una copia di sicurezza possibile.
  const pulizia = await eseguiPulizia({ backupPossibile: !!passphrase });

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

  const compresso = gzipSync(Buffer.from(JSON.stringify(dump)));
  const data = new Date().toISOString().slice(0, 10);
  const contenuto = passphrase ? cifra(compresso, passphrase) : null;

  const righeTabella = Object.entries(conteggi)
    .map(([t, n]) => `<tr><td style="padding:3px 10px;color:#7b909b;">${t}</td><td style="font-weight:bold;">${n}</td></tr>`)
    .join("");

  const righePulizia = pulizia.errore
    ? `<p style="color:#b45309;">Pulizia dati: errore — ${pulizia.errore}</p>`
    : `<p style="font-size:13px;color:#4a6572;">
         Pulizia dati ${pulizia.simulazione ? `<strong>in pausa</strong> — ${pulizia.motivo}: sotto solo il conteggio, nessuna modifica` : "eseguita"}:
         ${pulizia.prenotazioni} prenotazioni oltre ${MESI_PRENOTAZIONI} mesi da anonimizzare,
         ${pulizia.candidature} candidature non accettate oltre ${MESI_CANDIDATURE} mesi,
         ${pulizia.richieste} richieste informazioni scadute,
         ${pulizia.recensioniRespinte} recensioni respinte scadute.
       </p>`;

  const avviso = contenuto
    ? `<p>In allegato la copia completa: <strong>compressa e cifrata</strong> (AES-256).
         Per rileggerla serve la passphrase BACKUP_KEY: <code>node scripts/ripristina-backup.mjs &lt;file&gt;</code>.
         Conservane sempre almeno le ultime due.</p>`
    : `<p style="color:#b91c1c;"><strong>⚠️ Backup NON allegato:</strong> manca la variabile d'ambiente
         <code>BACKUP_KEY</code>. Il dump contiene dati personali di pazienti e professionisti e non viene
         spedito in chiaro. Imposta BACKUP_KEY su Render e il backup riparte da stanotte.</p>`;

  const inviata = await sendEmailConAllegato({
    to: EMAIL_BACKUP,
    subject: contenuto
      ? `Backup InfermieriWeb — ${data} (${Math.round(contenuto.length / 1024)} KB)`
      : `⚠️ Backup InfermieriWeb NON eseguito — ${data} (manca BACKUP_KEY)`,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 520px;">
  <h2 style="color:#0b3954;">Backup giornaliero del database 🗄️</h2>
  ${avviso}
  <table style="font-size:14px;">${righeTabella}</table>
  ${righePulizia}
  <p style="color:#7b909b;font-size:12px;">Contiene dati personali e credenziali: non inoltrare. Ripristino: vedi README nel repository.</p>
</div>`,
    attachmentName: contenuto ? `infermieriweb-backup-${data}.json.gz.enc` : "",
    attachmentBase64: contenuto ? contenuto.toString("base64") : "",
  });

  return {
    ok: inviata && !!contenuto,
    cifrato: !!contenuto,
    dimensioneKB: contenuto ? Math.round(contenuto.length / 1024) : 0,
    conteggi,
    pulizia,
  };
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
      ...(attachmentBase64 ? { attachment: [{ name: attachmentName, content: attachmentBase64 }] } : {}),
    }),
  });
  if (!r.ok) console.error("[backup] Brevo:", r.status, await r.text());
  return r.ok;
}
