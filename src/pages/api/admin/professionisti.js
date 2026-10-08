export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { sendEmail, emailDisdettaPaziente } from "../../../lib/mailer.js";
import { linkCambio } from "../../../lib/cambio.js";
import { avvisoEmail, normalizzaEmail } from "../../../lib/email.js";
import { prenotabilitaTutti, GIORNI_FINESTRA } from "../../../lib/prenotabilita.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const soloAdmin = (request) => {
  const session = sessionFromRequest(request);
  return session && session.role === "admin" ? session : null;
};

// Cosa succederebbe cancellando un professionista: numeri per la doppia conferma
async function anteprimaEliminazione(id) {
  const [p] = await sql`SELECT id, slug, name, status, email FROM professionals WHERE id = ${id}`;
  if (!p) return null;
  const [n] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('active', 'pending') AND start_dt > now())::int AS future,
      COUNT(*) FILTER (WHERE status IN ('active', 'pending') AND start_dt > now() AND customer_email <> '')::int AS future_con_email,
      COUNT(*) FILTER (WHERE NOT (status IN ('active', 'pending') AND start_dt > now()))::int AS passate
    FROM bookings WHERE professional_id = ${id}`;
  const [r] = await sql`SELECT COUNT(*)::int AS n FROM reviews WHERE professional_id = ${id}`;
  const [s] = await sql`SELECT COUNT(*)::int AS n FROM services WHERE professional_id = ${id} AND deleted_at IS NULL`;
  const [z] = await sql`SELECT COUNT(*)::int AS n FROM coverage_areas WHERE professional_id = ${id}`;
  const [u] = await sql`SELECT role FROM professional_users WHERE professional_id = ${id} LIMIT 1`;
  const [c] = await sql`SELECT COUNT(*)::int AS n FROM applications WHERE lower(email) = lower(${p.email || ""}) AND ${p.email || ""} <> ''`;
  return { id: p.id, slug: p.slug, name: p.name, status: p.status, admin: u?.role === "admin",
    future: n.future, future_con_email: n.future_con_email, passate: n.passate, recensioni: r.n, servizi: s.n, zone: z.n, candidature: c.n };
}

// GET /api/admin/professionisti — elenco completo con dati operativi
// GET /api/admin/professionisti?anteprima=12 — numeri per la cancellazione
export async function GET({ request, url }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);

  const anteprima = Number(url.searchParams.get("anteprima"));
  if (anteprima) {
    const a = await anteprimaEliminazione(anteprima);
    return a ? json({ anteprima: a }) : json({ error: "Professionista non trovato" }, 404);
  }

  const professionisti = await sql`
    SELECT p.id, p.slug, p.name, p.profession, p.city, p.province, p.status,
           p.albo_name, p.albo_number, p.albo_date, p.vat_number, p.phone, p.email,
           p.photo_url, p.lat, p.lng, p.created_at,
           (SELECT email FROM professional_users WHERE professional_id = p.id LIMIT 1) AS email_accesso,
           COALESCE(s.n, 0) AS servizi,
           COALESCE(b.n, 0) AS prenotazioni_totali,
           COALESCE(b.completate, 0) AS completate,
           COALESCE(b.annullate, 0) AS annullate,
           COALESCE(b30.n, 0) AS prenotazioni_30gg,
           COALESCE(r.media, 0) AS rating,
           COALESCE(r.n, 0) AS recensioni,
           COALESCE(z.zone, ARRAY[]::text[]) AS zone
    FROM professionals p
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM services WHERE professional_id = p.id AND active) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS n,
             COUNT(*) FILTER (WHERE status = 'done') AS completate,
             COUNT(*) FILTER (WHERE status = 'cancelled') AS annullate
      FROM bookings WHERE professional_id = p.id) b ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS n FROM bookings WHERE professional_id = p.id AND created_at > now() - interval '30 days') b30 ON TRUE
    LEFT JOIN LATERAL (SELECT ROUND(AVG(rating)::numeric,1) AS media, COUNT(*) AS n FROM reviews WHERE professional_id = p.id AND status = 'published') r ON TRUE
    LEFT JOIN LATERAL (SELECT array_agg(city ORDER BY city) AS zone FROM coverage_areas WHERE professional_id = p.id) z ON TRUE
    WHERE p.status <> 'deleted'
    ORDER BY p.created_at DESC`;

  // «Nessun orario prenotabile nei prossimi 30 giorni» con il motivo (8/10/26): stesso
  // calcolo del sito pubblico, per tutti in 6 query. Solo per i profili attivi: gli altri
  // non sono prenotabili per definizione.
  let prenotabilita = {};
  try { prenotabilita = await prenotabilitaTutti({ giorni: GIORNI_FINESTRA }); } catch (e) { console.error("[admin] prenotabilità non calcolata:", e.message); }

  // dominio sospetto (es. «gmail.co») → avviso visibile nella card
  return json({ professionisti: professionisti.map((p) => ({
    ...p,
    avviso_email: avvisoEmail(normalizzaEmail(p.email)),
    prenotabilita: p.status === "active" ? (prenotabilita[p.id] || null) : null,
  })) });
}

// PATCH /api/admin/professionisti {id, status} — attiva / sospende
export async function PATCH({ request }) {
  if (!soloAdmin(request)) return json({ error: "Riservato agli amministratori" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  let status = String(body.status || "");
  if (!id || !["active", "suspended", "pending", "network"].includes(status)) return json({ error: "Dati non validi" }, 400);

  // Riattivare un professionista SENZA P.IVA non deve renderlo pubblicamente prenotabile:
  // torna a "network" (non attivo) invece che ad "active".
  if (status === "active") {
    const [p] = await sql`SELECT vat_number FROM professionals WHERE id = ${id}`;
    if (p && !p.vat_number) status = "network";
  }

  const updated = await sql`UPDATE professionals SET status = ${status} WHERE id = ${id} RETURNING id`;
  if (!updated.length) return json({ error: "Professionista non trovato" }, 404);
  return json({ ok: true, status });
}

// DELETE /api/admin/professionisti {id, conferma} — cancellazione "lapide anonima"
// (scelta dei soci 7/10/26). Mai DELETE FROM professionals: la cascata porterebbe via le
// prenotazioni passate, i conteggi e l'area «Le mie prenotazioni» dei pazienti. Invece:
//  1. prenotazioni future → annullate (cancelled_by = admin) + email al paziente con il
//     link per scegliere un altro infermiere;
//  2. prenotazioni passate → restano agganciate all'id (i dati del paziente seguono la
//     pulizia a 24 mesi); il nome mostrato diventa «Professionista rimosso»;
//  3. cancellati: login e 2FA, notifiche push, zone, orari, disponibilità, blocchi, visite,
//     specializzazioni (anche su misura), prestazioni su misura, prestazioni senza
//     prenotazioni (le altre archiviate), recensioni, candidatura con la stessa email;
//  4. la riga viene svuotata di ogni dato personale (nome, foto, contatti, albo, P.IVA,
//     posizione), slug = rimosso-<id>, status = deleted;
//  5. riga in admin_audit senza dati personali.
// Condizioni: solo admin, profilo già SOSPESO, non sé stessi, non un altro admin,
// conferma = slug esatto del profilo.
export async function DELETE({ request }) {
  const session = soloAdmin(request);
  if (!session) return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const id = Number(body.id);
  if (!id) return json({ error: "Id mancante" }, 400);

  const [p] = await sql`SELECT id, slug, name, email, status FROM professionals WHERE id = ${id}`;
  if (!p) return json({ error: "Professionista non trovato" }, 404);
  if (p.status === "deleted") return json({ error: "Questo profilo è già stato eliminato" }, 409);
  if (p.status !== "suspended") return json({ error: "Prima sospendi il profilo: l'eliminazione definitiva si fa solo da un profilo sospeso" }, 400);
  if (Number(session.pid) === id) return json({ error: "Non puoi eliminare il tuo profilo" }, 400);
  const [utente] = await sql`SELECT role FROM professional_users WHERE professional_id = ${id} AND role = 'admin' LIMIT 1`;
  if (utente) return json({ error: "Questo profilo è di un amministratore: non si elimina da qui" }, 400);
  if (String(body.conferma || "").trim() !== p.slug) return json({ error: `Per confermare scrivi esattamente: ${p.slug}` }, 400);

  // 1. prenotazioni future: annullate + email al paziente (con il link "scegli un altro infermiere")
  const future = await sql`
    SELECT b.id, b.status, b.start_dt, b.customer_name, b.customer_email, b.source, s.name AS service_name
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE b.professional_id = ${id} AND b.status IN ('active', 'pending') AND b.start_dt > now()`;
  let emailInviate = 0;
  for (const b of future) {
    await sql`UPDATE bookings SET status = 'cancelled', cancelled_by = 'admin', cancelled_at = now() WHERE id = ${b.id}`;
    if (b.status === "active" && b.customer_email) {
      const avviso = emailDisdettaPaziente({
        booking: { name: b.customer_name, start: b.start_dt },
        professional: { name: p.name, slug: p.slug },
        service: { name: b.service_name },
        cambioLink: b.source === "online" ? linkCambio(b.id) : null,
      });
      if (await sendEmail({ to: b.customer_email, toName: b.customer_name, ...avviso })) {
        emailInviate++;
        await sql`UPDATE bookings SET cambio_inviato_at = now() WHERE id = ${b.id}`;
      }
    }
  }

  // 2./3. tutto il resto (istruzioni esplicite, tabella per tabella)
  await sql`DELETE FROM professional_users WHERE professional_id = ${id}`;
  await sql`DELETE FROM push_subscriptions WHERE professional_id = ${id}`;
  await sql`DELETE FROM coverage_areas WHERE professional_id = ${id}`;
  await sql`DELETE FROM opening_hours WHERE professional_id = ${id}`;
  await sql`DELETE FROM day_overrides WHERE professional_id = ${id}`;
  await sql`DELETE FROM blocks WHERE professional_id = ${id}`;
  await sql`DELETE FROM profile_views WHERE professional_id = ${id}`;
  await sql`DELETE FROM professional_specializations WHERE professional_id = ${id}`;
  await sql`DELETE FROM catalog_specializations WHERE professional_id = ${id}`;
  const recensioni = await sql`DELETE FROM reviews WHERE professional_id = ${id} RETURNING id`;
  const cancellati = await sql`
    DELETE FROM services WHERE professional_id = ${id}
      AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.service_id = services.id) RETURNING id`;
  const archiviati = await sql`
    UPDATE services SET active = FALSE, deleted_at = COALESCE(deleted_at, now())
    WHERE professional_id = ${id} RETURNING id`;
  await sql`DELETE FROM catalog_services WHERE professional_id = ${id}`;
  const candidature = p.email
    ? await sql`DELETE FROM applications WHERE lower(email) = lower(${p.email}) RETURNING id`
    : [];
  const [passate] = await sql`SELECT COUNT(*)::int AS n FROM bookings WHERE professional_id = ${id}`;

  // 4. lapide anonima: la riga resta, senza nessun dato personale
  await sql`
    UPDATE professionals
    SET name = 'Professionista rimosso', full_name = '', gender = '', profession = 'infermiere',
        albo_number = '', albo_name = '', albo_date = '', vat_number = '',
        bio = '', bio_consulenza = '', photo_url = '', photo_data = '',
        region = '', province = '', city = '', address = '', phone = '', email = '',
        lat = NULL, lng = NULL, google_rating = '', google_reviews_url = '',
        verified_by = '', verified_piva_at = NULL, verified_albo_at = NULL, tipo = '',
        slug = ${"rimosso-" + id}, status = 'deleted', deleted_at = now(),
        edited_by = ${session.name || "admin"}, edited_at = now()
    WHERE id = ${id}`;

  // 5. registro (senza dati personali)
  const dettagli = {
    future_annullate: future.length, email_inviate: emailInviate, passate_conservate: passate.n,
    recensioni_cancellate: recensioni.length, servizi_cancellati: cancellati.length,
    servizi_archiviati: archiviati.length, candidature_cancellate: candidature.length,
  };
  await sql`
    INSERT INTO admin_audit (admin, azione, soggetto_id, dettagli)
    VALUES (${session.name || session.email || "admin"}, 'professionista_rimosso', ${id}, ${JSON.stringify(dettagli)}::jsonb)`;

  return json({ ok: true, ...dettagli });
}
