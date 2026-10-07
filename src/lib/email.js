// Controlli sulle email dei professionisti (7/10/26). Caso vero: una candidata ha scritto
// «gmail.co»; l'admin ha corretto la scheda ma l'email per entrare (professional_users)
// è rimasta sbagliata, e con lei il recupero della password. Regola da qui in poi:
// UNA sola email per professionista, uguale in professionals (prenotazioni) e in
// professional_users (accesso). Da qui passano: «Correggi email e rimanda il benvenuto»,
// «Modifica scheda» (admin), il Profilo del pannello e la correzione sulle candidature.
import { sql } from "./db.js";

export const normalizzaEmail = (e) => String(e || "").trim().toLowerCase().slice(0, 160);

// Formato: una sola @, niente spazi, dominio con almeno un punto e finale di 2+ lettere
export function emailValida(e) {
  const m = /^([^@\s]+)@([^@\s]+)$/.exec(String(e || ""));
  if (!m || e.length > 160) return false;
  const [, locale, dominio] = m;
  if (locale.startsWith(".") || locale.endsWith(".") || locale.includes("..")) return false;
  const parti = dominio.split(".");
  if (parti.length < 2) return false;
  if (!parti.every((p) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(p))) return false;
  return /^[a-z]{2,}$/.test(parti[parti.length - 1]);
}

export const dominioEmail = (e) => String(e || "").split("@")[1] || "";

// Domini veri e comuni: mai segnalati (anche se «somigliano» a un altro, es. tin.it / tim.it)
const DOMINI_NOTI = [
  "gmail.com", "googlemail.com", "hotmail.it", "hotmail.com", "live.it", "live.com", "outlook.it", "outlook.com",
  "msn.com", "libero.it", "virgilio.it", "alice.it", "tin.it", "tim.it", "tiscali.it", "fastwebnet.it", "email.it",
  "inwind.it", "iol.it", "yahoo.it", "yahoo.com", "ymail.com", "icloud.com", "me.com", "mac.com", "gmx.it",
  "gmx.com", "gmx.net", "mail.com", "aruba.it", "pec.it", "legalmail.it", "postecert.it", "poste.it", "katamail.com",
  "proton.me", "protonmail.com", "teletu.it", "infermieriweb.it",
];
// I più usati, per proporre la correzione («di solito è …»)
const DOMINI_RIFERIMENTO = ["gmail.com", "hotmail.it", "hotmail.com", "libero.it", "yahoo.it", "yahoo.com",
  "outlook.it", "outlook.com", "icloud.com", "live.it", "virgilio.it", "alice.it", "tiscali.it", "pec.it"];

// Errori di battitura visti davvero (o quasi): risposta esatta senza calcoli.
// (Un finale di una lettera sola, es. «libero.i», non arriva qui: è già un formato sbagliato.)
const DOMINI_SOSPETTI = {
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmial.com": "gmail.com",
  "gamil.com": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.comm": "gmail.com",
  "gmail.it": "gmail.com", "gmai.com": "gmail.com", "gnail.com": "gmail.com",
  "hotmial.it": "hotmail.it", "hotmal.it": "hotmail.it", "hotmai.it": "hotmail.it",
  "hotmial.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmai.com": "hotmail.com",
  "liber.it": "libero.it", "libeor.it": "libero.it", "libero.com": "libero.it",
  "yaho.it": "yahoo.it", "yahooo.it": "yahoo.it", "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com",
  "outlok.it": "outlook.it", "outlok.com": "outlook.com", "outlook.co": "outlook.com",
  "icloud.co": "icloud.com", "iclou.com": "icloud.com", "icloud.con": "icloud.com", "icloud.it": "icloud.com",
};

// Distanza di modifica (lettere da cambiare/aggiungere/togliere/scambiare)
function distanza(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Avviso (NON blocco) quando il dominio sembra un errore di battitura. null = tutto ok.
export function avvisoEmail(email) {
  const dominio = dominioEmail(email);
  if (!dominio || DOMINI_NOTI.includes(dominio)) return null;
  const giusto = DOMINI_SOSPETTI[dominio]
    || DOMINI_RIFERIMENTO.find((r) => distanza(dominio, r) <= (r.length >= 9 ? 2 : 1));
  if (giusto) return `Il dominio «${dominio}» sembra un errore di battitura: di solito è «${giusto}». Controlla con la persona prima di confermare.`;
  if (/\.(co|con|cm|ti|ocm|comm)$/.test(dominio)) {
    return `Il dominio «${dominio}» sembra incompleto (manca una lettera alla fine?). Controlla prima di confermare.`;
  }
  return null;
}

// L'ALTRO professionista che entra già con questa email (null = libera)
export async function emailUsataDaAltri(email, pidEscluso) {
  const [r] = await sql`
    SELECT u.professional_id, p.name FROM professional_users u JOIN professionals p ON p.id = u.professional_id
    WHERE lower(u.email) = ${email} AND u.professional_id <> ${pidEscluso || 0} LIMIT 1`;
  return r || null;
}

// Cambia l'email nelle DUE tabelle con UNA sola istruzione SQL: o cambiano tutte e due o
// nessuna (se un altro account la prende nello stesso istante, il vincolo UNIQUE la
// respinge e non resta niente a metà). Ritorna false se l'email è già usata.
export async function aggiornaEmailProfessionista(pid, email, editedBy = null) {
  try {
    await sql`
      WITH accesso AS (
        UPDATE professional_users SET email = ${email} WHERE professional_id = ${pid} RETURNING id
      )
      UPDATE professionals
      SET email = ${email},
          edited_by = COALESCE(${editedBy}::text, edited_by),
          edited_at = CASE WHEN ${editedBy}::text IS NULL THEN edited_at ELSE now() END
      WHERE id = ${pid}`;
    return true;
  } catch (e) {
    if (e?.code === "23505") return false; // professional_users_email_key: già di un altro
    throw e;
  }
}

// Riga di registro senza dati personali: solo i domini (dove di solito sta l'errore)
export async function registraCambioEmail({ chi, pid, prima, dopo, origine, extra = {} }) {
  try {
    await sql`
      INSERT INTO admin_audit (admin, azione, soggetto_id, dettagli)
      VALUES (${chi || ""}, 'email_cambiata', ${pid},
              ${JSON.stringify({ origine, dominio_prima: dominioEmail(prima), dominio_dopo: dominioEmail(dopo), ...extra })}::jsonb)`;
  } catch (e) {
    console.error("[email] registro non scritto:", e.message); // il registro non deve bloccare la correzione
  }
}
