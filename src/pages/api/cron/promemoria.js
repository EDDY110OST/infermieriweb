export const prerender = false;

// Endpoint richiamato dal cron (Render Cron Job o servizio esterno).
// Protetto da CRON_SECRET: senza il segreto giusto non fa nulla.
export async function GET({ request, url }) {
  const segreto = process.env.CRON_SECRET || "";
  const dato = url.searchParams.get("key") || (request.headers.get("authorization") || "").replace("Bearer ", "");
  if (!segreto || dato !== segreto) return new Response("no", { status: 401 });
  const esito = await esegui();
  return esito instanceof Response ? esito : new Response("ok");
}

// Promemoria 24 ore prima dell'appuntamento (stile Prenotazioni Sbarba).
// Funzione schedulata: gira ogni ora e avvisa i pazienti con appuntamento
// tra 24 e 25 ore, una sola volta (guardia reminded_at).
import { neon } from "@neondatabase/serverless";
import { inviaEmailCambio, DAL_GIORNO_ACCETTA, linkEsito } from "../../../lib/cambio.js";
import { sendEmail, emailCompletaProfilo, emailEsitoProfessionista, ASSISTENZA_EMAIL } from "../../../lib/mailer.js";
import { prenotabilitaTutti } from "../../../lib/prenotabilita.js";

const SITE = "https://infermieriweb.it";
const API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "prenotazioni@infermieriweb.it";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "InfermieriWeb";

const dataEstesa = (iso) =>
  new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });

