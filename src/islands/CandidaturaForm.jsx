import { useEffect, useState } from "react";
import CercaComune from "./CercaComune.jsx";
import { TIPI_ATTIVITA, offreDomicilio } from "../data/listino.js";

const PROFESSIONI = ["Infermiere", "Infermiera"];

// «30 €» / «30,50 €» (stesso formato del sito, lib/prezzi.js)
const euro = (cents) => {
  const c = Math.round(Number(cents) || 0);
  return `${c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",")} €`;
};
// prezzo precompilato nel campo: «30» oppure «30,50»
const campoEuro = (cents) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ","));
// dal campo (virgola o punto) ai centesimi; NaN se non è un numero
const inCents = (testo) => {
  const t = String(testo ?? "").trim().replace(",", ".");
  if (!t) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

// Candidatura in 3 passi (13/10/26, decisione di Bruno): 1 chi sei e come contattarti
// (con la password), 2 i dati professionali per la verifica, 3 le prestazioni a
// domicilio con i prezzi. Così la scheda nasce GIÀ con le prestazioni e compare in
// ricerca e sulla mappa appena approvata: prima 8 approvati su 32 restavano con la
// scheda vuota perché non tornavano nel pannello. Chi offre solo consulenze salta il
// passo 3. Gli orari restano nel pannello: un orario inventato in registrazione
// produrrebbe prenotazioni a cui nessuno risponde. La privacy sta sempre all'ultimo passo.
export default function CandidaturaForm() {
  const [passo, setPasso] = useState(1);
  const [dati, setDati] = useState({
    name: "", email: "", phone: "", profession: "", gender: "", tipo: "domicilio",
    albo_name: "", albo_number: "", albo_date: "", vat_number: "",
    city: "", province: "", region: "", sigla: "", address: "", message: "", privacy: false,
    password: "", password2: "",
  });
  // listino: null = in carico · [] = non caricato/vuoto · [...] voci a domicilio
  const [listino, setListino] = useState(null);
  const [scelte, setScelte] = useState({}); // { [key]: { on, prezzo } }, prezzo in euro come testo
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(null); // { prestazioni: N } quando è andata

  const aDomicilio = offreDomicilio(dati.tipo); // chi offre solo consulenze finisce al passo 2

  // Il listino si carica subito (non al passo 3): così quando ci arriva è già pronto
  useEffect(() => {
    let vivo = true;
    fetch("/api/listino-pubblico")
      .then((r) => (r.ok ? r.json() : { voci: [] }))
      .then((d) => {
        if (!vivo) return;
        const voci = Array.isArray(d.voci) ? d.voci : [];
        setListino(voci);
        setScelte((prima) => {
          const s = { ...prima };
          for (const v of voci) if (!s[v.key]) s[v.key] = { on: false, prezzo: campoEuro(v.sugg_cents) };
          return s;
        });
      })
      .catch(() => { if (vivo) setListino([]); });
    return () => { vivo = false; };
  }, []);

  const avanti = (e) => {
    e.preventDefault();
    setErrore("");
    if (dati.password.length < 8) return setErrore("Scegli una password di almeno 8 caratteri");
    if (dati.password !== dati.password2) return setErrore("Le due password non coincidono");
    setPasso(2);
  };

  // Le prestazioni spuntate, controllate: almeno una, prezzo numerico e mai sotto il minimo
  const controllaPrestazioni = () => {
    const spuntate = (listino || []).filter((v) => scelte[v.key]?.on);
    if (!spuntate.length) return { error: "Scegli almeno una prestazione: è quella che fa comparire la tua scheda nelle ricerche dei pazienti." };
    const prestazioni = [];
    for (const v of spuntate) {
      const cents = inCents(scelte[v.key].prezzo);
      if (!Number.isFinite(cents)) return { error: `Scrivi un prezzo per «${v.nome}» (consigliato ${euro(v.sugg_cents)}).` };
      if (cents < v.min_cents) return { error: `Per «${v.nome}» il prezzo minimo è ${euro(v.min_cents)}: alza il prezzo o togli la spunta.` };
      prestazioni.push({ key: v.key, price_cents: cents });
    }
    return { prestazioni };
  };

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    if (!dati.privacy) return setErrore("Serve il consenso al trattamento dei dati: spunta la casella.");
    let prestazioni = [];
    if (aDomicilio) {
      const c = controllaPrestazioni();
      if (c.error) return setErrore(c.error);
      prestazioni = c.prestazioni;
    }
    setInvio(true);
    try {
      const r = await fetch("/api/candidatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dati, prestazioni }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore imprevisto");
      setFatto({ prestazioni: prestazioni.length });
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
          Grazie! Verifichiamo l'iscrizione all'albo e ti rispondiamo entro pochi giorni.
          {fatto.prestazioni > 0
            ? ` Appena approvata, la tua scheda nascerà già con le ${fatto.prestazioni} prestazioni che hai scelto e comparirà nelle ricerche della tua zona. Mancheranno solo gli orari: li imposti dal tuo pannello in 5 minuti.`
            : " Se è tutto in regola attiviamo la tua scheda e la tua agenda."}
        </p>
      </div>
    );
  }

  const tappa = (n, testo) => (
    <span style={{ color: passo === n ? "var(--iw-primary-deep)" : "var(--iw-muted)", whiteSpace: "nowrap" }}>{n}. {testo}</span>
  );
  const freccia = <span style={{ color: "var(--iw-muted)" }}>→</span>;
  const progresso = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", marginBottom: 16, fontSize: 15, fontWeight: 700 }}>
      {tappa(1, "I tuoi contatti")}{freccia}{tappa(2, "Verifica")}{aDomicilio && <>{freccia}{tappa(3, "Le tue prestazioni")}</>}
    </div>
  );

  // Consenso privacy + tasto d'invio: stanno SEMPRE all'ultimo passo (2 o 3)
  const blocchoFinale = (indietro) => (
    <>
      <div className="pf-check">
        <input id="cf-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
        <label htmlFor="cf-privacy" style={{ margin: 0, fontWeight: 400 }}>
          Acconsento al trattamento dei miei dati per la gestione della candidatura (<a href="/privacy" target="_blank" rel="noopener">informativa privacy</a>). *
        </label>
      </div>

      {errore && <div className="pf-errore" role="alert">{errore}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
        <button type="button" className="pf-btn secondario" onClick={() => { setErrore(""); setPasso(indietro); }}>← Indietro</button>
        <button className="pf-btn" disabled={invio}>
          {invio ? "Invio…" : "Invia la candidatura — è gratis"}
        </button>
      </div>
    </>
  );

  if (passo === 1) {
    return (
      <form className="pf-book" onSubmit={avanti}>
        {progresso}
        <label htmlFor="cf-nome">Nome e cognome *</label>
        <input id="cf-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} autoComplete="name" />

        <label htmlFor="cf-sesso">Sesso * <span style={{ fontWeight: 400 }}>(sulla scheda compari come «Inf. Nome C.», infermiere o infermiera)</span></label>
        <select id="cf-sesso" required value={dati.gender} onChange={(e) => setDati({ ...dati, gender: e.target.value })}>
          <option value="" disabled>Scegli…</option>
          <option value="m">Uomo</option>
          <option value="f">Donna</option>
        </select>

        <label htmlFor="cf-prof">Professione *</label>
        <select id="cf-prof" required value={dati.profession} onChange={(e) => setDati({ ...dati, profession: e.target.value })}>
          <option value="" disabled>Scegli…</option>
          {PROFESSIONI.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <label>Cosa vuoi offrire su InfermieriWeb? *</label>
        <div className="pf-tipi">
          {TIPI_ATTIVITA.map((t) => (
            <label key={t.key} className={`pf-tipo${dati.tipo === t.key ? " sel" : ""}`}>
              <input type="radio" name="cf-tipo" value={t.key} checked={dati.tipo === t.key} onChange={() => setDati({ ...dati, tipo: t.key })} />
              <span><strong>{t.nome}</strong><br /><span className="pf-note" style={{ margin: 0 }}>{t.breve}</span></span>
            </label>
          ))}
        </div>

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

        {errore && <div className="pf-errore" role="alert">{errore}</div>}
        <button className="pf-btn" style={{ width: "100%" }}>Continua →</button>
        <p className="pf-note" style={{ marginTop: 10 }}>
          {aDomicilio
            ? "Poi: i dati del tuo albo (per la verifica) e le prestazioni che offri, con i prezzi. In tutto 5 minuti."
            : "Manca solo un passo: i dati del tuo albo, che ci servono per verificare ogni professionista della rete."}
        </p>
      </form>
    );
  }

  if (passo === 2) {
    return (
      <form className="pf-book" onSubmit={aDomicilio ? (e) => { e.preventDefault(); setErrore(""); setPasso(3); } : invia}>
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
          <strong>Non ce l'hai ancora?</strong> Registrati lo stesso: teniamo da parte la tua richiesta e
          attiviamo la tua scheda pubblica appena apri la partita IVA.
        </p>

        <label htmlFor="cf-indirizzo">Indirizzo studio/sede <span style={{ fontWeight: 400 }}>(per il tuo segnaposto sulla mappa)</span></label>
        <input id="cf-indirizzo" placeholder="es. Via Roma 12" value={dati.address} onChange={(e) => setDati({ ...dati, address: e.target.value })} autoComplete="street-address" />

        <label htmlFor="cf-msg">Raccontaci di te <span style={{ fontWeight: 400 }}>(esperienza, zone coperte…)</span></label>
        <textarea id="cf-msg" rows={4} value={dati.message} onChange={(e) => setDati({ ...dati, message: e.target.value })} />

        {aDomicilio ? (
          <>
            {errore && <div className="pf-errore" role="alert">{errore}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
              <button type="button" className="pf-btn secondario" onClick={() => { setErrore(""); setPasso(1); }}>← Indietro</button>
              <button className="pf-btn">Continua →</button>
            </div>
            <p className="pf-note" style={{ marginTop: 10 }}>Ultimo passo: le prestazioni che offri a domicilio, con i prezzi.</p>
          </>
        ) : blocchoFinale(1)}
      </form>
    );
  }

  // Passo 3 — le prestazioni a domicilio (solo domicilio / entrambi)
  const nScelte = (listino || []).filter((v) => scelte[v.key]?.on).length;
  return (
    <form className="pf-book" onSubmit={invia} noValidate>
      {progresso}
      <p style={{ color: "var(--iw-slate)", marginTop: 0 }}>
        Spunta le prestazioni che fai a domicilio. Il prezzo è quello consigliato: puoi
        cambiarlo, ma non sotto il minimo. Con queste la tua scheda compare subito nelle
        ricerche della tua zona, appena approvata.
      </p>

      {listino === null && <p className="pf-note">Carico il listino…</p>}
      {listino && !listino.length && (
        <div className="pf-errore" role="alert">
          Il listino non si carica. Ricarica la pagina; se il problema resta scrivi a info@infermieriweb.it.
        </div>
      )}
      <div className="cf-prestazioni">
        {(listino || []).map((v) => {
          const s = scelte[v.key] || { on: false, prezzo: campoEuro(v.sugg_cents) };
          const cents = inCents(s.prezzo);
          const sotto = s.on && Number.isFinite(cents) && cents < v.min_cents;
          return (
            <div key={v.key} className={`cf-prestazione${s.on ? " sel" : ""}${sotto ? " sotto" : ""}`}>
              <label className="cf-prestazione-nome">
                <input type="checkbox" checked={s.on} onChange={(e) => { setErrore(""); setScelte({ ...scelte, [v.key]: { ...s, on: e.target.checked } }); }} />
                <span><strong>{v.nome}</strong><small>{v.durata_min} min · consigliato {euro(v.sugg_cents)} · minimo {euro(v.min_cents)}</small></span>
              </label>
              <label className="cf-prestazione-prezzo">
                <input
                  type="text" inputMode="decimal" value={s.prezzo} disabled={!s.on}
                  aria-label={`Prezzo di ${v.nome} in euro`}
                  onChange={(e) => { setErrore(""); setScelte({ ...scelte, [v.key]: { ...s, prezzo: e.target.value } }); }}
                />
                <span aria-hidden="true">€</span>
              </label>
              {sotto && <div className="cf-prestazione-errore">Minimo {euro(v.min_cents)}: alza il prezzo o togli la spunta</div>}
            </div>
          );
        })}
      </div>
      <p className="pf-note" style={{ margin: "0 0 14px" }}>
        {nScelte ? `Hai scelto ${nScelte} ${nScelte === 1 ? "prestazione" : "prestazioni"}.` : "Non hai ancora scelto nessuna prestazione."}{" "}
        Gli orari in cui ricevi prenotazioni li imposti dopo, dal tuo pannello (5 minuti). Il prezzo di notte, se lavori anche dopo le 22, lo aggiungi lì.
      </p>

      {blocchoFinale(2)}
    </form>
  );
}
