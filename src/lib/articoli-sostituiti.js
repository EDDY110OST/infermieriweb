// Articoli SOSTITUITI (9/10/26). Un articolo superato (prezzi vecchi, doppione, pezzo rifatto)
// non si cancella: si «sostituisce» con un articolo pubblicato. Il vecchio indirizzo porta lì
// con un 301 (Google passa il valore della pagina al nuovo indirizzo) e il vecchio articolo
// esce dal sito: non è più 'published', quindi sparisce da elenchi, home, sitemap, correlati e
// «Articoli di …» (tutte quelle query filtrano già su status = 'published').
// Regole: il sostituto dev'essere pubblicato e diverso dall'articolo; niente giri (A→B→A);
// chi puntava all'articolo sostituito ora punta direttamente al nuovo (niente catene).
// Lettura prudente: si seguono al massimo MAX_SALTI sostituzioni, mai due volte lo stesso.
import { sql } from "./db.js";
import { registraDecisione } from "./articoli-infermieri.js";

export const MAX_SALTI = 3;

// Nota per l'infermiere autore, se il suo articolo pubblicato viene sostituito
const notaSostituito = (titolo) =>
  `Il tuo articolo è stato sostituito da «${titolo}»: il suo vecchio indirizzo ora porta lì. Scrivici se vuoi sapere perché.`;

// Lo slug a cui porta il vecchio indirizzo `slug`, oppure null (→ 404 come prima).
// Si parte solo da un articolo NON pubblicato che ha un sostituto; vale il primo articolo
// pubblicato che si incontra (con autore non eliminato), entro MAX_SALTI salti.
export async function slugSostituto(slug) {
  try {
    const [r] = await sql`
      WITH RECURSIVE catena AS (
        SELECT a.id, a.status, a.replaced_by_id, 0 AS salti, ARRAY[a.id] AS visti
        FROM articles a
        WHERE a.slug = ${slug} AND a.status <> 'published' AND a.replaced_by_id IS NOT NULL
        UNION ALL
        SELECT b.id, b.status, b.replaced_by_id, c.salti + 1, c.visti || b.id
        FROM catena c JOIN articles b ON b.id = c.replaced_by_id
        WHERE c.status <> 'published' AND c.salti < ${MAX_SALTI} AND NOT (b.id = ANY(c.visti))
      )
      SELECT a.slug
      FROM catena c JOIN articles a ON a.id = c.id
      LEFT JOIN professionals p ON p.id = a.author_professional_id
      WHERE c.salti > 0 AND c.status = 'published' AND (a.author_professional_id IS NULL OR p.status <> 'deleted')
      ORDER BY c.salti LIMIT 1`;
    return r?.slug || null;
  } catch (e) {
    // es. colonna non ancora migrata: meglio un 404 che un errore 500
    console.error("[articoli] sostituzione non letta:", e.message);
    return null;
  }
}

// Admin → Blog → «↪️ Sostituisci con…». Ritorna {ok, …} oppure {status, error}.
export async function sostituisciArticolo(session, id, bersaglioId) {
  if (!bersaglioId) return { status: 400, error: "Scegli l'articolo che prende il suo posto." };
  if (bersaglioId === id) return { status: 400, error: "Un articolo non può sostituire sé stesso: scegline un altro." };

  const [a] = await sql`
    SELECT a.id, a.title, a.status, a.review_note, a.replaced_by_id, a.author_professional_id, p.status AS autore_stato
    FROM articles a LEFT JOIN professionals p ON p.id = a.author_professional_id
    WHERE a.id = ${id}`;
  if (!a) return { status: 404, error: "Articolo non trovato: forse è stato eliminato. Ricarica la pagina." };
  const [b] = await sql`SELECT id, slug, title, status FROM articles WHERE id = ${bersaglioId}`;
  if (!b) return { status: 404, error: "L'articolo scelto non esiste più. Ricarica la pagina." };
  if (b.status !== "published") return { status: 409, error: `«${b.title}» non è online: si può scegliere solo un articolo pubblicato.` };

  // Niente giri: seguendo le sostituzioni a partire dal nuovo articolo non si deve tornare qui
  const giro = await sql`
    WITH RECURSIVE c AS (
      SELECT id, replaced_by_id, 1 AS n FROM articles WHERE id = ${b.id}
      UNION ALL
      SELECT x.id, x.replaced_by_id, c.n + 1 FROM c JOIN articles x ON x.id = c.replaced_by_id WHERE c.n < 20
    )
    SELECT 1 FROM c WHERE id = ${id} LIMIT 1`;
  if (giro.length) return { status: 409, error: "Così si creerebbe un giro (A porta a B e B porta ad A): scegli un altro articolo." };

  // Esce dal sito: bozza; se è di un infermiere ancora iscritto torna a lui «da correggere»
  // con una nota (come «Ritira»). Un articolo già fuori dal sito resta com'è.
  const infermiereIscritto = !!a.author_professional_id && !!a.autore_stato && a.autore_stato !== "deleted";
  const stato = a.status === "published" ? (infermiereIscritto ? "changes" : "draft") : a.status;
  const nota = a.status === "published" && infermiereIscritto ? notaSostituito(b.title) : a.review_note || "";

  // Il controllo «nuovo articolo pubblicato» si ripete nella scrittura (se nel frattempo
  // l'avessero ritirato, non si scrive nulla)
  const fatto = await sql`
    UPDATE articles SET replaced_by_id = ${b.id}, status = ${stato}, review_note = ${nota}, updated_at = now()
    WHERE id = ${id} AND EXISTS (SELECT 1 FROM articles WHERE id = ${b.id} AND status = 'published')
    RETURNING id`;
  if (!fatto.length) return { status: 409, error: `«${b.title}» non è più online: ricarica la pagina e scegli di nuovo.` };

  // Niente catene: chi portava a questo articolo ora porta direttamente al nuovo
  const appiattiti = await sql`
    UPDATE articles SET replaced_by_id = ${b.id}, updated_at = now()
    WHERE replaced_by_id = ${id} AND id <> ${b.id}
    RETURNING id`;

  await registraDecisione(session, "articolo_sostituito", id, {
    sostituito_da: b.id, stato_prima: a.status, stato_dopo: stato,
    sostituito_prima: a.replaced_by_id || null, appiattiti: appiattiti.map((r) => r.id),
  });
  return { ok: true, status: stato, bersaglio: { id: b.id, slug: b.slug, title: b.title }, appiattiti: appiattiti.length };
}

// «Annulla sostituzione»: il vecchio indirizzo torna 404 (l'articolo resta fuori dal sito,
// in bozza, finché non lo si ripubblica).
export async function annullaSostituzione(session, id) {
  const [a] = await sql`SELECT id, status, replaced_by_id FROM articles WHERE id = ${id}`;
  if (!a) return { status: 404, error: "Articolo non trovato: forse è stato eliminato. Ricarica la pagina." };
  if (!a.replaced_by_id) return { ok: true, status: a.status, giaFatto: true };
  await sql`UPDATE articles SET replaced_by_id = NULL, updated_at = now() WHERE id = ${id}`;
  await registraDecisione(session, "sostituzione_annullata", id, { era_sostituito_da: a.replaced_by_id, stato: a.status });
  return { ok: true, status: a.status };
}
