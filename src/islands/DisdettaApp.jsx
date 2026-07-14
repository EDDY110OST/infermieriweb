import React, { useEffect, useState } from "react";

export default function DisdettaApp() {
  const [token] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""
  );
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  useEffect(() => {
    if (!token) return setErrore("Link non valido: manca il codice della prenotazione.");
    fetch(`/api/disdetta?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setErrore(d.error) : setDati(d.booking)))
      .catch(() => setErrore("Errore di caricamento"));
  }, [token]);

  const disdici = async () => {
    setErrore("");
    const r = await fetch("/api/disdetta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const d = await r.json();
    if (!r.ok) return setErrore(d.error || "Errore imprevisto");
    setFatto(true);
  };

  if (errore && !dati) return <div className="pf-errore">{errore}</div>;
  if (!dati) return <p className="pf-note">Caricamento…</p>;

  const quando = new Date(dati.start).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  if (fatto || dati.status === "cancelled") {
    return (
      <div className="pf-successo">
        <strong>Prenotazione annullata.</strong>
        <p style={{ margin: "8px 0 0" }}>Lo slot è tornato disponibile. Puoi prenotare di nuovo quando vuoi.</p>
      </div>
    );
  }

  return (
    <div className="pf-panel">
      <h2>La tua prenotazione</h2>
      <p>
        <strong>{dati.service}</strong> con {dati.professional}<br />
        <strong style={{ textTransform: "capitalize" }}>{quando}</strong>
      </p>
      {dati.cancellable ? (
        <>
          {errore && <div className="pf-errore">{errore}</div>}
          <button className="pf-btn pericolo" onClick={disdici}>Disdici questa prenotazione</button>
          <p className="pf-note" style={{ marginTop: 10 }}>
            La disdetta online è possibile fino a {dati.cancel_hours} ore prima dell'appuntamento.
          </p>
        </>
      ) : (
        <div className="pf-errore">
          La disdetta online non è più disponibile (meno di {dati.cancel_hours} ore all'appuntamento).
          Contatta direttamente il professionista.
        </div>
      )}
    </div>
  );
}
