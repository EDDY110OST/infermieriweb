// Articoli scritti e firmati dagli infermieri (8/10/26), lato server.
// Percorso: bozza → «Invia per la revisione» (avviso agli amministratori) → gli admin
// approvano, correggono e pubblicano, rimandano da correggere o rifiutano (email
// all'infermiere). Il testo passa SEMPRE dalla stessa lista bianca del blog.
import { sql } from "./db.js";
import { sanificaHtml, testoNudo, sezioniDaHtml } from "./blog-html.js";
import { readingTime, slugifyTitolo } from "./blog.js";
import { sendEmail, layout, PIEDE_COMUNICAZIONE, ASSISTENZA_EMAIL, EMAIL_AVVISI_ADMIN } from "./mailer.js";
import { pushToProfessional } from "./push.js";
import { nomeDiBattesimo } from "./comunicazioni.js";
import {
  CATEGORIE_ARTICOLO, TITOLO_MAX, DESCRIZIONE_MAX, MAX_IN_REVISIONE,
  pulisciTitolo, pulisciDescrizione, validaFonti, mancanzePerInvio,
} from "./articoli-regole.js";

const SITE = "https://infermieriweb.it";
export const LINK_CODA_ADMIN = `${SITE}/admin#blog-revisione`;
export const LINK_PANNELLO_ARTICOLI = `${SITE}/area-professionisti#articoli`;
// Nota lasciata sugli articoli che tornano in bozza perché l'autore è stato eliminato
export const NOTA_AUTORE_RIMOSSO = "L'autore è stato eliminato: l'articolo è tornato in bozza e non è più sul sito.";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Oggetto delle email: testo semplice su una riga
const oggetto = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);

// Copertina caricata: data URI (base64) ridimensionata dal browser. undefined = non toccare.
// Stessi limiti per admin e infermieri: JPEG, PNG o WebP, al massimo ~650 KB.
export const validaCover = (data) => {
  if (data === undefined || data === null) return { cover: undefined };
  const d = String(data);
  if (!d) return { cover: "" };
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) return { error: "Formato immagine di copertina non valido: usa una foto JPEG, PNG o WebP" };
  if (d.length > 900_000) return { error: "Copertina troppo pesante: usa un'immagine più leggera" };
  return { cover: d };
};

export const urlCopertina = (slug) => `/api/blog-immagine/${slug}?v=${Date.now()}`;

// Uno slug libero (aggiunge -2, -3… se serve). escludiId = l'articolo stesso.
export async function slugLibero(titolo, escludiId = 0) {
  const base = slugifyTitolo(titolo) || "articolo";
  let slug = base;
  for (let n = 2; ; n++) {
    const [occ] = await sql`SELECT id FROM articles WHERE slug = ${slug} AND id <> ${escludiId || 0}`;
    if (!occ) return slug;
    slug = `${base}-${n}`;
  }
}

// Dal modulo (infermiere o admin in «Modifica e pubblica») ai campi da salvare.
// perInvio = controlli completi (titolo, descrizione, testo, fonti); senza, è una bozza:
// basta un titolo di 3 caratteri, il resto si completa dopo.
export function contenutoArticolo(body, { perInvio = false } = {}) {
  const title = pulisciTitolo(body.title).slice(0, TITOLO_MAX + 40);
  const excerpt = pulisciDescrizione(body.excerpt).slice(0, DESCRIZIONE_MAX + 60);
  const category = CATEGORIE_ARTICOLO.includes(String(body.category)) ? String(body.category) : CATEGORIE_ARTICOLO[0];
  const bodyHtml = sanificaHtml(String(body.body_html || "").slice(0, 200000));
  const testo = testoNudo(bodyHtml);
  const f = validaFonti(body.sources);
  if (f.errore) return { error: f.errore };
  if (title.length < 3) return { error: "Scrivi almeno il titolo (anche provvisorio) per salvare la bozza." };
  if (perInvio) {
    const mancanze = mancanzePerInvio({ titolo: title, descrizione: excerpt, testo, fonti: f.fonti });
    if (mancanze.length) return { error: mancanze[0], errori: mancanze };
  }
  return {
    title, excerpt, category, bodyHtml, testo, fonti: f.fonti,
    sections: sezioniDaHtml(bodyHtml, title), reading: readingTime(testo || "x"),
  };
}

