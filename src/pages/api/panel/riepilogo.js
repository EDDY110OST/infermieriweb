export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";

// GET /api/panel/riepilogo?mese=2026-07 — CSV delle prestazioni del mese
// (il "regalo per il commercialista" del professionista)
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session?.pid) return new Response("Non autenticato", { status: 401 });

  const mese = url.searchParams.get("mese") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mese)) return new Response("Mese non valido", { status: 400 });

  const righe = await sql`
    SELECT b.start_dt, b.customer_name, b.customer_phone, b.address, b.city,
           b.status, b.source, s.name AS service_name, s.price_cents
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE b.professional_id = ${session.pid}
      AND b.start_dt >= (${mese} || '-01')::date
      AND b.start_dt < ((${mese} || '-01')::date + interval '1 month')
      AND b.status IN ('done', 'active')
    ORDER BY b.start_dt`;

  const dataIt = (iso) =>
    new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", year: "numeric" });
  const oraIt = (iso) =>
    new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
  const csvSafe = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const STATI = { done: "Completata", active: "Da svolgere" };
  const intestazione = ["Data", "Ora", "Prestazione", "Paziente", "Telefono", "Indirizzo", "Città", "Importo indicativo €", "Stato", "Origine"];

  const corpo = righe.map((r) => [
    dataIt(r.start_dt), oraIt(r.start_dt), r.service_name, r.customer_name, r.customer_phone,
    r.address, r.city, (r.price_cents / 100).toFixed(2).replace(".", ","),
    STATI[r.status] || r.status, r.source === "manual" ? "Telefonica" : "Online",
  ].map(csvSafe).join(";"));

  const totale = righe
    .filter((r) => r.status === "done")
    .reduce((somma, r) => somma + r.price_cents, 0);

  const csv = [
    intestazione.map(csvSafe).join(";"),
    ...corpo,
    "",
    [csvSafe("TOTALE prestazioni completate"), csvSafe(""), csvSafe(""), csvSafe(""), csvSafe(""), csvSafe(""), csvSafe(""), csvSafe((totale / 100).toFixed(2).replace(".", ",")), csvSafe(""), csvSafe("")].join(";"),
    "",
    csvSafe("Importi indicativi 'a partire da' della piattaforma: il compenso effettivo è quello concordato con il paziente. Documento di supporto, non un documento fiscale."),
  ].join("\n");

  // BOM: così Excel apre gli accenti correttamente
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestazioni-${mese}.csv"`,
    },
  });
}
