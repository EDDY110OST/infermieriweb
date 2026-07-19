import React, { useState } from "react";
import CercaComune from "./CercaComune.jsx";

const PROFESSIONI = ["Infermiere", "Infermiera"];

// Candidatura in 2 passi: prima chi sei e come contattarti (30 secondi),
// poi i dati professionali per la verifica. Stesso payload finale per l'API.
export default function CandidaturaForm() {
  const [passo, setPasso] = useState(1);
  const [dati, setDati] = useState({
    name: "", email: "", phone: "", profession: "", gender: "",
    albo_name: "", albo_number: "", albo_date: "", vat_number: "",
    city: "", province: "", region: "", sigla: "", address: "", message: "", privacy: false,
    password: "", password2: "",
  });
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(false);

  const avanti = (e) => {
    e.preventDefault();
    setErrore("");
    if (dati.password.length < 8) return setErrore("Scegli una password di almeno 8 caratteri");
    if (dati.password !== dati.password2) return setErrore("Le due password non coincidono");
    setPasso(2);
  };

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
          Grazie! Ti ricontatteremo entro pochi giorni per verificare i dati e attivare
          la tua scheda e la tua agenda.
        </p>
      </div>
    );
  }

  const progresso = (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
      <span style={{ color: passo === 1 ? "var(--iw-primary-deep)" : "var(--iw-muted)" }}>1. I tuoi contatti</span>
      <span style={{ color: "var(--iw-muted)" }}>→</span>
      <span style={{ color: passo === 2 ? "var(--iw-primary-deep)" : "var(--iw-muted)" }}>2. Verifica professionale</span>
    </div>
  );

  if (passo === 1) {
    return (
      <form className="pf-book" onSubmit={avanti}>
        {progresso}
        <label htmlFor="cf-nome">Nome e cognome *</label>
        <input id="cf-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} autoComplete="name" />

        <label htmlFor="cf-sesso">Sesso * <span style={{ fontWeight: 400 }}>(per l'appellativo sulla scheda: Dott. / Dott.ssa)</span></label>
        <select id="cf-sesso" required value={dati.gender} onChange={(e) => setDati({ ...dati, gender: e.target.value })}>
          <option value="" disabled>Scegli…</option>
          <option value="m">Uomo → Dott.</option>
          <option value="f">Donna → Dott.ssa</option>
        </select>

        <label htmlFor="cf-prof">Professione *</label>
        <select id="cf-prof" required value={dati.profession} onChange={(e) => setDati({ ...dati, profession: e.target.value })}>
          <option value="" disabled>Scegli…</option>
          {PROFESSIONI.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <label htmlFor="cf-citta">Comune in cui operi *</label>
        <CercaComune
          id="cf-citta"
          required
          placeholder="es. Lucca"
          valore={dati.city}
          onTesto={(t) => setDati({ ...dati, city: t, province: "", region: "", sigla: "" })}
          onScegli={(c) => setDati({ ...dati, city: c.nome, province: c.provincia, region: c.regione, sigla: c.sigla })}
        />
        <p className="pf-note" style={{ margin: "6px 0 12px" }}>
          {dati.province
            ? `📍 ${dati.province} · ${dati.region}`
            : "Scegli il comune dalla tendina: provincia e regione le compiliamo noi. Altri comuni li aggiungi dopo dalla tua area riservata."}
        </p>

        <label htmlFor="cf-email">Email *</label>
        <input id="cf-email" required type="email" value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

        <label htmlFor="cf-tel">Telefono *</label>
        <input id="cf-tel" required type="tel" minLength={6} value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

        <label htmlFor="cf-pw">Scegli una password * <span style={{ fontWeight: 400 }}>(almeno 8 caratteri)</span></label>
        <input id="cf-pw" required type="password" minLength={8} value={dati.password} onChange={(e) => setDati({ ...dati, password: e.target.value })} autoComplete="new-password" />

        <label htmlFor="cf-pw2">Ripeti la password *</label>
        <input id="cf-pw2" required type="password" minLength={8} value={dati.password2} onChange={(e) => setDati({ ...dati, password2: e.target.value })} autoComplete="new-password" />
        <p className="pf-note" style={{ marginTop: -6 }}>La userai per entrare nella tua agenda: sceglila tu, così non la dimentichi.</p>

        {errore && <div className="pf-errore">{errore}</div>}
        <button className="pf-btn" style={{ width: "100%" }}>Continua →</button>
        <p className="pf-note" style={{ marginTop: 10 }}>
          Manca solo un passo: i dati del tuo albo, che ci servono per verificare
          ogni professionista della rete.
        </p>
      </form>
    );
  }

  return (
    <form className="pf-book" onSubmit={invia}>
      {progresso}
      <p style={{ color: "var(--iw-slate)", marginTop: 0 }}>
        Questi dati servono solo alla verifica: su InfermieriWeb entra chi è
        davvero iscritto all'albo. È ciò che rende la rete affidabile.
      </p>

      <label htmlFor="cf-albo-nome">OPI di Appartenenza * <span style={{ fontWeight: 400 }}>(es. OPI Lucca)</span></label>
      <input id="cf-albo-nome" required minLength={3} placeholder="es. OPI Lucca" value={dati.albo_name} onChange={(e) => setDati({ ...dati, albo_name: e.target.value })} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <div>
          <label htmlFor="cf-albo">N. iscrizione *</label>
          <input id="cf-albo" required value={dati.albo_number} onChange={(e) => setDati({ ...dati, albo_number: e.target.value })} />
        </div>
        <div>
          <label htmlFor="cf-albo-data">Data iscrizione *</label>
          <input id="cf-albo-data" required type="date" value={dati.albo_date} onChange={(e) => setDati({ ...dati, albo_date: e.target.value })} />
        </div>
      </div>

      <label htmlFor="cf-piva">Partita IVA <span style={{ fontWeight: 400 }}>(se ce l'hai — 11 cifre)</span></label>
      <input id="cf-piva" pattern="[0-9]{11}" inputMode="numeric" maxLength={11} placeholder="es. 01234567890" value={dati.vat_number} onChange={(e) => setDati({ ...dati, vat_number: e.target.value.replace(/\D/g, "") })} />
      <p className="pf-note" style={{ marginTop: -6 }}>
        <strong>Hai la P.IVA?</strong> La tua scheda sarà prenotabile online dai pazienti a domicilio.{" "}
        <strong>Non ce l'hai?</strong> Candidati lo stesso: il tuo profilo entrerà nella vetrina riservata
        alle strutture sanitarie (in preparazione) e potrai attivare le prenotazioni a domicilio quando la aprirai.
      </p>

      <label htmlFor="cf-indirizzo">Indirizzo studio/sede <span style={{ fontWeight: 400 }}>(per il tuo segnaposto sulla mappa)</span></label>
      <input id="cf-indirizzo" placeholder="es. Via Roma 12" value={dati.address} onChange={(e) => setDati({ ...dati, address: e.target.value })} autoComplete="street-address" />

      <label htmlFor="cf-msg">Raccontaci di te (prestazioni offerte, zone coperte…)</label>
      <textarea id="cf-msg" rows={4} value={dati.message} onChange={(e) => setDati({ ...dati, message: e.target.value })} />

      <div className="pf-check">
        <input id="cf-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
        <label htmlFor="cf-privacy" style={{ margin: 0, fontWeight: 400 }}>
          Acconsento al trattamento dei miei dati per la gestione della candidatura (<a href="/privacy" target="_blank" rel="noopener">informativa privacy</a>). *
        </label>
      </div>

      {errore && <div className="pf-errore">{errore}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
        <button type="button" className="pf-btn secondario" onClick={() => setPasso(1)}>← Indietro</button>
        <button className="pf-btn" disabled={invio}>
          {invio ? "Invio…" : "Invia la candidatura — è gratis"}
        </button>
      </div>
    </form>
  );
}
