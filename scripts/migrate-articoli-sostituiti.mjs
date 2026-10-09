// Migrazione 9/10/2026 — Articoli SOSTITUITI: il vecchio indirizzo porta (301) a un altro articolo.
//   - articles.replaced_by_id: l'articolo che lo sostituisce (NULL = nessuna sostituzione).
//     Un articolo sostituito NON è pubblicato (esce da elenchi, home, sitemap, correlati…):
//     resta solo la sua riga, che fa da redirect. Se il sostituto viene eliminato, il
//     collegamento si toglie da solo (ON DELETE SET NULL) e il vecchio indirizzo torna 404.
//   - vincolo: un articolo non può sostituire sé stesso.
// Render NON esegue le migrazioni: si lancia a mano contro Neon PRIMA del deploy (il codice
// nuovo legge questa colonna). IDEMPOTENTE: si può rilanciare quante volte si vuole.
// Nessun articolo cambia: la colonna nasce vuota (verifica alla fine).
//   DATABASE_URL="postgres://…" node scripts/migrate-articoli-sostituiti.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const esisteVincolo = async (nome) =>
  (await sql`SELECT 1 FROM pg_constraint WHERE conname = ${nome}`).length > 0;

const prima = await sql`SELECT id, status, slug, published_at::text AS pub, md5(title || body_raw || body_html) AS impronta FROM articles ORDER BY id`;

const passi = [
  ["articles.replaced_by_id", () => sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS replaced_by_id integer`],
  ["articles → articles (chiave esterna, ON DELETE SET NULL)", async () => {
    if (await esisteVincolo("articles_replaced_by_id_fkey")) return;
    await sql`ALTER TABLE articles ADD CONSTRAINT articles_replaced_by_id_fkey FOREIGN KEY (replaced_by_id) REFERENCES articles(id) ON DELETE SET NULL`;
  }],
  ["articles: niente sostituzione con sé stesso", async () => {
    if (await esisteVincolo("articles_replaced_by_not_self")) return;
    await sql`ALTER TABLE articles ADD CONSTRAINT articles_replaced_by_not_self CHECK (replaced_by_id IS NULL OR replaced_by_id <> id)`;
  }],
  ["indice articoli sostituiti", () => sql`CREATE INDEX IF NOT EXISTS ix_articles_replaced_by ON articles (replaced_by_id) WHERE replaced_by_id IS NOT NULL`],
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
const [col] = await sql`SELECT data_type FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'replaced_by_id'`;
console.log("articles.replaced_by_id →", col ? col.data_type : "MANCA",
  `· fkey:${(await esisteVincolo("articles_replaced_by_id_fkey")) ? "ok" : "no"}`,
  `· non-sé-stesso:${(await esisteVincolo("articles_replaced_by_not_self")) ? "ok" : "no"}`);

const dopo = await sql`SELECT id, status, slug, published_at::text AS pub, md5(title || body_raw || body_html) AS impronta, replaced_by_id FROM articles ORDER BY id`;
const mappaPrima = new Map(prima.map((a) => [a.id, a]));
const cambiati = dopo.filter((a) => {
  const p = mappaPrima.get(a.id);
  return p && (p.status !== a.status || p.slug !== a.slug || p.pub !== a.pub || p.impronta !== a.impronta);
});
console.log(`articoli: ${dopo.length} · pubblicati: ${dopo.filter((a) => a.status === "published").length} · sostituiti: ${dopo.filter((a) => a.replaced_by_id).length} · cambiati dalla migrazione: ${cambiati.length}`);
if (!col || cambiati.length) { console.error("❌ qualcosa non torna: controllare", cambiati.map((a) => a.id)); process.exit(1); }
