import React, { useEffect, useState } from "react";

export default function DisdettaApp() {
  const [token] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""
  );
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const [recupero, setRecupero] = useState({ email: "", inviato: false, errore: "" });

  useEffect(() => {
    if (!token) return;
    fetch(`/api/disdetta?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setErrore(d.error) : setDati(d.booking)))
      .catch(() => setErrore("Errore di caricamento"));
  }, [token]);

  const recuperaLink = async (e) => {
    e.preventDefault();
    setRecupero((r) => ({ ...r, errore: "" }));
    const r = await fetch("/api/disdetta-recupero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recupero.email }),
    });
    const d = await r.json();
    if (!r.ok) return setRecupero((prev) => ({ ...prev, errore: d.error || "Errore imprevisto" }));
    setRecupero((prev) => ({ ...prev, inviato: true }));
  };

  // Nessun token (arrivo diretto): niente vicolo cieco, si recupera il link via email
  if (!token) {
    return (
      <div className="pf-panel">
        <h2 style={{ marginTop: 0 }}>Hai perso l'email con il link?</h2>
        {recupero.inviato ? (
          <div className="pf-successo">
            Fatto ✅ Se ci sono prenotazioni attive collegate a quell'email, ti abbiamo
            appena rimandato i link per gestirle (controlla anche lo spam).
          </div>
        ) : (
          <form className="pf-book" onSubmit={recuperaLink}>
            <p style={{ color: "var(--iw-slate)" }}>
              Inserisci l'email usata per prenotare: ti rimandiamo subito il link per
              gestire o disdire la prenotazione.
            </p>
            <label htmlFor="rec-email">La tua email</label>
            <input id="rec-email" type="email" required value={recupero.email}
              onChange={(e) => setRecupero((r) => ({ ...r, email: e.target.value }))} autoComplete="email" />
            {recupero.errore && <div className="pf-errore">{recupero.errore}</div>}
            <button className="pf-btn">Rimandami il link</button>
            <p className="pf-note" style={{ marginTop: 10 }}>
              In alternativa puoi sempre contattare direttamente il professionista
              (il suo telefono è nella sua scheda e nell'email di conferma). Oppure
              apri <a href="/le-mie-prenotazioni">Le mie prenotazioni</a> per vederle tutte.
            </p>
          </form>
        )}
      </div>
    );
  }

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
