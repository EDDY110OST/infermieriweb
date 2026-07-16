import React, { useState } from "react";

// Nuova password col token ricevuto via email (60 minuti di validità)
export default function ResetPasswordApp() {
  const [token] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""
  );
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);
  const [invio, setInvio] = useState(false);

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    if (password !== conferma) return setErrore("Le due password non coincidono");
    setInvio(true);
    try {
      const r = await fetch("/api/panel/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (!r.ok) return setErrore(d.error || "Errore imprevisto");
      setFatto(true);
    } catch {
      setErrore("Problema di connessione: riprova tra un attimo");
    } finally {
      setInvio(false);
    }
  };

  if (!token) {
    return <div className="pf-errore">Link non valido: usa il tasto che trovi nell'email di reset.</div>;
  }

  if (fatto) {
    return (
      <div className="pf-successo">
        <strong>Password aggiornata ✅</strong>
        <p style={{ margin: "8px 0 0" }}>Da adesso entri con la nuova password.</p>
        <p style={{ margin: "10px 0 0" }}>
          <a className="pf-btn" href="/area-professionisti">Vai all'accesso</a>
        </p>
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <label htmlFor="rp-pass">Nuova password <span style={{ fontWeight: 400 }}>(almeno 10 caratteri)</span></label>
      <input id="rp-pass" type="password" required minLength={10} value={password}
        onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      <label htmlFor="rp-conf">Ripeti la nuova password</label>
      <input id="rp-conf" type="password" required minLength={10} value={conferma}
        onChange={(e) => setConferma(e.target.value)} autoComplete="new-password" />
      {errore && <div className="pf-errore">{errore}</div>}
      <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
        {invio ? "Salvo…" : "Salva la nuova password"}
      </button>
    </form>
  );
}
