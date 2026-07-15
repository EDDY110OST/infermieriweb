export const prerender = false;

import { availableSlots } from "../../lib/slots.js";

// GET /api/slots?professional_id=1&service_id=2&date=2026-07-15
export async function GET({ url }) {
  const professionalId = Number(url.searchParams.get("professional_id"));
  const serviceId = Number(url.searchParams.get("service_id"));
  const date = url.searchParams.get("date") || "";

  if (!professionalId || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: "Parametri mancanti" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const slots = await availableSlots(professionalId, serviceId, date);
  return new Response(JSON.stringify({ slots }), {
    headers: { "Content-Type": "application/json" },
  });
}
