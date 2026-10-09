// Migrazione «nome e cognome per intero» (decisione dei soci, 9/10/2026).
// Il nome pubblico passa da «Inf. Laura G.» a «Inf. Laura Gilli»: «Inf. » + full_name con le
// maiuscole giuste (stessa funzione del sito, src/lib/appellativo.js).
//
// Cambia SOLO chi oggi ha il nome nato in automatico col vecchio formato «Inf. Nome X.»
// (nomi presi dal nome completo + iniziale del cognome). Chi ha un nome pubblico scritto a
// mano diverso (es. «Inf. Eduard G.D.») resta com'è e viene elencato. Gli eliminati non si
// toccano. Chi nei 15 giorni di preavviso chiede di tenere solo l'iniziale per gravi motivi
// di sicurezza si esclude con --escludi=<id,id> (l'esclusione resta anche nei giri dopo).
//
// Backup: per ogni riga cambiata, il nome di prima va in professionals_nome_backup (id, name,
// data) NELLA STESSA ISTRUZIONE dell'aggiornamento (o tutte e due o nessuna). Chi è già nel
// backup è già stato fatto: rilanciando, non si tocca più (così un'iniziale rimessa a mano
// dopo la migrazione per motivi di sicurezza non torna mai nome intero). IDEMPOTENTE.
// Render NON esegue le migrazioni: si lancia a mano contro Neon. Provata prima su PGlite.
//
//   DATABASE_URL="postgres://…" node scripts/migrate-nome-completo.mjs --prova        solo prima → dopo, non scrive
//   DATABASE_URL="postgres://…" node scripts/migrate-nome-completo.mjs                applica
//   DATABASE_URL="postgres://…" node scripts/migrate-nome-completo.mjs --escludi=15   applica, tranne l'id 15
//   DATABASE_URL="postgres://…" node scripts/migrate-nome-completo.mjs --ripristina   rimette i nomi dal backup
import { neon } from "@neondatabase/serverless";
import { nomePubblico, maiuscoleNome } from "../src/lib/appellativo.js";

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) { console.error("❌ Manca DATABASE_URL nell'ambiente"); process.exit(1); }
const sql = neon(url);

const argomenti = process.argv.slice(2);
const RIPRISTINA = argomenti.includes("--ripristina");
const PROVA = argomenti.includes("--prova");
const iEscludi = argomenti.findIndex((a) => a.startsWith("--escludi"));
const ESCLUSI = new Set(
  (iEscludi < 0 ? "" : argomenti[iEscludi].includes("=") ? argomenti[iEscludi].split("=")[1] : argomenti[iEscludi + 1] || "")
    .split(",").map((x) => Number(x.trim())).filter(Boolean)
);

// «Inf. Nome X.»: nomi + UNA iniziale. Nato in automatico se le parole prima dell'iniziale
// sono tutte nel nome completo e l'iniziale è quella dell'unica parola che avanza (il
// cognome). Copre anche «Inf. Giovanni Del R.» e un nome completo corretto dopo
// (es. «Sargentelli Diletta» → «Diletta Sargentelli» con «Inf. Sargentelli D.»).
const RE_INIZIALE = /^Inf\.\s+(.+)\s(\p{Lu})\.$/u;
function natoConIniziale(nome, fullName) {
  const m = String(nome || "").trim().match(RE_INIZIALE);
  if (!m) return false;
  const resto = maiuscoleNome(fullName).toLowerCase().split(" ").filter(Boolean);
  for (const parola of m[1].toLowerCase().split(/\s+/)) {
    const i = resto.indexOf(parola);
    if (i < 0) return false;
    resto.splice(i, 1);
  }
  return resto.length === 1 && resto[0].startsWith(m[2].toLowerCase());
}

const tabella = (righe) => {
  if (!righe.length) return;
  const w = Math.max(...righe.map((r) => r.prima.length), 5);
  for (const r of righe) console.log(`  ${String(r.id).padStart(3)}  ${r.prima.padEnd(w)}  →  ${r.dopo}${r.nota ? `   (${r.nota})` : ""}`);
};

// In prova non si crea nemmeno la tabella: solo letture
const [{ esiste }] = await sql`SELECT to_regclass('professionals_nome_backup') IS NOT NULL AS esiste`;
if (!esiste && !PROVA) {
  await sql`
    CREATE TABLE IF NOT EXISTS professionals_nome_backup (
      id integer PRIMARY KEY,
      name text NOT NULL,
      data timestamp with time zone NOT NULL DEFAULT now()
    )`;
}
const conBackup = esiste || !PROVA;

