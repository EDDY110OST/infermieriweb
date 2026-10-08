export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { consenti } from "../../../lib/ratelimit.js";
import {
  autoreDellaSessione, contenutoArticolo, validaCover, slugLibero, urlCopertina,
  inviaPerRevisione, avvisaAdminNuovoArticolo,
} from "../../../lib/articoli-infermieri.js";
import { MAX_IN_REVISIONE, MAX_NON_PUBBLICATI } from "../../../lib/articoli-regole.js";

// «📰 I miei articoli» (8/10/26): l'infermiere scrive, salva la bozza e la invia agli
// amministratori. Ogni query è legata a author_professional_id = l'infermiere della
// sessione: la bozza di un collega non si legge e non si tocca (risponde «non trovato»).

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const MODIFICABILI = ["draft", "changes"];

async function leggiCorpo(request) {
  try { return await request.json(); } catch { return null; }
}

// Dopo l'invio: avviso agli amministratori (non deve mai bloccare la risposta)
async function dopoInvio(articolo, autore) {
  try { await avvisaAdminNuovoArticolo({ articolo, autore }); } catch (e) { console.error("[articoli] avviso admin:", e.message); }
}

// GET /api/panel/articoli — i miei articoli · ?id=5 — un articolo completo per modificarlo
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const autore = await autoreDellaSessione(session);
  if (!autore) return json({ error: "Profilo non trovato" }, 404);

  const id = Number(url.searchParams.get("id"));
  if (id) {
    const [a] = await sql`
      SELECT id, slug, title, category, excerpt, image, (cover_data <> '') AS ha_copertina, body_html, sources,
             status, review_note, submitted_at, reviewed_at, published_at, updated_at
      FROM articles WHERE id = ${id} AND author_professional_id = ${autore.id}`;
    if (!a) return json({ error: "Articolo non trovato" }, 404);
    return json({ articolo: a });
  }

  const articoli = await sql`
    SELECT id, slug, title, category, excerpt, image, status, review_note, submitted_at, reviewed_at, published_at, updated_at
    FROM articles WHERE author_professional_id = ${autore.id}
    ORDER BY CASE status WHEN 'changes' THEN 0 WHEN 'draft' THEN 1 WHEN 'review' THEN 2 WHEN 'published' THEN 3 ELSE 4 END,
             updated_at DESC`;
  return json({
    articoli,
    puoScrivere: autore.attivo,
    motivo: autore.motivo,
    inRevisione: articoli.filter((a) => a.status === "review").length,
    limiti: { inRevisione: MAX_IN_REVISIONE },
  });
}

// POST /api/panel/articoli — nuovo articolo {title, category, excerpt, body_html, sources, cover_data?, invia?}
export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const autore = await autoreDellaSessione(session);
  if (!autore) return json({ error: "Profilo non trovato" }, 404);
  if (!autore.attivo) return json({ error: autore.motivo }, 403);
  const body = await leggiCorpo(request);
  if (!body) return json({ error: "Richiesta non valida" }, 400);

  if (!(await consenti(`articoli:${autore.id}`, 40, 60))) {
    return json({ error: "Troppi salvataggi ravvicinati: riprova tra qualche minuto" }, 429);
  }
  const [conta] = await sql`SELECT COUNT(*)::int AS n FROM articles WHERE author_professional_id = ${autore.id} AND status <> 'published'`;
  if (conta.n >= MAX_NON_PUBBLICATI) {
    return json({ error: `Hai già ${MAX_NON_PUBBLICATI} articoli non pubblicati. Elimina qualche bozza prima di iniziarne un'altra.` }, 429);
  }

  const v = contenutoArticolo(body, { perInvio: !!body.invia });
  if (v.error) return json(v, 400);
  const cov = validaCover(body.cover_data);
  if (cov.error) return json(cov, 400);

  // Doppio clic / doppio invio del modulo: lo stesso titolo appena salvato è lo stesso articolo
  const [gemello] = await sql`
    SELECT id, status FROM articles
    WHERE author_professional_id = ${autore.id} AND title = ${v.title} AND status IN ('draft', 'review')
      AND updated_at > now() - interval '2 minutes'
    ORDER BY id DESC LIMIT 1`;
  if (gemello) {
    if (body.invia && gemello.status === "draft") {
      const esito = await inviaPerRevisione(gemello.id, autore.id);
      if (esito.ok) await dopoInvio(esito.articolo, autore);
      if (!esito.ok) return json({ error: esito.error, id: gemello.id }, esito.status);
    }
    return json({ ok: true, id: gemello.id, status: body.invia ? "review" : gemello.status, gia_salvato: true });
  }

  const slug = await slugLibero(v.title);
  const coverData = cov.cover || "";
  const image = coverData ? urlCopertina(slug) : "";
  const [nuovo] = await sql`
    INSERT INTO articles (slug, title, category, excerpt, image, cover_data, reading_time, body_raw, body_html, body_format,
                          sections, sources, status, author_professional_id)
    VALUES (${slug}, ${v.title}, ${v.category}, ${v.excerpt}, ${image}, ${coverData}, ${v.reading}, '', ${v.bodyHtml}, 'html',
            ${JSON.stringify(v.sections)}::jsonb, ${JSON.stringify(v.fonti)}::jsonb, 'draft', ${autore.id})
    RETURNING id`;

  if (body.invia) {
    const esito = await inviaPerRevisione(nuovo.id, autore.id);
    if (!esito.ok) return json({ error: esito.error, id: nuovo.id }, esito.status);
    await dopoInvio(esito.articolo, autore);
    return json({ ok: true, id: nuovo.id, status: "review" });
  }
  return json({ ok: true, id: nuovo.id, status: "draft" });
}

