export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { geocodeWithFallback } from "../../../lib/geocode.js";
import { trovaComune } from "../../../data/comuni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/profilo — dati del profilo del professionista loggato
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return json({ error: "Non autenticato" }, 401);

  const [profilo] = await sql`
    SELECT slug, name, profession, albo_name, albo_number, albo_date, vat_number,
           bio, phone, email, address, city, province, region, photo_url, lat, lng
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
    SELECT bio, phone, address, city, province, region, albo_name, albo_number, albo_date, vat_number
    FROM professionals WHERE id = ${session.pid}`;
  if (!attuale) return json({ error: "Profilo non trovato" }, 404);

  const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 1200) : attuale.bio;
  const phone = body.phone !== undefined ? String(body.phone).trim().slice(0, 40) : attuale.phone;
  const address = body.address !== undefined ? String(body.address).trim().slice(0, 200) : attuale.address;
  // Dati professionali: il professionista li completa/corregge quando vuole
  // (la P.IVA spesso arriva dopo l'iscrizione, il numero OPI può cambiare).
  const albo_name = body.albo_name !== undefined ? String(body.albo_name).trim().slice(0, 120) : attuale.albo_name;
  const albo_number = body.albo_number !== undefined ? String(body.albo_number).trim().slice(0, 40) : attuale.albo_number;
  const albo_date = body.albo_date !== undefined ? (String(body.albo_date).trim() || null) : attuale.albo_date;
  const vat_number = body.vat_number !== undefined ? String(body.vat_number).replace(/\D/g, "").slice(0, 11) : attuale.vat_number;

  if (vat_number && vat_number.length !== 11) {
    return json({ error: "La partita IVA, se la indichi, deve avere 11 cifre" }, 400);
  }
  if (albo_number && !albo_name) {
    return json({ error: "Se indichi il numero di iscrizione, indica anche l'albo/OPI di appartenenza" }, 400);
  }

  // Il comune deve esistere nell'elenco ufficiale ISTAT: provincia e regione
  // le ricaviamo da lì, così il segnaposto sulla mappa cade sempre giusto.
  let city = attuale.city;
  let province = attuale.province;
  let region = attuale.region;
  if (body.city !== undefined) {
    const scritto = String(body.city).trim();
    if (scritto.length < 2) return json({ error: "Il comune è obbligatorio" }, 400);
    const comune = trovaComune(scritto, body.sigla || null) || trovaComune(scritto);
    if (!comune) {
      return json({ error: `"${scritto}" non è un comune italiano: scegli il comune dalla tendina dei suggerimenti` }, 400);
    }
    city = comune.nome;
    province = comune.provincia;
    region = comune.regione;
  }

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
          region = ${region}, albo_name = ${albo_name}, albo_number = ${albo_number},
          albo_date = ${albo_date}, vat_number = ${vat_number},
          lat = ${geocoded.lat}, lng = ${geocoded.lng}
      WHERE id = ${session.pid}`;
  } else {
    await sql`
      UPDATE professionals
      SET bio = ${bio}, phone = ${phone}, address = ${address}, city = ${city}, province = ${province},
          region = ${region}, albo_name = ${albo_name}, albo_number = ${albo_number},
          albo_date = ${albo_date}, vat_number = ${vat_number}
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
