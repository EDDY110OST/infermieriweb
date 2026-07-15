// Header di sicurezza sulle risposte SSR (le pagine statiche li prendono da public/_headers)
export const onRequest = async (context, next) => {
  const response = await next();
  const headers = response.headers;
  if (!headers.has("X-Frame-Options")) headers.set("X-Frame-Options", "DENY");
  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!headers.has("Permissions-Policy")) headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  return response;
};