async function esegui() {
  const sql = neon((process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL));

  // Le prenotazioni mai convalidate scadono da sole (double opt-in, finestra 60')
  try {
    await sql`UPDATE bookings SET status = 'expired' WHERE status = 'pending' AND created_at < now() - interval '60 minutes'`;
  } catch { /* la pulizia riprova alla prossima ora */ }

  // Esito dell'appuntamento (14/10/26, audit L10 e F4): fino a oggi un appuntamento attivo
  // finito da 3 ore diventava «completato» DA SOLO e al paziente partiva l'invito alla
  // recensione «verificata», anche se la visita non c'era stata. Ora all'infermiere arriva
  // UNA email «Com'è andata?» (guardia esito_chiesto_at) e lo stato lo decide lui: dalla
  // pagina /esito o dall'agenda. Solo allora parte l'invito alla recensione. Massimo 30 a giro;
  // niente email per appuntamenti di oltre 30 giorni fa.
  try {
    const daChiedere = await sql`
      SELECT b.id, b.start_dt, b.customer_name, s.name AS service_name,
             p.name AS professional_name, p.full_name AS professional_full_name, p.email AS professional_email
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN professionals p ON p.id = b.professional_id
      WHERE b.status = 'active' AND b.esito_chiesto_at IS NULL AND p.email <> ''
        AND b.end_dt < now() - interval '3 hours'
        AND b.end_dt > now() - interval '30 days'
      ORDER BY b.end_dt
      LIMIT 30`;
    let chieste = 0;
    for (const b of daChiedere) {
      const mail = emailEsitoProfessionista({
        booking: { name: b.customer_name, start: b.start_dt },
        service: { name: b.service_name },
        link: linkEsito(b.id),
      });
      const ok = await sendEmail({ to: b.professional_email, toName: b.professional_full_name || b.professional_name, replyTo: ASSISTENZA_EMAIL, ...mail });
      if (!ok) continue;
      await sql`UPDATE bookings SET esito_chiesto_at = now() WHERE id = ${b.id}`;
      chieste++;
    }
    if (daChiedere.length) console.log(`[esito] ${chieste}/${daChiedere.length} richieste «com'è andata?» inviate agli infermieri.`);
  } catch (e) { console.log("[esito] errore:", e?.message || e); }

  // Cambio infermiere per mancata risposta (7/10/26): prenotazione online convalidata da
  // più di 24 ore (2 ore se l'appuntamento era a meno di 24 ore dalla richiesta) e
  // l'infermiere non ha premuto «Confermo che ci sarò» → al paziente la proposta di
  // scegliere un altro infermiere. Una volta sola; la prenotazione resta valida.
  try {
    const senzaRisposta = await sql`
      SELECT b.id FROM bookings b
      WHERE b.status = 'active' AND b.source = 'online'
        AND b.accepted_at IS NULL AND b.cambio_inviato_at IS NULL
        AND b.customer_email <> ''
        AND b.created_at >= ${DAL_GIORNO_ACCETTA}::timestamptz
        AND b.start_dt > now() + interval '1 hour'
        AND (b.created_at < now() - interval '24 hours'
             OR (b.start_dt < b.created_at + interval '24 hours' AND b.created_at < now() - interval '2 hours'))
      ORDER BY b.start_dt LIMIT 50`;
    let inviate = 0;
    for (const b of senzaRisposta) { if (await inviaEmailCambio(b.id, "non-risposta")) inviate++; }
    if (senzaRisposta.length) console.log(`[cambio-infermiere] ${inviate}/${senzaRisposta.length} proposte inviate.`);
  } catch (e) { console.log("[cambio-infermiere] errore:", e?.message || e); }

  if (!API_KEY) {
    console.log("[promemoria] BREVO_API_KEY assente: salto il giro.");
    return new Response("no-key");
  }

  // Completa la scheda (13/10/26): 8 approvati su 32 avevano la scheda vuota e non
  // tornavano più. A chi è attivo, a domicilio, approvato da almeno 3 giorni e ancora
  // NON prenotabile perché senza prestazioni o senza orari, parte un promemoria a 3
  // giorni (finestra 3-9) e uno a 10 giorni (da 10 in poi), ciascuno UNA volta sola
  // (guardie promemoria_profilo_3_at / _10_at). Chi è iscritto da mesi riceve solo
  // quello dei 10 giorni. Le soglie si calcolano qui in JS e non con now() in SQL,
  // così l'ambiente di prova può spostare il giorno (IW_ORA_FINTA). Massimo 30 a giro.
  try {
    const adesso = new Date();
    // Partono solo di giorno (9-18 ora italiana): un promemoria alle 23 infastidisce e basta.
    // Per fermarli del tutto: PROMEMORIA_PROFILO_ATTIVO=0 fra le variabili d'ambiente su Render
    // (stesso meccanismo di PULIZIA_ATTIVA in lib/pulizia.js).
    const oraRoma = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hour: "2-digit", hour12: false }).format(adesso));
    const spento = ["0", "false", "no"].includes(String(process.env.PROMEMORIA_PROFILO_ATTIVO || "").toLowerCase());
    if (spento) console.log("[completa-profilo] disattivato (PROMEMORIA_PROFILO_ATTIVO=0)");
    const inOrario = oraRoma >= 9 && oraRoma < 18;
    const daAlmeno3Giorni = new Date(adesso.getTime() - 3 * 86400000).toISOString();
    const candidati = (spento || !inOrario) ? [] : await sql`
      SELECT id, name, full_name, email, created_at, promemoria_profilo_3_at, promemoria_profilo_10_at
      FROM professionals
      WHERE status = 'active' AND email <> ''
        AND tipo IN ('', 'domicilio', 'entrambi')
        AND created_at <= ${daAlmeno3Giorni}::timestamptz
        AND (promemoria_profilo_3_at IS NULL OR promemoria_profilo_10_at IS NULL)
      ORDER BY created_at`;
    if (candidati.length) {
      const stato = await prenotabilitaTutti({ now: adesso });
      // il calcolo di prenotabilità conta anche le consulenze: qui serve sapere se c'è
      // almeno una prestazione A DOMICILIO (è quella che fa uscire in ricerca e mappa)
      const conDomicilio = new Set((await sql`
        SELECT DISTINCT professional_id FROM services
        WHERE active AND deleted_at IS NULL AND catalog_key NOT LIKE 'consulenza-%'`).map((r) => Number(r.professional_id)));
      // chi è senza prestazioni esce dal calcolo PRIMA del controllo orari (motivo
      // «nessun_orario» mai segnalato): gli orari si guardano a parte, così l'email dice
      // tutto ciò che manca. Orario = settimanale fisso oppure un giorno aperto a mano.
      const oggiRoma = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(adesso);
      const conOrari = new Set((await sql`
        SELECT DISTINCT professional_id FROM opening_hours
        UNION
        SELECT DISTINCT professional_id FROM day_overrides
        WHERE jsonb_array_length(fasce) > 0 AND day >= ${oggiRoma}::date`).map((r) => Number(r.professional_id)));
      let inviate = 0, daInviare = 0;
      for (const p of candidati) {
        const s = stato[p.id];
        if (!s || s.prenotabile) continue;
        const tipi = new Set((s.motivi || []).map((m) => m.tipo));
        const mancaPrestazioni = tipi.has("nessuna_prestazione") || !conDomicilio.has(Number(p.id));
        const mancaOrari = tipi.has("nessun_orario") || !conOrari.has(Number(p.id));
        if (!mancaPrestazioni && !mancaOrari) continue; // non prenotabile per altri motivi (blocchi, giorni chiusi…): non è questo promemoria
        const giorni = Math.floor((adesso.getTime() - new Date(p.created_at).getTime()) / 86400000);
        const soglia = giorni >= 10 && !p.promemoria_profilo_10_at ? 10
          : giorni >= 3 && giorni <= 9 && !p.promemoria_profilo_3_at ? 3
          : 0;
        if (!soglia) continue;
        daInviare++;
        if (inviate >= 30) continue; // il resto al prossimo giro
        const mail = emailCompletaProfilo({ name: p.full_name || p.name, mancaPrestazioni, mancaOrari, soglia });
        const ok = await sendEmail({ to: p.email, toName: p.full_name || p.name, replyTo: ASSISTENZA_EMAIL, ...mail });
        if (!ok) continue;
        if (soglia === 10) await sql`UPDATE professionals SET promemoria_profilo_10_at = now() WHERE id = ${p.id}`;
        else await sql`UPDATE professionals SET promemoria_profilo_3_at = now() WHERE id = ${p.id}`;
        inviate++;
      }
      if (daInviare) console.log(`[completa-profilo] ${inviate}/${daInviare} promemoria inviati.`);
    }
  } catch (e) { console.log("[completa-profilo] errore:", e?.message || e); }

  const inScadenza = await sql`
    SELECT b.id, b.start_dt, b.customer_name, b.customer_email, b.cancel_token, b.address, b.city,
           s.name AS service_name, p.name AS professional_name, p.email AS professional_email, p.cancel_hours
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN professionals p ON p.id = b.professional_id
    WHERE b.status = 'active'
      AND b.reminded_at IS NULL
      AND b.customer_email <> ''
      AND b.start_dt >= now() + interval '24 hours'
      AND b.start_dt <  now() + interval '25 hours'`;

  let inviati = 0;
  for (const b of inScadenza) {
    const link = `${SITE}/prenotazione?token=${b.cancel_token}`;
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: b.customer_email, name: b.customer_name }],
        replyTo: { email: b.professional_email },
        subject: `Promemoria: domani ${b.service_name} — ${dataEstesa(b.start_dt)}`,
        htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
  <h2 style="color: #0b3954;">Ci vediamo domani 👋</h2>
  <p>Ciao ${b.customer_name}, ti ricordiamo l'appuntamento:</p>
  <p style="font-size: 16px;"><strong>${b.service_name}</strong> con <strong>${b.professional_name}</strong><br/>
  <strong style="text-transform: capitalize;">${dataEstesa(b.start_dt)}</strong>
  ${b.address ? `<br/>${b.address}${b.city ? ", " + b.city : ""}` : ""}</p>
  <p>Se non puoi più essere presente, disdici (è gratuito fino a ${b.cancel_hours} ore prima):</p>
  <p style="text-align:center; margin: 22px 0;">
    <a href="${link}" style="background:#00897b;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold;">Gestisci o disdici la prenotazione</a>
  </p>
  <p style="color:#7b909b;font-size:13px;">Rispondendo a questa email scrivi direttamente al professionista.
  Per assistenza sulla piattaforma: <a href="mailto:info@infermieriweb.it" style="color:#00897b;">info@infermieriweb.it</a></p>
</div>`,
      }),
    });
    if (r.ok) {
      await sql`UPDATE bookings SET reminded_at = now() WHERE id = ${b.id}`;
      inviati++;
    } else {
      console.error("[promemoria] Brevo errore", r.status, await r.text());
    }
  }
  console.log(`[promemoria] ${inviati}/${inScadenza.length} promemoria inviati.`);
  return new Response(`ok ${inviati}`);
};

