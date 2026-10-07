// Specializzazioni (7/10/26): lista gestita dagli amministratori (tabella
// catalog_specializations, stesso stampo del listino: professional_id NULL = per
// tutti, valorizzato = su misura per uno solo) e scelte del professionista
// (professional_specializations, fino a MAX_SPECIALIZZAZIONI). Sono DICHIARATE
// dal professionista: il badge "verificata" arriva in fase 2.
import { sql } from "./db.js";
import { chiaveDaNome } from "./listino.js";

export const MAX_SPECIALIZZAZIONI = 5;

// Le voci che un professionista può spuntare: globali attive + le sue su misura
export async function specializzazioniPerProfessionista(pid) {
  return sql`
    SELECT id, key, nome, sort, (professional_id IS NOT NULL) AS su_misura
    FROM catalog_specializations
    WHERE active AND (professional_id IS NULL OR professional_id = ${pid || 0})
    ORDER BY sort, nome`;
}

// Le chiavi scelte da un professionista
export async function scelteDi(pid) {
  const r = await sql`SELECT key FROM professional_specializations WHERE professional_id = ${pid} ORDER BY key`;
  return r.map((x) => x.key);
}

// Le specializzazioni da mostrare sulla scheda pubblica (nome leggibile, in ordine)
export async function specializzazioniPubbliche(pid) {
  return sql`
    SELECT c.key, c.nome
    FROM professional_specializations ps
    JOIN catalog_specializations c
      ON c.key = ps.key AND c.active AND (c.professional_id IS NULL OR c.professional_id = ps.professional_id)
    WHERE ps.professional_id = ${pid}
    ORDER BY c.sort, c.nome`;
}

// Chiave libera per una voce nuova (globale o su misura)
export async function chiaveSpecializzazioneLibera(nome, pid = null) {
  const base = chiaveDaNome(nome, "domicilio");
  for (let n = 0; n < 50; n++) {
    const key = n === 0 ? base : `${base}-${n + 1}`;
    const [occupata] = await sql`
      SELECT id FROM catalog_specializations
      WHERE key = ${key} AND (professional_id IS NULL OR professional_id = ${pid || 0})`;
    if (!occupata) return key;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 60);
}