// L'infermiere della sessione, con lo stato del profilo. Può scrivere solo se ATTIVO
// (non sospeso, non in rete senza P.IVA, non eliminato): la firma porta alla sua scheda.
export async function autoreDellaSessione(session) {
  if (!session?.pid) return null;
  const [p] = await sql`
    SELECT id, slug, name, full_name, email, status, deleted_at, albo_name, albo_number, photo_url
    FROM professionals WHERE id = ${session.pid}`;
  if (!p) return null;
  const attivo = p.status === "active" && !p.deleted_at;
  const motivo = attivo ? "" : p.status === "suspended"
    ? "Il tuo profilo è sospeso: per ora non puoi scrivere né inviare articoli."
    : p.status === "network"
      ? "Potrai scrivere articoli quando la tua scheda sarà attiva (serve la partita IVA)."
      : "Il tuo profilo non è attivo: per ora non puoi scrivere né inviare articoli.";
  return { ...p, attivo, motivo };
}

// Bozza/da correggere → in revisione. Tutto in UNA query: niente doppio invio (doppio clic,
// due schede aperte) e niente 4° articolo in revisione. Ritorna {ok} o {status, error}.
export async function inviaPerRevisione(id, pid) {
  const righe = await sql`
    UPDATE articles SET status = 'review', submitted_at = now(), updated_at = now()
    WHERE id = ${id} AND author_professional_id = ${pid} AND status IN ('draft', 'changes')
      AND (SELECT COUNT(*) FROM articles WHERE author_professional_id = ${pid} AND status = 'review') < ${MAX_IN_REVISIONE}
    RETURNING id, slug, title, excerpt`;
  if (righe.length) return { ok: true, articolo: righe[0] };
  const [a] = await sql`SELECT status FROM articles WHERE id = ${id} AND author_professional_id = ${pid}`;
  if (!a) return { status: 404, error: "Articolo non trovato" };
  if (a.status === "review") return { status: 409, error: "Questo articolo è già stato inviato: è in revisione.", giaInviato: true };
  if (a.status === "published") return { status: 409, error: "Questo articolo è già pubblicato." };
  if (a.status === "rejected") return { status: 409, error: "Questo articolo è stato rifiutato: non si può reinviare." };
  return { status: 429, error: `Hai già ${MAX_IN_REVISIONE} articoli in revisione. Aspetta la nostra risposta prima di inviarne un altro.` };
}

// Avviso agli amministratori: email agli stessi indirizzi della «Nuova candidatura» e
// notifica push sui telefoni degli admin che le hanno attivate nel pannello.
export async function avvisaAdminNuovoArticolo({ articolo, autore }) {
  const subject = oggetto(`Nuovo articolo da approvare: ${articolo.title} — ${autore.name}`);
  const html = layout(`
    <h2 style="color: #0b3954; margin-top: 0;">Nuovo articolo da approvare 📰</h2>
    <p><strong>${esc(autore.name)}</strong> ha inviato un articolo. Va letto e approvato prima di uscire.</p>
    <table style="width: 100%; font-size: 15px; margin: 14px 0;">
      <tr><td style="padding: 5px 0; color: #7b909b; width: 110px;">Titolo</td><td style="font-weight: bold;">${esc(articolo.title)}</td></tr>
      <tr><td style="padding: 5px 0; color: #7b909b;">Descrizione</td><td>${esc(articolo.excerpt)}</td></tr>
      <tr><td style="padding: 5px 0; color: #7b909b;">Autore</td><td><a href="${SITE}/p/${esc(autore.slug)}" style="color: #00897b;">${esc(autore.name)}</a></td></tr>
    </table>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${LINK_CODA_ADMIN}" style="display: inline-block; background: #00897b; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: bold;">Apri «Da approvare» in admin</a>
    </p>
    <p style="color: #7b909b; font-size: 13px;">Controlla che non ci siano pubblicità, prezzi diversi dalla scheda, diagnosi o testi copiati, e che le fonti siano vere.</p>
  `, "");
  let email = 0;
  for (const to of EMAIL_AVVISI_ADMIN) {
    try { if (await sendEmail({ to, subject, html })) email++; } catch { /* l'articolo è comunque in coda */ }
  }
  let push = 0;
  try {
    const admin = await sql`SELECT DISTINCT professional_id FROM professional_users WHERE role = 'admin'`;
    for (const a of admin) {
      push += await pushToProfessional(a.professional_id, {
        title: "Nuovo articolo da approvare",
        body: `${articolo.title} — ${autore.name}`.slice(0, 160),
        url: "/admin#blog-revisione",
        tag: "articolo-da-approvare",
      });
    }
  } catch (e) { console.error("[articoli] push agli admin non riuscita:", e.message); }
  return { email, push };
}

