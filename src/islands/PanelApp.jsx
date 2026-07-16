import React, { useCallback, useEffect, useState } from "react";

const oraRoma = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
const giornoRoma = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" });

const STATI = { active: "Attiva", cancelled: "Annullata", done: "Completata", noshow: "Non presentato" };
const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const euro = (cents) => (cents / 100).toFixed(2).replace(".", ",");
const centesimi = (testo) => Math.round(parseFloat(String(testo).replace(",", ".") || "0") * 100);
const minutiA = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const aMinuti = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

const VAPID_PUBLIC = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY || "";

const base64ToUint8 = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const isIphoneNonInstallata = () =>
  /iP(hone|ad|od)/.test(navigator.userAgent) && !window.navigator.standalone;

// ---------------------------------------------------------------- Agenda

function TabAgenda({ statoPush, attivaNotifiche }) {
  const [agenda, setAgenda] = useState(null);
  const [errore, setErrore] = useState("");
  const [mostraBlocco, setMostraBlocco] = useState(false);
  const [blocco, setBlocco] = useState({ data: "", dataFine: "", dalle: "", alle: "", reason: "" });
  const [mostraManuale, setMostraManuale] = useState(false);
  const [servizi, setServizi] = useState(null);
  const [manuale, setManuale] = useState({ service_id: "", date: "", time: "", customer_name: "", customer_phone: "", address: "", city: "" });
  const [erroreManuale, setErroreManuale] = useState("");

  const carica = useCallback(() => {
    fetch("/api/panel/agenda?days=14")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setAgenda(d); })
      .catch(() => setErrore("Errore di caricamento agenda"));
  }, []);

  useEffect(carica, [carica]);

  const apriManuale = async () => {
    setMostraManuale(!mostraManuale);
    setMostraBlocco(false);
    if (!servizi) {
      const r = await fetch("/api/panel/servizi");
      if (r.ok) setServizi((await r.json()).servizi.filter((s) => s.active));
    }
  };

  const salvaManuale = async (e) => {
    e.preventDefault();
    setErroreManuale("");
    const r = await fetch("/api/panel/prenotazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...manuale, service_id: Number(manuale.service_id) }),
    });
    const d = await r.json();
    if (!r.ok) return setErroreManuale(d.error || "Errore");
    setMostraManuale(false);
    setManuale({ service_id: "", date: "", time: "", customer_name: "", customer_phone: "", address: "", city: "" });
    carica();
  };

  const cambiaStato = async (id, status, conferma) => {
    if (conferma && !window.confirm(conferma)) return;
    const r = await fetch("/api/panel/prenotazioni", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) carica();
  };

  const creaBlocco = async (e) => {
    e.preventDefault();
    if (!blocco.data || !blocco.dalle || !blocco.alle) return;
    const r = await fetch("/api/panel/blocchi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // ora locale nuda: l'offset di Roma (legale/solare) lo calcola il server
        start_local: `${blocco.data}T${blocco.dalle}`,
        end_local: `${blocco.dataFine || blocco.data}T${blocco.alle}`,
        reason: blocco.reason,
      }),
    });
    if (r.ok) {
      setMostraBlocco(false);
      setBlocco({ data: "", dataFine: "", dalle: "", alle: "", reason: "" });
      carica();
    }
  };

  const rimuoviBlocco = async (id) => {
    await fetch(`/api/panel/blocchi?id=${id}`, { method: "DELETE" });
    carica();
  };

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
      <h2 style={{ color: "var(--iw-navy)", fontSize: 26, margin: "0 0 14px" }}>La tua agenda — prossimi 14 giorni</h2>
      <div className="pf-panel-toolbar">
        {statoPush === "pronte" && <button className="pf-btn secondario" onClick={attivaNotifiche}>🔔 Attiva notifiche</button>}
        {statoPush === "attive" && <span className="pf-push-ok">🔔 Notifiche attive</span>}
        <button className="pf-btn secondario" onClick={apriManuale}>☎️ Prenotazione telefonica</button>
        <button className="pf-btn secondario" onClick={() => { setMostraBlocco(!mostraBlocco); setMostraManuale(false); }}>🔒 Blocca orario</button>
      </div>

      {statoPush === "ios-install" && (
        <div className="pf-panel" style={{ marginBottom: 16, fontSize: 17 }}>
          📲 <strong>Per ricevere le notifiche su iPhone</strong>: apri questa pagina in Safari, tocca
          <strong> Condividi</strong> (□↑) → <strong>"Aggiungi alla schermata Home"</strong>, poi apri
          l'app "IW Pro" dalla home e attiva le notifiche da lì.
        </div>
      )}
      {statoPush === "negate" && (
        <div className="pf-panel" style={{ marginBottom: 16, fontSize: 17 }}>
          🔕 Le notifiche sono bloccate nelle impostazioni del browser per questo sito: riattivale da lì.
        </div>
      )}

      {mostraManuale && (
        <form className="pf-panel pf-book" onSubmit={salvaManuale} style={{ marginBottom: 18 }}>
          <h2>☎️ Prenotazione presa al telefono</h2>
          <p className="pf-note" style={{ marginTop: -6 }}>La inserisci qui e la tua disponibilità online resta sempre vera.</p>
          <label>Prestazione *</label>
          <select required value={manuale.service_id} onChange={(e) => setManuale({ ...manuale, service_id: e.target.value })}>
            <option value="">Scegli…</option>
            {(servizi || []).map((s) => <option key={s.id} value={s.id}>{s.name} · {s.duration_min} min</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Giorno *</label>
              <input type="date" required value={manuale.date} onChange={(e) => setManuale({ ...manuale, date: e.target.value })} />
            </div>
            <div>
              <label>Ora *</label>
              <input type="time" required step={300} value={manuale.time} onChange={(e) => setManuale({ ...manuale, time: e.target.value })} />
            </div>
          </div>
          <label>Nome paziente *</label>
          <input required minLength={2} value={manuale.customer_name} onChange={(e) => setManuale({ ...manuale, customer_name: e.target.value })} />
          <label>Telefono</label>
          <input type="tel" value={manuale.customer_phone} onChange={(e) => setManuale({ ...manuale, customer_phone: e.target.value })} />
          <label>Indirizzo visita</label>
          <input value={manuale.address} onChange={(e) => setManuale({ ...manuale, address: e.target.value })} placeholder="Via, civico, città" />
          {erroreManuale && <div className="pf-errore">{erroreManuale}</div>}
          <button className="pf-btn">Aggiungi in agenda</button>
        </form>
      )}

      {mostraBlocco && (
        <form className="pf-panel pf-book" onSubmit={creaBlocco} style={{ marginBottom: 18 }}>
          <h2>🔒 Blocca uno spazio (ferie, pausa, impegno)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Dal giorno *</label>
              <input type="date" required value={blocco.data} onChange={(e) => setBlocco({ ...blocco, data: e.target.value })} />
            </div>
            <div>
              <label>Al giorno <span style={{ fontWeight: 400 }}>(per le ferie)</span></label>
              <input type="date" min={blocco.data} value={blocco.dataFine} onChange={(e) => setBlocco({ ...blocco, dataFine: e.target.value })} />
            </div>
          </div>
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

      {errore && <div className="pf-errore">{errore}</div>}
      {!agenda && !errore && <p className="pf-note">Caricamento…</p>}
      {agenda && eventi.length === 0 && (
        <div className="pf-panel">
          <p style={{ margin: 0 }}>Nessuna prenotazione nei prossimi 14 giorni.</p>
          <p className="pf-note" style={{ marginBottom: 0 }}>
            Fai girare il tuo link personale (lo trovi nella scheda Profilo): è il modo più rapido per riempire l'agenda.
          </p>
        </div>
      )}

      {Object.entries(perGiorno).map(([giorno, lista]) => (
        <div key={giorno} style={{ marginBottom: 22 }}>
          <h3 style={{ color: "var(--iw-navy)", margin: "0 0 10px", textTransform: "capitalize" }}>{giorno}</h3>
          {lista.map((e) =>
            e.tipo === "booking" ? (
              <div className="pf-agenda-item" key={`b${e.dato.id}`}>
                <span className="ora">{oraRoma(e.dato.start_dt)}</span>
                <div className="chi">
                  <strong>{e.dato.customer_name}</strong>
                  {e.dato.customer_phone && <> · <a href={`tel:${e.dato.customer_phone}`}>{e.dato.customer_phone}</a></>}
                  {e.dato.source === "manual" && <span className="pf-tag-tel">☎️ telefonica</span>}
                  <div className="servizio">
                    {e.dato.service_name}
                    {e.dato.address ? ` · ${e.dato.address}${e.dato.city ? ", " + e.dato.city : ""}` : ""}
                  </div>
                </div>
                <span className={`stato ${e.dato.status}`}>{STATI[e.dato.status]}</span>
                {e.dato.status === "active" && (
                  <span style={{ display: "flex", gap: 6 }}>
                    <button className="pf-btn secondario compatto" onClick={() => cambiaStato(e.dato.id, "done")}>Fatta</button>
                    <button className="pf-btn pericolo compatto" onClick={() => cambiaStato(e.dato.id, "cancelled", `Annullo la prenotazione di ${e.dato.customer_name}? Il paziente verrà avvisato via email.`)}>Annulla</button>
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
                <button className="pf-btn pericolo compatto" onClick={() => rimuoviBlocco(e.dato.id)}>Rimuovi</button>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Servizi

function TabServizi() {
  const [servizi, setServizi] = useState(null);
  const [nuovo, setNuovo] = useState({ name: "", durata: "30", prezzo: "" });
  const [messaggio, setMessaggio] = useState(null);

  const carica = useCallback(() => {
    fetch("/api/panel/servizi").then((r) => r.json()).then((d) => setServizi(d.servizi || []));
  }, []);
  useEffect(carica, [carica]);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 4000);
  };

  const aggiungi = async (e) => {
    e.preventDefault();
    const r = await fetch("/api/panel/servizi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nuovo.name, duration_min: Number(nuovo.durata), price_cents: centesimi(nuovo.prezzo) }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    setNuovo({ name: "", durata: "30", prezzo: "" });
    avvisa("ok", "Prestazione aggiunta ✅");
    carica();
  };

  const salva = async (s) => {
    const r = await fetch("/api/panel/servizi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, name: s.name, duration_min: Number(s.duration_min), price_cents: s._prezzo !== undefined ? centesimi(s._prezzo) : s.price_cents, active: s.active }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", "Salvato ✅");
    carica();
  };

  const cambia = (id, campo, valore) =>
    setServizi(servizi.map((s) => (s.id === id ? { ...s, [campo]: valore, _mod: true } : s)));

  if (!servizi) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <p className="pf-note" style={{ marginTop: 0 }}>
        Le prestazioni attive compaiono sulla tua scheda pubblica con prezzo "a partire da".
        Il compenso resta interamente tuo: zero commissioni.
      </p>
      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {servizi.map((s) => (
        <div className="pf-servizio-edit" key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
          <input className="nome" value={s.name} onChange={(e) => cambia(s.id, "name", e.target.value)} aria-label="Nome prestazione" />
          <div className="riga2">
            <label>
              min
              <input type="number" min={5} max={480} step={5} value={s.duration_min} onChange={(e) => cambia(s.id, "duration_min", e.target.value)} aria-label="Durata in minuti" />
            </label>
            <label>
              da €
              <input inputMode="decimal" value={s._prezzo !== undefined ? s._prezzo : euro(s.price_cents)} onChange={(e) => cambia(s.id, "_prezzo", e.target.value)} aria-label="Prezzo da" />
            </label>
            <label className="attivo">
              <input type="checkbox" checked={s.active} onChange={(e) => cambia(s.id, "active", e.target.checked)} /> attiva
            </label>
            {s._mod && <button className="pf-btn compatto" onClick={() => salva(s)} type="button">Salva</button>}
          </div>
        </div>
      ))}

      <form className="pf-panel pf-book" onSubmit={aggiungi} style={{ marginTop: 18 }}>
        <h2>+ Nuova prestazione</h2>
        <label>Nome *</label>
        <input required minLength={3} placeholder="es. Medicazione post-operatoria" value={nuovo.name} onChange={(e) => setNuovo({ ...nuovo, name: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label>Durata (minuti) *</label>
            <input type="number" required min={5} max={480} step={5} value={nuovo.durata} onChange={(e) => setNuovo({ ...nuovo, durata: e.target.value })} />
          </div>
          <div>
            <label>Prezzo "da" (€) *</label>
            <input required inputMode="decimal" placeholder="30,00" value={nuovo.prezzo} onChange={(e) => setNuovo({ ...nuovo, prezzo: e.target.value })} />
          </div>
        </div>
        <button className="pf-btn">Aggiungi</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Orari

function TabOrari() {
  const [giorni, setGiorni] = useState(null);
  const [messaggio, setMessaggio] = useState(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/panel/orari").then((r) => r.json()).then((d) => {
      const base = GIORNI.map((nome, weekday) => ({ nome, weekday, attivo: false, dalle: "08:00", alle: "19:00" }));
      for (const o of d.orari || []) {
        base[o.weekday] = { ...base[o.weekday], attivo: true, dalle: minutiA(o.start_min), alle: minutiA(o.end_min) };
      }
      setGiorni(base);
    });
  }, []);

  const salva = async () => {
    setSalvo(true);
    setMessaggio(null);
    const orari = giorni.filter((g) => g.attivo).map((g) => ({
      weekday: g.weekday, start_min: aMinuti(g.dalle), end_min: aMinuti(g.alle),
    }));
    const r = await fetch("/api/panel/orari", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orari }),
    });
    const d = await r.json();
    setSalvo(false);
    setMessaggio(r.ok
      ? { tipo: "ok", testo: "✅ Orari salvati: il calendario pubblico è già aggiornato." }
      : { tipo: "err", testo: d.error });
  };

  const cambia = (weekday, campo, valore) =>
    setGiorni(giorni.map((g) => (g.weekday === weekday ? { ...g, [campo]: valore } : g)));

  if (!giorni) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <p className="pf-note" style={{ marginTop: 0 }}>
        I pazienti possono prenotare solo dentro questi orari (meno le prenotazioni già prese e i blocchi).
      </p>
      {giorni.map((g) => (
        <div className="pf-orario-riga" key={g.weekday}>
          <label className="giorno">
            <input type="checkbox" checked={g.attivo} onChange={(e) => cambia(g.weekday, "attivo", e.target.checked)} />
            {g.nome}
          </label>
          {g.attivo ? (
            <span className="fascia">
              <input type="time" value={g.dalle} onChange={(e) => cambia(g.weekday, "dalle", e.target.value)} aria-label={`${g.nome} dalle`} />
              →
              <input type="time" value={g.alle} onChange={(e) => cambia(g.weekday, "alle", e.target.value)} aria-label={`${g.nome} alle`} />
            </span>
          ) : (
            <span className="chiuso">Chiuso</span>
          )}
        </div>
      ))}
      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ margin: "12px 0" }}>{messaggio.testo}</div>}
      <button className="pf-btn" onClick={salva} disabled={salvo} style={{ marginTop: 10 }}>
        {salvo ? "Salvo…" : "Salva orari"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Profilo

function TabZone() {
  const [zone, setZone] = useState(null);
  const [nuova, setNuova] = useState({ city: "", province: "" });
  const [messaggio, setMessaggio] = useState(null);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 4000);
  };

  const carica = () =>
    fetch("/api/panel/zone").then((r) => r.json()).then((d) => {
      setZone(d.zone || []);
      // la provincia della prima zona è quasi sempre quella giusta anche per la prossima
      if (d.zone?.length) setNuova((n) => ({ ...n, province: n.province || d.zone[0].province }));
    });

  useEffect(() => { carica(); }, []);

  const aggiungi = async (e) => {
    e.preventDefault();
    const r = await fetch("/api/panel/zone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuova),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    setNuova((n) => ({ city: "", province: n.province }));
    avvisa("ok", `${d.zona.city} aggiunta ✅ Da adesso i pazienti di quella zona ti trovano.`);
    carica();
  };

  const togli = async (z) => {
    if (!confirm(`Togliere ${z.city} dalle tue zone? Non comparirai più nelle ricerche di quel comune.`)) return;
    const r = await fetch("/api/panel/zone", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: z.id }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", "Zona rimossa");
    carica();
  };

  if (!zone) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <p className="pf-note" style={{ marginTop: 0 }}>
        I comuni che copri a domicilio: decidono dove compari nelle ricerche, sulla mappa
        e nelle pagine di zona. Più comuni copri, più pazienti ti trovano.
      </p>
      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      <div className="pf-zone-lista">
        {zone.map((z) => (
          <span className="pf-zona" key={z.id}>
            📍 {z.city} <small>({z.province})</small>
            <button type="button" aria-label={`Togli ${z.city}`} onClick={() => togli(z)}>×</button>
          </span>
        ))}
      </div>

      <form className="pf-panel pf-book" onSubmit={aggiungi} style={{ marginTop: 18 }}>
        <h2>+ Aggiungi un comune</h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          <div>
            <label>Comune *</label>
            <input required minLength={2} placeholder="es. Borgo a Mozzano" value={nuova.city} onChange={(e) => setNuova({ ...nuova, city: e.target.value })} />
          </div>
          <div>
            <label>Provincia *</label>
            <input required minLength={2} placeholder="es. Lucca o LU" value={nuova.province} onChange={(e) => setNuova({ ...nuova, province: e.target.value })} />
          </div>
        </div>
        <button className="pf-btn">Aggiungi zona</button>
      </form>
    </div>
  );
}

function TabProfilo() {
  const [profilo, setProfilo] = useState(null);
  const [qr, setQr] = useState(null);

  const generaQr = async () => {
    const { default: QRCode } = await import("qrcode");
    const url = `https://infermieriweb.it/p/${profilo.slug}`;
    setQr(await QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#0b3954", light: "#ffffff" } }));
  };
  const [esito, setEsito] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [password, setPassword] = useState({ attuale: "", nuova: "" });
  const [esitoPassword, setEsitoPassword] = useState(null);
  const [caricoFoto, setCaricoFoto] = useState(false);

  useEffect(() => {
    fetch("/api/panel/profilo").then((r) => r.json()).then((d) => setProfilo(d.profilo));
  }, []);

  const salva = async (e) => {
    e.preventDefault();
    setSalvo(true);
    setEsito(null);
    try {
      const r = await fetch("/api/panel/profilo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: profilo.bio, phone: profilo.phone, address: profilo.address, city: profilo.city, province: profilo.province }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore di salvataggio");
      if (d.geocoded) {
        setEsito({ tipo: "ok", testo: d.geocoded.precision === "indirizzo"
          ? `✅ Salvato. Segnaposto aggiornato al tuo indirizzo: ${d.geocoded.matched}`
          : `✅ Salvato. Indirizzo non trovato con precisione: segnaposto al centro di ${profilo.city}. Controlla via e civico.` });
      } else if (d.posizioneCambiata) {
        setEsito({ tipo: "warn", testo: "Salvato, ma l'indirizzo non è stato trovato sulla mappa: scrivilo per esteso (es. Via Roma 12)." });
      } else {
        setEsito({ tipo: "ok", testo: "✅ Profilo salvato." });
      }
    } catch (err) {
      setEsito({ tipo: "err", testo: err.message });
    } finally {
      setSalvo(false);
    }
  };

  // Foto: ridimensionata nel browser a 480px (pochi KB), poi caricata
  const caricaFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaricoFoto(true);
    const img = new Image();
    img.onload = async () => {
      const lato = 480;
      const scala = Math.max(lato / img.width, lato / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = lato;
      canvas.height = lato;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        (lato - img.width * scala) / 2,
        (lato - img.height * scala) / 2,
        img.width * scala,
        img.height * scala
      );
      const data = canvas.toDataURL("image/jpeg", 0.85);
      const r = await fetch("/api/panel/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const d = await r.json();
      setCaricoFoto(false);
      if (r.ok) setProfilo({ ...profilo, photo_url: d.photo_url });
      else setEsito({ tipo: "err", testo: d.error || "Errore nel caricamento foto" });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setCaricoFoto(false);
    img.src = URL.createObjectURL(file);
  };

  const cambiaPassword = async (e) => {
    e.preventDefault();
    setEsitoPassword(null);
    const r = await fetch("/api/panel/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password),
    });
    const d = await r.json();
    if (!r.ok) return setEsitoPassword({ tipo: "err", testo: d.error });
    setPassword({ attuale: "", nuova: "" });
    setEsitoPassword({ tipo: "ok", testo: "✅ Password aggiornata." });
  };

  if (!profilo) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <div className="pf-panel" style={{ marginBottom: 18 }}>
        <h2>La tua foto</h2>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <img src={profilo.photo_url} alt="La tua foto profilo" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--iw-primary-soft)" }} />
          <div>
            <label className="pf-btn secondario" style={{ cursor: "pointer" }}>
              {caricoFoto ? "Carico…" : "📷 Cambia foto"}
              <input type="file" accept="image/*" onChange={caricaFoto} style={{ display: "none" }} />
            </label>
            <p className="pf-note" style={{ marginTop: 8 }}>Mezzo busto, sfondo neutro, buona luce: è la prima cosa che il paziente guarda.</p>
          </div>
        </div>
      </div>

      <form className="pf-panel pf-book" onSubmit={salva} style={{ marginBottom: 18 }}>
        <h2>📍 Dati e segnaposto sulla mappa</h2>
        <label htmlFor="pr-indirizzo">Indirizzo studio/sede <span style={{ fontWeight: 400 }}>(posiziona il tuo segnaposto)</span></label>
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
        {esito && (
          <div className={esito.tipo === "err" ? "pf-errore" : "pf-successo"} style={esito.tipo === "warn" ? { background: "#fff7ed", color: "#b45309", borderColor: "#fed7aa" } : {}}>
            {esito.testo}
          </div>
        )}
        <button className="pf-btn" disabled={salvo}>{salvo ? "Salvo…" : "Salva profilo"}</button>
        <p className="pf-note" style={{ marginTop: 8 }}>
          La tua scheda pubblica: <a href={`/p/${profilo.slug}`} target="_blank" rel="noreferrer">infermieriweb.it/p/{profilo.slug}</a>
        </p>
      </form>

      <div className="pf-panel" style={{ marginBottom: 18 }}>
        <h2>🔳 Il tuo QR personale</h2>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Punta alla tua scheda: stampalo su biglietti da visita, ricettario, vetrofania in farmacia.
        </p>
        {qr ? (
          <div style={{ textAlign: "center" }}>
            <img src={qr} alt={`QR code della tua scheda infermieriweb.it/p/${profilo.slug}`} style={{ width: 200, height: 200 }} />
            <br />
            <a className="pf-btn secondario" href={qr} download={`qr-infermieriweb-${profilo.slug}.png`}>⬇️ Scarica PNG</a>
          </div>
        ) : (
          <button type="button" className="pf-btn secondario" onClick={generaQr}>Genera il mio QR</button>
        )}
      </div>

      <form className="pf-panel pf-book" onSubmit={cambiaPassword}>
        <h2>🔑 Cambia password</h2>
        <label htmlFor="pw-att">Password attuale</label>
        <input id="pw-att" type="password" required value={password.attuale} onChange={(e) => setPassword({ ...password, attuale: e.target.value })} autoComplete="current-password" />
        <label htmlFor="pw-new">Nuova password (minimo 10 caratteri)</label>
        <input id="pw-new" type="password" required minLength={10} value={password.nuova} onChange={(e) => setPassword({ ...password, nuova: e.target.value })} autoComplete="new-password" />
        {esitoPassword && <div className={esitoPassword.tipo === "ok" ? "pf-successo" : "pf-errore"}>{esitoPassword.testo}</div>}
        <button className="pf-btn">Aggiorna password</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- Statistiche

function Delta({ ora, prima }) {
  if (!prima && !ora) return null;
  if (!prima) return <span className="pf-delta pari">— primo mese</span>;
  const diff = ora - prima;
  if (diff === 0) return <span className="pf-delta pari">= come il mese scorso</span>;
  const perc = Math.round((diff / prima) * 100);
  return diff > 0
    ? <span className="pf-delta su">▲ +{perc}% sul mese scorso</span>
    : <span className="pf-delta giu">▼ {perc}% sul mese scorso</span>;
}

function TabStatistiche() {
  const [dati, setDati] = useState(null);
  const [meseCsv, setMeseCsv] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetch("/api/panel/statistiche").then((r) => r.json()).then(setDati);
  }, []);

  if (!dati) return <p className="pf-note">Caricamento…</p>;

  const mese = new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div>
      <h2 style={{ color: "var(--iw-navy)", fontSize: 26, margin: "0 0 4px", textTransform: "capitalize" }}>{mese}</h2>
      <p className="pf-note" style={{ marginTop: 0 }}>Il valore che la piattaforma ti sta portando, in numeri.</p>

      <div className="pf-tiles">
        <div className="pf-tile">
          <span className="etichetta">Prenotazioni del mese</span>
          <span className="numero">{dati.prenotazioni.mese}</span>
          <Delta ora={dati.prenotazioni.mese} prima={dati.prenotazioni.mesePrec} />
        </div>
        <div className="pf-tile">
          <span className="etichetta">Visite alla tua scheda</span>
          <span className="numero">{dati.visite.mese}</span>
          <Delta ora={dati.visite.mese} prima={dati.visite.mesePrec} />
        </div>
        <div className="pf-tile">
          <span className="etichetta">Recensioni verificate</span>
          <span className="numero">{dati.recensioni.media ? `★ ${String(dati.recensioni.media).replace(".", ",")}` : "—"}</span>
          <span className="pf-delta pari">{dati.recensioni.totale > 0 ? `su ${dati.recensioni.totale} recensioni` : "ancora nessuna: arriveranno!"}</span>
        </div>
        <div className="pf-tile">
          <span className="etichetta">Prestazioni completate (totale)</span>
          <span className="numero">{dati.prenotazioni.completateTotali}</span>
          <span className="pf-delta pari">da quando sei sulla piattaforma</span>
        </div>
      </div>

      <div className="pf-panel" style={{ marginTop: 18 }}>
        <h2>📄 Riepilogo per il commercialista</h2>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Scarica l'elenco delle prestazioni del mese (CSV, si apre con Excel): comodo per la tua contabilità.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="month" value={meseCsv} onChange={(e) => setMeseCsv(e.target.value)}
            style={{ border: "1px solid var(--iw-line)", borderRadius: 10, padding: "9px 12px", fontFamily: "inherit", fontSize: 17 }} />
          <a className="pf-btn secondario" href={`/api/panel/riepilogo?mese=${meseCsv}`}>⬇️ Scarica CSV</a>
        </div>
      </div>

      <p className="pf-note" style={{ marginTop: 18 }}>
        💡 Vuoi più visite? Condividi il tuo link personale su WhatsApp e Google (scheda Profilo)
        e scarica il tuo QR da esporre.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- App

export default function PanelApp() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [recupero, setRecupero] = useState({ aperto: false, email: "", inviato: false });
  const [utente, setUtente] = useState(null);
  const [errore, setErrore] = useState("");
  const [tab, setTab] = useState("agenda");
  const [statoPush, setStatoPush] = useState("idle");

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

  useEffect(() => {
    // se la sessione è già attiva, l'agenda risponde
    fetch("/api/panel/agenda?days=1").then((r) => {
      if (r.ok) setUtente({ name: "" });
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
  };

  const esci = async () => {
    await fetch("/api/panel/logout", { method: "POST" });
    setUtente(null);
    setTab("agenda");
  };

  if (!utente) {
    if (recupero.aperto) {
      return (
        <div className="pf-panel" style={{ maxWidth: 440, margin: "0 auto" }}>
          <h2>Password dimenticata</h2>
          {recupero.inviato ? (
            <div className="pf-successo">
              Fatto ✅ Se quell'email ha un account, ti abbiamo inviato il link per
              scegliere la nuova password (vale 60 minuti — controlla anche lo spam).
            </div>
          ) : (
            <form className="pf-book" onSubmit={async (e) => {
              e.preventDefault();
              try {
                const r = await fetch("/api/panel/recupero", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: recupero.email }),
                });
                const d = await r.json();
                if (!r.ok) return setErrore(d.error || "Errore imprevisto");
                setErrore("");
                setRecupero({ ...recupero, inviato: true });
              } catch { setErrore("Problema di connessione: riprova"); }
            }}>
              <p style={{ color: "var(--iw-slate)" }}>
                Scrivi l'email del tuo account: ti mandiamo il link per reimpostarla.
              </p>
              <label htmlFor="pl-rec">Email</label>
              <input id="pl-rec" type="email" required value={recupero.email}
                onChange={(e) => setRecupero({ ...recupero, email: e.target.value })} autoComplete="username" />
              {errore && <div className="pf-errore">{errore}</div>}
              <button className="pf-btn" style={{ width: "100%" }}>Mandami il link</button>
            </form>
          )}
          <p className="pf-note" style={{ marginTop: 12 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setErrore(""); setRecupero({ aperto: false, email: "", inviato: false }); }}>← Torna all'accesso</a>
          </p>
        </div>
      );
    }
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
          <a href="#" onClick={(e) => { e.preventDefault(); setErrore(""); setRecupero({ aperto: true, email: login.email, inviato: false }); }}>Password dimenticata?</a>
        </p>
        <p className="pf-note" style={{ marginTop: 6 }}>
          Non hai ancora un account? <a href="/lavora-con-noi">Candidati qui</a>: l'iscrizione è gratuita in fase di lancio.
        </p>
      </div>
    );
  }

  const TABS = [
    { id: "agenda", label: "📅 Agenda" },
    { id: "servizi", label: "🩺 Servizi" },
    { id: "orari", label: "🕒 Orari" },
    { id: "zone", label: "📍 Zone" },
    { id: "stats", label: "📊 Statistiche" },
    { id: "profilo", label: "👤 Profilo" },
  ];

  return (
    <div>
      <div className="pf-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`pf-tab${tab === t.id ? " sel" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <button className="pf-tab esci" onClick={esci}>Esci</button>
      </div>

      {tab === "agenda" && <TabAgenda statoPush={statoPush} attivaNotifiche={attivaNotifiche} />}
      {tab === "servizi" && <TabServizi />}
      {tab === "orari" && <TabOrari />}
      {tab === "zone" && <TabZone />}
      {tab === "stats" && <TabStatistiche />}
      {tab === "profilo" && <TabProfilo />}
    </div>
  );
}
