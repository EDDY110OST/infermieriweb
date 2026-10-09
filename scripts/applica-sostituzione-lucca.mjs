// Sostituzione decisa da Bruno il 9/10/2026: il vecchio articolo «Quanto costa un infermiere a
// domicilio a Lucca?» (id 1, prezzi sbagliati) porta con un 301 al nuovo articolo nazionale
// «Quanto costa un infermiere a domicilio? I prezzi veri 2026» (id 17) ed esce dal sito.
// È la stessa cosa che fa Admin → Blog → «↪️ Sostituisci con…», qui in uno script da lanciare
// SUBITO DOPO il deploy (prima: migrazione → push → deploy).
// IDEMPOTENTE: rilanciato non cambia nulla. Non tocca niente se il 17 non è pubblicato, se gli
// slug non sono quelli attesi o se manca la migrazione.
//   DATABASE_URL="postgres://…" node scripts/applica-sostituzione-lucca.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const VECCHIO = { id: 1, slug: "quanto-costa-infermiere-domicilio-lucca" };
const NUOVO = { id: 17, slug: "quanto-costa-un-infermiere-a-domicilio-i-prezzi-veri-2026" };
const ferma = (msg) => { console.error(`❌ ${msg} Nessuna modifica.`); process.exit(1); };

const [col] = await sql`SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'replaced_by_id'`;
if (!col) ferma("Manca la colonna articles.replaced_by_id: lancia prima scripts/migrate-articoli-sostituiti.mjs.");

const [v] = await sql`SELECT id, slug, title, status, replaced_by_id, author_professional_id FROM articles WHERE id = ${VECCHIO.id}`;
const [n] = await sql`SELECT id, slug, title, status FROM articles WHERE id = ${NUOVO.id}`;
if (!v || v.slug !== VECCHIO.slug) ferma(`L'articolo ${VECCHIO.id} non è «${VECCHIO.slug}».`);
if (!n || n.slug !== NUOVO.slug) ferma(`L'articolo ${NUOVO.id} non è «${NUOVO.slug}».`);
if (n.status !== "published") ferma(`Il nuovo articolo (id ${NUOVO.id}) non è pubblicato (stato: ${n.status}).`);
if (v.author_professional_id) ferma("Il vecchio articolo risulta firmato da un infermiere: va gestito dall'admin.");

if (Number(v.replaced_by_id) === NUOVO.id && v.status !== "published") {
  console.log(`✅ Già fatto: «${v.title}» (id ${v.id}, ${v.status}) è sostituito da «${n.title}» (id ${n.id}).`);
} else {
  const fatto = await sql`
    UPDATE articles SET replaced_by_id = ${NUOVO.id}, status = 'draft', updated_at = now()
    WHERE id = ${VECCHIO.id}
      AND EXISTS (SELECT 1 FROM articles WHERE id = ${NUOVO.id} AND status = 'published')
    RETURNING id, status, replaced_by_id`;
  if (!fatto.length) ferma("Il nuovo articolo non è più pubblicato.");
  // Niente catene: chi portava al vecchio ora porta direttamente al nuovo
  const appiattiti = await sql`
    UPDATE articles SET replaced_by_id = ${NUOVO.id}, updated_at = now()
    WHERE replaced_by_id = ${VECCHIO.id} AND id <> ${NUOVO.id} RETURNING id`;
  await sql`
    INSERT INTO admin_audit (admin, azione, soggetto_id, dettagli)
    VALUES ('script applica-sostituzione-lucca', 'articolo_sostituito', ${VECCHIO.id},
            ${JSON.stringify({ sostituito_da: NUOVO.id, stato_prima: v.status, stato_dopo: "draft", sostituito_prima: v.replaced_by_id || null, appiattiti: appiattiti.map((r) => r.id) })}::jsonb)`;
  console.log(`✅ «${v.title}» (id ${v.id}): ${v.status} → draft, sostituito da «${n.title}» (id ${n.id}).`);
}

const [dopo] = await sql`SELECT status, replaced_by_id FROM articles WHERE id = ${VECCHIO.id}`;
const pubblicati = await sql`SELECT COUNT(*)::int AS n FROM articles WHERE status = 'published'`;
console.log(`Stato: id ${VECCHIO.id} = ${dopo.status}, replaced_by_id = ${dopo.replaced_by_id} · articoli pubblicati: ${pubblicati[0].n}`);
console.log(`Controllo: curl -sI https://infermieriweb.it/articoli/${VECCHIO.slug} → 301, location: /articoli/${NUOVO.slug}`);
