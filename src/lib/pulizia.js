import { sql } from "./db.js";

/**
 * Pulizia periodica dei dati personali: fa davvero quello che promette
 * l'informativa privacy ("i dati non restano per sempre").
 *
 * Gira ogni notte PRIMA del backup, e solo se il backup di quella notte è
 * davvero possibile (BACKUP_KEY impostata): senza copia di sicurezza non si
 * cancella niente. Per fermarla del tutto: PULIZIA_ATTIVA=0 fra le variabili
 * d'ambiente su Render. In pausa conta soltanto, senza toccare niente.
 *
 * Finestre (le stesse scritte nell'informativa privacy):
 *  - prenotazioni: anonimizzate 24 mesi dopo l'appuntamento (la riga resta, senza
 *    più nome, telefono, email e indirizzo: servono solo i conteggi)
 *  - candidature non accettate: eliminate dopo 12 mesi
 *  - richieste di informazioni: eliminate dopo 24 mesi
 *  - recensioni respinte: eliminate dopo 12 mesi
 *  - lista d'attesa e newsletter: restano finché l'interessato non si cancella
 */

export const MESI_PRENOTAZIONI = 24;
export const MESI_CANDIDATURE = 12;
export const MESI_RICHIESTE = 24;
export const MESI_RECENSIONI_RESPINTE = 12;

const spenta = () => ["0", "false", "no"].includes(String(process.env.PULIZIA_ATTIVA || "").toLowerCase());

/**
 * @param {{ backupPossibile?: boolean }} opzioni
 */
export async function eseguiPulizia({ backupPossibile = false } = {}) {
  const simulazione = spenta() || !backupPossibile;
  const esito = { simulazione, motivo: spenta() ? "disattivata (PULIZIA_ATTIVA=0)" : !backupPossibile ? "nessun backup possibile: manca BACKUP_KEY" : "" };

  try {
    // 1. Prenotazioni vecchie → anonimizzate (non cancellate: i conteggi restano)
    const daAnonimizzare = await sql`
      SELECT COUNT(*) AS n FROM bookings
      WHERE start_dt < now() - (${MESI_PRENOTAZIONI} || ' months')::interval
        AND customer_name <> 'anonimizzato'`;
    esito.prenotazioni = Number(daAnonimizzare[0].n);
    if (!simulazione && esito.prenotazioni > 0) {
      await sql`
        UPDATE bookings
        SET customer_name = 'anonimizzato', customer_phone = '', customer_email = '',
            address = '', cancel_token = '', consent_text = ''
        WHERE start_dt < now() - (${MESI_PRENOTAZIONI} || ' months')::interval
          AND customer_name <> 'anonimizzato'`;
    }

    // 2. Candidature non accettate
    const candidature = await sql`
      SELECT COUNT(*) AS n FROM applications
      WHERE status <> 'approved' AND created_at < now() - (${MESI_CANDIDATURE} || ' months')::interval`;
    esito.candidature = Number(candidature[0].n);
    if (!simulazione && esito.candidature > 0) {
      await sql`
        DELETE FROM applications
        WHERE status <> 'approved' AND created_at < now() - (${MESI_CANDIDATURE} || ' months')::interval`;
    }

    // 3. Richieste di informazioni
    const richieste = await sql`
      SELECT COUNT(*) AS n FROM info_requests
      WHERE created_at < now() - (${MESI_RICHIESTE} || ' months')::interval`;
    esito.richieste = Number(richieste[0].n);
    if (!simulazione && esito.richieste > 0) {
      await sql`DELETE FROM info_requests WHERE created_at < now() - (${MESI_RICHIESTE} || ' months')::interval`;
    }

    // 4. Recensioni respinte (quelle pubblicate restano sulla scheda)
    const recensioni = await sql`
      SELECT COUNT(*) AS n FROM reviews
      WHERE status = 'rejected' AND created_at < now() - (${MESI_RECENSIONI_RESPINTE} || ' months')::interval`;
    esito.recensioniRespinte = Number(recensioni[0].n);
    if (!simulazione && esito.recensioniRespinte > 0) {
      await sql`
        DELETE FROM reviews
        WHERE status = 'rejected' AND created_at < now() - (${MESI_RECENSIONI_RESPINTE} || ' months')::interval`;
    }
  } catch (err) {
    esito.errore = err.message;
  }

  return esito;
}
