import { useCallback, useEffect, useState } from "react";
import { MODELLO_VIOLAZIONE } from "../data/registri-privacy-modello.js";

// Admin → Documenti → «Registro dei trattamenti» e «Registro delle violazioni» (12/11/26).
// I due registri che il GDPR chiede di tenere per iscritto (art. 30 e art. 33.5): qui si
// leggono, si correggono e si stampano. Niente si cancella e ogni modifica resta scritta
// con data e nome (lib/registri-privacy.js). I dati arrivano da /api/admin/registri-privacy.

const ROMA = "Europe/Rome";
const quando = (iso) =>
  new Date(iso).toLocaleString("it-IT", { timeZone: ROMA, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Punti lasciati in sospeso nelle bozze: «[DA COMPILARE: …]», «[DA DECIDERE …]» ecc.
const SOSPESO = /\[DA [A-ZÀ-Ú]+[^\]]*\]/g;
// Conta anche le voci lasciate senza testo.
const sospesi = (riga) => (riga.voci || []).reduce((n, v) => n + (String(v.contenuto).trim() ? (String(v.contenuto).match(SOSPESO) || []).length : 1), 0);

const TESTI = {
  trattamenti: {
    titolo: "📒 Registro dei trattamenti",
    intro: "Dice, per ogni uso dei dati, a cosa serve, chi riguarda, a chi va e per quanto resta. La legge lo chiede a chi tratta dati legati alla salute (art. 30 GDPR). Non si pubblica: si mostra al Garante se lo chiede. Aggiornalo ogni volta che il sito cambia il modo di usare i dati.",
    nuova: "➕ Aggiungi un trattamento",
    riga: "trattamento",
  },
  violazioni: {
    titolo: "🚨 Registro delle violazioni",
    intro: "Qui si annota ogni incidente che tocca i dati personali, anche quando non va comunicato al Garante (art. 33.5 GDPR). Non è solo il furto: conta anche un'email al destinatario sbagliato, un dato modificato per errore, il sito fermo a lungo.",
    nuova: "➕ Aggiungi un incidente",
    riga: "incidente",
  },
};

const BOX_AVVISO = { background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 16 };
const ETICHETTA = { fontWeight: 700, color: "var(--iw-navy)", fontSize: 15 };

// Il testo di una voce, con i punti in sospeso evidenziati
function Testo({ children }) {
  const testo = String(children || "");
  if (!testo.trim()) return <mark style={{ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "0 3px" }}>da compilare</mark>;
  const pezzi = testo.split(/(\[DA [A-ZÀ-Ú]+[^\]]*\])/g);
  return (
    <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {pezzi.map((p, i) => (/^\[DA /.test(p)
        ? <mark key={i} style={{ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "0 3px" }}>{p}</mark>
        : <span key={i}>{p}</span>))}
    </span>
  );
}

function Procedura72Ore() {
  return (
    <details className="pf-panel" style={{ marginBottom: 14 }}>
      <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--iw-navy)", fontSize: 18 }}>⏱️ Cosa fare entro 72 ore se succede qualcosa</summary>
      <p style={{ margin: "12px 0 8px", color: "var(--iw-slate)" }}>
        Le 72 ore partono da quando uno di voi due <strong>viene a sapere</strong> dell'incidente.
      </p>
      <ol style={{ margin: 0, paddingLeft: 22, color: "var(--iw-slate)", display: "grid", gap: 6 }}>
        <li><strong>Subito — fermare il danno:</strong> cambiare password e chiavi coinvolte, chiudere l'accesso, spegnere la funzione che perde dati.</li>
        <li><strong>Subito — avvisare l'altro gestore,</strong> per telefono o messaggio.</li>
        <li><strong>Entro 24 ore — capire i fatti:</strong> cosa è successo, quali dati, quante persone, da quando, se i dati erano cifrati.</li>
        <li><strong>Entro 48 ore — valutare il rischio:</strong> «può fare un danno alle persone?» (truffe, imbarazzo, un appuntamento sanitario perso). Nel dubbio, sentire l'avvocato.</li>
        <li><strong>Entro 72 ore — decidere:</strong> rischio improbabile → si scrive solo qui, con il motivo; rischio possibile → notifica al Garante dal modulo sul suo sito; rischio elevato → anche avviso alle persone coinvolte, con parole semplici.</li>
        <li><strong>Sempre — scrivere la riga qui sotto,</strong> anche se non si notifica.</li>
        <li><strong>Dopo — correggere la causa</strong> e annotare cosa è cambiato.</li>
      </ol>
      <p className="pf-note" style={{ margin: "10px 0 0" }}>
        Se l'incidente parte da un fornitore (Render, Brevo, Aruba) le 72 ore partono dal suo avviso. Scarica una copia in PDF del registro dopo ogni riga nuova: se il sito è fermo, questa pagina non si apre.
      </p>
    </details>
  );
}

