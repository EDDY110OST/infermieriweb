// Email transazionali via Brevo. Senza BREVO_API_KEY le email non partono
// (viene loggato) ma il flusso non si rompe: l'API risponde emailed=false.

const API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "prenotazioni@infermieriweb.it";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "InfermieriWeb";
const SITE = "https://infermieriweb.it";
// Casella di assistenza: le email partono da un mittente automatico che NON riceve,
// quindi ogni email dice a chi scrivere davvero.
const ASSISTENZA_EMAIL = process.env.EMAIL_ASSISTENZA || "info@infermieriweb.it";

// Piè di pagina delle risposte. Il mittente (prenotazioni@) NON è una casella:
// se l'email ha un replyTo le risposte arrivano a una persona vera, altrimenti
// si perderebbero — e allora va detto chiaro dove scrivere.
const NOTA_CON_RISPOSTA = `Puoi rispondere a questa email: la risposta arriva direttamente alla persona
  che segue il tuo appuntamento. Per assistenza sulla piattaforma scrivi invece a
  <a href="mailto:${ASSISTENZA_EMAIL}" style="color: #00897b;">${ASSISTENZA_EMAIL}</a>.`;

const NOTA_NO_REPLY = `<strong style="color: #5c7280;">Questa è un'email automatica: non rispondere a questo
  indirizzo</strong>, le risposte non vengono lette da nessuno. Per assistenza scrivi a
  <a href="mailto:${ASSISTENZA_EMAIL}" style="color: #00897b;">${ASSISTENZA_EMAIL}</a>.`;