// Email all'infermiere sull'esito: pubblicato (con il link), da correggere o rifiutato (con la nota)
export function emailEsitoArticolo({ esito, articolo, autore, nota }) {
  const nome = esc(nomeDiBattesimo(autore));
  const titolo = esc(articolo.title);
  const riquadroNota = nota ? `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 16px; margin: 14px 0;">
      <p style="margin: 0 0 6px; font-weight: bold; color: #9a3412;">La nota degli amministratori</p>
      <p style="margin: 0; white-space: pre-line;">${esc(nota)}</p>
    </div>` : "";
  const tasto = (href, testo) => `
    <p style="text-align: center; margin: 24px 0;">
      <a href="${href}" style="display: inline-block; background: #00897b; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: bold;">${testo}</a>
    </p>`;
  if (esito === "published") {
    const link = `${SITE}/articoli/${articolo.slug}`;
    return {
      subject: oggetto(`Il tuo articolo è online ✅ ${articolo.title}`),
      html: layout(`
        <h2 style="color: #0b3954; margin-top: 0;">Il tuo articolo è online ✅</h2>
        <p>Ciao ${nome},</p>
        <p>abbiamo letto il tuo articolo <strong>«${titolo}»</strong> e l'abbiamo pubblicato. Grazie!</p>
        <p>Esce con il tuo nome, il numero OPI e il link alla tua scheda. Così i pazienti ti conoscono meglio.</p>
        ${tasto(link, "Leggi il tuo articolo")}
        <p style="color: #7b909b; font-size: 13px;">Puoi condividerlo dove vuoi. Se vuoi cambiare qualcosa, rispondi a questa email: lo sistemiamo noi.</p>
      `, PIEDE_COMUNICAZIONE),
    };
  }
  if (esito === "changes") {
    return {
      subject: oggetto(`Il tuo articolo è da correggere: ${articolo.title}`),
      html: layout(`
        <h2 style="color: #0b3954; margin-top: 0;">Il tuo articolo è quasi pronto ✏️</h2>
        <p>Ciao ${nome},</p>
        <p>abbiamo letto il tuo articolo <strong>«${titolo}»</strong>. Prima di pubblicarlo ti chiediamo qualche correzione.</p>
        ${riquadroNota}
        <p>Apri il pannello, scheda <strong>«📰 I miei articoli»</strong>: correggi e premi di nuovo <strong>«Invia per la revisione»</strong>.</p>
        ${tasto(LINK_PANNELLO_ARTICOLI, "Correggi l'articolo")}
      `, PIEDE_COMUNICAZIONE),
    };
  }
  return {
    subject: oggetto(`Il tuo articolo non è stato pubblicato: ${articolo.title}`),
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Il tuo articolo non è stato pubblicato</h2>
      <p>Ciao ${nome},</p>
      <p>abbiamo letto il tuo articolo <strong>«${titolo}»</strong>. Questa volta non possiamo pubblicarlo.</p>
      ${riquadroNota}
      <p>Puoi sempre scriverne uno nuovo dal pannello. Se hai dubbi, rispondi a questa email.</p>
      ${tasto(LINK_PANNELLO_ARTICOLI, "Apri i tuoi articoli")}
    `, PIEDE_COMUNICAZIONE),
  };
}

export async function mandaEsitoAllInfermiere({ esito, articolo, autoreId, nota }) {
  const [autore] = await sql`
    SELECT p.name, p.full_name, p.email, u.name AS nome_accesso, u.email AS email_accesso
    FROM professionals p LEFT JOIN professional_users u ON u.professional_id = p.id
    WHERE p.id = ${autoreId} AND p.deleted_at IS NULL LIMIT 1`;
  const to = autore?.email || autore?.email_accesso;
  if (!to) return false;
  try {
    return await sendEmail({ to, toName: autore.name, replyTo: ASSISTENZA_EMAIL, ...emailEsitoArticolo({ esito, articolo, autore, nota }) });
  } catch {
    return false;
  }
}

// Registro delle decisioni: SOLO numeri e stati (niente nomi, niente testo della nota)
export async function registraDecisione(session, azione, articoloId, dettagli = {}) {
  try {
    await sql`
      INSERT INTO admin_audit (admin, azione, soggetto_id, dettagli)
      VALUES (${session?.name || "admin"}, ${azione}, ${articoloId}, ${JSON.stringify(dettagli)}::jsonb)`;
  } catch (e) { console.error("[articoli] registro non scritto:", e.message); }
}

export const contaDaApprovare = async () =>
  Number((await sql`SELECT COUNT(*)::int AS n FROM articles WHERE status = 'review'`)[0].n);
