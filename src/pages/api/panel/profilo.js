export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest, pidBersaglio, adminSuAltro } from "../../../lib/auth.js";
import { geocodeWithFallback } from "../../../lib/geocode.js";
import { trovaComune } from "../../../data/comuni.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// GET /api/panel/profilo — dati del profilo del professionista loggato
export async function GET({ request }) {
  const session = sessionFromRequest(request);
  const url = new URL(request.url);
  const pid = pidBersaglio(session, url.searchParams.get("pid"));
  if (!pid) return json({ error: "Non autenticato" }, 401);

  const [profilo] = await sql`
    SELECT slug, name, full_name, gender, profession, albo_name, albo_number, albo_date, vat_number,
           bio, phone, email, address, city, province, region, photo_url, lat, lng, status,
           edited_by, edited_at
    FROM professionals WHERE id = ${pid}`;
  if (!profilo) return json({ error: "Profilo non trovato" }, 404);
  return json({ profilo });
}

// PATCH /api/panel/profilo — il professionista aggiorna i suoi dati;
// se cambia indirizzo/città, il segnaposto sulla mappa si aggiorna da solo
export async function PATCH({ request }) {
  const session = sessionFromRequest(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const pid = pidBersaglio(session, body.pid);
  if (!pid) return json({ error: "Non autenticato" }, 401);
  const admin = session?.role === "admin";

  const [attuale] = await sql`
    SELECT name, full_name, gender, profession, email, bio, phone, address, city, province, region,
           albo_name, albo_number, albo_date, vat_number, status, slug
    FROM professionals WHERE id = ${pid}`;
  if (!attuale) return json({ error: "Profilo non trovato" }, 404);

  const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 1200) : attuale.bio;
  const phone = body.phone !== undefined ? String(body.phone).trim().slice(0, 40) : attuale.phone;
  const address = body.address !== undefined ? String(body.address).trim().slice(0, 200) : attuale.address;
  // Dati professionali: il professionista li completa/corregge quando vuole
  // (la P.IVA spesso arriva dopo l'iscrizione, il numero OPI può cambiare).
  const albo_name = body.albo_name !== undefined ? String(body.albo_name).trim().slice(0, 120) : attuale.albo_name;
  const albo_number = body.albo_number !== undefined ? String(body.albo_number).trim().slice(0, 40) : attuale.albo_number;
  // albo_date è NOT NULL (default ''): mai null, sennò il salvataggio va in errore.
  const albo_date = body.albo_date !== undefined ? String(body.albo_date).trim() : attuale.albo_date;
  const vat_number = body.vat_number !== undefined ? String(body.vat_number).replace(/\D/g, "").slice(0, 11) : attuale.vat_number;

  // Campi identità: modificabili SOLO dall'admin (il professionista non cambia
  // da solo il proprio nome pubblico, l'appellativo, la professione o l'email di contatto).
  let name = attuale.name, full_name = attuale.full_name, gender = attuale.gender,
      profession = attuale.profession, email = attuale.email;
  if (admin) {
    if (body.name !== undefined) name = String(body.name).trim().slice(0, 120) || attuale.name;
    if (body.full_name !== undefined) full_name = String(body.full_name).trim().slice(0, 160);
    if (body.gender !== undefined) { const g = String(body.gender).trim().toLowerCase(); gender = (g === "f" || g === "m") ? g : ""; }
    if (body.profession !== undefined) profession = String(body.profession).trim().slice(0, 80) || attuale.profession;
    if (body.email !== undefined) {
      const e = String(body.email).trim().toLowerCase().slice(0, 160);
      if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return json({ error: "Email di contatto non valida" }, 400);
      email = e;
    }
  }

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
      SET name = ${name}, full_name = ${full_name}, gender = ${gender}, profession = ${profession}, email = ${email},
          bio = ${bio}, phone = ${phone}, address = ${address}, city = ${city}, province = ${province},
          region = ${region}, albo_name = ${albo_name}, albo_number = ${albo_number},
          albo_date = ${albo_date}, vat_number = ${vat_number},
          lat = ${geocoded.lat}, lng = ${geocoded.lng}
      WHERE id = ${pid}`;
  } else {
    await sql`
      UPDATE professionals
      SET name = ${name}, full_name = ${full_name}, gender = ${gender}, profession = ${profession}, email = ${email},
          bio = ${bio}, phone = ${phone}, address = ${address}, city = ${city}, province = ${province},
          region = ${region}, albo_name = ${albo_name}, albo_number = ${albo_number},
          albo_date = ${albo_date}, vat_number = ${vat_number}
      WHERE id = ${pid}`;
  }

  if (adminSuAltro(session, body.pid)) {
    await sql`UPDATE professionals SET edited_by = ${session.name || "admin"}, edited_at = now() WHERE id = ${pid}`;
  }

  // Un profilo "network" (senza P.IVA) che aggiunge ORA una P.IVA valida: avvisa l'admin
  // perché verifichi la P.IVA e attivi la scheda. Non attivo in automatico (la P.IVA va controllata).
  let pivaSegnalata = false;
  const pivaAppenaAggiunta = attuale.status === "network" && !attuale.vat_number && vat_number && vat_number.length === 11;
  if (pivaAppenaAggiunta) {
    pivaSegnalata = true;
    try {
      const { sendEmail } = await import("../../../lib/mailer.js");
      const assistenza = process.env.EMAIL_ASSISTENZA || "info@infermieriweb.it";
      await sendEmail({
        to: assistenza,
        subject: `P.IVA da verificare: ${name} vuole attivare la scheda`,
        html: `<p><strong>${name}</strong> (profilo /p/${attuale.slug}, finora senza P.IVA) ha appena aggiunto la partita IVA <strong>${vat_number}</strong> dal pannello.</p>
               <p>Verificala sull'Agenzia delle Entrate e, se è in regola, porta lo stato del professionista da <em>network</em> a <em>active</em> dall'admin: da quel momento la sua scheda diventa pubblica e prenotabile.</p>`,
      });
    } catch { /* la notifica non deve mai bloccare il salvataggio */ }
  }

  return json({
    ok: true,
    geocoded: geocoded
      ? { precision: geocoded.precision, matched: geocoded.matched, lat: geocoded.lat, lng: geocoded.lng }
      : null,
    posizioneCambiata,
    pivaSegnalata,
  });
}