export async function sendEmail({ to, toName, subject, html, replyTo }) {
  html = String(html).replace("{{NOTA_RISPOSTE}}", replyTo ? NOTA_CON_RISPOSTA : NOTA_NO_REPLY);
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
      {{NOTA_RISPOSTE}}
    </p>
    <p style="color: #7b909b; font-size: 12px; margin-top: 10px;">
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

export function emailConfermaPaziente({ booking, professional, service, cancelToken, areaLink }) {
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
      ${areaLink ? `
      <div style="margin-top: 22px; padding: 16px 18px; background: #f0fdfa; border-radius: 12px;">
        <p style="margin: 0 0 10px; font-weight: bold; color: #0b3954;">Vuoi ritrovare le tue prenotazioni quando vuoi?</p>
        <p style="margin: 0 0 12px; font-size: 14px;">Con il tuo link personale le vedi tutte in un posto solo e riprenoti lo stesso professionista in due tocchi. Senza password: basta la tua email.</p>
        <p style="margin: 0;"><a href="${areaLink}" style="color: #00897b; font-weight: bold;">Apri "Le mie prenotazioni" →</a></p>
      </div>` : ""}
    `),
  };
}

export function emailConvalidaPrenotazione({ booking, professional, service, confermaLink }) {
  return {
    subject: `Convalida la tua prenotazione entro 60 minuti — ${service.name}`,
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Un ultimo passo: convalida la prenotazione ⏳</h2>
      <p>Ciao ${booking.name},</p>
      <p>abbiamo riservato per te questo appuntamento:</p>
      <table style="width: 100%; font-size: 15px; margin: 14px 0;">
        <tr><td style="padding: 5px 0; color: #7b909b;">Prestazione</td><td style="font-weight: bold;">${service.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Professionista</td><td style="font-weight: bold;">${professional.name}</td></tr>
        <tr><td style="padding: 5px 0; color: #7b909b;">Quando</td><td style="font-weight: bold; text-transform: capitalize;">${dataEstesa(booking.start)}</td></tr>
      </table>
      <p><strong>Per renderlo definitivo premi il tasto qui sotto entro 60 minuti</strong>:
      dopo, l'orario torna disponibile per gli altri pazienti.</p>
      <p style="text-align: center; margin: 26px 0;">
        <a href="${confermaLink}" style="display: inline-block; background: #00897b; color: #fff; text-decoration: none; padding: 17px 38px; border-radius: 999px; font-weight: bold; font-size: 17px;">✓ Convalida la prenotazione</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">Questo passaggio ci serve per verificare che la tua email sia
      corretta e proteggere l'agenda dei professionisti dalle prenotazioni false. Se non hai richiesto tu
      questa prenotazione, ignora questa email: si annullerà da sola.</p>
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

export function emailBenvenutoProfessionista({ name, email, passwordTemporanea, slug, senzaPiva = false }) {
  if (senzaPiva) {
    return {
      subject: "Benvenuto su InfermieriWeb: il tuo profilo è attivo 🎉",
      html: layout(`
        <h2 style="color: #0b3954; margin-top: 0;">Benvenuto nella rete, ${name}!</h2>
        <p>La tua candidatura è stata approvata e il tuo profilo professionale è attivo.</p>
        <table style="width: 100%; font-size: 15px; margin: 14px 0; background: #f6f9f9; border-radius: 10px;">
          <tr><td style="padding: 10px 14px; color: #7b909b;">Accesso</td><td style="padding: 10px 0; font-weight: bold;">${SITE}/area-professionisti</td></tr>
          <tr><td style="padding: 10px 14px; color: #7b909b;">Email</td><td style="padding: 10px 0; font-weight: bold;">${email}</td></tr>
          ${passwordTemporanea
            ? `<tr><td style="padding: 10px 14px; color: #7b909b;">Password temporanea</td><td style="padding: 10px 0; font-weight: bold;">${passwordTemporanea}</td></tr>`
            : `<tr><td style="padding: 10px 14px; color: #7b909b;">Password</td><td style="padding: 10px 0; font-weight: bold;">quella che hai scelto in registrazione</td></tr>`}
        </table>
        <p><strong>Come funziona per te (senza partita IVA):</strong></p>
        <p style="margin: 4px 0;">🏥 Il tuo profilo entrerà nella <strong>vetrina riservata alle strutture sanitarie</strong> (RSA, cliniche, cooperative) che cercano infermieri: la stiamo preparando e ti avviseremo appena è attiva. Nel frattempo il tuo profilo NON compare nelle ricerche dei pazienti e non è prenotabile: è normale, non è un errore.</p>
        <p style="margin: 4px 0;">📋 Intanto <strong>completa il profilo</strong>: entra con le tue credenziali${passwordTemporanea ? ", cambia la password temporanea" : ""}, carica la foto e scrivi due righe su di te — le strutture guarderanno proprio queste cose.</p>
        <p style="margin: 4px 0;">🚀 <strong>Quando aprirai la partita IVA</strong>, rispondi a questa email: attiveremo la tua scheda pubblica e i pazienti potranno prenotarti online a domicilio, con zero commissioni.</p>
        <p style="text-align: center; margin: 22px 0;">
          <a href="${SITE}/area-professionisti" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Entra nel tuo profilo</a>
        </p>
      `),
    };
  }
  return {
    subject: "Benvenuto su InfermieriWeb: la tua agenda è pronta 🎉",
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Benvenuto nella rete, ${name}!</h2>
      <p>La tua candidatura è stata approvata: la tua scheda e la tua agenda sono pronte.</p>
      <table style="width: 100%; font-size: 15px; margin: 14px 0; background: #f6f9f9; border-radius: 10px;">
        <tr><td style="padding: 10px 14px; color: #7b909b;">Accesso</td><td style="padding: 10px 0; font-weight: bold;">${SITE}/area-professionisti</td></tr>
        <tr><td style="padding: 10px 14px; color: #7b909b;">Email</td><td style="padding: 10px 0; font-weight: bold;">${email}</td></tr>
        ${passwordTemporanea
          ? `<tr><td style="padding: 10px 14px; color: #7b909b;">Password temporanea</td><td style="padding: 10px 0; font-weight: bold;">${passwordTemporanea}</td></tr>`
          : `<tr><td style="padding: 10px 14px; color: #7b909b;">Password</td><td style="padding: 10px 0; font-weight: bold;">quella che hai scelto in registrazione</td></tr>`}
      </table>
      <p><strong>I tuoi primi passi (15 minuti in tutto):</strong></p>
      <p style="margin: 4px 0;">1️⃣ Entra con le tue credenziali${passwordTemporanea ? " e <strong>cambia subito la password temporanea</strong> (scheda Profilo)" : ""}</p>
      <p style="margin: 4px 0;">2️⃣ Carica la tua <strong>foto</strong> e il tuo <strong>indirizzo</strong> (il segnaposto sulla mappa si posiziona da solo)</p>
      <p style="margin: 4px 0;">3️⃣ Inserisci le tue <strong>prestazioni con i prezzi</strong> (scheda Servizi)</p>
      <p style="margin: 4px 0;">4️⃣ Imposta i tuoi <strong>orari settimanali</strong> (scheda Orari)</p>
      <p style="margin: 4px 0;">5️⃣ Aggiungi i <strong>comuni che copri a domicilio</strong> (scheda Zone): più comuni copri, più pazienti ti trovano</p>
      <p style="margin: 10px 0 4px; color: #7b909b; font-size: 14px;">Finché prestazioni e orari non sono inseriti, la tua scheda dice "sta completando il profilo" e non è prenotabile: bastano i passi 3 e 4 per andare in campo.</p>

      <div style="background: #f0fdfa; border: 1px solid #ccebe6; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 0 0 4px; font-weight: bold; color: #0b3954; font-size: 16px;">📲 Porta l'agenda sul telefono, come una vera app (2 minuti)</p>
        <p style="margin: 0 0 12px; color: #46626e; font-size: 14px;">Così ogni nuova prenotazione ti arriva come una <strong>notifica sul telefono</strong>, senza dover controllare le email. Segui i passi del tuo telefono:</p>

        <p style="margin: 0 0 4px; font-weight: bold; color: #0b3954;">Se hai un iPhone:</p>
        <p style="margin: 2px 0;">1. Apri <strong>Safari</strong> (la bussola blu — proprio Safari, non altre app) e vai su <strong>infermieriweb.it/area-professionisti</strong></p>
        <p style="margin: 2px 0;">2. Tocca il tasto <strong>Condividi</strong>: è il <strong>quadratino con la freccia verso l'alto</strong>, in basso al centro dello schermo</p>
        <p style="margin: 2px 0;">3. Scorri l'elenco che appare e tocca <strong>"Aggiungi alla schermata Home"</strong>, poi <strong>"Aggiungi"</strong> in alto a destra</p>
        <p style="margin: 2px 0;">4. Chiudi Safari: sulla schermata Home ora c'è l'icona <strong>"IW Pro"</strong> — da oggi entri sempre da lì</p>

        <p style="margin: 12px 0 4px; font-weight: bold; color: #0b3954;">Se hai un Android (Samsung, Xiaomi, ecc.):</p>
        <p style="margin: 2px 0;">1. Apri <strong>Chrome</strong> e vai su <strong>infermieriweb.it/area-professionisti</strong></p>
        <p style="margin: 2px 0;">2. Tocca i <strong>tre puntini</strong> in alto a destra</p>
        <p style="margin: 2px 0;">3. Tocca <strong>"Aggiungi a schermata Home"</strong> e conferma con <strong>"Aggiungi"</strong></p>
        <p style="margin: 2px 0;">4. Sulla schermata Home trovi l'icona <strong>"IW Pro"</strong> — entra sempre da lì</p>

        <p style="margin: 12px 0 0; font-weight: bold; color: #0b3954;">Ultimo passo (importante):</p>
        <p style="margin: 2px 0;">Apri l'app dall'icona nuova, entra con le tue credenziali e nella scheda <strong>Agenda</strong> tocca <strong>"🔔 Attiva notifiche"</strong>, poi <strong>"Consenti"</strong> quando il telefono te lo chiede. Fatto: da adesso le prenotazioni ti "suonano" in tasca.</p>
        <p style="margin: 8px 0 0; color: #7b909b; font-size: 13px;">Su iPhone le notifiche funzionano SOLO se entri dall'icona sulla Home (non da Safari): per questo il passaggio sopra è importante.</p>
      </div>

      <div style="background: #fff8e6; border: 1px solid #f4dfa5; border-radius: 12px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 0 0 4px; font-weight: bold; color: #0b3954; font-size: 16px;">⭐ Passo 7 — Fatti trovare su Google (5 minuti, vale oro)</p>
        <p style="margin: 0 0 10px; color: #46626e; font-size: 14px;">Se hai un <strong>profilo Google Business</strong> (quello con le recensioni che appare quando cercano il tuo nome su Google), collega la tua scheda:</p>
        <p style="margin: 2px 0;">1. Cerca il tuo nome su Google ed entra nel tuo profilo con "Modifica profilo"</p>
        <p style="margin: 2px 0;">2. Vai su <strong>Modifica profilo → Contatti → Sito web</strong></p>
        <p style="margin: 2px 0;">3. Incolla il link della tua scheda: <strong>${SITE}/p/${slug}</strong></p>
        <p style="margin: 10px 0 0; color: #46626e; font-size: 14px;">Da quel momento, chi ti cerca su Google trova il tasto per <strong>prenotarti online</strong>. Non hai un profilo Google Business? Crealo gratis su business.google.com: per un libero professionista è la vetrina più importante che esista.</p>
      </div>
      <p style="text-align: center; margin: 22px 0;">
        <a href="${SITE}/area-professionisti" style="background: #00897b; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Entra nella tua agenda</a>
      </p>
      <p>La tua scheda pubblica: <a href="${SITE}/p/${slug}">${SITE}/p/${slug}</a> — condividila su WhatsApp, Google e i social: è tua, e le prenotazioni che porta sono tue al 100%. Zero commissioni.</p>
    `),
  };
}

