export const prerender = false;

import { sql } from "../../lib/db.js";
import { consenti, ipDa } from "../../lib/ratelimit.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// POST /api/candidatura — form "Lavora con noi" (approvazione manuale)
export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Richiesta non valida" }, 400);
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const profession = String(body.profession || "infermiere").trim();
  const alboName = String(body.albo_name || "").trim();
  const alboNumber = String(body.albo_number || "").trim();
  const alboDate = String(body.albo_date || "").trim();
  const vatNumber = String(body.vat_number || "").replace(/\D/g, "");
  const city = String(body.city || "").trim();
  const address = String(body.address || "").trim().slice(0, 200);
  const province = String(body.province || "").trim();
  const message = String(body.message || "").trim().slice(0, 2000);

  if (name.length < 2 || !email.includes("@") || phone.length < 6 || city.length < 2) {
    return json({ error: "Compila nome, email, telefono e città" }, 400);
  }
  if (alboName.length < 3 || !alboNumber || !alboDate) {
    return json({ error: "Servono albo di appartenenza, numero e data di iscrizione" }, 400);
  }
  if (vatNumber.length !== 11) {
    return json({ error: "La partita IVA deve avere 11 cifre" }, 400);
  }
  if (!body.privacy) return json({ error: "Serve il consenso al trattamento dei dati" }, 400);

  if (!(await consenti(`candidatura:${ipDa(request)}`, 3, 60))) {
    return json({ error: "Troppe richieste ravvicinate: riprova più tardi" }, 429);
  }

  const recente = await sql`
    SELECT id FROM applications WHERE email = ${email} AND created_at > now() - interval '1 day'`;
  if (recente.length) return json({ error: "Candidatura già ricevuta: ti ricontatteremo a breve." }, 429);

  await sql`
    INSERT INTO applications (name, email, phone, profession, albo_name, albo_number, albo_date, vat_number, city, province, address, message)
    VALUES (${name}, ${email}, ${phone}, ${profession}, ${alboName}, ${alboNumber}, ${alboDate}, ${vatNumber}, ${city}, ${province}, ${address}, ${message})`;

  // TODO: notifica email a Bruno/Eduard (Brevo) quando ci sarà l'account
  return json({ ok: true });
}
