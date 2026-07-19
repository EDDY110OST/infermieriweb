import React, { useCallback, useEffect, useState } from "react";
import { LISTINO, LISTINO_MAP, FASCE, fasciaDi } from "../data/listino.js";
import CercaComune from "./CercaComune.jsx";
import CampoPassword from "./CampoPassword.jsx";

// Ogni chiamata del pannello: se torna 401 la sessione è scaduta -> avvisa tutto il pannello,
// così invece di schede vuote o pagine bianche l'infermiere viene riportato al login.
function panelFetch(url, opts) {
  return fetch(url, opts).then((r) => {
    if (r.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iw-sessione-scaduta"));
    }
    return r;
  });
}

const oraRoma = (iso) =>
  new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
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


// Semaforo dello stato: verde fatto, giallo da fare, rosso annullato
const SEMAFORO = {
  done:      { colore: "#16a34a", nome: "Effettuato" },
  active:    { colore: "#eab308", nome: "Da fare" },
  cancelled: { colore: "#dc2626", nome: "Annullato" },
  noshow:    { colore: "#94a3b8", nome: "Non presentato" },
};

// Minuti dalla mezzanotte (ora di Roma) di una data ISO
const minutiRoma = (iso) => {
  const t = new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hour12: false });
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const giornoRoma = (iso) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date(iso));

// minuti dalla mezzanotte <-> "HH:MM" (per l'editor della disponibilità del giorno)
const minToHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const hhmmToMin = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };

// Colore della disponibilità del giorno sul calendario
const DISPO_COLORE = {
  aperto:   { bordo: "#16a34a", nome: "Disponibile (orari fissi)" },
  speciale: { bordo: "#2563eb", nome: "Orari speciali" },
  chiuso:   { bordo: "#cbd5e1", nome: "Chiuso" },
};