export function emailRecuperoPasswordProfessionista({ name, resetLink }) {
  return {
    subject: "Reimposta la tua password — InfermieriWeb",
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Reimposta la password</h2>
      <p>Ciao ${name || ""},</p>
      <p>abbiamo ricevuto la richiesta di reimpostare la password del tuo accesso professionista.
      Premi il tasto qui sotto <strong>entro 60 minuti</strong> e scegli la nuova password:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #00897b; color: #fff; text-decoration: none; padding: 15px 34px; border-radius: 999px; font-weight: bold; font-size: 16px;">Scegli la nuova password</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">Se non hai richiesto tu il reset, ignora questa email: la tua password attuale resta valida.</p>
    `),
  };
}

export function emailRichiestaRecensione({ booking, professional, service, reviewUrl }) {
  return {
    subject: `Com'è andata con ${professional.name}? Lascia una recensione`,
    html: layout(`
      <h2 style="color: #0b3954; margin-top: 0;">Com'è andata? ⭐</h2>
      <p>Ciao ${booking.name},</p>
      <p>la tua prestazione (<strong>${service.name}</strong> con <strong>${professional.name}</strong>) risulta completata.
      La tua opinione aiuta altre famiglie a scegliere con fiducia — e richiede meno di un minuto.</p>
      <p style="text-align: center; margin: 22px 0;">
        <a href="${reviewUrl}" style="background: #f5a623; color: #fff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: bold;">Lascia la tua recensione</a>
      </p>
      <p style="color: #7b909b; font-size: 13px;">Solo chi ha davvero prenotato può recensire: per questo le recensioni su InfermieriWeb sono verificate.</p>
    `),
  };
}
