import React, { useState } from "react";

const TIPI = ["RSA / Casa di riposo", "Clinica / Casa di cura", "Cooperativa sociale", "Centro medico / Ambulatorio", "Assistenza domiciliare", "Altro"];

export default function StruttureLeadForm() {
  const [dati, setDati] = useState({ name: "", type: TIPI[0], city: "", email: "", phone: "", message: "" });
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    try {
      const r = await fetch("/api/strutture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dati),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore imprevisto");
      setFatto(true);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setInvio(false);
    }
  };

  if (fatto) {
    return (
      <div className="pf-successo">
        <strong>Richiesta ricevuta ✅</strong>
        <p style={{ margin: "8px 0 0" }}>
          Ti ricontattiamo entro 24 ore all'email indicata per capire di cosa avete
          bisogno e presentarvi i profili della rete.
        </p>
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <label htmlFor="sl-nome">Nome della struttura *</label>
      <input id="sl-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} placeholder="es. RSA Villa Serena" />

      <label htmlFor="sl-tipo">Tipo di struttura</label>
      <select id="sl-tipo" value={dati.type} onChange={(e) => setDati({ ...dati, type: e.target.value })}>
        {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <label htmlFor="sl-citta">Città</label>
      <input id="sl-citta" value={dati.city} onChange={(e) => setDati({ ...dati, city: e.target.value })} />

      <label htmlFor="sl-email">Email *</label>
      <input id="sl-email" type="email" required value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

      <label htmlFor="sl-tel">Telefono</label>
      <input id="sl-tel" type="tel" value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

      <label htmlFor="sl-msg">Di cosa avete bisogno? <span style={{ fontWeight: 400 }}>(turni, sostituzioni, collaborazioni…)</span></label>
      <textarea id="sl-msg" rows={4} value={dati.message} onChange={(e) => setDati({ ...dati, message: e.target.value })} />

      {errore && <div className="pf-errore">{errore}</div>}
      <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
        {invio ? "Invio…" : "Invia la richiesta — senza impegno"}
      </button>
      <p className="pf-note" style={{ marginTop: 10 }}>
        Usiamo questi dati solo per ricontattarvi (<a href="/privacy">informativa privacy</a>).
      </p>
    </form>
  );
}
