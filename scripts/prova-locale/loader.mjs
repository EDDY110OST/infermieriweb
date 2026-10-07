const SHIM = new URL("./neon-shim.mjs", import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier === "@neondatabase/serverless") return { url: SHIM, shortCircuit: true };
  return next(specifier, context);
}
