import React, { useState } from "react";

const MOTIVI = [
  "Informazioni generali",
  "Sono un infermiere / voglio entrare in rete",
  "Assistenza su una prenotazione",
  "Altro",
];

export default function RichiediInfoForm() {
  const [dati, setDati] = useState({ reason: MOTIVI[0], name: "", email: "", phone: "", city: "", message: "", newsletter: false, privacy: false });
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    if (!dati.privacy) { setErrore("Per inviare devi accettare l'informativa sulla privacy."); return; }
    setInvio(true);
    try {
      const r = await fetch("/api/richiedi-informazioni", {
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
        <strong>Richiesta inviata ✅</strong>
        <p style={{ margin: "8px 0 0" }}>
          Grazie! Leggiamo tutto e ti rispondiamo via email appena possibile.
          Per un'emergenza sanitaria chiama sempre il <strong>112</strong>.
        </p>
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <label htmlFor="ri-motivo">Motivo della richiesta</label>
      <select id="ri-motivo" value={dati.reason} onChange={(e) => setDati({ ...dati, reason: e.target.value })}>
        {MOTIVI.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <label htmlFor="ri-nome">Nome *</label>
      <input id="ri-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} placeholder="Il tuo nome" autoComplete="name" />

      <label htmlFor="ri-email">Email *</label>
      <input id="ri-email" type="email" required value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

      <label htmlFor="ri-tel">Telefono</label>
      <input id="ri-tel" type="tel" value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

      <label htmlFor="ri-citta">Città</label>
      <input id="ri-citta" value={dati.city} onChange={(e) => setDati({ ...dati, city: e.target.value })} autoComplete="address-level2" />

      <label htmlFor="ri-msg">Messaggio</label>
      <textarea id="ri-msg" rows={4} value={dati.message} onChange={(e) => setDati({ ...dati, message: e.target.value })} placeholder="Scrivici la tua domanda…" />
      <p className="pf-note" style={{ marginTop: -4 }}>
        Per la tua privacy, non inserire qui informazioni sulla tua salute, diagnosi o patologie: indica
        solo di cosa hai bisogno in termini generali. I dettagli clinici li fornirai al professionista.
      </p>

      <div className="pf-check">
        <input id="ri-newsletter" type="checkbox" checked={dati.newsletter} onChange={(e) => setDati({ ...dati, newsletter: e.target.checked })} />
        <label htmlFor="ri-newsletter" style={{ margin: 0, fontWeight: 400 }}>
          Desidero ricevere comunicazioni sui servizi di InfermieriWeb.
        </label>
      </div>

      <div className="pf-check">
        <input id="ri-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
        <label htmlFor="ri-privacy" style={{ margin: 0, fontWeight: 400 }}>
          Ho letto l'<a href="/privacy" target="_blank" rel="noopener">informativa sulla privacy</a> e acconsento al trattamento dei miei dati per rispondere alla richiesta. *
        </label>
      </div>

      {errore && <div className="pf-errore">{errore}</div>}
      <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
        {invio ? "Invio…" : "Invia la richiesta"}
      </button>
      <p className="pf-note" style={{ marginTop: 10 }}>
        Usiamo questi dati solo per risponderti (<a href="/privacy">informativa privacy</a>).
        Le comunicazioni le ricevi solo se spunti la casella e puoi disiscriverti quando vuoi.
      </p>
    </form>
  );
}
