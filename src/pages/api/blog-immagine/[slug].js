export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

// GET /api/blog-immagine/[slug] — serve la copertina dell'articolo caricata dall'admin
// o dall'infermiere autore. Finché l'articolo non è pubblicato la vedono solo gli
// amministratori e chi l'ha scritto (8/10/26: le bozze degli infermieri restano private).
export async function GET({ params, request }) {
  const slug = String(params.slug || "").slice(0, 80);
  const [a] = await sql`SELECT cover_data, status, author_professional_id FROM articles WHERE slug = ${slug}`;

  if (!a || !a.cover_data) return new Response("Not found", { status: 404 });
  if (a.status !== "published") {
    const s = sessionFromRequest(request);
    const puo = s && (s.role === "admin" || (a.author_professional_id && Number(s.pid) === Number(a.author_professional_id)));
    if (!puo) return new Response("Not found", { status: 404 });
  }

  const match = a.cover_data.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      // le bozze non restano in cache condivise
      "Cache-Control": a.status === "published" ? "public, max-age=86400" : "private, no-store",
    },
  });
}
