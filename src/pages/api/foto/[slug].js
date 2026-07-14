export const prerender = false;

import { sql } from "../../../lib/db.js";

// GET /api/foto/[slug] — serve la foto del professionista caricata dal pannello
export async function GET({ params }) {
  const slug = String(params.slug || "").slice(0, 80);
  const [prof] = await sql`
    SELECT photo_data FROM professionals WHERE slug = ${slug} AND status = 'active'`;

  if (!prof || !prof.photo_data) return new Response("Not found", { status: 404 });

  const match = prof.photo_data.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=86400",
    },
  });
}