function CalendarioMensile({ bookings, dispo, onGiorno, giornoSel, meseData, setMeseData }) {
  const anno = meseData.getFullYear();
  const mese = meseData.getMonth();
  const primo = new Date(anno, mese, 1);
  const inizioGriglia = new Date(primo);
  inizioGriglia.setDate(1 - ((primo.getDay() + 6) % 7)); // la settimana parte da lunedì

  const perGiorno = {};
  for (const b of bookings) {
    const g = giornoRoma(b.start_dt);
    (perGiorno[g] ||= []).push(b);
  }

  const celle = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inizioGriglia);
    d.setDate(inizioGriglia.getDate() + i);
    const chiave = new Intl.DateTimeFormat("en-CA").format(d);
    return { data: d, chiave, fuoriMese: d.getMonth() !== mese, appuntamenti: perGiorno[chiave] || [] };
  });

  const oggi = new Intl.DateTimeFormat("en-CA").format(new Date());
  const nomeMese = meseData.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className="pf-cal">
      <div className="pf-cal-testa">
        <button type="button" className="pf-btn secondario compatto" onClick={() => setMeseData(new Date(anno, mese - 1, 1))}>←</button>
        <strong style={{ textTransform: "capitalize" }}>{nomeMese}</strong>
        <button type="button" className="pf-btn secondario compatto" onClick={() => setMeseData(new Date(anno, mese + 1, 1))}>→</button>
        <button type="button" className="pf-btn secondario compatto" onClick={() => setMeseData(new Date())}>Oggi</button>
      </div>

      <div className="pf-cal-griglia">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((g) => (
          <div className="pf-cal-intestazione" key={g}>{g}</div>
        ))}
        {celle.map((c) => {
          const stato = dispo?.[c.chiave]?.stato || "aperto";
          const col = DISPO_COLORE[stato] || DISPO_COLORE.aperto;
          return (
            <button
              type="button"
              key={c.chiave}
              className={`pf-cal-cella${c.fuoriMese ? " fuori" : ""}${c.chiave === oggi ? " oggi" : ""}${c.chiave === giornoSel ? " scelto" : ""}${stato === "chiuso" ? " chiuso" : ""}`}
              style={{ borderBottom: `3px solid ${col.bordo}` }}
              onClick={() => onGiorno(c.chiave)}
              title={col.nome}
            >
              <span className="numero">{c.data.getDate()}</span>
              <span className="pallini">
                {c.appuntamenti.slice(0, 4).map((b) => (
                  <span key={b.id} className="pallino" style={{ background: (SEMAFORO[b.status] || SEMAFORO.active).colore }}
                    title={`${new Date(b.start_dt).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })} ${b.customer_name} — ${(SEMAFORO[b.status] || SEMAFORO.active).nome}`} />
                ))}
                {c.appuntamenti.length > 4 && <span className="piu">+{c.appuntamenti.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pf-cal-legenda">
        {Object.entries(DISPO_COLORE).map(([k, v]) => (
          <span key={k}><span className="pallino quadrato" style={{ background: v.bordo }} /> {v.nome}</span>
        ))}
        <span className="pf-cal-legenda-sep" />
        {Object.entries(SEMAFORO).map(([k, v]) => (
          <span key={k}><span className="pallino" style={{ background: v.colore }} /> {v.nome}</span>
        ))}
      </div>
    </div>
  );
}

function TabAgenda({ statoPush, attivaNotifiche }) {
  const [agenda, setAgenda] = useState(null);
  const [errore, setErrore] = useState("");
  const [mostraBlocco, setMostraBlocco] = useState(false);
  const [blocco, setBlocco] = useState({ data: "", dataFine: "", dalle: "", alle: "", reason: "" });
  const [mostraManuale, setMostraManuale] = useState(false);
  const [servizi, setServizi] = useState(null);
  const [manuale, setManuale] = useState({ service_id: "", date: "", time: "", customer_name: "", customer_phone: "", address: "", city: "" });
  const [erroreManuale, setErroreManuale] = useState("");
  const [meseData, setMeseData] = useState(new Date());
  const [giornoSel, setGiornoSel] = useState(() => new Intl.DateTimeFormat("en-CA").format(new Date()));
  const [dispo, setDispo] = useState({});        // stato disponibilità per giorno (colora il calendario)
  const [editDispo, setEditDispo] = useState(null); // fasce in modifica per il giorno selezionato
  const [avvisoDispo, setAvvisoDispo] = useState(null);

  const carica = useCallback(() => {
    // carico il mese visualizzato con i bordi (la griglia mostra anche code e teste di mese)
    const primo = new Date(meseData.getFullYear(), meseData.getMonth(), 1);
    const da = new Date(primo);
    da.setDate(1 - ((primo.getDay() + 6) % 7));
    const dal = new Intl.DateTimeFormat("en-CA").format(da);
    panelFetch(`/api/panel/agenda?from=${dal}&days=42`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setAgenda(d); })
      .catch(() => setErrore("Errore di caricamento agenda"));
    panelFetch(`/api/panel/disponibilita?from=${dal}&days=42`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setDispo(Object.fromEntries(d.giorni.map((g) => [g.day, g]))); })
      .catch(() => {});
  }, [meseData]);

  useEffect(carica, [carica]);

  // Salva un'eccezione per il giorno selezionato (fasce vuote = chiuso)
  const salvaDispo = async (fasce) => {
    setAvvisoDispo(null);
    const r = await panelFetch("/api/panel/disponibilita", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: giornoSel, fasce }),
    });
    const d = await r.json();
    if (!r.ok) return setAvvisoDispo({ tipo: "err", testo: d.error || "Errore" });
    setEditDispo(null);
    if (d.scoperte?.length) {
      const righe = d.scoperte.map((s) => `• ${new Date(s.quando).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" })} ${s.cliente} (${s.servizio})`).join("\n");
      setAvvisoDispo({ tipo: "warn", testo: `Attenzione: hai ancora ${d.scoperte.length} prenotazione/i in questo giorno fuori dalla nuova disponibilità:\n${righe}\nRestano valide: se non puoi più, spostale o annullale qui sotto avvisando il paziente.` });
    }
    carica();
  };

  // Toglie l'eccezione: il giorno torna a seguire l'orario fisso settimanale
  const tornaAlFisso = async () => {
    setAvvisoDispo(null);
    await panelFetch("/api/panel/disponibilita", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: giornoSel }),
    });
    setEditDispo(null);
    carica();
  };

  const apriManuale = async () => {
    setMostraManuale(!mostraManuale);
    setMostraBlocco(false);
    if (!servizi) {
      const r = await panelFetch("/api/panel/servizi");
      if (r.ok) setServizi((await r.json()).servizi.filter((s) => s.active));
    }
  };

  const salvaManuale = async (e) => {
    e.preventDefault();
    setErroreManuale("");
    const r = await panelFetch("/api/panel/prenotazioni", {
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
    const r = await panelFetch("/api/panel/prenotazioni", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) carica();
  };

  const creaBlocco = async (e) => {
    e.preventDefault();
    if (!blocco.data || !blocco.dalle || !blocco.alle) return;
    const r = await panelFetch("/api/panel/blocchi", {
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
    await panelFetch(`/api/panel/blocchi?id=${id}`, { method: "DELETE" });
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
      <h2 style={{ color: "var(--iw-navy)", fontSize: 26, margin: "0 0 14px" }}>La tua agenda</h2>
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
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
            <div>
              <label>Indirizzo visita</label>
              <input value={manuale.address} onChange={(e) => setManuale({ ...manuale, address: e.target.value })} placeholder="Via e civico" />
            </div>
            <div>
              <label>Città</label>
              <input value={manuale.city} onChange={(e) => setManuale({ ...manuale, city: e.target.value })} placeholder="es. Lucca" />
            </div>
          </div>
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
      {agenda && (
        <CalendarioMensile
          bookings={agenda.bookings}
          dispo={dispo}
          meseData={meseData}
          setMeseData={setMeseData}
          giornoSel={giornoSel}
          onGiorno={(g) => { setGiornoSel(g); setEditDispo(null); setAvvisoDispo(null); }}
        />
      )}

      {agenda && (() => {
        const stato = dispo[giornoSel]?.stato || "aperto";
        const fonte = dispo[giornoSel]?.fonte || "fisso";
        const fasce = dispo[giornoSel]?.fasce || [];
        const etichettaGiorno = new Date(giornoSel + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
        const testoStato =
          stato === "chiuso" ? (fonte === "eccezione" ? "Chiuso (deciso da te per questo giorno)" : "Chiuso (nessun orario fisso questo giorno)")
          : fonte === "eccezione" ? `Orari speciali solo per oggi: ${fasce.map((f) => `${minToHHMM(f[0])}–${minToHHMM(f[1])}`).join(", ")}`
          : `Segue i tuoi orari fissi: ${fasce.map((f) => `${minToHHMM(f[0])}–${minToHHMM(f[1])}`).join(", ")}`;
        return (
          <div className="pf-panel pf-dispo" style={{ marginTop: 14 }}>
            <h3 style={{ margin: "0 0 4px", textTransform: "capitalize" }}>Disponibilità di {etichettaGiorno}</h3>
            <p className="pf-note" style={{ marginTop: 0 }}>
              {testoStato}
              {fonte === "eccezione" && <> · <button type="button" className="pf-link" onClick={tornaAlFisso}>torna agli orari fissi</button></>}
            </p>

            {avvisoDispo && (
              <div className={avvisoDispo.tipo === "err" ? "pf-errore" : "pf-successo"}
                style={{ whiteSpace: "pre-line", ...(avvisoDispo.tipo === "warn" ? { background: "#fff7ed", color: "#b45309", borderColor: "#fed7aa" } : {}) }}>
                {avvisoDispo.testo}
              </div>
            )}

            {editDispo === null ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button type="button" className="pf-btn pericolo compatto" onClick={() => salvaDispo([])}>🚫 Chiudi questo giorno</button>
                <button type="button" className="pf-btn secondario compatto"
                  onClick={() => setEditDispo(fasce.length ? fasce.map((f) => ({ da: minToHHMM(f[0]), a: minToHHMM(f[1]) })) : [{ da: "09:00", a: "13:00" }])}>
                  🕑 Imposta orari solo per oggi
                </button>
              </div>
            ) : (
              <div>
                <p className="pf-note" style={{ marginTop: 0 }}>Orari validi <strong>solo per {etichettaGiorno}</strong>. Lascia una sola fascia o aggiungine per la pausa pranzo/cena.</p>
                {editDispo.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <input type="time" value={f.da} onChange={(e) => setEditDispo(editDispo.map((x, j) => j === i ? { ...x, da: e.target.value } : x))} />
                    <span>→</span>
                    <input type="time" value={f.a} onChange={(e) => setEditDispo(editDispo.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} />
                    {editDispo.length > 1 && <button type="button" className="pf-btn pericolo compatto" onClick={() => setEditDispo(editDispo.filter((_, j) => j !== i))}>🗑</button>}
                  </div>
                ))}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  <button type="button" className="pf-btn secondario compatto" onClick={() => setEditDispo([...editDispo, { da: "15:00", a: "19:00" }])}>+ Aggiungi fascia</button>
                  <button type="button" className="pf-btn compatto" onClick={() => salvaDispo(editDispo.map((f) => [hhmmToMin(f.da), hhmmToMin(f.a)]))}>Salva questo giorno</button>
                  <button type="button" className="pf-btn secondario compatto" onClick={() => { setEditDispo(null); setAvvisoDispo(null); }}>Annulla</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {agenda && eventi.length === 0 && (
        <div className="pf-panel" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>Nessuna prenotazione in questo mese.</p>
          <p className="pf-note" style={{ marginBottom: 0 }}>
            Fai girare il tuo link personale (lo trovi nella scheda Profilo): è il modo più rapido per riempire l'agenda.
          </p>
        </div>
      )}

      {Object.entries(perGiorno).filter(([giorno]) => giorno === giornoSel).map(([giorno, lista]) => (
        <div key={giorno} style={{ marginBottom: 22, marginTop: 18 }}>
          <h3 style={{ color: "var(--iw-navy)", margin: "0 0 10px", textTransform: "capitalize" }}>
            {new Date(giorno + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {["mattina", "pomeriggio", "sera", "notte"].map((chiave) => {
            const diFascia = lista.filter((e) => fasciaDi(minutiRoma(e.quando)) === chiave);
            if (!diFascia.length) return null;
            return (
              <div key={chiave} style={{ marginBottom: 14 }}>
                <div className="pf-fascia-titolo">
                  {FASCE[chiave].icona} {FASCE[chiave].nome} <span>{FASCE[chiave].orario}</span>
                </div>
                {diFascia.map((e) =>
            e.tipo === "booking" ? (
              <div className="pf-agenda-item" key={`b${e.dato.id}`}>
                <span className="pallino grande" style={{ background: (SEMAFORO[e.dato.status] || SEMAFORO.active).colore }} title={(SEMAFORO[e.dato.status] || SEMAFORO.active).nome} />
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
                    <button className="pf-btn pericolo compatto" onClick={() => cambiaStato(e.dato.id, "cancelled", `Annullo la prenotazione di ${e.dato.customer_name}? ${e.dato.customer_email ? "Il paziente verrà avvisato via email." : "È una prenotazione telefonica: ricordati di avvisare tu il paziente."}`)}>Annulla</button>
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
            );
          })}
        </div>
      ))}

      {agenda && eventi.length > 0 && !perGiorno[giornoSel] && (
        <div className="pf-panel" style={{ marginTop: 14 }}>
          <p style={{ margin: 0 }}>Nessun appuntamento in questa giornata. Tocca un giorno con il pallino per vedere il dettaglio.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Servizi

function TabServizi() {
  const [servizi, setServizi] = useState(null);
  const [nuovo, setNuovo] = useState({ key: "", durata: "", prezzo: "", prezzoNotte: "" });
  const [messaggio, setMessaggio] = useState(null);

  const carica = useCallback(() => {
    panelFetch("/api/panel/servizi").then((r) => r.json()).then((d) => setServizi(d.servizi || []));
  }, []);
  useEffect(carica, [carica]);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 4000);
  };

  const aggiungi = async (e) => {
    e.preventDefault();
    const r = await panelFetch("/api/panel/servizi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalog_key: nuovo.key, duration_min: Number(nuovo.durata), price_cents: centesimi(nuovo.prezzo), price_notte_cents: nuovo.prezzoNotte ? centesimi(nuovo.prezzoNotte) : null }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    setNuovo({ key: "", durata: "", prezzo: "", prezzoNotte: "" });
    avvisa("ok", "Prestazione aggiunta ✅");
    carica();
  };

  const salva = async (s) => {
    const r = await panelFetch("/api/panel/servizi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, name: s.name, duration_min: Number(s.duration_min), price_cents: s._prezzo !== undefined ? centesimi(s._prezzo) : s.price_cents, price_notte_cents: s._prezzoNotte !== undefined ? (s._prezzoNotte ? centesimi(s._prezzoNotte) : null) : s.price_notte_cents, active: s.active }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", "Salvato ✅");
    carica();
  };

  const elimina = async (s) => {
    if (!confirm(`Eliminare "${s.name}" dalla tua scheda?\n\nSe vuoi solo sospenderla temporaneamente, togli la spunta "attiva" invece di eliminarla.`)) return;
    const r = await panelFetch(`/api/panel/servizi?id=${s.id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", `"${s.name}" eliminata dalla tua scheda`);
    carica();
  };

  const cambia = (id, campo, valore) =>
    setServizi(servizi.map((s) => (s.id === id ? { ...s, [campo]: valore, _mod: true } : s)));

  if (!servizi) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <p className="pf-note" style={{ marginTop: 0 }}>
        Scegli dal listino <strong>solo le prestazioni che vuoi offrire</strong> e imposta il tuo
        prezzo: non puoi scendere sotto il minimo indicato (per evitare concorrenza sleale),
        sopra il consigliato sei libero. Il compenso resta interamente tuo: zero commissioni.
        <br />Togli la spunta <strong>"attiva"</strong> per sospendere una prestazione (sparisce
        dalla scheda ma resta qui), oppure premi <strong>🗑</strong> per eliminarla del tutto. Il campo <strong>🌙 notte</strong> è la tua maggiorazione per le prenotazioni tra le 22:00 e le 07:00 (vuoto = di notte non la fai).
      </p>
      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {servizi.map((s) => {
        const voce = LISTINO_MAP[s.catalog_key];
        return (
        <div className="pf-servizio-edit" key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
          <div className="nome" style={{ fontWeight: 700, color: "var(--iw-navy)", padding: "8px 0" }}>{s.name}</div>
          <div className="riga2">
            <label>
              min
              <input type="number" min={5} max={480} step={5} value={s.duration_min} onChange={(e) => cambia(s.id, "duration_min", e.target.value)} aria-label="Durata in minuti" />
            </label>
            <label>
              € giorno
              <input inputMode="decimal" value={s._prezzo !== undefined ? s._prezzo : euro(s.price_cents)} onChange={(e) => cambia(s.id, "_prezzo", e.target.value)} aria-label="Prezzo di giorno" />
            </label>
            <label title="Prezzo maggiorato per le prenotazioni notturne (22:00-07:00). Lascia vuoto se di notte non fai questa prestazione.">
              🌙 notte
              <input inputMode="decimal" placeholder="—" value={s._prezzoNotte !== undefined ? s._prezzoNotte : (s.price_notte_cents ? euro(s.price_notte_cents) : "")} onChange={(e) => cambia(s.id, "_prezzoNotte", e.target.value)} aria-label="Prezzo di notte" />
            </label>
            <label className="attivo">
              <input type="checkbox" checked={s.active} onChange={(e) => cambia(s.id, "active", e.target.checked)} /> attiva
            </label>
            {s._mod && <button className="pf-btn compatto" onClick={() => salva(s)} type="button">Salva</button>}
            <button className="pf-elimina" onClick={() => elimina(s)} type="button" title={`Elimina ${s.name}`} aria-label={`Elimina ${s.name}`}>🗑</button>
          </div>
          {voce && <p className="pf-note" style={{ margin: "2px 0 0", fontSize: 14 }}>minimo {voce.min} € · consigliato {voce.consigliato} €</p>}
        </div>
      ); })}

      {(() => {
        const gia = new Set(servizi.map((s) => s.catalog_key));
        const disponibili = LISTINO.filter((v) => !gia.has(v.key));
        const voceSel = LISTINO_MAP[nuovo.key];
        if (!disponibili.length) return <p className="pf-note" style={{ marginTop: 18 }}>Hai già aggiunto tutte le prestazioni del listino ✅</p>;
        return (
          <form className="pf-panel pf-book" onSubmit={aggiungi} style={{ marginTop: 18 }}>
            <h2>+ Aggiungi una prestazione</h2>
            <label>Prestazione *</label>
            <select required value={nuovo.key} onChange={(e) => {
              const v = LISTINO_MAP[e.target.value];
              setNuovo({ key: e.target.value, durata: v ? String(v.durata) : "", prezzo: v ? String(v.consigliato).replace(".", ",") : "", prezzoNotte: "" });
            }}>
              <option value="">Scegli dal listino…</option>
              {disponibili.map((v) => <option key={v.key} value={v.key}>{v.nome}</option>)}
            </select>
            {voceSel && (
              <p className="pf-note" style={{ marginTop: -4 }}>
                Prezzo minimo <strong>{voceSel.min} €</strong> · consigliato <strong>{voceSel.consigliato} €</strong> — sopra il consigliato sei libero.
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Durata (minuti) *</label>
                <input type="number" required min={5} max={480} step={5} value={nuovo.durata} onChange={(e) => setNuovo({ ...nuovo, durata: e.target.value })} />
              </div>
              <div>
                <label>Il tuo prezzo di giorno (€) *</label>
                <input required inputMode="decimal" placeholder={voceSel ? String(voceSel.consigliato) : "€"} value={nuovo.prezzo} onChange={(e) => setNuovo({ ...nuovo, prezzo: e.target.value })} />
              </div>
            </div>
            <label>🌙 Prezzo di notte (€) <span style={{ fontWeight: 400 }}>— facoltativo</span></label>
            <input inputMode="decimal" placeholder="lascia vuoto se di notte non la fai" value={nuovo.prezzoNotte} onChange={(e) => setNuovo({ ...nuovo, prezzoNotte: e.target.value })} />
            <p className="pf-note" style={{ marginTop: -4 }}>
              Vale per le prenotazioni tra le <strong>22:00 e le 07:00</strong>. È una maggiorazione:
              non può essere inferiore al prezzo di giorno. Se lo lasci vuoto, di notte questa
              prestazione non è prenotabile.
            </p>
            <button className="pf-btn" disabled={!nuovo.key}>Aggiungi</button>
          </form>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------- Orari

function TabOrari() {
  const [giorni, setGiorni] = useState(null);
  const [messaggio, setMessaggio] = useState(null);
  const [salvo, setSalvo] = useState(false);

  // Ogni giorno ha una LISTA di fasce: mattina/pomeriggio/sera/notte le decide
  // il professionista, e le pause (pranzo, cena) sono i buchi tra una fascia e l'altra.
  useEffect(() => {
    panelFetch("/api/panel/orari").then((r) => r.json()).then((d) => {
      const base = GIORNI.map((nome, weekday) => ({ nome, weekday, fasce: [] }));
      for (const o of d.orari || []) {
        base[o.weekday].fasce.push({ dalle: minutiA(o.start_min), alle: minutiA(o.end_min) });
      }
      base.forEach((g) => g.fasce.sort((a, b) => a.dalle.localeCompare(b.dalle)));
      setGiorni(base);
    });
  }, []);

  const salva = async () => {
    setSalvo(true);
    setMessaggio(null);
    const orari = [];
    for (const g of giorni) {
      for (const f of g.fasce) {
        if (!f.dalle || !f.alle) continue;
        orari.push({ weekday: g.weekday, start_min: aMinuti(f.dalle), end_min: aMinuti(f.alle) });
      }
    }
    const r = await panelFetch("/api/panel/orari", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orari }),
    });
    const d = await r.json();
    setSalvo(false);
    setMessaggio(r.ok
      ? { tipo: "ok", testo: "✅ Orari salvati: il calendario pubblico è già aggiornato." }
      : { tipo: "err", testo: d.error });
  };

  const aggiungiFascia = (weekday) =>
    setGiorni(giorni.map((g) => {
      if (g.weekday !== weekday) return g;
      const ultima = g.fasce[g.fasce.length - 1];
      const proposta = !g.fasce.length ? { dalle: "08:00", alle: "13:00" }
        : ultima.alle < "15:00" ? { dalle: "15:00", alle: "19:00" }
        : { dalle: "21:00", alle: "23:00" };
      return { ...g, fasce: [...g.fasce, proposta] };
    }));

  const togliFascia = (weekday, i) =>
    setGiorni(giorni.map((g) => (g.weekday === weekday ? { ...g, fasce: g.fasce.filter((_, k) => k !== i) } : g)));

  const cambiaFascia = (weekday, i, campo, valore) =>
    setGiorni(giorni.map((g) => (g.weekday === weekday
      ? { ...g, fasce: g.fasce.map((f, k) => (k === i ? { ...f, [campo]: valore } : f)) }
      : g)));

  const copiaSuTutti = (weekday) => {
    const modello = giorni.find((g) => g.weekday === weekday);
    if (!modello.fasce.length) return;
    if (!confirm(`Copiare gli orari di ${modello.nome} su TUTTI gli altri giorni?`)) return;
    setGiorni(giorni.map((g) => ({ ...g, fasce: modello.fasce.map((f) => ({ ...f })) })));
    setMessaggio({ tipo: "ok", testo: "Orari copiati su tutti i giorni — ricordati di premere Salva" });
  };

  if (!giorni) return <p className="pf-note">Caricamento…</p>;

  return (
    <div>
      <div className="pf-info-box">
        <strong>Questo è il tuo orario fisso settimanale</strong>, quello che si ripete ogni settimana.
        È perfetto se lavori solo a domicilio. <br />
        Se invece hai <strong>turni che cambiano</strong> (es. lavori in struttura), imposta qui un
        orario di base — anche vuoto — e poi vai nella scheda <strong>Agenda</strong>: dal calendario
        puoi <strong>chiudere o cambiare il singolo giorno</strong>. Così nessuno ti prenota mentre sei in reparto.
      </div>
      <p className="pf-note" style={{ marginTop: 0 }}>
        I pazienti possono prenotare solo dentro queste fasce (meno le prenotazioni già prese e i blocchi).
        Puoi mettere <strong>più fasce per giorno</strong>: la pausa pranzo o cena è semplicemente il buco
        tra una fascia e l'altra. Le fasce tra le <strong>22:00 e le 07:00</strong> 🌙 sono notturne: lì
        valgono i prezzi maggiorati che hai impostato nella scheda Servizi.
      </p>
      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {giorni.map((g) => (
        <div className="pf-giorno-card" key={g.weekday}>
          <div className="testa">
            <strong>{g.nome}</strong>
            {g.fasce.length === 0 && <span className="chiuso">Chiuso</span>}
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {g.fasce.length > 0 && (
                <button type="button" className="pf-btn secondario compatto" onClick={() => copiaSuTutti(g.weekday)} title="Copia questi orari su tutti i giorni">
                  Copia su tutti
                </button>
              )}
              <button type="button" className="pf-btn secondario compatto" onClick={() => aggiungiFascia(g.weekday)}>+ Fascia</button>
            </span>
          </div>
          {g.fasce.map((f, i) => {
            const notturna = aMinuti(f.dalle) >= 22 * 60 || aMinuti(f.alle) <= 7 * 60;
            return (
              <div className="fascia-riga" key={i}>
                <input type="time" value={f.dalle} onChange={(e) => cambiaFascia(g.weekday, i, "dalle", e.target.value)} aria-label={`${g.nome} fascia ${i + 1} dalle`} />
                <span>→</span>
                <input type="time" value={f.alle} onChange={(e) => cambiaFascia(g.weekday, i, "alle", e.target.value)} aria-label={`${g.nome} fascia ${i + 1} alle`} />
                {notturna && <span className="tag-notte">🌙 notturna</span>}
                <button type="button" className="pf-elimina" onClick={() => togliFascia(g.weekday, i)} aria-label="Togli fascia">🗑</button>
              </div>
            );
          })}
        </div>
      ))}

      <button className="pf-btn" onClick={salva} disabled={salvo} style={{ marginTop: 14 }}>
        {salvo ? "Salvo…" : "Salva orari"}
      </button>
    </div>
  );
}

function TabZone() {
  const [zone, setZone] = useState(null);
  const [nuova, setNuova] = useState({ city: "", province: "", region: "", sigla: "" });
  const [messaggio, setMessaggio] = useState(null);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 4000);
  };

  const carica = () =>
    panelFetch("/api/panel/zone").then((r) => r.json()).then((d) => {
      setZone(d.zone || []);
    });

  useEffect(() => { carica(); }, []);

  const aggiungi = async (e) => {
    e.preventDefault();
    const r = await panelFetch("/api/panel/zone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuova),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    setNuova({ city: "", province: "", region: "", sigla: "" });
    avvisa("ok", `${d.zona.city} aggiunta ✅ Da adesso i pazienti di quella zona ti trovano.`);
    carica();
  };

  const togli = async (z) => {
    if (!confirm(`Togliere ${z.city} dalle tue zone? Non comparirai più nelle ricerche di quel comune.`)) return;
    const r = await panelFetch("/api/panel/zone", {
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
        <div>
          <label htmlFor="zona-comune">Comune *</label>
          <CercaComune
            id="zona-comune"
            required
            placeholder="es. Borgo a Mozzano"
            valore={nuova.city}
            onTesto={(t) => setNuova({ city: t, province: "", region: "", sigla: "" })}
            onScegli={(c) => setNuova({ city: c.nome, province: c.provincia, region: c.regione, sigla: c.sigla })}
          />
          {nuova.province ? (
            <p className="pf-note" style={{ margin: "6px 0 0" }}>📍 {nuova.province} · {nuova.region}</p>
          ) : (
            <p className="pf-note" style={{ margin: "6px 0 0" }}>Scegli il comune dalla tendina: provincia e regione le mettiamo noi.</p>
          )}
        </div>
        <button className="pf-btn" disabled={!nuova.province}>Aggiungi zona</button>
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
    panelFetch("/api/panel/profilo").then((r) => r.json()).then((d) => setProfilo(d.profilo));
  }, []);

  const salva = async (e) => {
    e.preventDefault();
    setSalvo(true);
    setEsito(null);
    try {
      const r = await panelFetch("/api/panel/profilo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profilo.bio, phone: profilo.phone, address: profilo.address,
          city: profilo.city, province: profilo.province, sigla: profilo.sigla,
          albo_name: profilo.albo_name, albo_number: profilo.albo_number,
          albo_date: profilo.albo_date, vat_number: profilo.vat_number,
        }),
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
      const r = await panelFetch("/api/panel/foto", {
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
    const r = await panelFetch("/api/panel/password", {
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
        <label htmlFor="pr-citta">Comune *</label>
        <CercaComune
          id="pr-citta"
          required
          valore={profilo.city || ""}
          onTesto={(t) => setProfilo({ ...profilo, city: t, province: "", region: "", sigla: "" })}
          onScegli={(c) => setProfilo({ ...profilo, city: c.nome, province: c.provincia, region: c.regione, sigla: c.sigla })}
        />
        <p className="pf-note" style={{ margin: "6px 0 12px" }}>
          {profilo.province ? `📍 ${profilo.province}${profilo.region ? " · " + profilo.region : ""}` : "Scegli il comune dalla tendina: provincia e regione le mettiamo noi."}
        </p>
        <label htmlFor="pr-tel">Telefono</label>
        <input id="pr-tel" type="tel" value={profilo.phone || ""} onChange={(e) => setProfilo({ ...profilo, phone: e.target.value })} />
        <label htmlFor="pr-bio">Presentazione (compare sulla tua scheda pubblica)</label>
        <textarea id="pr-bio" rows={4} maxLength={1200} value={profilo.bio || ""} onChange={(e) => setProfilo({ ...profilo, bio: e.target.value })} />

        <h2 style={{ marginTop: 22 }}>🎓 I tuoi dati professionali</h2>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Puoi completarli o correggerli quando vuoi: la partita IVA spesso arriva dopo
          l'iscrizione, e il numero OPI può cambiare se ti trasferisci di provincia.
          Sono dati che vediamo <strong>solo noi</strong> per la verifica: sulla scheda pubblica
          compare soltanto il numero di iscrizione all'albo.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label htmlFor="pr-albo">Albo / OPI di appartenenza</label>
            <input id="pr-albo" placeholder="es. OPI Lucca" value={profilo.albo_name || ""} onChange={(e) => setProfilo({ ...profilo, albo_name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pr-albonum">Numero di iscrizione</label>
            <input id="pr-albonum" placeholder="es. 12345" value={profilo.albo_number || ""} onChange={(e) => setProfilo({ ...profilo, albo_number: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label htmlFor="pr-albodata">Data di iscrizione</label>
            <input id="pr-albodata" type="date" value={(profilo.albo_date || "").slice(0, 10)} onChange={(e) => setProfilo({ ...profilo, albo_date: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pr-piva">Partita IVA <span style={{ fontWeight: 400 }}>(se ce l'hai)</span></label>
            <input id="pr-piva" inputMode="numeric" maxLength={11} placeholder="11 cifre" value={profilo.vat_number || ""} onChange={(e) => setProfilo({ ...profilo, vat_number: e.target.value.replace(/\D/g, "") })} />
          </div>
        </div>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Senza partita IVA lavori comunque con noi: sei nella rete e i pazienti ti trovano.
          Quando la apri, torna qui e aggiungila.
        </p>
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
        <h2>⭐ Fatti trovare su Google (5 minuti, vale oro)</h2>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Hai un <strong>profilo Google Business</strong> (quello con le recensioni che appare
          quando cercano il tuo nome)? Collegalo alla tua scheda: chi ti cerca su Google
          troverà il tasto per prenotarti online.
        </p>
        <ol style={{ margin: "0 0 12px", paddingLeft: 20, color: "var(--iw-slate)", fontSize: 16.5 }}>
          <li>Cerca il tuo nome su Google ed entra con "Modifica profilo"</li>
          <li>Vai su <strong>Modifica profilo → Contatti → Sito web</strong></li>
          <li>Incolla il link della tua scheda (tasto qui sotto)</li>
        </ol>
        <button type="button" className="pf-btn secondario" onClick={() => {
          navigator.clipboard?.writeText(`https://infermieriweb.it/p/${profilo.slug}`);
          setEsito({ tipo: "ok", testo: "✅ Link copiato: incollalo nel tuo profilo Google Business." });
          setTimeout(() => setEsito(null), 4000);
        }}>📋 Copia il link della mia scheda</button>
        <p className="pf-note" style={{ marginTop: 10 }}>
          Non hai un profilo Google Business? Crealo gratis su business.google.com:
          per un libero professionista è la vetrina più importante che esista.
        </p>
      </div>

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

  const [erroreStat, setErroreStat] = useState(false);
  useEffect(() => {
    panelFetch("/api/panel/statistiche")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && d.prenotazioni ? setDati(d) : setErroreStat(true)))
      .catch(() => setErroreStat(true));
  }, []);

  if (erroreStat) return <p className="pf-note">Statistiche non disponibili al momento. Riprova tra poco.</p>;
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
        await panelFetch("/api/panel/push", {
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
      const r = await panelFetch("/api/panel/push", {
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

  // Sessione scaduta durante l'uso: torna al login con un avviso (niente schede vuote)
  useEffect(() => {
    const scaduta = () => { setUtente(null); setErrore("La sessione è scaduta: accedi di nuovo."); };
    window.addEventListener("iw-sessione-scaduta", scaduta);
    return () => window.removeEventListener("iw-sessione-scaduta", scaduta);
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
                const r = await panelFetch("/api/panel/recupero", {
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
          <CampoPassword id="pl-pass" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password" />
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
