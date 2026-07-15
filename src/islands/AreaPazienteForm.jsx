import React, { useState } from "react";

// Richiesta del link magico: l'email è l'identità, niente password da ricordare.
export default function AreaPazienteForm() {
  const [email, setEmail] = useState("");
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState("");

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    const r = await fetch("/api/area-paziente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json();
    if (!r.ok) return setErrore(d.error || "Errore imprevisto");
    setInviato(true);
  };

  if (inviato) {
    return (
      <div className="pf-successo">
        Fatto ✅ Se quell'email ha prenotazioni su InfermieriWeb, ti abbiamo appena
        inviato il tuo link personale (controlla anche lo spam).
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <p style={{ color: "var(--iw-slate)" }}>
        Inserisci l'email con cui hai prenotato: ti mandiamo un link personale,
        senza password da ricordare.
      </p>
      <label htmlFor="ap-email">La tua email</label>
      <input id="ap-email" type="email" required value={email}
        onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      {errore && <div className="pf-errore">{errore}</div>}
      <button className="pf-btn">Mandami il link</button>
    </form>
  );
}
