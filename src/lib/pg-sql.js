import pg from "pg";

// Collegamento al database con il protocollo Postgres standard (29/10/26): sostituisce
// @neondatabase/serverless, che parla solo con Neon. Stessa interfaccia usata in tutto
// il sito: sql`SELECT … ${valore}` e sql.query(testo, parametri), entrambi restituiscono
// l'elenco delle righe. Funziona con Render Postgres e con Neon (che accetta anche Postgres
// standard), così il passaggio da un database all'altro è solo un cambio di DATABASE_URL.
const pool = new Map(); // una sola connessione condivisa per indirizzo

function poolPer(url) {
  if (!pool.has(url)) {
    // Indirizzo interno di Render (senza punto nel nome host) o database sul computer:
    // rete privata, niente SSL. Indirizzi esterni (Render esterno, Neon): SSL obbligatorio.
    const host = new URL(url).hostname;
    const interno = !host.includes(".") || host === "127.0.0.1";
    const p = new pg.Pool({
      connectionString: url,
      ssl: interno ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    });
    // Una connessione caduta (es. riavvio del database) non deve spegnere il server.
    p.on("error", (e) => console.log(`[db] connessione chiusa: ${e?.message || e}`));
    pool.set(url, p);
  }
  return pool.get(url);
}

export function creaSql(url) {
  // L'indirizzo può contenere sslmode=…: l'SSL lo decidiamo qui sopra.
  const pulito = url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, "");
  const p = poolPer(pulito);
  const sql = (testi, ...valori) => {
    const testo = testi.reduce((acc, pezzo, i) => acc + "$" + i + pezzo);
    return p.query(testo, valori).then((r) => r.rows);
  };
  sql.query = (testo, parametri = []) => p.query(testo, parametri).then((r) => r.rows);
  return sql;
}
