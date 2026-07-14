import { createSession, readSession } from "./auth.js";

// Token firmato per l'invito alla recensione (45 giorni di validità)
export const tokenRecensione = (bookingId) =>
  createSession({ typ: "recensione", bid: bookingId }, 60 * 60 * 24 * 45);

export const leggiTokenRecensione = (token) => {
  const dati = readSession(token);
  return dati && dati.typ === "recensione" && dati.bid ? dati.bid : null;
};
