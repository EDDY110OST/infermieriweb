export const prerender = false;

import { sql } from "../../../lib/db.js";
import { sessionFromRequest } from "../../../lib/auth.js";
import { FILTRI, INIZIO_REGISTRO } from "../../../lib/accessi.js";
import { riepilogoAccessi } from "../../../lib/accessi-server.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

const PAGINA = 100;
const MAX_CSV = 5000;

// GET /api/admin/accessi — il registro degli accessi all'area riservata (lib/accessi.js)
//   ?pid=12         solo un professionista
//   ?tipo=falliti   tutti | ingressi | falliti | password
//   ?prima=<id>     le righe più vecchie di quella (tasto «Mostra altri»)
//   ?solo=eventi    senza il riepilogo per professionista (pagine successive)
//   ?tutte=1        fino a 5.000 righe in una volta (per il CSV)
export async function GET({ request, url }) {
  const session = sessionFromRequest(request);
  if (!session || session.role !== "admin") return json({ error: "Riservato agli amministratori" }, 403);

  const pid = Number(url.searchParams.get("pid")) || null;
  const filtro = FILTRI.find((f) => f.k === url.searchParams.get("tipo")) || FILTRI[0];
  const eventi = filtro.eventi ? filtro.eventi.join(",") : null;
  const prima = Number(url.searchParams.get("prima")) || null;
  const limite = url.searchParams.get("tutte") ? MAX_CSV : PAGINA;

  // il nome si legge dalla scheda al momento della lettura: nel registro c'è solo l'id
  const righe = await sql`
    SELECT a.id, a.created_at, a.evento, a.professional_id, a.email, a.dispositivo,
           p.name AS nome, (u.role = 'admin') AS admin
    FROM access_log a
    LEFT JOIN professionals p ON p.id = a.professional_id
    LEFT JOIN professional_users u ON u.id = a.user_id
    WHERE (${pid}::int IS NULL OR a.professional_id = ${pid}::int)
      AND (${eventi}::text IS NULL OR a.evento = ANY(string_to_array(${eventi}::text, ',')))
      AND (${prima}::bigint IS NULL OR a.id < ${prima}::bigint)
    ORDER BY a.id DESC
    LIMIT ${limite + 1}::int`;
  const altri = righe.length > limite;
  const risposta = { dal: INIZIO_REGISTRO, eventi: righe.slice(0, limite), altri };
  if (url.searchParams.get("solo") === "eventi") return json(risposta);

  const [professionisti, riepilogo, [numeri]] = await Promise.all([
    sql`
      SELECT p.id, p.name, p.status, p.city, p.province, p.phone, p.email, p.created_at,
             EXISTS (SELECT 1 FROM professional_users WHERE professional_id = p.id AND role = 'admin') AS admin,
             (SELECT COUNT(*)::int FROM services WHERE professional_id = p.id AND active) AS servizi
      FROM professionals p
      WHERE p.status <> 'deleted'
      ORDER BY p.created_at DESC`,
    riepilogoAccessi(),
    sql`
      SELECT COUNT(*) FILTER (WHERE evento IN ('password_sbagliata', 'codice_sbagliato'))::int AS falliti_7g,
             COUNT(*) FILTER (WHERE evento IN ('email_sconosciuta', 'recupero_sconosciuta'))::int AS sconosciute_7g
      FROM access_log WHERE created_at > now() - interval '7 days'`,
  ]);

  return json({
    ...risposta,
    numeri,
    professionisti: professionisti.map((p) => ({ ...p, accessi: riepilogo[p.id] || null })),
  });
}
