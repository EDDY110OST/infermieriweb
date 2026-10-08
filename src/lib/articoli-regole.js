// Articoli scritti dagli infermieri (8/10/26): regole condivise fra pannello (browser) e
// server. Qui NIENTE database né email: solo limiti, stati e controlli sui testi, così il
// pannello avvisa PRIMA dell'invio e il server applica le stesse identiche regole.

// Stati della revisione. «classe» = colore della pastiglia (.stato.* in platform.css)
export const STATI_ARTICOLO = {
  draft: { nome: "Bozza", classe: "expired" },
  review: { nome: "In revisione", classe: "pending" },
  changes: { nome: "Da correggere", classe: "cancelled" },
  rejected: { nome: "Rifiutato", classe: "noshow" },
  published: { nome: "Pubblicato", classe: "done" },
};

export const MAX_IN_REVISIONE = 3;     // antiabuso: articoli in revisione nello stesso momento
export const MAX_NON_PUBBLICATI = 15;  // bozze + da correggere + rifiutati + in revisione
export const TITOLO_MIN = 10;
export const TITOLO_MAX = 110;
export const DESCRIZIONE_MIN = 70;
export const DESCRIZIONE_MAX = 160;    // oltre, Google la taglia
export const TESTO_MIN = 1200;         // caratteri di testo (circa 200 parole)
export const FONTI_MAX = 10;
export const NOTA_MIN = 10;            // nota degli admin quando rimandano o rifiutano

// Stessi argomenti del filtro della pagina /articoli
export const CATEGORIE_ARTICOLO = [
  "Assistenza Domiciliare", "ECG", "Holter", "Medicazioni", "Prelievi",
  "Iniezioni", "Flebo", "Cateteri", "Stomie",
];

// Titolo: solo testo. Via i tag, i caratteri di controllo e gli spazi doppi.
export const pulisciTitolo = (t) =>
  String(t ?? "").replace(/<[^>]*>/g, "").replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();

// Breve descrizione (meta description): testo semplice su una riga
export const pulisciDescrizione = (t) =>
  String(t ?? "").replace(/<[^>]*>/g, "").replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();

// Un link di una fonte: solo http/https, niente spazi, niente javascript:
export function linkFonte(u) {
  const s = String(u ?? "").trim();
  if (!s) return "";
  const conProtocollo = /^https?:\/\//i.test(s) ? s : /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(s) ? `https://${s}` : null;
  if (!conProtocollo || /\s/.test(conProtocollo) || conProtocollo.length > 500) return null;
  try {
    const url = new URL(conProtocollo);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Fonti: [{testo, url}]. Le righe vuote si tolgono; testo obbligatorio, link facoltativo.
export function validaFonti(lista) {
  const fonti = [];
  const righe = Array.isArray(lista) ? lista : [];
  for (const [i, r] of righe.entries()) {
    const testo = pulisciTitolo(r?.testo).slice(0, 200);
    const grezzo = String(r?.url ?? "").trim();
    if (!testo && !grezzo) continue;
    if (testo.length < 3) return { errore: `Fonte ${i + 1}: scrivi da dove viene (es. «Ministero della Salute, 2024»).` };
    const url = grezzo ? linkFonte(grezzo) : "";
    if (url === null) return { errore: `Fonte ${i + 1}: il link non è valido. Deve iniziare con https://` };
    fonti.push({ testo, url });
  }
  if (fonti.length > FONTI_MAX) return { errore: `Puoi indicare al massimo ${FONTI_MAX} fonti.` };
  return { fonti };
}

// Cosa manca per poter INVIARE (la bozza si salva anche incompleta).
// testo = testo nudo del corpo (senza tag).
export function mancanzePerInvio({ titolo, descrizione, testo, fonti }) {
  const m = [];
  const t = pulisciTitolo(titolo);
  if (t.length < TITOLO_MIN) m.push(`Il titolo è troppo corto: almeno ${TITOLO_MIN} caratteri.`);
  if (t.length > TITOLO_MAX) m.push(`Il titolo è troppo lungo: al massimo ${TITOLO_MAX} caratteri.`);
  const d = pulisciDescrizione(descrizione);
  if (d.length < DESCRIZIONE_MIN) m.push(`La breve descrizione è troppo corta: almeno ${DESCRIZIONE_MIN} caratteri (ora ${d.length}).`);
  if (d.length > DESCRIZIONE_MAX) m.push(`La breve descrizione è troppo lunga: al massimo ${DESCRIZIONE_MAX} caratteri (ora ${d.length}).`);
  const n = String(testo || "").replace(/\s+/g, " ").trim().length;
  if (!n) m.push("Il testo è vuoto.");
  else if (n < TESTO_MIN) m.push(`Il testo è troppo corto: almeno ${TESTO_MIN.toLocaleString("it-IT")} caratteri, circa 200 parole (ora ${n.toLocaleString("it-IT")}).`);
  if (!Array.isArray(fonti) || !fonti.length) m.push("Manca la fonte: indicane almeno una (es. Ministero della Salute, ISS, FNOPI, una linea guida).");
  return m;
}

// «OPI Lucca n. 4572» dai dati dell'albo così come sono scritti nella scheda
// («Opi Lucca», «Cremona», «OPI CREMONA», «TERAMO»…)
export function etichettaAlbo(alboNome, alboNumero) {
  let nome = String(alboNome || "").trim().replace(/^o\.?\s*p\.?\s*i\.?\s+/i, "");
  nome = nome.split(/\s+/).filter(Boolean)
    .map((p) => (p === p.toUpperCase() || p === p.toLowerCase()) ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p)
    .join(" ");
  const parti = [];
  parti.push(nome ? `OPI ${nome}` : "OPI");
  if (String(alboNumero || "").trim()) parti.push(`n. ${String(alboNumero).trim()}`);
  return parti.join(" ");
}
