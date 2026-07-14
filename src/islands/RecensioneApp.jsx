import React, { useEffect, useState } from "react";

export default function RecensioneApp() {
  const [token] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") || "" : ""
  );
  const [info, setInfo] = useState(null);
  const [errore, setErrore] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [autore, setAutore] = useState("");
  const [invio, setInvio] = useState(false);
  const [fatto, setFatto] = useState(false);

  useEffect(() => {
    if (!token) return setErrore("Link non valido: manca il codice.");
    fetch(`/api/recensione?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return setErrore(d.error);
        setInfo(d);
        setAutore(d.nome ? d.nome.split(" ")[0] : "");
      })
      .catch(() => setErrore("Errore di caricamento"));
  }, [token]);

  const invia = async (e) => {
    e.preventDefault();
    if (!rating) return setErrore("Scegli quante stelle dare");
    setErrore("");
    setInvio(true);
    try {
      const r = await fetch("/api/recensione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, text, author_name: autore }),
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

  if (errore && !info) return <div className="pf-errore">{errore}</div>;
  if (!info) return <p className="pf-note">Caricamento…</p>;

  if (fatto || info.giaRecensita) {
    return (
      <div className="pf-successo">
        <strong>{info.giaRecensita && !fatto ? "Hai già recensito questa prestazione." : "Grazie! ⭐"}</strong>
        <p style={{ margin: "8px 0 0" }}>
          {fatto
            ? "La tua recensione verrà pubblicata dopo una rapida verifica. Aiuta davvero altre famiglie a scegliere."
            : "La tua recensione è già stata registrata."}
        </p>
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      <p style={{ marginTop: 0 }}>
        Com'è andata la prestazione <strong>{info.prestazione}</strong> con <strong>{info.professionista}</strong>?
      </p>

      <div className="pf-stelle-picker" role="radiogroup" aria-label="Valutazione da 1 a 5 stelle">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} stelle`}
            className={`stella${(hover || rating) >= n ? " piena" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor="rc-testo">Racconta la tua esperienza (facoltativo)</label>
      <textarea id="rc-testo" rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Puntualità, professionalità, come ti sei trovato…" />

      <label htmlFor="rc-nome">Il tuo nome (come apparirà)</label>
      <input id="rc-nome" maxLength={80} value={autore} onChange={(e) => setAutore(e.target.value)} placeholder="es. Maria R." />

      {errore && <div className="pf-errore">{errore}</div>}
      <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
        {invio ? "Invio…" : "Invia la recensione"}
      </button>
      <p className="pf-note" style={{ marginTop: 8 }}>
        Recensione verificata: sei arrivato qui dal link di una prenotazione reale.
      </p>
    </form>
  );
}
