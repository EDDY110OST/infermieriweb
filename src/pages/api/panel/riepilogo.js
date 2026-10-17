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
           b.status, b.source, s.name AS service_name
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
  // 17/10/26 (DAC7, decisione di Bruno): nessun importo legato alle prenotazioni, né riga per
  // riga né come totale. Il sito non sa quanto incassa l'infermiere e non deve sembrare che lo
  // sappia. Il «report dei guadagni» tornerà solo con la SRL e gli abbonamenti.
  const intestazione = ["Data", "Ora", "Prestazione", "Paziente", "Telefono", "Indirizzo", "Città", "Stato", "Origine"];

  const corpo = righe.map((r) => [
    dataIt(r.start_dt), oraIt(r.start_dt), r.service_name, r.customer_name, r.customer_phone,
    r.address, r.city, STATI[r.status] || r.status, r.source === "manual" ? "Telefonica" : "Online",
  ].map(csvSafe).join(";"));

  const csv = [
    intestazione.map(csvSafe).join(";"),
    ...corpo,
    "",
    csvSafe("Elenco delle prenotazioni. Il compenso lo concordi e lo ricevi direttamente dal paziente: la piattaforma non lo conosce. Documento di supporto, non un documento fiscale."),
  ].join("\n");

  // BOM: così Excel apre gli accenti correttamente
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestazioni-${mese}.csv"`,
    },
  });
}
