// Prova locale: il driver "pg" (usato da src/lib/pg-sql.js dal 29/10/26) → stesso Postgres
// in memoria (PGlite) di neon-shim.mjs. Niente tocca il database vero.
import { neon } from "./neon-shim.mjs";

class Pool {
  constructor() { this.sql = neon("prova-locale"); }
  on() {}
  async query(testo, parametri = []) { return { rows: await this.sql.query(testo, parametri) }; }
}
export { Pool };
export default { Pool };
