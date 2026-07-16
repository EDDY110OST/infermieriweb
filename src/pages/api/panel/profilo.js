export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { geocodeWithFallback } from "../../../lib/geocode.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/profilo — dati del profilo del professionista loggato
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const [profilo] = await sql`
    SELECT slug, name, profession, albo_number, bio, phone, email, address, city, province, region,
           photo_url, lat, lng, slug
    FROM professionals WHERE id = ${session.pid}`;
  if (!profilo) return json({ error: "Profilo non trovato" }, 404);
  return json({ profilo });
}

// PATCH /api/panel/profilo — il professionista aggiorna i suoi dati;
// se cambia indirizzo/città, il segnaposto sulla mappa si aggiorna da solo
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const [attuale] = await sql`
    SELECT bio, phone, address, city, province FROM professionals WHERE id = ${session.pid}`;
  if (!attuale) return json({ error: "Profilo non trovato" }, 404);

  const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 1200) : attuale.bio;
  const phone = body.phone !== undefined ? String(body.phone).trim().slice(0, 40) : attuale.phone;
  const address = body.address !== undefined ? String(body.address).trim().slice(0, 200) : attuale.address;
  const city = body.city !== undefined ? String(body.city).trim().slice(0, 80) : attuale.city;
  const province = body.province !== undefined ? String(body.province).trim().slice(0, 60) : attuale.province;

  if (city.length < 2) return json({ error: "La città è obbligatoria" }, 400);

  // Geocodifica solo se posizione cambiata (rispetta la policy Nominatim)
  let geocoded = null;
  const posizioneCambiata =
    address !== attuale.address || city !== attuale.city || province !== attuale.province;

  if (posizioneCambiata) {
    geocoded = await geocodeWithFallback({ address, city, province });
  }

  if (geocoded) {
    await sql`
      UPDATE professionals
      SET bio = ${bio}, phone = ${phone}, address = ${address}, city = ${city}, province = ${province},
          lat = ${geocoded.lat}, lng = ${geocoded.lng}
      WHERE id = ${session.pid}`;
  } else {
    await sql`
      UPDATE professionals
      SET bio = ${bio}, phone = ${phone}, address = ${address}, city = ${city}, province = ${province}
      WHERE id = ${session.pid}`;
  }

  return json({
    ok: true,
    geocoded: geocoded
      ? { precision: geocoded.precision, matched: geocoded.matched, lat: geocoded.lat, lng: geocoded.lng }
      : null,
    posizioneCambiata,
  });
}