// PATCH /api/panel/articoli — salva {id, …campi} e, con invia: true, lo manda in revisione.
// Si modifica solo una bozza o un articolo rimandato «da correggere».
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const autore = await autoreDellaSessione(session);
  if (!autore) return json({ error: "Profilo non trovato" }, 404);
  if (!autore.attivo) return json({ error: autore.motivo }, 403);
  const body = await leggiCorpo(request);
  if (!body) return json({ error: "Richiesta non valida" }, 400);
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [a] = await sql`SELECT * FROM articles WHERE id = ${id} AND author_professional_id = ${autore.id}`;
  if (!a) return json({ error: "Articolo non trovato" }, 404);
  if (!MODIFICABILI.includes(a.status)) {
    const perche = a.status === "review" ? "È già stato inviato: aspetta la risposta degli amministratori."
      : a.status === "published" ? "È pubblicato: per cambiarlo scrivi agli amministratori."
        : "È stato rifiutato: non si può più modificare.";
    return json({ error: `Questo articolo non si può modificare. ${perche}` }, 409);
  }
  if (!(await consenti(`articoli:${autore.id}`, 40, 60))) {
    return json({ error: "Troppi salvataggi ravvicinati: riprova tra qualche minuto" }, 429);
  }

  const v = contenutoArticolo({
    title: body.title ?? a.title,
    category: body.category ?? a.category,
    excerpt: body.excerpt ?? a.excerpt,
    body_html: body.body_html ?? a.body_html,
    sources: body.sources ?? a.sources,
  }, { perInvio: !!body.invia });
  if (v.error) return json(v, 400);
  const cov = validaCover(body.cover_data);
  if (cov.error) return json(cov, 400);

  // Finché non è mai uscito, l'indirizzo segue il titolo
  const slug = !a.published_at && v.title !== a.title ? await slugLibero(v.title, a.id) : a.slug;
  let coverData = a.cover_data || "";
  if (cov.cover) coverData = cov.cover;
  else if (body.remove_cover) coverData = "";
  const image = coverData ? (cov.cover || slug !== a.slug ? urlCopertina(slug) : a.image) : "";

  const aggiornati = await sql`
    UPDATE articles SET slug = ${slug}, title = ${v.title}, category = ${v.category}, excerpt = ${v.excerpt},
      image = ${image}, cover_data = ${coverData}, body_html = ${v.bodyHtml}, body_format = 'html',
      sections = ${JSON.stringify(v.sections)}::jsonb, sources = ${JSON.stringify(v.fonti)}::jsonb,
      reading_time = ${v.reading}, updated_at = now()
    WHERE id = ${id} AND author_professional_id = ${autore.id} AND status IN ('draft', 'changes')
    RETURNING id`;
  if (!aggiornati.length) return json({ error: "Questo articolo è appena stato inviato: non si può più modificare." }, 409);

  if (body.invia) {
    const esito = await inviaPerRevisione(id, autore.id);
    if (!esito.ok) return json({ error: esito.error, gia_inviato: !!esito.giaInviato }, esito.status);
    await dopoInvio(esito.articolo, autore);
    return json({ ok: true, id, status: "review" });
  }
  return json({ ok: true, id, status: a.status });
}

// DELETE /api/panel/articoli?id=5 — elimina una bozza, un «da correggere» o un rifiutato
export async function DELETE({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);
  const tolti = await sql`
    DELETE FROM articles WHERE id = ${id} AND author_professional_id = ${session.pid}
      AND status IN ('draft', 'changes', 'rejected')
    RETURNING id`;
  if (tolti.length) return json({ ok: true });
  const [a] = await sql`SELECT status FROM articles WHERE id = ${id} AND author_professional_id = ${session.pid}`;
  if (!a) return json({ error: "Articolo non trovato" }, 404);
  return json({ error: a.status === "review" ? "È in revisione: non si può eliminare adesso." : "È pubblicato: per toglierlo scrivi agli amministratori." }, 409);
}
