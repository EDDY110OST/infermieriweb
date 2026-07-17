export const prerender = false;

import { sql } from "../../../lib/db.js";

// GET /api/blog-immagine/[slug] — serve la copertina dell'articolo caricata dall'admin
export async function GET({ params }) {
  const slug = String(params.slug || "").slice(0, 80);
  const [a] = await sql`SELECT cover_data FROM articles WHERE slug = ${slug}`;

  if (!a || !a.cover_data) return new Response("Not found", { status: 404 });

  const match = a.cover_data.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=86400",
    },
  });
}