// Modulo per creare o correggere una riga: titolo + elenco di voci (nome e testo)
function Modulo({ quale, iniziale, prossimo, onSalva, onAnnulla, salvando, errore }) {
  const [titolo, setTitolo] = useState(iniziale.titolo);
  const [voci, setVoci] = useState(iniziale.voci);
  const nuova = !iniziale.id;
  const violazione = quale === "violazioni";
  // il numero dell'incidente («1/2026») lo assegna il sito e non si cambia
  const numero = violazione ? (nuova ? prossimo : String(iniziale.titolo).match(/^\d+\/\d{4}/)?.[0]) : "";
  const senzaNumero = (t) => String(t).replace(/^\d+\/\d{4}\s*[—-]\s*/, "");
  const cambiaVoce = (i, campo, valore) => setVoci((v) => v.map((x, j) => (j === i ? { ...x, [campo]: valore } : x)));
  const cambiato = titolo !== iniziale.titolo || JSON.stringify(voci) !== JSON.stringify(iniziale.voci);

  return (
    <form
      className="pf-book"
      style={{ maxWidth: "none", margin: 0, padding: 0, border: 0, boxShadow: "none", background: "none" }}
      onSubmit={(e) => { e.preventDefault(); onSalva({ id: iniziale.id, titolo: violazione ? senzaNumero(titolo) : titolo, voci }); }}
    >
      <label htmlFor="rp-titolo">{violazione ? "In poche parole: cosa è successo *" : "Nome del trattamento *"}</label>
      <input
        id="rp-titolo" required minLength={2} maxLength={200}
        value={violazione ? senzaNumero(titolo) : titolo}
        onChange={(e) => setTitolo(e.target.value)}
        placeholder={violazione ? "es. email di conferma spedita al paziente sbagliato" : "es. Pagamenti online"}
      />
      {violazione && numero && <p className="pf-note" style={{ margin: "-6px 0 12px" }}>Nel registro sarà l'incidente <strong>n. {numero}</strong>: il numero lo mette il sito e non cambia più.</p>}

      {voci.map((v, i) => (
        <div key={i} style={{ borderTop: "1px solid var(--iw-line)", padding: "12px 0 2px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <input
              aria-label={`Nome della voce ${i + 1}`} maxLength={140} style={{ flex: 1, minWidth: 0, marginBottom: 0, fontWeight: 700 }}
              value={v.voce} onChange={(e) => cambiaVoce(i, "voce", e.target.value)} placeholder="Nome della voce (es. Per quanto restano)"
            />
            <button type="button" className="pf-btn pericolo compatto" aria-label={`Togli la voce ${v.voce || i + 1}`} onClick={() => setVoci((x) => x.filter((_, j) => j !== i))}>Togli</button>
          </div>
          <textarea
            aria-label={`Testo della voce ${v.voce || i + 1}`} maxLength={8000}
            rows={Math.min(16, Math.max(2, Math.ceil(String(v.contenuto).length / 38) + String(v.contenuto).split("\n").length - 1))}
            value={v.contenuto} onChange={(e) => cambiaVoce(i, "contenuto", e.target.value)} placeholder={v.aiuto || ""}
          />
        </div>
      ))}
      <button type="button" className="pf-btn secondario compatto" style={{ marginBottom: 14 }} onClick={() => setVoci((x) => [...x, { voce: "", contenuto: "" }])}>＋ Aggiungi una voce</button>

      {errore && <div className="pf-errore">{errore}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="pf-btn" disabled={salvando}>{salvando ? "Salvo…" : nuova ? "Salva nel registro" : "Salva la correzione"}</button>
        <button type="button" className="pf-btn secondario" disabled={salvando} onClick={() => { if (!cambiato || window.confirm("Chiudo senza salvare le modifiche?")) onAnnulla(); }}>Annulla</button>
      </div>
      <p className="pf-note" style={{ margin: "10px 0 0" }}>
        {nuova ? "La riga resta nel registro con la data di oggi e il tuo nome." : "La correzione resta scritta nello storico: chi, quando, com'era prima e com'è adesso."}
      </p>
    </form>
  );
}

export default function RegistriPrivacy({ quale = "trattamenti" }) {
  const T = TESTI[quale];
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState("");
  const [aperta, setAperta] = useState(null); // id della riga aperta in lettura
  const [modulo, setModulo] = useState(null); // {id?, titolo, voci} in modifica
  const [salvando, setSalvando] = useState(false);
  const [erroreModulo, setErroreModulo] = useState("");
  const [fatto, setFatto] = useState("");
  const [archivio, setArchivio] = useState(false);

  const carica = useCallback(async () => {
    setErrore("");
    try {
      const r = await fetch(`/api/admin/registri-privacy?registro=${quale}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Non riesco a leggere il registro");
      setDati(d);
    } catch (e) { setErrore(e.message); }
  }, [quale]);
  useEffect(() => { setDati(null); setModulo(null); setAperta(null); setFatto(""); carica(); }, [carica]);

  const manda = async (corpo, messaggio) => {
    setSalvando(true); setErroreModulo(""); setFatto("");
    try {
      const r = await fetch("/api/admin/registri-privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Non sono riuscito a salvare");
      setModulo(null);
      setFatto(d.invariata ? "Nessuna modifica da salvare." : messaggio);
      setAperta(d.id);
      await carica();
      return true;
    } catch (e) { setErroreModulo(e.message); return false; } finally { setSalvando(false); }
  };
  const salva = (riga) => manda({ azione: "salva", registro: quale, ...riga }, riga.id ? "Correzione salvata." : "Riga aggiunta al registro.");
  const archivia = (r, giu) => {
    if (giu && !window.confirm(`Archivio «${r.titolo}»? Resta nel registro tra i trattamenti non più in uso e si può rimettere.`)) return;
    if (giu) setArchivio(true); // così si vede subito dov'è finita la riga
    manda({ azione: giu ? "archivia" : "ripristina", id: r.id }, giu ? "Trattamento archiviato. Lo trovi qui sotto, fra quelli non più in uso." : "Trattamento rimesso in uso.");
  };
  const apriNuova = () => {
    setFatto(""); setErroreModulo("");
    setModulo(quale === "violazioni"
      ? { titolo: "", voci: MODELLO_VIOLAZIONE.map((m) => ({ voce: m.voce, contenuto: "", aiuto: m.aiuto })) }
      : { titolo: "", voci: ["A cosa serve", "Base giuridica", "Chi riguarda", "Quali dati", "A chi vanno", "Fuori dall'UE", "Per quanto restano"].map((voce) => ({ voce, contenuto: "" })) });
  };

  if (errore) return <div className="pf-panel"><div className="pf-errore">{errore}</div><button className="pf-btn secondario" onClick={carica}>Riprova</button></div>;
  if (!dati) return <div className="pf-panel"><p className="pf-note">Carico il registro…</p></div>;

  const attive = dati.righe.filter((r) => r.stato !== "archiviato");
  const archiviate = dati.righe.filter((r) => r.stato === "archiviato");
  const daCompletare = attive.reduce((n, r) => n + sospesi(r), 0);
  const ultima = dati.righe.reduce((m, r) => (!m || new Date(r.updated_at) > new Date(m.updated_at) ? r : m), null);

  // Funzione e non componente: un componente definito qui dentro verrebbe rimontato a ogni
  // ridisegno, e un errore di salvataggio farebbe perdere quello che si stava scrivendo.
  const riga = (r) => {
    const n = sospesi(r), eAperta = aperta === r.id, inModifica = modulo?.id === r.id;
    return (
      <div key={r.id} className="pf-panel" style={{ marginBottom: 10, padding: "14px 18px" }}>
        <button
          type="button" aria-expanded={eAperta}
          onClick={() => { setAperta(eAperta ? null : r.id); if (inModifica) setModulo(null); }}
          style={{ all: "unset", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", width: "100%", boxSizing: "border-box" }}
        >
          <strong style={{ fontSize: 18, color: "var(--iw-navy)", flex: 1, minWidth: 180 }}>{eAperta ? "▾" : "▸"} {r.titolo}</strong>
          {n > 0 && <span className="stato noshow">{n} da completare</span>}
          {r.stato === "archiviato" && <span className="stato expired">non più in uso</span>}
        </button>
        {eAperta && !inModifica && (
          <div style={{ marginTop: 12 }}>
            {(r.voci || []).map((v, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: "1px solid var(--iw-line)" }}>
                <div style={ETICHETTA}>{v.voce}</div>
                <div style={{ color: "var(--iw-slate)" }}><Testo>{v.contenuto}</Testo></div>
              </div>
            ))}
            <p className="pf-note" style={{ margin: "10px 0" }}>Ultima modifica: {quando(r.updated_at)} — {r.updated_by || "—"}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="pf-btn compatto" onClick={() => { setFatto(""); setErroreModulo(""); setModulo({ id: r.id, titolo: r.titolo, voci: (r.voci || []).map((v) => ({ ...v })) }); }}>✏️ {quale === "violazioni" ? "Correggi o completa" : "Modifica"}</button>
              {quale === "trattamenti" && (r.stato === "archiviato"
                ? <button className="pf-btn secondario compatto" disabled={salvando} onClick={() => archivia(r, false)}>Rimetti in uso</button>
                : <button className="pf-btn secondario compatto" disabled={salvando} onClick={() => archivia(r, true)}>Archivia (non più in uso)</button>)}
            </div>
          </div>
        )}
        {inModifica && (
          <div style={{ marginTop: 12 }}>
            <Modulo quale={quale} iniziale={modulo} prossimo={dati.prossimo} onSalva={salva} onAnnulla={() => setModulo(null)} salvando={salvando} errore={erroreModulo} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h2 style={{ marginTop: 0 }}>{T.titolo}</h2>
        <p style={{ color: "var(--iw-slate)", margin: "0 0 12px" }}>{T.intro}</p>
        <div className="pf-panel-toolbar" style={{ marginBottom: 0 }}>
          <button className="pf-btn compatto" onClick={apriNuova}>{T.nuova}</button>
          <a className="pf-btn secondario compatto" href={`/admin/registro-stampa?quale=${quale}`} target="_blank" rel="noreferrer">🖨️ Stampa o salva in PDF</a>
        </div>
        {ultima && <p className="pf-note" style={{ margin: "12px 0 0" }}>Ultima modifica al registro: {quando(ultima.updated_at)} — {ultima.updated_by || "—"}.</p>}
      </div>

      {quale === "violazioni" && <Procedura72Ore />}
      {daCompletare > 0 && (
        <div style={BOX_AVVISO}>
          ⚠️ <strong>{daCompletare === 1 ? "Resta 1 punto" : `Restano ${daCompletare} punti`} da completare</strong>, in giallo dentro le righe con l'etichetta «da completare».
          Finché ci sono, il registro è una bozza.
        </div>
      )}
      {fatto && <div className="pf-successo" style={{ marginBottom: 14 }}>✅ {fatto}</div>}
      {erroreModulo && !modulo && <div className="pf-errore" style={{ marginBottom: 14 }}>{erroreModulo}</div>}

      {modulo && !modulo.id && (
        <div className="pf-panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: "var(--iw-navy)" }}>{quale === "violazioni" ? "Nuovo incidente" : "Nuovo trattamento"}</h3>
          <Modulo quale={quale} iniziale={modulo} prossimo={dati.prossimo} onSalva={salva} onAnnulla={() => setModulo(null)} salvando={salvando} errore={erroreModulo} />
        </div>
      )}

      {attive.length === 0 && <div className="pf-panel"><p className="pf-note" style={{ margin: 0 }}>Nessun {T.riga} nel registro.</p></div>}
      {attive.map(riga)}

      {archiviate.length > 0 && (
        <div style={{ margin: "18px 0 10px" }}>
          <button className="pf-btn secondario compatto" aria-expanded={archivio} onClick={() => setArchivio(!archivio)}>
            {archivio ? "▾" : "▸"} Trattamenti non più in uso ({archiviate.length})
          </button>
        </div>
      )}
      {archivio && archiviate.map(riga)}

      <div className="pf-panel" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🕓 Storico delle modifiche</h3>
        {dati.storico.map((s) => (
          <div key={s.id} style={{ padding: "8px 0", borderTop: "1px solid var(--iw-line)", fontSize: 16, color: "var(--iw-slate)" }}>
            <strong>{quando(s.at)}</strong> — {s.azione === "avviato" ? s.titolo : <>{s.admin}: {s.azione} «{s.titolo}»</>}
          </div>
        ))}
        <p className="pf-note" style={{ margin: "10px 0 0" }}>Lo storico non si può modificare né cancellare. Nella versione da stampare c'è tutto.</p>
      </div>
    </div>
  );
}
