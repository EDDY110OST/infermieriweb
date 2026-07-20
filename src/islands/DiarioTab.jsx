import React, { useEffect, useState } from "react";

// Come panelFetch di PanelApp: su 401 avvisa il pannello (torna al login).
function pFetch(url, opts) {
  return fetch(url, opts).then((r) => {
    if (r.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iw-sessione-scaduta"));
    }
    return r;
  });
}

const VUOTO = { nome: "", telefono: "", terapia: "", patologie: "", intolleranze: "", allergie: "", parametri: "", note: "", consent: false };

const dataIt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "";

export default function DiarioTab() {
  const [pazienti, setPazienti] = useState(null); // null = caricamento
  const [attivo, setAttivo] = useState(true);      // false = DIARIO_KEY non configurata
  const [editor, setEditor] = useState(null);      // null = elenco; oggetto = scheda in modifica
  const [salvataggio, setSalvataggio] = useState(false);
  const [messaggio, setMessaggio] = useState(null);

  const caricaElenco = () => {
    setPazienti(null);
    pFetch("/api/panel/diario").then(async (r) => {
      if (r.status === 503) { setAttivo(false); setPazienti([]); return; }
      const d = await r.json();
      setPazienti(d.pazienti || []);
    }).catch(() => setPazienti([]));
  };

  useEffect(() => { caricaElenco(); }, []);

  const apri = (id) => {
    setMessaggio(null);
    pFetch(`/api/panel/diario?id=${id}`).then((r) => r.json()).then((d) => {
      if (d.record) setEditor({ ...VUOTO, ...d.record });
      else setMessaggio({ tipo: "err", testo: d.error || "Errore" });
    });
  };

  const salva = async (e) => {
    e.preventDefault();
    setMessaggio(null);
    if (!editor.consent) {
      setMessaggio({ tipo: "err", testo: "Spunta il consenso del paziente per poter salvare." });
      return;
    }
    setSalvataggio(true);
    try {
      const r = await pFetch("/api/panel/diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editor),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore imprevisto");
      setEditor(null);
      caricaElenco();
      setMessaggio({ tipo: "ok", testo: "Scheda salvata." });
    } catch (err) {
      setMessaggio({ tipo: "err", testo: err.message });
    } finally {
      setSalvataggio(false);
    }
  };

  const elimina = async () => {
    if (!editor?.id) { setEditor(null); return; }
    if (!confirm(`Eliminare definitivamente la scheda di ${editor.nome || "questo paziente"}? L'operazione non è reversibile.`)) return;
    await pFetch(`/api/panel/diario?id=${editor.id}`, { method: "DELETE" });
    setEditor(null);
    caricaElenco();
    setMessaggio({ tipo: "ok", testo: "Scheda eliminata." });
  };

  const set = (campo, valore) => setEditor({ ...editor, [campo]: valore });

  // ---- Diario non ancora attivo (manca la chiave di cifratura) ----
  if (!attivo) {
    return (
      <div className="pf-panel">
        <h2 style={{ marginTop: 0 }}>📋 Diario infermieristico</h2>
        <div className="pf-errore">
          Il diario non è ancora attivo su questo sito. Serve la chiave di cifratura dei dati:
          contatta l'amministratore. (Nessun dato sanitario viene salvato finché la cifratura non è attiva.)
        </div>
      </div>
    );
  }

  // ---- Editor scheda paziente ----
  if (editor) {
    return (
      <div className="pf-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>{editor.id ? "Modifica scheda" : "Nuova scheda paziente"}</h2>
          <button type="button" className="pf-btn secondario" onClick={() => setEditor(null)}>← Torna all'elenco</button>
        </div>

        <div className="pf-diario-lock">
          🔒 I dati di questa scheda sono <strong>cifrati</strong> e visibili <strong>solo a te</strong>. Inserisci
          solo le informazioni necessarie all'assistenza.
        </div>

        {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

        <form className="pf-book" onSubmit={salva}>
          <h3 className="pf-diario-sez">Dati anagrafici</h3>
          <label htmlFor="d-nome">Nome e cognome *</label>
          <input id="d-nome" required minLength={2} value={editor.nome} onChange={(e) => set("nome", e.target.value)} />
          <label htmlFor="d-tel">Telefono</label>
          <input id="d-tel" type="tel" value={editor.telefono} onChange={(e) => set("telefono", e.target.value)} />

          <h3 className="pf-diario-sez">Terapia</h3>
          <label htmlFor="d-ter">Terapia in corso</label>
          <textarea id="d-ter" rows={3} value={editor.terapia} onChange={(e) => set("terapia", e.target.value)} placeholder="Farmaci, dosaggi, orari, medicazioni…" />

          <h3 className="pf-diario-sez">Anamnesi clinica</h3>
          <label htmlFor="d-pat">Patologie</label>
          <textarea id="d-pat" rows={3} value={editor.patologie} onChange={(e) => set("patologie", e.target.value)} placeholder="Patologie note, diagnosi, interventi…" />
          <label htmlFor="d-int">Intolleranze</label>
          <input id="d-int" value={editor.intolleranze} onChange={(e) => set("intolleranze", e.target.value)} />
          <label htmlFor="d-all">Allergie</label>
          <input id="d-all" value={editor.allergie} onChange={(e) => set("allergie", e.target.value)} />

          <h3 className="pf-diario-sez">Parametri vitali</h3>
          <label htmlFor="d-par">Rilevazioni</label>
          <textarea id="d-par" rows={3} value={editor.parametri} onChange={(e) => set("parametri", e.target.value)} placeholder="PA, FC, SpO₂, temperatura, glicemia… con data della rilevazione" />

          <h3 className="pf-diario-sez">Note</h3>
          <label htmlFor="d-note">Note e informazioni aggiuntive</label>
          <textarea id="d-note" rows={4} value={editor.note} onChange={(e) => set("note", e.target.value)} />

          <div className="pf-check" style={{ marginTop: 6 }}>
            <input id="d-consent" type="checkbox" checked={editor.consent} onChange={(e) => set("consent", e.target.checked)} />
            <label htmlFor="d-consent" style={{ margin: 0, fontWeight: 400 }}>
              Attesto di aver informato il paziente e di aver raccolto il suo <strong>consenso</strong> al
              trattamento dei suoi dati sanitari nell'ambito dell'assistenza che gli fornisco. *
            </label>
          </div>

          {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginTop: 4 }}>{messaggio.testo}</div>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button className="pf-btn" disabled={salvataggio}>{salvataggio ? "Salvo…" : "Salva scheda"}</button>
            {editor.id && <button type="button" className="pf-btn secondario" onClick={elimina}>🗑 Elimina</button>}
          </div>
        </form>
      </div>
    );
  }

  // ---- Elenco pazienti ----
  return (
    <div className="pf-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>📋 Diario infermieristico</h2>
        <button type="button" className="pf-btn" onClick={() => { setMessaggio(null); setEditor({ ...VUOTO }); }}>+ Nuovo paziente</button>
      </div>

      <div className="pf-diario-lock">
        🔒 Le schede dei tuoi pazienti sono <strong>cifrate</strong> e visibili <strong>solo a te</strong>: nemmeno
        gli amministratori possono leggerle. Registra qui i dati di chi assisti a domicilio.
      </div>

      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {pazienti === null ? (
        <p className="pf-note">Carico le schede…</p>
      ) : pazienti.length === 0 ? (
        <p className="pf-note">Non hai ancora nessuna scheda. Premi <strong>+ Nuovo paziente</strong> per crearne una.</p>
      ) : (
        <div className="pf-diario-lista">
          {pazienti.map((p) => (
            <button key={p.id} type="button" className="pf-diario-riga" onClick={() => apri(p.id)}>
              <span className="nome">{p.nome}</span>
              <span className="data">agg. {dataIt(p.updated_at)} ›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
