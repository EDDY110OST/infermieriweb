import React, { useEffect, useRef, useState } from "react";

// Il tasto di convalida: il click umano è il punto — i filtri antispam delle
// caselle email "visitano" i link, ma non premono bottoni.
export default function ConfermaApp() {
  const [token] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""
  );
  const [stato, setStato] = useState("invio"); // invio | fatto | errore
  const partito = useRef(false);
  const [errore, setErrore] = useState("");
  const [cancelToken, setCancelToken] = useState("");

  const convalida = async () => {
    setStato("invio");
    setErrore("");
    try {
      const r = await fetch("/api/conferma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (!r.ok) { setErrore(d.error || "Errore imprevisto"); return setStato("errore"); }
      setCancelToken(d.cancel_token || "");
      setStato("fatto");
    } catch {
      setErrore("Problema di connessione: riprova tra un attimo");
      setStato("errore");
    }
  };

  useEffect(() => {
    if (token && !partito.current) {
      partito.current = true;
      convalida();
    }
  }, [token]);

  if (!token) {
    return <div className="pf-errore">Link non valido: apri il tasto "Convalida" che trovi nell'email di prenotazione.</div>;
  }

  if (stato === "fatto") {
    return (
      <div className="pf-successo">
        <strong>Prenotazione confermata ✅</strong>
        <p style={{ margin: "10px 0 0" }}>
          Il professionista è stato avvisato: ti aspetta all'orario scelto. Ti abbiamo
          inviato l'email definitiva con tutti i dettagli e il link per gestire o
          disdire (gratis) se cambiano i piani.
        </p>
        {cancelToken && (
          <p style={{ margin: "10px 0 0" }}>
            <a href={`/prenotazione?token=${cancelToken}`}>Gestisci la prenotazione da qui</a>
          </p>
        )}
      </div>
    );
  }

  if (stato === "errore") {
    return (
      <div>
        <div className="pf-errore">{errore}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="pf-btn secondario" onClick={convalida}>Riprova</button>
          <a className="pf-btn" href="/cerca">Prenota di nuovo</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--iw-slate)", fontSize: 18 }}>Sto convalidando la tua prenotazione…</p>
    </div>
  );
}
