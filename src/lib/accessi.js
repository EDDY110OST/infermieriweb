// REGISTRO DEGLI ACCESSI all'area riservata (13/10/2026) — la parte senza database, che
// usano sia il server (lib/accessi-server.js) sia la pagina admin (AdminRegistroAccessi).
//
// Caso vero: 8 infermieri approvati su 32 avevano la scheda vuota e non sapevamo dire se
// fossero mai entrati nel pannello. Il registro risponde a due domande:
//  - chi NON è mai entrato dopo l'approvazione (da contattare);
//  - chi ci prova e non ci riesce (password sbagliata, email diversa da quella che ricorda).

// Il registro parte da questo giorno: degli accessi di prima non c'è traccia, quindi per
// chi era già iscritto «nessuna riga» NON vuol dire «mai entrato».
export const INIZIO_REGISTRO = "2026-10-13";

// evento → come lo legge un admin
export const EVENTI = {
  accesso: "È entrato con email e password",
  pannello: "Ha aperto il pannello (era già collegato)",
  uscita: "È uscito",
  password_sbagliata: "Password sbagliata",
  codice_sbagliato: "Codice a 6 cifre sbagliato",
  email_sconosciuta: "Email che non ha un account",
  password_richiesta: "Ha chiesto il link «Password dimenticata»",
  recupero_sconosciuta: "«Password dimenticata» con un'email che non ha un account",
  password_reimpostata: "Ha scelto una nuova password dal link",
  password_cambiata: "Ha cambiato la password dal pannello",
};

export const ICONE = {
  accesso: "🔑", pannello: "📲", uscita: "🚪",
  password_sbagliata: "⚠️", codice_sbagliato: "⚠️", email_sconosciuta: "❓",
  password_richiesta: "✉️", recupero_sconosciuta: "❓", password_reimpostata: "🔁", password_cambiata: "🔁",
};

// «È dentro al pannello»: conta sia chi scrive la password sia chi era già collegato
export const EVENTI_INGRESSO = ["accesso", "pannello"];
export const EVENTI_FALLITI = ["password_sbagliata", "codice_sbagliato", "email_sconosciuta", "recupero_sconosciuta"];
// i falliti di un account che esiste: dicono «questa persona non riesce a entrare»
export const EVENTI_FALLITI_ACCOUNT = ["password_sbagliata", "codice_sbagliato"];

// I filtri della pagina admin (chiave → etichetta ed eventi; null = tutti)
export const FILTRI = [
  { k: "tutti", label: "Tutto", eventi: null },
  { k: "ingressi", label: "Solo gli ingressi", eventi: EVENTI_INGRESSO },
  { k: "falliti", label: "Solo i tentativi falliti", eventi: EVENTI_FALLITI },
  { k: "password", label: "Solo le password (richieste e cambi)", eventi: ["password_richiesta", "password_reimpostata", "password_cambiata"] },
];

// Dal browser teniamo SOLO il tipo di dispositivo, mai la riga intera (user-agent).
// Nota: l'iPad con Safari si presenta come un Mac.
export function dispositivoDa(userAgent) {
  const ua = String(userAgent || "");
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "telefono Android" : "tablet Android";
  if (/Windows/.test(ua)) return "computer Windows";
  if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
  if (/CrOS/.test(ua)) return "Chromebook";
  if (/Linux/.test(ua)) return "computer Linux";
  return "";
}

// Lo stato di UN professionista, da mostrare in admin. `r` è la sua riga del riepilogo
// (lib/accessi-server.js) o null se nel registro non ha niente.
//  - entrato:      ha almeno un ingresso registrato
//  - mai:          approvato DOPO l'inizio del registro e mai entrato → certo
//  - non_si_sa:    era già iscritto prima del registro e da allora non è entrato
// `bloccato` = ha tentativi falliti più recenti dell'ultimo ingresso (o nessun ingresso).
export function statoAccessi(r, approvatoIl) {
  const ultimo = r?.ultimo ? new Date(r.ultimo).getTime() : 0;
  const fallito = r?.ultimo_fallito ? new Date(r.ultimo_fallito).getTime() : 0;
  const bloccato = fallito > ultimo;
  if (ultimo) return { stato: "entrato", bloccato };
  const primaDelRegistro = approvatoIl && new Date(approvatoIl).getTime() < new Date(`${INIZIO_REGISTRO}T00:00:00+02:00`).getTime();
  return { stato: primaDelRegistro ? "non_si_sa" : "mai", bloccato };
}
