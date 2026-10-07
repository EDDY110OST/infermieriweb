export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { parseBody, readingTime, slugifyTitolo } from "../../../lib/blog.js";
import { sanificaHtml, testoNudo, sezioniDaHtml, rawToHtml } from "../../../lib/blog-html.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  return session && session.role === "admin" ? session : null;
};

// GET /api/admin/blog — tutti gli articoli (anche bozze)
// GET /api/admin/blog?converti=12 — l'HTML per aprire un articolo «raw» nell'editor visuale
export async function GET({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const converti = Number(url.searchParams.get("converti"));
  if (converti) {
    const [a] = await sql`SELECT id, title, body_raw, body_html, body_format FROM articles WHERE id = ${converti}`;
    if (!a) return json({ error: "Articolo non trovato" }, 404);
    return json({ html: a.body_format === "html" ? a.body_html : rawToHtml(a.body_raw, a.title) });
  }
  const articoli = await sql`
    SELECT id, slug, title, category, excerpt, image, status, published_at, body_raw, body_html, body_format, updated_at
    FROM articles ORDER BY COALESCE(published_at, CURRENT_DATE) DESC, id DESC`;
  return json({ articoli });
}

// Due formati: 'raw' (testo con «## Titolo», come sempre) e 'html' (editor visuale: HTML
// che QUI passa dalla lista bianca prima di essere salvato). In entrambi i casi si
// calcolano le sezioni (indice, correlati, SEO) e il tempo di lettura.
const valida = (body) => {
  const title = String(body.title || "").trim().slice(0, 160);
  const category = String(body.category || "").trim().slice(0, 60) || "Salute";
  const excerpt = String(body.excerpt || "").trim().slice(0, 300);
  const image = String(body.image || "").trim().slice(0, 300);
  const formato = body.body_format === "html" ? "html" : "raw";
  if (title.length < 5) return { error: "Il titolo è troppo corto" };
  if (!excerpt) return { error: "Serve il sommario (excerpt): è la frase che compare in elenco e su Google" };
  if (formato === "html") {
    const bodyHtml = sanificaHtml(String(body.body_html || "").slice(0, 200000));
    const testo = testoNudo(bodyHtml);
    if (testo.length < 50) return { error: "Il testo è troppo corto" };
    return { title, category, excerpt, image, formato, bodyHtml, bodyRaw: "", sections: sezioniDaHtml(bodyHtml, title), reading: readingTime(testo) };
  }
  const bodyRaw = String(body.body_raw || "").trim().slice(0, 50000);
  if (bodyRaw.length < 50) return { error: "Il testo è troppo corto" };
  return { title, category, excerpt, image, formato, bodyHtml: "", bodyRaw, sections: parseBody(bodyRaw, title), reading: readingTime(bodyRaw) };
};

// Copertina caricata: data URI (base64) ridimensionata dal browser. undefined = non toccare.
const validaCover = (data) => {
  if (data === undefined || data === null) return { cover: undefined };
  const d = String(data);
  if (!d) return { cover: "" };
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) return { error: "Formato immagine di copertina non valido" };
  if (d.length > 900_000) return { error: "Copertina troppo pesante: usa un'immagine più leggera" };
  return { cover: d };
};

// POST /api/admin/blog — nuovo articolo {title, category, excerpt, image?, body_raw, publish?}
export async function POST({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const v = valida(body);
  if (v.error) return json(v, 400);

  const base = slugifyTitolo(v.title) || "articolo";
  let slug = base;
  for (let n = 2; ; n++) {
    const [occ] = await sql`SELECT id FROM articles WHERE slug = ${slug}`;
    if (!occ) break;
    slug = `${base}-${n}`;
  }

  const cov = validaCover(body.cover_data);
  if (cov.error) return json(cov, 400);
  let image = v.image;
  let coverData = "";
  if (cov.cover) {
    coverData = cov.cover;
    image = `/api/blog-immagine/${slug}?v=${Date.now()}`;
  }

  const publish = !!body.publish;
  const sections = JSON.stringify(v.sections);
  const [nuovo] = await sql`
    INSERT INTO articles (slug, title, category, excerpt, image, cover_data, reading_time, body_raw, body_html, body_format, sections, status, published_at)
    VALUES (${slug}, ${v.title}, ${v.category}, ${v.excerpt}, ${image}, ${coverData}, ${v.reading},
            ${v.bodyRaw}, ${v.bodyHtml}, ${v.formato}, ${sections}::jsonb, ${publish ? "published" : "draft"}, ${publish ? new Date().toISOString().slice(0, 10) : null})
    RETURNING id, slug`;
  return json({ ok: true, id: nuovo.id, slug: nuovo.slug });
}

// PATCH /api/admin/blog — modifica {id, title?, category?, excerpt?, image?, body_raw?, publish?|unpublish?}
export async function PATCH({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [attuale] = await sql`SELECT * FROM articles WHERE id = ${id}`;
  if (!attuale) return json({ error: "Articolo non trovato" }, 404);

  const v = valida({
    title: body.title ?? attuale.title,
    category: body.category ?? attuale.category,
    excerpt: body.excerpt ?? attuale.excerpt,
    image: body.image ?? attuale.image,
    body_format: body.body_format ?? attuale.body_format,
    body_raw: body.body_raw ?? attuale.body_raw,
    body_html: body.body_html ?? attuale.body_html,
  });
  if (v.error) return json(v, 400);

  const cov = validaCover(body.cover_data);
  if (cov.error) return json(cov, 400);
  let image = v.image;
  let coverData = attuale.cover_data || "";
  if (cov.cover) {
    coverData = cov.cover;
    image = `/api/blog-immagine/${attuale.slug}?v=${Date.now()}`;
  } else if (body.remove_cover) {
    coverData = "";
    image = "";
  }

  let status = attuale.status;
  let publishedAt = attuale.published_at;
  if (body.publish) {
    status = "published";
    publishedAt = publishedAt || new Date().toISOString().slice(0, 10);
  }
  if (body.unpublish) status = "draft";

  const sections = JSON.stringify(v.sections);
  // Passando a «html» il testo raw resta com'era (ritorno indietro possibile); con «raw» l'HTML si svuota
  const bodyRaw = v.formato === "html" ? attuale.body_raw : v.bodyRaw;
  await sql`
    UPDATE articles SET title = ${v.title}, category = ${v.category}, excerpt = ${v.excerpt},
      image = ${image}, cover_data = ${coverData}, body_raw = ${bodyRaw}, body_html = ${v.bodyHtml},
      body_format = ${v.formato}, sections = ${sections}::jsonb,
      reading_time = ${v.reading}, status = ${status}, published_at = ${publishedAt},
      updated_at = now()
    WHERE id = ${id}`;
  return json({ ok: true, status });
}

// DELETE /api/admin/blog?id=3
export async function DELETE({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "Id mancante" }, 400);
  await sql`DELETE FROM articles WHERE id = ${id}`;
  return json({ ok: true });
}
