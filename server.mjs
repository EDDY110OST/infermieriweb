// Wrapper di produzione per Render: applica gli header di sicurezza a OGNI risposta
// (anche alle pagine statiche prerenderizzate, che il middleware Astro non intercetta).
// Su Netlify se ne occupava public/_headers, che su Render non viene letto.
import { handler as astroHandler } from "./dist/server/entry.mjs";
import http from "node:http";

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer((req, res) => {
  const setSafe = res.writeHead.bind(res);
  res.writeHead = (status, ...rest) => {
    if (!res.headersSent) {
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    return setSafe(status, ...rest);
  };
  astroHandler(req, res, () => {
    if (!res.headersSent) { res.statusCode = 404; res.end("Not found"); }
  });
});

server.listen(PORT, HOST, () => console.log(`InfermieriWeb in ascolto su ${HOST}:${PORT}`));
