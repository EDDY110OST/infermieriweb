const SHIM = new URL("./neon-shim.mjs", import.meta.url).href;
const SHIM_PG = new URL("./pg-shim.mjs", import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier === "@neondatabase/serverless") return { url: SHIM, shortCircuit: true };
  // Dal 29/10/26 il sito parla Postgres standard (lib/pg-sql.js → "pg"): stessa sostituzione.
  if (specifier === "pg") return { url: SHIM_PG, shortCircuit: true };
  return next(specifier, context);
}
