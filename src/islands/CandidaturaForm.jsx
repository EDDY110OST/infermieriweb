import React, { useState } from "react";

const PROFESSIONI = ["infermiere", "fisioterapista", "ostetrica", "medico specialista", "altro"];

export default function CandidaturaForm() {
  const [dati, setDati] = useState({
    name: "", email: "", phone: "", profession: "infermiere",
    albo_number: "", city: "", province: "", message: "", privacy: false,
  });
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    try {
      const r = await fetch("/api/candidatura", {
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
        <strong>Candidatura ricevuta ✅</strong>
        <p style={{ margin: "8px 0 0" }}>
          Grazie! Ti ricontatteremo entro pochi giorni per attivare la tua scheda e la tua agenda.
        </p>
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <label htmlFor="cf-nome">Nome e cognome *</label>
      <input id="cf-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} autoComplete="name" />

      <label htmlFor="cf-prof">Professione *</label>
      <select id="cf-prof" value={dati.profession} onChange={(e) => setDati({ ...dati, profession: e.target.value })}>
        {PROFESSIONI.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
      </select>

      <label htmlFor="cf-albo">Numero iscrizione all'albo (es. OPI)</label>
      <input id="cf-albo" value={dati.albo_number} onChange={(e) => setDati({ ...dati, albo_number: e.target.value })} />

      <label htmlFor="cf-email">Email *</label>
      <input id="cf-email" required type="email" value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

      <label htmlFor="cf-tel">Telefono *</label>
      <input id="cf-tel" required type="tel" minLength={6} value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

      <label htmlFor="cf-citta">Città in cui operi *</label>
      <input id="cf-citta" required minLength={2} value={dati.city} onChange={(e) => setDati({ ...dati, city: e.target.value })} />

      <label htmlFor="cf-prov">Provincia</label>
      <input id="cf-prov" value={dati.province} onChange={(e) => setDati({ ...dati, province: e.target.value })} />

      <label htmlFor="cf-msg">Raccontaci di te (prestazioni offerte, zone coperte…)</label>
      <textarea id="cf-msg" rows={4} value={dati.message} onChange={(e) => setDati({ ...dati, message: e.target.value })} />

      <div className="pf-check">
        <input id="cf-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
        <label htmlFor="cf-privacy" style={{ margin: 0, fontWeight: 400 }}>
          Acconsento al trattamento dei miei dati per la gestione della candidatura. *
        </label>
      </div>

      {errore && <div className="pf-errore">{errore}</div>}

      <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
        {invio ? "Invio…" : "Invia la candidatura — è gratis"}
      </button>
    </form>
  );
}
