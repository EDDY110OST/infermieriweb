import { sql } from "./db.js";

/**
 * Limite anti-bot basato sul database (le funzioni serverless non hanno
 * memoria condivisa). Registra l'evento e dice se la soglia è superata.
 * @returns true se l'azione è CONSENTITA
 */
export async function consenti(chiave, limite, finestraMinuti) {
  try {
    // pulizia opportunistica del vecchiume (economica: indice su ts)
    await sql`DELETE FROM rate_events WHERE ts < now() - interval '1 day'`;
    await sql`INSERT INTO rate_events (key) VALUES (${chiave})`;
    const [{ n }] = await sql`
      SELECT COUNT(*) AS n FROM rate_events
      WHERE key = ${chiave} AND ts > now() - (${finestraMinuti} || ' minutes')::interval`;
    return Number(n) <= limite;
  } catch (err) {
    // se il limitatore ha problemi, non deve bloccare il servizio
    console.error("[ratelimit] errore:", err.message);
    return true;
  }
}

export const ipDa = (request) =>
  request.headers.get("x-nf-client-connection-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "sconosciuto";
