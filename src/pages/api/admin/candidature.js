export const prerender = false;

import { randomBytes } from "node:crypto";
import { sql } from "../../../lib/db.js";
import { sessionFromRequest, hashPassword } from "../../../lib/auth.js";
import { geocodeWithFallback } from "../../../lib/geocode.js";
import { regioneDaProvincia } from "../../../lib/geografia.js";
import { sendEmail, emailBenvenutoProfessionista } from "../../../lib/mailer.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return null;
  return session;
};

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 60);

// GET /api/admin/candidature — quelle in attesa
export async function GET({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);
  const candidature = await sql`
    SELECT id, name, email, phone, profession, albo_name, albo_number, albo_date,
           vat_number, city, province, address, message, created_at
    FROM applications WHERE status = 'new' ORDER BY created_at`;
  return json({ candidature });
}

// POST /api/admin/candidature {id, action: "approve"|"reject"}
export async function POST({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  const action = String(body.action || "");
  if (!id || !["approve", "reject"].includes(action)) return json({ error: "Dati non validi" }, 400);

  const [cand] = await sql`SELECT * FROM applications WHERE id = ${id} AND status = 'new'`;
  if (!cand) return json({ error: "Candidatura non trovata o già gestita" }, 404);

  if (action === "reject") {
    await sql`UPDATE applications SET status = 'rejected' WHERE id = ${id}`;
    if (cand.email) {
      await sendEmail({
        to: cand.email, toName: cand.name,
        subject: "La tua candidatura a InfermieriWeb",
        html: `<p>Ciao ${cand.name},</p><p>grazie per la candidatura. Al momento non possiamo attivare la tua scheda: ti ricontatteremo se le condizioni cambieranno. Per qualsiasi domanda rispondi pure a questa email.</p>`,
      });
    }
    return json({ ok: true });
  }

  // --- APPROVAZIONE ---
  const [utenteEsistente] = await sql`SELECT id FROM professional_users WHERE lower(email) = ${cand.email.toLowerCase()}`;
  if (utenteEsistente) return json({ error: "Esiste già un account con questa email" }, 409);

  // slug unico
  const base = slugify(cand.name) || `professionista-${id}`;
  let slug = base;
  for (let n = 2; ; n++) {
    const [occupato] = await sql`SELECT id FROM professionals WHERE slug = ${slug}`;
    if (!occupato) break;
    slug = `${base}-${n}`;
  }

  const regione = regioneDaProvincia(cand.province) || "";
  const geo = await geocodeWithFallback({ address: cand.address, city: cand.city, province: cand.province });
  const albo = [cand.albo_name, cand.albo_number ? `n. ${cand.albo_number}` : ""].filter(Boolean).join(" ");
  const passwordTemporanea = `IW-${randomBytes(5).toString("hex")}`;

  const [prof] = await sql`
    INSERT INTO professionals (slug, name, profession, albo_number, bio, photo_url, region, province, city, address, phone, email, lat, lng, status)
    VALUES (
      ${slug}, ${cand.name}, ${cand.profession}, ${albo},
      ${cand.message ? cand.message.slice(0, 1200) : ""},
      '/professionisti-foto/placeholder.svg',
      ${regione}, ${cand.province}, ${cand.city}, ${cand.address},
      ${cand.phone}, ${cand.email},
      ${geo ? geo.lat : null}, ${geo ? geo.lng : null},
      'active'
    ) RETURNING id`;

  await sql`
    INSERT INTO professional_users (professional_id, email, pass_hash, name, role)
    VALUES (${prof.id}, ${cand.email}, ${hashPassword(passwordTemporanea)}, ${cand.name.split(" ")[0]}, 'professional')`;

  await sql`
    INSERT INTO coverage_areas (professional_id, city, province, region)
    VALUES (${prof.id}, ${cand.city}, ${cand.province}, ${regione})`;

  await sql`UPDATE applications SET status = 'approved' WHERE id = ${id}`;

  const benvenuto = emailBenvenutoProfessionista({
    name: cand.name, email: cand.email, passwordTemporanea, slug,
  });
  const emailed = await sendEmail({ to: cand.email, toName: cand.name, ...benvenuto });

  return json({
    ok: true, slug, emailed,
    credenziali: { email: cand.email, password: passwordTemporanea },
    geocodificato: geo ? geo.precision : null,
  });
}
