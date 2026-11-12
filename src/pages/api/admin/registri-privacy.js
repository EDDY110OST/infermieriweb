export const prerender = false;

import { sessionFromRequest } from "../../../lib/auth.js";
import { REGISTRI, leggiRegistro, leggiStorico, salvaRiga, cambiaStato, prossimoNumeroViolazione } from "../../../lib/registri-privacy.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Admin → Documenti → registri privacy (12/11/26). Solo amministratori (la sessione admin
// vale solo se è nata con il codice dell'app: vedi sessionFromRequest in lib/auth.js).
//   GET  ?registro=trattamenti|violazioni → righe + storico delle modifiche
//   POST {azione: "salva", registro, id?, titolo, voci:[{voce, contenuto}]}
//   POST {azione: "archivia" | "ripristina", id}          (solo trattamenti)
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);
  const registro = url.searchParams.get("registro");
  if (!REGISTRI.includes(registro)) return json({ error: "Registro sconosciuto" }, 400);
  const [righe, storico] = await Promise.all([leggiRegistro(registro), leggiStorico(registro)]);
  return json({
    righe, storico,
    ...(registro === "violazioni" ? { prossimo: await prossimoNumeroViolazione() } : {}),
  });
}

export async function POST({ request }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Richiesta non valida" }, 400); }
  const admin = String(session.name || `admin ${session.uid}`).slice(0, 80);

  let esito;
  if (body.azione === "salva") {
    esito = await salvaRiga({ registro: body.registro, id: body.id, titolo: body.titolo, voci: body.voci, admin });
  } else if (body.azione === "archivia" || body.azione === "ripristina") {
    esito = await cambiaStato({ id: body.id, stato: body.azione === "archivia" ? "archiviato" : "attivo", admin });
  } else {
    return json({ error: "Azione sconosciuta" }, 400);
  }
  if (esito.errore) return json({ error: esito.errore }, esito.status || 400);
  return json({ ok: true, id: esito.riga.id, invariata: !!esito.invariata });
}
