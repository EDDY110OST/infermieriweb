// I dati dei suggerimenti di ricerca, preparati sul server (7/10/26).
// La home li mette direttamente nella pagina (nessuna richiesta in più);
// la 404, che è statica, li chiede a /api/suggerimenti. Su /cerca invece
// l'indice si costruisce dalla lista dei professionisti già caricata.
// Stesse regole di /api/professionisti: attivo e con almeno una prestazione
// a domicilio attiva (le consulenze per colleghi non contano).
import { sql } from "./db.js";
import { siglaComune } from "../data/comuni.js";
import { indiceSuggerimenti } from "./suggerimenti.js";

export async function datiSuggerimenti() {
  const righe = await sql`
    SELECT p.id,
           COALESCE(c.zone, '[]'::json) AS zone,
           COALESCE(sv.nomi, ARRAY[]::text[]) AS servizi
    FROM professionals p
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('city', city, 'province', province)) AS zone
      FROM coverage_areas WHERE professional_id = p.id
    ) c ON TRUE
    LEFT JOIN LATERAL (
      SELECT array_agg(name ORDER BY sort) AS nomi FROM services
      WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%'
    ) sv ON TRUE
    WHERE p.status = 'active'
      AND EXISTS (SELECT 1 FROM services WHERE professional_id = p.id AND active AND catalog_key NOT LIKE 'consulenza-%')`;
  return indiceSuggerimenti(righe.map((p) => ({
    id: p.id,
    coverage: p.zone.map((z) => z.city),
    sigle: Object.fromEntries(p.zone.map((z) => [z.city, siglaComune(z.city, z.province)])),
    servizi: p.servizi,
  })));
}
