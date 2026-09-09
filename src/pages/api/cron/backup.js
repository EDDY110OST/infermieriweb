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

// Backup notturno: prima la pulizia dei dati scaduti (tempi di conservazione
// dichiarati nell'informativa privacy), poi la copia cifrata spedita via email.
// Gira ogni notte alle 03:00 UTC (~05:00 in Italia d'estate).
import { eseguiBackup } from "../../../lib/backup.js";

async function esegui() {
  const esito = await eseguiBackup();
  console.log("[backup-notturno]", JSON.stringify(esito.conteggi), "pulizia:", JSON.stringify(esito.pulizia),
    esito.ok ? "spedito (cifrato)" : esito.cifrato === false ? "NON spedito: manca BACKUP_KEY" : "NON spedito");
  return new Response(esito.ok ? "ok" : "errore-invio", { status: esito.ok ? 200 : 502 });
};

