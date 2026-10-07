// «✉️ Scrivi agli infermieri» (7/10/26): una comunicazione a tutti gli infermieri scelti,
// una email per persona. Qui: chi la riceve, come si scrive il testo (editor visuale o
// testo semplice) e come diventa una email. L'HTML passa SEMPRE dalla stessa lista bianca
// del blog (lib/blog-html.js); i colori, che nel sito sono classi, nella mail diventano
// stili in linea (le email non leggono i fogli di stile).
import { sql } from "./db.js";
import { sanificaHtml, testoNudo, TONI } from "./blog-html.js";
import { senzaTitolo } from "./appellativo.js";
import { emailValida, normalizzaEmail } from "./email.js";
import { layout, PIEDE_COMUNICAZIONE } from "./mailer.js";

export const STATI_DESTINATARI = { active: "Attivi", network: "Rete (senza P.IVA)", suspended: "Sospesi" };
export const MAX_CARATTERI = 30000; // testo nudo; nessun limite sotto i 20.000
export const SOGLIA_BREVO = 250;    // Brevo gratuito: circa 300 email al giorno in tutto
export const PAUSA_MS = 400;        // fra un invio e l'altro

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Nome di battesimo per {nome}. Si parte dal nome pubblico («Inf. Maria Grazia B.»): è
// quello che gli admin hanno già sistemato a mano. Via il titolo, le iniziali del cognome
// e le particelle rimaste in coda («Giovanni Del R.» → «Giovanni»). Maiuscole sistemate
// solo se il nome è tutto maiuscolo o tutto minuscolo («MARIA» → «Maria»).
const PARTICELLE = new Set(["de", "del", "della", "dei", "degli", "delle", "di", "da", "dal", "dalla", "dallo", "lo", "la", "le", "van", "von"]);
const sistemaMaiuscole = (nome) => nome.split(" ").map((p) =>
  (p === p.toUpperCase() || p === p.toLowerCase()) ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p).join(" ");
export function nomeDiBattesimo({ name, full_name, nome_accesso }) {
  const parti = senzaTitolo(name).replace(/\([^)]*\)/g, " ").trim().split(/\s+/).filter(Boolean);
  while (parti.length > 1 && /^(\p{Lu}\.)+$/u.test(parti[parti.length - 1])) parti.pop();
  while (parti.length > 1 && PARTICELLE.has(parti[parti.length - 1].toLowerCase())) parti.pop();
  let nome = parti.join(" ");
  if (!nome || /^\p{Lu}\.$/u.test(nome) || nome === "Professionista rimosso") {
    nome = String(nome_accesso || full_name || "").trim().split(/\s+/)[0] || "";
  }
  return sistemaMaiuscole(nome) || "collega";
}

// Chi può ricevere: attivi, rete e sospesi. MAI gli eliminati (deleted_at / status
// deleted) e mai chi non ha un'email valida. Gli amministratori sono segnati: nella
// pagina partono tolti (come nell'invio a mano del 7/10), si rimettono con un clic.
export async function destinatariPossibili() {
  const righe = await sql`
    SELECT p.id, p.name, p.full_name, p.email, p.status, u.name AS nome_accesso, u.role
    FROM professionals p
    LEFT JOIN professional_users u ON u.professional_id = p.id
    WHERE p.status IN ('active', 'network', 'suspended') AND p.deleted_at IS NULL`;
  const tutti = righe.map((r) => ({
    id: r.id, name: r.name, status: r.status, email: normalizzaEmail(r.email),
    nome: nomeDiBattesimo(r), admin: r.role === "admin",
  }));
  const validi = tutti.filter((d) => d.email && emailValida(d.email));
  validi.sort((a, b) => senzaTitolo(a.name).localeCompare(senzaTitolo(b.name), "it"));
  return { destinatari: validi, senza_email: tutti.length - validi.length };
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"»])/g;
const conLink = (riga) => esc(riga).replace(URL_RE, (u) => `<a href="${u}">${u}</a>`);

// «Testo semplice» (textarea): riga vuota = nuovo paragrafo, a capo = a capo. Gli indirizzi
// web diventano link. Niente altro: chi incolla da WhatsApp o da Word ritrova i paragrafi.
export function testoSempliceInHtml(testo) {
  return String(testo || "").replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/)
    .map((b) => b.replace(/^\n+|\n+$/g, ""))
    .filter((b) => b.trim())
    .map((b) => `<p>${b.split("\n").map((r) => conLink(r.trimEnd())).join("<br>")}</p>`)
    .join("\n");
}

// Oggetto + corpo dalla richiesta → versione pulita (o errore da mostrare in pagina)
export function preparaComunicazione(body) {
  const oggetto = String(body.oggetto || "").replace(/\s+/g, " ").trim();
  if (oggetto.length < 3) return { error: "Scrivi l'oggetto della mail" };
  if (oggetto.length > 150) return { error: "L'oggetto è troppo lungo: al massimo 150 caratteri" };
  const formato = body.formato === "testo" ? "testo" : "visuale";
  const grezzo = formato === "testo"
    ? testoSempliceInHtml(String(body.testo || "").slice(0, MAX_CARATTERI * 2))
    : String(body.html || "").slice(0, MAX_CARATTERI * 20);
  const html = sanificaHtml(grezzo);
  const caratteri = testoNudo(html).length;
  if (caratteri < 10) return { error: "Il testo è troppo corto" };
  if (caratteri > MAX_CARATTERI) return { error: `Il testo è troppo lungo: al massimo ${MAX_CARATTERI.toLocaleString("it-IT")} caratteri (ora ${caratteri.toLocaleString("it-IT")})` };
  return { oggetto, html, formato, caratteri };
}

// Dall'HTML della lista bianca agli stili in linea della mail
const STILI = {
  p: "margin: 0 0 12px; line-height: 1.55;",
  h2: "color: #0b3954; font-size: 20px; line-height: 1.3; margin: 22px 0 8px;",
  h3: "color: #0b3954; font-size: 17px; line-height: 1.3; margin: 18px 0 6px;",
  ul: "padding-left: 22px; margin: 0 0 12px;",
  ol: "padding-left: 22px; margin: 0 0 12px;",
  li: "margin: 4px 0; line-height: 1.5;",
  blockquote: "margin: 0 0 12px; padding: 10px 14px; border-left: 4px solid #00897b; background: #f0fdfa; border-radius: 8px;",
};
const COLORE = Object.fromEntries(TONI.map((t) => [t.key, t.hex]));
export function htmlPerEmail(html) {
  return String(html)
    .replace(/<(p|h2|h3|ul|ol|li|blockquote)>/g, (_, t) => `<${t} style="${STILI[t]}">`)
    .replace(/<span class="col-([a-z]+)">/g, (_, k) => (COLORE[k] ? `<span style="color: ${COLORE[k]};">` : "<span>"))
    .replace(/<a href=/g, '<a style="color: #00897b; text-decoration: underline;" href=');
}

const SEGNAPOSTO = /\{\s*nome\s*\}/gi;
export const oggettoPer = (oggetto, nome) => String(oggetto).replace(SEGNAPOSTO, nome);

// La mail per UNA persona: {nome} → il suo nome di battesimo; impaginato del sito, piè
// di pagina delle comunicazioni (risposta a noi, perché la ricevi), NIENTE nota sugli appuntamenti.
export function emailComunicazione({ html, nome }) {
  const corpo = htmlPerEmail(html).replace(SEGNAPOSTO, esc(nome));
  return layout(`<div style="font-size: 16px; color: #10222e;">${corpo}</div>`, PIEDE_COMUNICAZIONE);
}
