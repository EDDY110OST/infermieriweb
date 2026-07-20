import { avviaScheduler } from "./lib/scheduler.js";

// Scheduler interno (Render non ha le funzioni schedulate di Netlify): parte una
// sola volta al caricamento del modulo, cioè all'avvio del server.
avviaScheduler();

// Header di sicurezza sulle risposte SSR
export const onRequest = async (context, next) => {
  const response = await next();
  const headers = response.headers;
  if (!headers.has("X-Frame-Options")) headers.set("X-Frame-Options", "DENY");
  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!headers.has("Strict-Transport-Security")) headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!headers.has("Permissions-Policy")) headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  return response;
};
