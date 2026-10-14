import { useState } from "react";

// Modulo «Segnala un contenuto» (14/10/26, DSA art. 16): cosa, dove, perché, chi segnala
// e la dichiarazione di buona fede. Invia a /api/segnala.
const TIPI = [
  ["recensione", "Una recensione"],
  ["scheda", "La scheda di un professionista"],
  ["articolo", "Un articolo del blog"],
  ["altro", "Altro"],
];

export default function SegnalaForm({ tipoIniziale = "", urlIniziale = "" }) {
  const [dati, setDati] = useState({
    tipo: TIPI.some(([k]) => k === tipoIniziale) ? tipoIniziale : "recensione",
    url: urlIniziale, motivo: "", nome: "", email: "", buonaFede: false, privacy: false,
  });
  const [errore, setErrore] = useState("");
  const [invio, setInvio] = useState(false);
  const [fatto, setFatto] = useState(false);
  const cambia = (k, v) => { setErrore(""); setDati({ ...dati, [k]: v }); };

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    if (dati.motivo.trim().length < 10) return setErrore("Spiega in poche parole cosa non va (almeno 10 caratteri).");
    if (!dati.email.includes("@")) return setErrore("Serve la tua email: ti scriviamo cosa abbiamo deciso.");
    if (!dati.buonaFede) return setErrore("Conferma che la segnalazione è fatta in buona fede: spunta la casella.");
    if (!dati.privacy) return setErrore("Conferma di aver letto l'informativa privacy: spunta la casella.");
    setInvio(true);
    try {
      const r = await fetch("/api/segnala", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dati) });
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
      <div className="pf-panel">
        <div className="pf-successo">
          <strong>Segnalazione ricevuta ✅</strong>
          <p style={{ margin: "8px 0 0" }}>Ti abbiamo mandato una email di ricevuta. Ti scriviamo appena l'abbiamo esaminata.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="pf-panel pf-book" onSubmit={invia} noValidate>
      <label htmlFor="sg-tipo">Cosa vuoi segnalare *</label>
      <select id="sg-tipo" value={dati.tipo} onChange={(e) => cambia("tipo", e.target.value)}>
        {TIPI.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>

      <label htmlFor="sg-url">Dove si trova <span style={{ fontWeight: 400 }}>(indirizzo della pagina o nome del professionista)</span></label>
      <input id="sg-url" value={dati.url} onChange={(e) => cambia("url", e.target.value)} placeholder="es. infermieriweb.it/p/nome-cognome" maxLength={300} />

      <label htmlFor="sg-motivo">Cosa non va e perché *</label>
      <textarea id="sg-motivo" rows={5} value={dati.motivo} onChange={(e) => cambia("motivo", e.target.value)} maxLength={3000}
        placeholder="es. La recensione del 3 ottobre parla di una visita che non c'è mai stata" />

      <div className="pf-campi-2">
        <div>
          <label htmlFor="sg-nome">Il tuo nome</label>
          <input id="sg-nome" value={dati.nome} onChange={(e) => cambia("nome", e.target.value)} autoComplete="name" maxLength={120} />
        </div>
        <div>
          <label htmlFor="sg-email">La tua email *</label>
          <input id="sg-email" type="email" value={dati.email} onChange={(e) => cambia("email", e.target.value)} autoComplete="email" maxLength={160} />
        </div>
      </div>

      <div className="pf-check">
        <input id="sg-buona-fede" type="checkbox" checked={dati.buonaFede} onChange={(e) => cambia("buonaFede", e.target.checked)} />
        <label htmlFor="sg-buona-fede" style={{ margin: 0, fontWeight: 400 }}>Dichiaro in buona fede che quello che ho scritto è corretto e completo. *</label>
      </div>
      <div className="pf-check">
        <input id="sg-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => cambia("privacy", e.target.checked)} />
        <label htmlFor="sg-privacy" style={{ margin: 0, fontWeight: 400 }}>Ho letto l'<a href="/privacy" target="_blank" rel="noopener">informativa privacy</a>: i miei dati servono solo a gestire la segnalazione. *</label>
      </div>

      {errore && <div className="pf-errore" role="alert">{errore}</div>}
      <button className="pf-btn" disabled={invio} style={{ width: "100%" }}>{invio ? "Invio…" : "Invia la segnalazione"}</button>
    </form>
  );
}