if (RIPRISTINA) {
  // Rimette il nome di prima a chi ha ANCORA il nome messo dalla migrazione; chi è stato
  // cambiato a mano dopo resta com'è (e resta nel backup). Le righe rimesse escono dal
  // backup: così, se serve, la migrazione si può rifare.
  const righe = !conBackup ? [] : await sql`
    SELECT b.id, b.name AS vecchio, p.name AS attuale, p.full_name
    FROM professionals_nome_backup b JOIN professionals p ON p.id = b.id ORDER BY b.id`;
  const rimessi = [], lasciati = [];
  for (const r of righe) {
    if (String(r.attuale).trim() === String(r.vecchio).trim()) {
      lasciati.push({ id: r.id, prima: r.attuale, dopo: r.attuale, nota: "uguale a prima (escluso, o iniziale rimessa a mano): resta nel backup" });
      continue;
    }
    if (String(r.attuale).trim() !== nomePubblico(r.full_name)) {
      lasciati.push({ id: r.id, prima: r.attuale, dopo: r.attuale, nota: `cambiato a mano dopo la migrazione; nel backup: ${r.vecchio}` });
      continue;
    }
    if (!PROVA) {
      await sql`
        WITH rimesso AS (
          UPDATE professionals SET name = ${r.vecchio} WHERE id = ${r.id} AND name = ${r.attuale} RETURNING id
        )
        DELETE FROM professionals_nome_backup WHERE id IN (SELECT id FROM rimesso)`;
    }
    rimessi.push({ id: r.id, prima: r.attuale, dopo: r.vecchio });
  }
  console.log(`\n${PROVA ? "PROVA (non scrivo nulla) — " : ""}Ripristino dei nomi dal backup`);
  console.log(`\nRimessi come prima: ${rimessi.length}`); tabella(rimessi);
  console.log(`\nLasciati come sono: ${lasciati.length}`); tabella(lasciati);
  const [resto] = conBackup ? await sql`SELECT COUNT(*)::int AS n FROM professionals_nome_backup` : [{ n: 0 }];
  console.log(`\nRighe rimaste nel backup: ${resto.n}${conBackup ? "" : " (il backup non esiste ancora)"}`);
} else {
  const fatti = new Set(conBackup ? (await sql`SELECT id FROM professionals_nome_backup`).map((r) => r.id) : []);
  const professionisti = await sql`
    SELECT p.id, p.name, p.full_name, p.status, p.deleted_at,
           (SELECT string_agg(u.role, ',') FROM professional_users u WHERE u.professional_id = p.id) AS ruoli
    FROM professionals p ORDER BY p.id`;

  const cambiare = [], aPosto = [], lasciati = [];
  let eliminati = 0, giaFatti = 0;
  for (const p of professionisti) {
    if (p.deleted_at || p.status === "deleted") { eliminati++; continue; }
    const attuale = String(p.name || "").trim();
    const full = String(p.full_name || "").trim();
    const nuovo = nomePubblico(full);
    const admin = String(p.ruoli || "").includes("admin") ? "amministratore" : "";
    const nota = (testo) => [testo, admin].filter(Boolean).join(" · ");
    if (fatti.has(p.id)) { giaFatti++; continue; } // nel backup: già fatto (o iniziale rimessa a mano dopo)
    if (!full) { lasciati.push({ id: p.id, prima: attuale, dopo: attuale, nota: nota("nome completo vuoto") }); continue; }
    if (attuale === nuovo) { aPosto.push({ id: p.id, prima: attuale, dopo: attuale, nota: nota(full.split(/\s+/).length < 2 ? "nome completo senza cognome" : "già nome e cognome") }); continue; }
    if (!natoConIniziale(attuale, full)) { lasciati.push({ id: p.id, prima: attuale, dopo: attuale, nota: nota(`scritto a mano; dal nome completo sarebbe «${nuovo}»`) }); continue; }
    if (ESCLUSI.has(p.id)) {
      // l'esclusione resta: la riga va nel backup col nome di oggi, i prossimi giri non la toccano
      if (!PROVA) await sql`INSERT INTO professionals_nome_backup (id, name) VALUES (${p.id}, ${attuale}) ON CONFLICT (id) DO NOTHING`;
      lasciati.push({ id: p.id, prima: attuale, dopo: attuale, nota: nota("escluso (--escludi): resta con l'iniziale anche nei prossimi giri") });
      continue;
    }
    const avvisi = [];
    if (full === full.toUpperCase() || full === full.toLowerCase()) avvisi.push(`nome completo «${full}» con maiuscole sistemate`);
    cambiare.push({ id: p.id, prima: attuale, dopo: nuovo, nota: nota(avvisi.join("; ")) });
  }

  console.log(`\n${PROVA ? "PROVA (non scrivo nulla) — " : ""}Nome pubblico con nome e cognome per intero`);
  let cambiati = 0;
  if (!PROVA) {
    for (const r of cambiare) {
      // backup e aggiornamento nella stessa istruzione: se la riga è già nel backup, niente
      const fatto = await sql`
        WITH salvato AS (
          INSERT INTO professionals_nome_backup (id, name) VALUES (${r.id}, ${r.prima})
          ON CONFLICT (id) DO NOTHING RETURNING id
        )
        UPDATE professionals SET name = ${r.dopo}
        WHERE id = ${r.id} AND name = ${r.prima} AND EXISTS (SELECT 1 FROM salvato)
        RETURNING id`;
      if (fatto.length) cambiati++;
      else r.nota = [r.nota, "NON cambiato: il nome è cambiato nel frattempo, rilancia"].filter(Boolean).join(" · ");
    }
  }
  console.log(`\nDa «Inf. Nome X.» a nome e cognome: ${cambiare.length}${PROVA ? "" : ` (cambiati ${cambiati})`}`); tabella(cambiare);
  console.log(`\nGià a posto: ${aPosto.length}`); tabella(aPosto);
  console.log(`\nLasciati come sono (da guardare): ${lasciati.length}`); tabella(lasciati);
  console.log(`\nGià fatti da questa migrazione (nel backup, non si toccano più): ${giaFatti}`);
  console.log(`Eliminati (non toccati): ${eliminati}`);
  const [b] = conBackup ? await sql`SELECT COUNT(*)::int AS n FROM professionals_nome_backup` : [{ n: 0 }];
  console.log(`Righe nel backup professionals_nome_backup: ${b.n}${conBackup ? "" : " (la tabella non esiste ancora: si crea alla prima applicazione)"}`);
}
