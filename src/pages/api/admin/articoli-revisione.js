export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import {
  contenutoArticolo, validaCover, slugLibero, urlCopertina, mandaEsitoAllInfermiere,
  registraDecisione, contaDaApprovare,
} from "../../../lib/articoli-infermieri.js";
import { NOTA_MIN } from "../../../lib/articoli-regole.js";

// Coda «Da approvare» (8/10/26): gli articoli inviati dagli infermieri. Gli admin
// approvano e pubblicano, correggono e pubblicano, rimandano da correggere (nota
// obbligatoria) o rifiutano (nota obbligatoria). Ogni decisione: email all'infermiere +
// riga in admin_audit senza dati personali.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const s = sessionFromRequest(request);
  return s && s.role === "admin" ? s : null;
};

// GET — la coda (dal più vecchio) + gli articoli tornati in bozza perché l'autore è stato eliminato
export async function GET({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const coda = await sql`
    SELECT a.id, a.slug, a.title, a.category, a.excerpt, a.image, a.body_html, a.sources, a.reading_time,
           a.review_note, a.submitted_at, a.updated_at,
           p.id AS autore_id, p.name AS autore_nome, p.slug AS autore_slug, p.photo_url AS autore_foto,
           p.albo_name AS autore_albo, p.albo_number AS autore_numero, p.status AS autore_stato
    FROM articles a JOIN professionals p ON p.id = a.author_professional_id
    WHERE a.status = 'review'
    ORDER BY a.submitted_at ASC NULLS LAST, a.id ASC`;
  return json({ coda, da_approvare: coda.length });
}

// POST {id, azione: approva | modifica | rimanda | rifiuta, nota?, …campi per «modifica»}
export async function POST({ request }) {
  const session = soloAdmin(request);
  if (!session) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  const azione = String(body.azione || "");
  if (!id || !["approva", "modifica", "rimanda", "rifiuta"].includes(azione)) return json({ error: "Dati non validi" }, 400);

  const [a] = await sql`SELECT * FROM articles WHERE id = ${id}`;
  if (!a || !a.author_professional_id) return json({ error: "Articolo non trovato" }, 404);
  if (a.status !== "review") {
    return json({ error: "Questo articolo non è più in revisione: forse l'altro amministratore l'ha già gestito. Ricarica la pagina." }, 409);
  }
  const chi = session.name || "admin";

  // Rimanda da correggere / Rifiuta: la nota è obbligatoria (è quello che legge l'infermiere)
  if (azione === "rimanda" || azione === "rifiuta") {
    const nota = String(body.nota || "").trim().slice(0, 2000);
    if (nota.length < NOTA_MIN) return json({ error: `Scrivi una nota per l'infermiere (almeno ${NOTA_MIN} caratteri): spiega cosa cambiare.` }, 400);
    const stato = azione === "rimanda" ? "changes" : "rejected";
    const fatto = await sql`
      UPDATE articles SET status = ${stato}, review_note = ${nota}, reviewed_at = now(), reviewed_by = ${chi}, updated_at = now()
      WHERE id = ${id} AND status = 'review' RETURNING id, slug, title`;
    if (!fatto.length) return json({ error: "Questo articolo è appena stato gestito da un altro amministratore." }, 409);
    const emailInviata = await mandaEsitoAllInfermiere({ esito: stato, articolo: fatto[0], autoreId: a.author_professional_id, nota });
    await registraDecisione(session, azione === "rimanda" ? "articolo_rimandato" : "articolo_rifiutato", id,
      { stato_prima: "review", stato_dopo: stato, email_inviata: emailInviata, nota_caratteri: nota.length });
    return json({ ok: true, status: stato, email_inviata: emailInviata, da_approvare: await contaDaApprovare() });
  }

  // Approva (così com'è) o Modifica e pubblica (con le correzioni dell'admin)
  let campi = {
    title: a.title, category: a.category, excerpt: a.excerpt, bodyHtml: a.body_html,
    sections: a.sections, fonti: a.sources, reading: a.reading_time,
  };
  let coverData = a.cover_data || "";
  let coverNuova = false;
  if (azione === "modifica") {
    const v = contenutoArticolo({
      title: body.title ?? a.title,
      category: body.category ?? a.category,
      excerpt: body.excerpt ?? a.excerpt,
      body_html: body.body_html ?? a.body_html,
      sources: body.sources ?? a.sources,
    }, { perInvio: true });
    if (v.error) return json(v, 400);
    campi = v;
    const cov = validaCover(body.cover_data);
    if (cov.error) return json(cov, 400);
    if (cov.cover) { coverData = cov.cover; coverNuova = true; } else if (body.remove_cover) coverData = "";
  }
  // Prima pubblicazione: l'indirizzo segue il titolo definitivo
  const slug = !a.published_at && campi.title !== a.title ? await slugLibero(campi.title, a.id) : a.slug;
  const image = coverData ? (coverNuova || slug !== a.slug ? urlCopertina(slug) : a.image) : "";

  const fatto = await sql`
    UPDATE articles SET slug = ${slug}, title = ${campi.title}, category = ${campi.category}, excerpt = ${campi.excerpt},
      body_html = ${campi.bodyHtml}, body_format = 'html', sections = ${JSON.stringify(campi.sections)}::jsonb,
      sources = ${JSON.stringify(campi.fonti)}::jsonb, reading_time = ${campi.reading},
      image = ${image}, cover_data = ${coverData},
      status = 'published', published_at = COALESCE(published_at, (now() AT TIME ZONE 'Europe/Rome')::date),
      reviewed_at = now(), reviewed_by = ${chi}, review_note = '', updated_at = now()
    WHERE id = ${id} AND status = 'review'
    RETURNING id, slug, title`;
  if (!fatto.length) return json({ error: "Questo articolo è appena stato gestito da un altro amministratore." }, 409);
  const emailInviata = await mandaEsitoAllInfermiere({ esito: "published", articolo: fatto[0], autoreId: a.author_professional_id });
  await registraDecisione(session, azione === "modifica" ? "articolo_modificato_e_pubblicato" : "articolo_approvato", id,
    { stato_prima: "review", stato_dopo: "published", email_inviata: emailInviata });
  return json({ ok: true, status: "published", slug: fatto[0].slug, email_inviata: emailInviata, da_approvare: await contaDaApprovare() });
}
