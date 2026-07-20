import { avviaScheduler } from "./lib/scheduler.js";
import { traduciHtmlMain } from "./lib/traduci.js";

// Scheduler interno (Render non ha le funzioni schedulate di Netlify): parte una
// sola volta al caricamento del modulo, cioè all'avvio del server.
avviaScheduler();

// Lingua richiesta dalla richiesta: ?lang= vince, poi il cookie, default italiano
function langDi(context) {
  const param = new URL(context.request.url).searchParams.get("lang");
  if (param === "en" || param === "it") return param;
  return context.cookies.get("iw_lang")?.value === "en" ? "en" : "it";
}

// Header di sicurezza sulle risposte SSR
export const onRequest = async (context, next) => {
  const response = await next();
  const headers = response.headers;
  if (!headers.has("X-Frame-Options")) headers.set("X-Frame-Options", "DENY");
  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!headers.has("Strict-Transport-Security")) headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!headers.has("Permissions-Policy")) headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");

  // Traduzione automatica del CORPO pagina per la versione inglese (header/footer
  // sono già tradotti dai dizionari). Solo pagine HTML pubbliche; area riservata/admin/api
  // restano in italiano. Senza chiave DeepL la funzione ritorna l'HTML invariato (graceful).
  try {
    const url = new URL(context.request.url);
    const riservata = url.pathname.startsWith("/api") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/area-professionisti");
    const isHtml = (headers.get("content-type") || "").includes("text/html");
    if (langDi(context) === "en" && isHtml && response.status === 200 && !riservata) {
      const html = await response.text();
      const tradotto = await traduciHtmlMain(html, "en");
      const nuovi = new Headers(headers);
      nuovi.delete("content-length"); // il corpo cambia lunghezza
      return new Response(tradotto, { status: response.status, statusText: response.statusText, headers: nuovi });
    }
  } catch { /* qualsiasi errore: si serve la pagina italiana, mai una pagina rotta */ }

  return response;
};
