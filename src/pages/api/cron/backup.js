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

// Backup notturno del database, spedito via email (fuori dal fornitore).
// Gira ogni notte alle 03:00 UTC (~05:00 in Italia d'estate).
import { eseguiBackup } from "../../src/lib/backup.js";

async function esegui() {
  const esito = await eseguiBackup();
  console.log("[backup-notturno]", JSON.stringify(esito.conteggi), esito.ok ? "spedito" : "NON spedito");
  return new Response(esito.ok ? "ok" : "errore-invio", { status: esito.ok ? 200 : 502 });
};

