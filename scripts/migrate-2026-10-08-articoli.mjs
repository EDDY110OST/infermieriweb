// Migrazione 8/10/2026 — Articoli scritti e firmati dagli infermieri, validati dagli
// amministratori prima di uscire.
//   - author_professional_id: chi l'ha scritto (NULL = articolo della redazione, come oggi)
//   - status: ai valori di oggi ('draft', 'published') si aggiungono 'review' (in revisione),
//     'changes' (da correggere) e 'rejected' (rifiutato). Gli articoli esistenti NON cambiano.
//   - review_note: la nota degli amministratori all'infermiere (rimandato / rifiutato)
//   - submitted_at / reviewed_at / reviewed_by: invio e decisione
//   - sources: le fonti [{testo, url}] mostrate in fondo all'articolo
// Render NON esegue le migrazioni: si lancia a mano contro Neon, INSIEME al deploy (il codice
// nuovo legge queste colonne). IDEMPOTENTE: si può rilanciare quante volte si vuole.
// Provata due volte di fila sull'ambiente locale PGlite (scripts/prova-locale) prima di Neon.
//   DATABASE_URL="postgres://…" node scripts/migrate-2026-10-08-articoli.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const esisteVincolo = async (nome) =>
  (await sql`SELECT 1 FROM pg_constraint WHERE conname = ${nome}`).length > 0;

// Prima: com'erano gli articoli (per verificare alla fine che nessuno sia cambiato)
const prima = await sql`SELECT id, status, published_at::text AS pub, md5(title || body_raw || body_html) AS impronta FROM articles ORDER BY id`;

const passi = [
  ["articles.author_professional_id", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_professional_id integer`],
  ["articles.review_note", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT ''`],
  ["articles.submitted_at", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone`],
  ["articles.reviewed_at", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone`],
  ["articles.reviewed_by", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS reviewed_by text NOT NULL DEFAULT ''`],
  ["articles.sources", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sources jsonb NOT NULL DEFAULT '[]'::jsonb`],
  // L'autore è una riga di professionals. Nessuna cascata: le righe dei professionisti non si
  // cancellano mai (lapide anonima); se qualcuno ci provasse, il database lo ferma.
  ["articles → professionals (chiave esterna)", async () => {
    if (await esisteVincolo("articles_author_professional_id_fkey")) return;
    await sql`ALTER TABLE articles ADD CONSTRAINT articles_author_professional_id_fkey FOREIGN KEY (author_professional_id) REFERENCES professionals(id)`;
  }],
  // Solo gli stati previsti. Se nel database ci fosse un valore diverso, il vincolo NON si
  // aggiunge (avviso, nessun errore): meglio un controllo in meno che un articolo cambiato.
  ["articles.status (stati ammessi)", async () => {
    if (await esisteVincolo("articles_status_check")) return;
    const strani = await sql`SELECT DISTINCT status FROM articles WHERE status NOT IN ('draft', 'review', 'changes', 'rejected', 'published')`;
    if (strani.length) {
      console.warn(`⚠️  stati non previsti nel database (${strani.map((s) => s.status).join(", ")}): vincolo NON aggiunto`);
      return;
    }
    await sql`ALTER TABLE articles ADD CONSTRAINT articles_status_check CHECK (status IN ('draft', 'review', 'changes', 'rejected', 'published'))`;
  }],
  ["indice articoli per autore", () => sql`CREATE INDEX IF NOT EXISTS ix_articles_author ON articles (author_professional_id, status)`],
  ["indice articoli per stato", () => sql`CREATE INDEX IF NOT EXISTS ix_articles_status ON articles (status, published_at DESC)`],
];

for (const [nome, passo] of passi) {
  try {
    await passo();
    console.log(`✅ ${nome}`);
  } catch (e) {
    console.error(`❌ ${nome}: ${e.message}`);
    process.exit(1);
  }
}

// Verifica finale
const r = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'articles'`;
const have = new Set(r.map((x) => x.column_name));
const attese = ["author_professional_id", "review_note", "submitted_at", "reviewed_at", "reviewed_by", "sources"];
console.log("articles →", attese.map((n) => `${n}:${have.has(n) ? "ok" : "MANCA"}`).join(" "));
console.log("vincoli →", `fkey:${(await esisteVincolo("articles_author_professional_id_fkey")) ? "ok" : "no"}`,
  `stati:${(await esisteVincolo("articles_status_check")) ? "ok" : "no"}`);

const dopo = await sql`SELECT id, status, published_at::text AS pub, md5(title || body_raw || body_html) AS impronta, author_professional_id FROM articles ORDER BY id`;
const mappaPrima = new Map(prima.map((a) => [a.id, a]));
const cambiati = dopo.filter((a) => {
  const p = mappaPrima.get(a.id);
  return p && (p.status !== a.status || p.pub !== a.pub || p.impronta !== a.impronta);
});
const perStato = {};
for (const a of dopo) perStato[a.status] = (perStato[a.status] || 0) + 1;
console.log(`articoli: ${dopo.length} (${Object.entries(perStato).map(([s, n]) => `${s}=${n}`).join(" ")}) · cambiati dalla migrazione: ${cambiati.length} · firmati da infermieri: ${dopo.filter((a) => a.author_professional_id).length}`);
if (cambiati.length) { console.error("❌ qualche articolo è cambiato: controllare", cambiati.map((a) => a.id)); process.exit(1); }
