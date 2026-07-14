// Backup notturno del database, spedito via email (fuori dal fornitore).
// Gira ogni notte alle 03:00 UTC (~05:00 in Italia d'estate).
import { eseguiBackup } from "../../src/lib/backup.js";

export default async () => {
  const esito = await eseguiBackup();
  console.log("[backup-notturno]", JSON.stringify(esito.conteggi), esito.ok ? "spedito" : "NON spedito");
  return new Response(esito.ok ? "ok" : "errore-invio", { status: esito.ok ? 200 : 502 });
};

export const config = { schedule: "0 3 * * *" };
