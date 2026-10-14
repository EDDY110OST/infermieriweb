export const prerender = false;

import { sendEmail, ASSISTENZA_EMAIL } from "../../lib/mailer.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TIPI = { recensione: "Recensione", scheda: "Scheda di un professionista", articolo: "Articolo del blog", altro: "Altro" };

// POST /api/segnala — segnalazione di un contenuto (14/10/26, DSA art. 16). Non si salva
// nel database: va all'assistenza (info@, non a un singolo gestore: uno dei due è anche
// infermiere e potrebbe essere il soggetto della segnalazione) e chi segnala riceve la
// ricevuta. La decisione motivata si manda poi rispondendo a quella email.
export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }

  const tipo = TIPI[body.tipo] ? body.tipo : "altro";
  const url = String(body.url || "").trim().slice(0, 300);
  const motivo = String(body.motivo || "").trim().slice(0, 3000);
  const nome = String(body.nome || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);

  if (motivo.length < 10) return json({ error: "Spiega in poche parole cosa non va (almeno 10 caratteri)" }, 400);
  if (!email.includes("@") || email.length < 6) return json({ error: "Serve un'email valida per risponderti" }, 400);
  if (body.buonaFede !== true) return json({ error: "Conferma che la segnalazione è fatta in buona fede" }, 400);
  if (body.privacy !== true) return json({ error: "Conferma di aver letto l'informativa privacy" }, 400);
  if (!(await consenti(`segnala:${ipDa(request)}`, 5, 60))) {
    return json({ error: "Troppe segnalazioni ravvicinate: riprova più tardi" }, 429);
  }

  const quando = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" });
  const ok = await sendEmail({
    to: ASSISTENZA_EMAIL,
    replyTo: email,
    subject: `🚩 Segnalazione: ${TIPI[tipo]}${url ? ` — ${url.slice(0, 60)}` : ""}`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
      <h2 style="color: #0b3954;">Nuova segnalazione di un contenuto</h2>
      <table style="width: 100%; font-size: 15px;">
        <tr><td style="padding: 4px 0; color: #7b909b;">Cosa</td><td style="font-weight: bold;">${esc(TIPI[tipo])}</td></tr>
        <tr><td style="padding: 4px 0; color: #7b909b;">Dove</td><td>${esc(url) || "—"}</td></tr>
        <tr><td style="padding: 4px 0; color: #7b909b;">Chi segnala</td><td>${esc(nome) || "—"} · ${esc(email)}</td></tr>
        <tr><td style="padding: 4px 0; color: #7b909b;">Quando</td><td>${esc(quando)}</td></tr>
      </table>
      <p style="background: #f6f9f9; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap;">${esc(motivo)}</p>
      <p style="color: #7b909b; font-size: 13px;">Ha dichiarato di segnalare in buona fede. Esamina il contenuto e rispondi a questa email con la decisione e il motivo (regolamento DSA, art. 16-17). Se togli un contenuto, avvisa anche chi l'ha scritto spiegando perché.</p>
    </div>`,
  });
  if (!ok) return json({ error: "Non siamo riusciti a inviare la segnalazione: riprova o scrivi a info@infermieriweb.it" }, 502);

  try {
    await sendEmail({
      to: email, toName: nome || undefined, replyTo: ASSISTENZA_EMAIL,
      subject: "Abbiamo ricevuto la tua segnalazione — InfermieriWeb",
      html: `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #10222e;">
        <h2 style="color: #0b3954;">Segnalazione ricevuta</h2>
        <p>Ciao${nome ? " " + esc(nome) : ""}, grazie: abbiamo ricevuto la tua segnalazione (${esc(TIPI[tipo]).toLowerCase()}${url ? `: ${esc(url)}` : ""}).</p>
        <p>La esaminiamo e ti scriviamo cosa abbiamo deciso e perché. Se vuoi aggiungere qualcosa, rispondi a questa email.</p>
      </div>`,
    });
  } catch { /* la segnalazione è comunque arrivata */ }

  return json({ ok: true });
}
