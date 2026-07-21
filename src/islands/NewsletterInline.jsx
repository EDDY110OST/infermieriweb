import React, { useState } from "react";

// Box email compatto: registra il consenso alle comunicazioni via /api/newsletter.
export default function NewsletterInline({ source = "newsletter", placeholder = "La tua email", cta = "Tienimi aggiornato" }) {
  const [email, setEmail] = useState("");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    setInvio(true);
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
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
        Perfetto! Ti scriveremo appena ci sono novità.
      </div>
    );
  }

  return (
    <form className="pf-nl" onSubmit={invia}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        autoComplete="email"
        aria-label="La tua email"
      />
      <button className="pf-btn" disabled={invio}>{invio ? "Invio…" : cta}</button>
      {errore && <div className="pf-errore" style={{ width: "100%", marginTop: 8 }}>{errore}</div>}
      <p className="pf-note" style={{ width: "100%", marginTop: 8 }}>
        Iscrivendoti accetti l'<a href="/privacy" target="_blank" rel="noopener">informativa sulla privacy</a>.
      </p>
    </form>
  );
}
