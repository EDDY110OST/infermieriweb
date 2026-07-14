import React, { useCallback, useEffect, useState } from "react";

const oraRoma = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
const giornoRoma = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" });

const STATI = { active: "Attiva", cancelled: "Annullata", done: "Completata", noshow: "Non presentato" };

const VAPID_PUBLIC = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY || "";

const base64ToUint8 = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const isIphoneNonInstallata = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) && !window.navigator.standalone;

export default function PanelApp() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [utente, setUtente] = useState(null);
  const [errore, setErrore] = useState("");
  const [agenda, setAgenda] = useState(null);
  const [blocco, setBlocco] = useState({ data: "", dalle: "", alle: "", reason: "" });
  const [mostraBlocco, setMostraBlocco] = useState(false);
  const [statoPush, setStatoPush] = useState("idle");
  const [mostraProfilo, setMostraProfilo] = useState(false);
  const [profilo, setProfilo] = useState(null);
  const [esitoProfilo, setEsitoProfilo] = useState(null);
  const [salvoProfilo, setSalvoProfilo] = useState(false);

  const apriProfilo = async () => {
    const apertura = !mostraProfilo;
    setMostraProfilo(apertura);
    setEsitoProfilo(null);
    if (apertura && !profilo) {
      const r = await fetch("/api/panel/profilo");
      if (r.ok) setProfilo((await r.json()).profilo);
    }
  };

  const salvaProfilo = async (e) => {
    e.preventDefault();
    setSalvoProfilo(true);
    setEsitoProfilo(null);
    try {
      const r = await fetch("/api/panel/profilo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profilo.bio, phone: profilo.phone, address: profilo.address,
          city: profilo.city, province: profilo.province,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore di salvataggio");
      if (d.geocoded) {
        setEsitoProfilo({
          tipo: "ok",
          testo: d.geocoded.precision === "indirizzo"
            ? `✅ Salvato. Segnaposto sulla mappa aggiornato al tuo indirizzo: ${d.geocoded.matched}`
            : `✅ Salvato. Indirizzo non trovato con precisione: il segnaposto è al centro di ${profilo.city}. Controlla via e numero civico.`,
        });
      } else if (d.posizioneCambiata) {
        setEsitoProfilo({ tipo: "warn", testo: "Salvato, ma l'indirizzo non è stato trovato sulla mappa: verifica che sia scritto per esteso (es. Via Roma 12)." });
      } else {
        setEsitoProfilo({ tipo: "ok", testo: "✅ Profilo salvato." });
      }
    } catch (err) {
      setEsitoProfilo({ tipo: "err", testo: err.message });
    } finally {
      setSalvoProfilo(false);
    }
  };

  // Notifiche push (modello Prenotazioni Sbarba): stato del dispositivo
  useEffect(() => {
    if (!utente) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) {
      setStatoPush(isIphoneNonInstallata() ? "ios-install" : "unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw-app.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/panel/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
        setStatoPush("attive");
      } else {
        setStatoPush(Notification.permission === "denied" ? "negate" : "pronte");
      }
    }).catch(() => setStatoPush("unsupported"));
  }, [utente]);

  const attivaNotifiche = async () => {
    try {
      const permesso = await Notification.requestPermission();
      if (permesso !== "granted") return setStatoPush("negate");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8(VAPID_PUBLIC),
      });
      const r = await fetch("/api/panel/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setStatoPush(r.ok ? "attive" : "errore");
    } catch {
      setStatoPush("errore");
    }
  };

  const caricaAgenda = useCallback(() => {
    fetch("/api/panel/agenda?days=14")
      .then((r) => {
        if (r.status === 401) { setUtente(null); return null; }
        return r.json();
      })
      .then((d) => { if (d) setAgenda(d); })
      .catch(() => setErrore("Errore di caricamento agenda"));
  }, []);

  useEffect(() => {
    // se la sessione è già attiva, l'agenda risponde
    fetch("/api/panel/agenda?days=14").then((r) => {
      if (r.ok) {
        setUtente({ name: "" });
        r.json().then(setAgenda);
      }
    });
  }, []);

  const accedi = async (e) => {
    e.preventDefault();
    setErrore("");
    const r = await fetch("/api/panel/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login),
    });
    const d = await r.json();
    if (!r.ok) return setErrore(d.error || "Errore di accesso");
    setUtente(d);
    caricaAgenda();
  };

  const esci = async () => {
    await fetch("/api/panel/logout", { method: "POST" });
    setUtente(null);
    setAgenda(null);
  };

  const cambiaStato = async (id, status) => {
    const r = await fetch("/api/panel/prenotazioni", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) caricaAgenda();
  };

  const creaBlocco = async (e) => {
    e.preventDefault();
    if (!blocco.data || !blocco.dalle || !blocco.alle) return;
    const r = await fetch("/api/panel/blocchi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: `${blocco.data}T${blocco.dalle}:00+02:00`,
        end: `${blocco.data}T${blocco.alle}:00+02:00`,
        reason: blocco.reason,
      }),
    });
    if (r.ok) {
      setMostraBlocco(false);
      setBlocco({ data: "", dalle: "", alle: "", reason: "" });
      caricaAgenda();
    }
  };

  const rimuoviBlocco = async (id) => {
    await fetch(`/api/panel/blocchi?id=${id}`, { method: "DELETE" });
    caricaAgenda();
  };

  if (!utente) {
    return (
      <div className="pf-panel" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2>Accesso professionisti</h2>
        <form className="pf-book" onSubmit={accedi}>
          <label htmlFor="pl-email">Email</label>
          <input id="pl-email" type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} autoComplete="username" />
          <label htmlFor="pl-pass">Password</label>
          <input id="pl-pass" type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password" />
          {errore && <div className="pf-errore">{errore}</div>}
          <button className="pf-btn" style={{ width: "100%" }}>Entra</button>
        </form>
        <p className="pf-note" style={{ marginTop: 12 }}>
          Non hai ancora un account? <a href="/lavora-con-noi">Candidati qui</a>: l'iscrizione è gratuita in fase di lancio.
        </p>
      </div>
    );
  }

  const eventi = [];
  if (agenda) {
    for (const b of agenda.bookings) eventi.push({ tipo: "booking", quando: b.start_dt, dato: b });
    for (const b of agenda.blocks) eventi.push({ tipo: "block", quando: b.start_dt, dato: b });
    eventi.sort((a, b) => new Date(a.quando) - new Date(b.quando));
  }

  const perGiorno = eventi.reduce((acc, e) => {
    const g = giornoRoma(e.quando);
    (acc[g] = acc[g] || []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h2 style={{ color: "var(--iw-navy)" }}>La tua agenda — prossimi 14 giorni</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {statoPush === "pronte" && (
            <button className="pf-btn secondario" onClick={attivaNotifiche}>🔔 Attiva notifiche</button>
          )}
          {statoPush === "attive" && (
            <span style={{ fontSize: 13.5, color: "var(--iw-primary-deep)", fontWeight: 700 }}>🔔 Notifiche attive</span>
          )}
          <button className="pf-btn secondario" onClick={apriProfilo}>📍 Il mio profilo</button>
          <button className="pf-btn secondario" onClick={() => setMostraBlocco(!mostraBlocco)}>+ Blocca orario</button>
          <button className="pf-btn pericolo" onClick={esci}>Esci</button>
        </div>
      </div>

      {statoPush === "ios-install" && (
        <div className="pf-panel" style={{ marginBottom: 16, fontSize: 14.5 }}>
          📲 <strong>Per ricevere le notifiche su iPhone</strong>: apri questa pagina in Safari, tocca
          <strong> Condividi</strong> (□↑) → <strong>"Aggiungi alla schermata Home"</strong>, poi apri
          l'app "IW Pro" dalla home e attiva le notifiche da lì.
        </div>
      )}
      {statoPush === "negate" && (
        <div className="pf-panel" style={{ marginBottom: 16, fontSize: 14.5 }}>
          🔕 Le notifiche sono bloccate nelle impostazioni del browser per questo sito: riattivale da lì.
        </div>
      )}

      {mostraProfilo && (
        <form className="pf-panel pf-book" onSubmit={salvaProfilo} style={{ marginBottom: 18 }}>
          <h2>📍 Il mio profilo</h2>
          {!profilo ? (
            <p className="pf-note">Caricamento…</p>
          ) : (
            <>
              <label htmlFor="pr-indirizzo">Indirizzo dello studio/sede <span style={{ fontWeight: 400 }}>(posiziona il tuo segnaposto sulla mappa)</span></label>
              <input id="pr-indirizzo" placeholder="es. Via Roma 12" value={profilo.address || ""} onChange={(e) => setProfilo({ ...profilo, address: e.target.value })} autoComplete="street-address" />

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label htmlFor="pr-citta">Città *</label>
                  <input id="pr-citta" required minLength={2} value={profilo.city || ""} onChange={(e) => setProfilo({ ...profilo, city: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="pr-prov">Provincia</label>
                  <input id="pr-prov" value={profilo.province || ""} onChange={(e) => setProfilo({ ...profilo, province: e.target.value })} />
                </div>
              </div>

              <label htmlFor="pr-tel">Telefono</label>
              <input id="pr-tel" type="tel" value={profilo.phone || ""} onChange={(e) => setProfilo({ ...profilo, phone: e.target.value })} />

              <label htmlFor="pr-bio">Presentazione (compare sulla tua scheda pubblica)</label>
              <textarea id="pr-bio" rows={4} maxLength={1200} value={profilo.bio || ""} onChange={(e) => setProfilo({ ...profilo, bio: e.target.value })} />

              {esitoProfilo && (
                <div className={esitoProfilo.tipo === "err" ? "pf-errore" : "pf-successo"} style={esitoProfilo.tipo === "warn" ? { background: "#fff7ed", color: "#b45309", borderColor: "#fed7aa" } : {}}>
                  {esitoProfilo.testo}
                </div>
              )}

              <button className="pf-btn" disabled={salvoProfilo}>{salvoProfilo ? "Salvo…" : "Salva profilo"}</button>
              <p className="pf-note" style={{ marginTop: 8 }}>
                La tua scheda pubblica: <a href={`/p/${profilo.slug}`} target="_blank" rel="noreferrer">infermieriweb.it/p/{profilo.slug}</a>
              </p>
            </>
          )}
        </form>
      )}

      {mostraBlocco && (
        <form className="pf-panel pf-book" onSubmit={creaBlocco} style={{ marginBottom: 18 }}>
          <h2>Blocca uno spazio (ferie, pausa, impegno)</h2>
          <label>Giorno</label>
          <input type="date" required value={blocco.data} onChange={(e) => setBlocco({ ...blocco, data: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Dalle</label>
              <input type="time" required value={blocco.dalle} onChange={(e) => setBlocco({ ...blocco, dalle: e.target.value })} />
            </div>
            <div>
              <label>Alle</label>
              <input type="time" required value={blocco.alle} onChange={(e) => setBlocco({ ...blocco, alle: e.target.value })} />
            </div>
          </div>
          <label>Motivo (facoltativo)</label>
          <input value={blocco.reason} onChange={(e) => setBlocco({ ...blocco, reason: e.target.value })} placeholder="es. ferie" />
          <button className="pf-btn">Salva blocco</button>
        </form>
      )}

      {!agenda && <p className="pf-note">Caricamento…</p>}
      {agenda && eventi.length === 0 && (
        <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna prenotazione nei prossimi 14 giorni.</p></div>
      )}

      {Object.entries(perGiorno).map(([giorno, lista]) => (
        <div key={giorno} style={{ marginBottom: 22 }}>
          <h3 style={{ color: "var(--iw-navy)", margin: "0 0 10px", textTransform: "capitalize" }}>{giorno}</h3>
          {lista.map((e) =>
            e.tipo === "booking" ? (
              <div className="pf-agenda-item" key={`b${e.dato.id}`}>
                <span className="ora">{oraRoma(e.dato.start_dt)}</span>
                <div className="chi">
                  <strong>{e.dato.customer_name}</strong> · <a href={`tel:${e.dato.customer_phone}`}>{e.dato.customer_phone}</a>
                  <div className="servizio">
                    {e.dato.service_name}
                    {e.dato.address ? ` · ${e.dato.address}${e.dato.city ? ", " + e.dato.city : ""}` : ""}
                  </div>
                </div>
                <span className={`stato ${e.dato.status}`}>{STATI[e.dato.status]}</span>
                {e.dato.status === "active" && (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button className="pf-btn secondario" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => cambiaStato(e.dato.id, "done")}>Fatta</button>
                    <button className="pf-btn pericolo" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => cambiaStato(e.dato.id, "cancelled")}>Annulla</button>
                  </span>
                )}
              </div>
            ) : (
              <div className="pf-agenda-item pf-agenda-blocco" key={`k${e.dato.id}`}>
                <span className="ora">{oraRoma(e.dato.start_dt)}</span>
                <div className="chi">
                  <strong>🔒 Orario bloccato</strong> fino alle {oraRoma(e.dato.end_dt)}
                  {e.dato.reason && <div className="servizio">{e.dato.reason}</div>}
                </div>
                <button className="pf-btn pericolo" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => rimuoviBlocco(e.dato.id)}>Rimuovi</button>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
