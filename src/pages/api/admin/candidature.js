export const prerender = false;

import { randomBytes } from "node:crypto";
import { sql } from "../../../lib/db.js";
import { sessionFromRequest, hashPassword } from "../../../lib/auth.js";
import { geocodePerMappa, jitterPerId } from "../../../lib/geocode.js";
import { trovaComune } from "../../../data/comuni.js";
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
  const admin = sessionFromRequest(request);
  if (!admin || admin.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

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

  // --- GATE DI VERIFICA (tutela legale): non si attiva chi non è stato verificato ---
  if (!body.verificaPiva || !body.verificaAlbo) {
    return json({ error: "Approvazione bloccata: conferma di aver verificato partita IVA (Agenzia Entrate) e iscrizione all'albo (FNOPI)." }, 400);
  }
  const verificatoDa = admin?.email || admin?.name || "admin";

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

  // regione E provincia dal comune vero (elenco ISTAT): più affidabile del testo
  // scritto dal candidato (che a volte mette la sigla, es. "Lu" invece di "Lucca")
  const comuneCand = trovaComune(cand.city);
  const regione = comuneCand?.regione || "";
  const provincia = comuneCand?.provincia || cand.province;
  // le zone coperte sono comuni singoli validi: le passo come ripiego per la mappa
  const zoneCand = String(cand.city || "").split(",").map((c) => ({ city: c.trim(), province: provincia })).filter((z) => z.city);
  const geo = await geocodePerMappa({ address: cand.address, city: (zoneCand[0]?.city || cand.city), province: provincia, zone: zoneCand });
  // password scelta dal candidato in registrazione; ripiego a temporanea solo per i vecchi record senza hash
  // Nome pubblico: "Dott./Dott.ssa Nome I." — il nome completo resta riservato
  // (va solo nell'email di conferma al paziente prenotato)
  const parti = String(cand.name).trim().split(/\s+/);
  const cognome = parti.length > 1 ? parti[parti.length - 1] : "";
  const nomi = parti.length > 1 ? parti.slice(0, -1).join(" ") : parti[0];
  const titolo = cand.gender === "f" ? "Dott.ssa" : "Dott.";
  const nomePubblico = `${titolo} ${nomi}${cognome ? " " + cognome[0].toUpperCase() + "." : ""}`;

  const passwordScelta = cand.pass_hash && cand.pass_hash.startsWith("scrypt$");
  const passwordTemporanea = passwordScelta ? null : `IW-${randomBytes(5).toString("hex")}`;

  const [prof] = await sql`
    INSERT INTO professionals (slug, name, full_name, gender, profession, albo_name, albo_number, albo_date, bio, photo_url, region, province, city, address, phone, email, lat, lng, status, vat_number, verified_piva_at, verified_albo_at, verified_by)
    VALUES (
      ${slug}, ${nomePubblico}, ${cand.name}, ${cand.gender || ''}, ${cand.profession}, ${cand.albo_name || ''}, ${cand.albo_number || ''}, ${cand.albo_date || ''},
      ${cand.message ? cand.message.slice(0, 1200) : ""},
      '/professionisti-foto/placeholder.svg',
      ${regione}, ${provincia}, ${cand.city}, ${cand.address},
      ${cand.phone}, ${cand.email},
      ${geo ? geo.lat : null}, ${geo ? geo.lng : null},
      ${cand.vat_number ? "active" : "network"}, ${cand.vat_number || ""}, now(), now(), ${verificatoDa}
    ) RETURNING id`;

  await sql`
    INSERT INTO professional_users (professional_id, email, pass_hash, name, role)
    VALUES (${prof.id}, ${cand.email}, ${passwordScelta ? cand.pass_hash : hashPassword(passwordTemporanea)}, ${cand.name.split(" ")[0]}, 'professional')`;

  // zone coperte: comuni singoli puliti (mai il campo città grezzo tipo "Lucca e dintorni")
  const comuni = zoneCand.length ? zoneCand.map((z) => z.city) : [cand.city];
  for (const comune of [...new Set(comuni.filter((c) => c && c.length >= 2))]) {
    await sql`INSERT INTO coverage_areas (professional_id, city, province, region)
      VALUES (${prof.id}, ${comune}, ${cand.province}, ${regione}) ON CONFLICT DO NOTHING`;
  }

  // marker distinto: se la posizione è a livello città, scosto in base all'id
  if (geo && geo.precision === "citta") {
    const j = jitterPerId(geo.lat, geo.lng, prof.id);
    await sql`UPDATE professionals SET lat = ${j.lat}, lng = ${j.lng} WHERE id = ${prof.id}`;
  }

  await sql`UPDATE applications SET status = 'approved' WHERE id = ${id}`;

  const benvenuto = emailBenvenutoProfessionista({
    name: cand.name, email: cand.email, passwordTemporanea, slug,
    senzaPiva: !cand.vat_number,
  });
  const emailed = await sendEmail({ to: cand.email, toName: cand.name, ...benvenuto });

  return json({
    ok: true, slug, emailed,
    credenziali: { email: cand.email, password: passwordTemporanea },
    geocodificato: geo ? geo.precision : null,
  });
}
