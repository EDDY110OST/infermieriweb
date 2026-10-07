// AMBIENTE DI PROVA LOCALE SENZA TOCCARE NEON (7/10/2026)
// ----------------------------------------------------------------------------
// Il sito gira in locale contro un Postgres IN MEMORIA (PGlite) caricato con
// db/schema.sql e con una copia dei dati di produzione (pazienti anonimizzati).
// Il driver Neon viene sostituito al volo da un loader Node: nessuna riga viene
// mai scritta sul database vero.
//
// Uso (dalla cartella sito/):
//   npm i --no-save @electric-sql/pglite            # una volta (non entra in package.json)
//   DATABASE_URL="postgres://…neon…" node scripts/prova-locale/dump-seed.mjs   # SOLO letture → seed.json
//   export NODE_OPTIONS="--import ./scripts/prova-locale/hook.mjs"
//   DATABASE_URL=local SESSION_SECRET=prova npm run build
//   DATABASE_URL=local SESSION_SECRET=prova HOST=127.0.0.1 PORT=4399 node dist/server/entry.mjs
//
// Sessione admin per le prove (cookie iw_session) = payload base64url + "." + HMAC-SHA256(SESSION_SECRET):
//   payload = {uid: 2, pid: 2, role: "admin", name: "Bruno", exp: Date.now() + 3600e3}
// Variabili utili: IW_SHIM_LOG=1 (riepilogo seed), IW_SHIM_LOG=2 (ogni query),
// IW_SEED_JSON / IW_SCHEMA_SQL per percorsi diversi. Il file seed.json è in .gitignore.
import { register } from "node:module";
import { appendFileSync } from "node:fs";
register("./loader.mjs", import.meta.url);

// Email: con IW_MAIL_DUMP=<file> e BREVO_API_KEY qualsiasi, le chiamate a Brevo NON partono:
// ogni email finisce come riga JSON nel file (destinatario, oggetto, html) e si può leggere
// nelle prove (link di convalida, accetta, cambio infermiere…). Nessuna email a persone vere.
// Con IW_MAIL_FALLISCI=<testo> Brevo «rifiuta» (400) i destinatari che lo contengono: serve
// a provare l'elenco delle email non partite (es. «Scrivi agli infermieri»).
if (process.env.IW_MAIL_DUMP) {
  const fetchVero = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith("https://api.brevo.com/")) {
      let body = {};
      try { body = JSON.parse(opts?.body || "{}"); } catch { /* vuoto */ }
      const a = body.to?.[0]?.email || "";
      if (process.env.IW_MAIL_FALLISCI && a.includes(process.env.IW_MAIL_FALLISCI)) {
        return new Response(JSON.stringify({ code: "invalid_parameter", message: "prova locale: indirizzo rifiutato" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      appendFileSync(process.env.IW_MAIL_DUMP, JSON.stringify({ at: new Date().toISOString(), to: body.to, replyTo: body.replyTo, subject: body.subject, html: body.htmlContent }) + "\n");
      return new Response(JSON.stringify({ messageId: "prova-locale" }), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    return fetchVero(url, opts);
  };
}
