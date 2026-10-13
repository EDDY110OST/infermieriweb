import { useCallback, useEffect, useRef, useState } from "react";
import { EVENTI, ICONE, FILTRI, EVENTI_FALLITI, INIZIO_REGISTRO, statoAccessi } from "../lib/accessi.js";

// Admin → Infermieri → «🔑 Registro accessi» (13/10/26): chi entra nell'area riservata e
// quando, chi non è mai entrato dopo l'approvazione e chi ci prova senza riuscirci.
// I dati arrivano da /api/admin/accessi; le regole stanno in lib/accessi.js.

const ROMA = "Europe/Rome";
const giornoRoma = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: ROMA }).format(d);
const oraRoma = (d) => new Intl.DateTimeFormat("it-IT", { timeZone: ROMA, hour: "2-digit", minute: "2-digit" }).format(d);
const dataLunga = (iso) => new Intl.DateTimeFormat("it-IT", { timeZone: ROMA, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
const INIZIO = dataLunga(`${INIZIO_REGISTRO}T12:00:00+02:00`);

// «oggi alle 9:12» | «ieri alle 18:30» | «lun 12 ott alle 18:30»
function quando(iso) {
  if (!iso) return "";
  const d = new Date(iso), adesso = new Date();
  const g = giornoRoma(d);
  if (g === giornoRoma(adesso)) return `oggi alle ${oraRoma(d)}`;
  if (g === giornoRoma(new Date(adesso.getTime() - 86400000))) return `ieri alle ${oraRoma(d)}`;
  const altroAnno = g.slice(0, 4) !== giornoRoma(adesso).slice(0, 4);
  const giorno = new Intl.DateTimeFormat("it-IT", { timeZone: ROMA, weekday: "short", day: "numeric", month: "short", ...(altroAnno ? { year: "numeric" } : {}) }).format(d);
  return `${giorno} alle ${oraRoma(d)}`;
}

const BOX_AVVISO = { background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 10, padding: "8px 12px", marginBottom: 10 };
const RIGA = { padding: "10px 0", borderTop: "1px solid var(--iw-line)" };
const volte = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`;

// La riga sulla scheda di ogni infermiere (Infermieri → Elenco). p.accessi è null solo se
// il registro non si è potuto leggere: in quel caso non si scrive niente.
export function RigaAccessi({ p }) {
  if (!p.accessi) return null;
  const { stato, bloccato } = statoAccessi(p.accessi, p.created_at);
  return (
    <>
      {bloccato && (
        <div style={{ ...BOX_AVVISO, fontSize: 15 }}>
          ⚠️ <strong>Sta provando a entrare ma non ci riesce:</strong> ultimo tentativo fallito {quando(p.accessi.ultimo_fallito)}. Aiutalo con «Correggi email e rimanda il benvenuto».
        </div>
      )}
      {stato === "mai" && !bloccato && (
        <div style={{ ...BOX_AVVISO, fontSize: 15 }}>⚠️ <strong>Non è mai entrato nel pannello</strong> dopo l'approvazione. Da contattare.</div>
      )}
      {stato === "entrato" && (
        <div className="pf-note" style={{ margin: "0 0 8px" }}>
          🔑 Ultima volta nel pannello: <strong>{quando(p.accessi.ultimo)}</strong>{p.accessi.dispositivo ? ` (${p.accessi.dispositivo})` : ""}
        </div>
      )}
      {stato === "non_si_sa" && !bloccato && (
        <div className="pf-note" style={{ margin: "0 0 8px" }}>🔑 Nessun accesso dal {INIZIO}, quando è partito il registro (di prima non c'è traccia).</div>
      )}
    </>
  );
}

function scaricaCsv(righe, nomeFile) {
  const colonne = [
    { label: "Data e ora", get: (r) => new Date(r.created_at).toLocaleString("it-IT", { timeZone: ROMA }) },
    { label: "Cosa è successo", get: (r) => EVENTI[r.evento] || r.evento },
    { label: "Infermiere", get: (r) => r.nome || "" },
    { label: "Email scritta", get: (r) => r.email || "" },
    { label: "Dispositivo", get: (r) => r.dispositivo || "" },
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const testo = [colonne.map((c) => esc(c.label)).join(",")]
    .concat(righe.map((r) => colonne.map((c) => esc(c.get(r))).join(",")))
    .join("\n");
  // BOM (U+FEFF) in testa: così Excel apre il file con gli accenti giusti
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + testo], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = nomeFile; a.click();
  URL.revokeObjectURL(url);
}

const contatti = (p) => `${p.city} (${p.province}) · 📞 ${p.phone || "—"} · ✉️ ${p.email || "—"}`;

export default function RegistroAccessi() {
  const [dati, setDati] = useState(null);       // { professionisti, numeri, dal }
  const [eventi, setEventi] = useState(null);
  const [altri, setAltri] = useState(false);
  const [pid, setPid] = useState("");
  const [tipo, setTipo] = useState("tutti");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const movimentiRef = useRef(null);

  const query = useCallback((extra = {}) => {
    const q = new URLSearchParams({ tipo, ...extra });
    if (pid) q.set("pid", pid);
    return `/api/admin/accessi?${q}`;
  }, [pid, tipo]);

  // primo caricamento: riepilogo + movimenti; poi a ogni cambio di filtro solo i movimenti
  const haRiepilogo = useRef(false);
  useEffect(() => {
    let attivo = true;
    fetch(query(haRiepilogo.current ? { solo: "eventi" } : {}))
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!attivo) return;
        if (!ok) return setErrore(d.error || "Il registro non si è potuto leggere");
        setErrore("");
        // `adesso` = momento del caricamento: serve al conteggio «ultimi 7 giorni»
        if (d.professionisti) { setDati({ ...d, adesso: Date.now() }); haRiepilogo.current = true; }
        setEventi(d.eventi || []);
        setAltri(!!d.altri);
      })
      .catch(() => attivo && setErrore("Il registro non si è potuto leggere: riprova tra poco"));
    return () => { attivo = false; };
  }, [query]);

  const mostraAltri = async () => {
    if (inCorso || !eventi?.length) return;
    setInCorso(true);
    try {
      const r = await fetch(query({ solo: "eventi", prima: eventi[eventi.length - 1].id }));
      const d = await r.json();
      if (r.ok) { setEventi((e) => e.concat(d.eventi || [])); setAltri(!!d.altri); }
    } finally { setInCorso(false); }
  };

  const csv = async () => {
    if (inCorso) return;
    setInCorso(true);
    try {
      const r = await fetch(query({ solo: "eventi", tutte: "1" }));
      const d = await r.json();
      if (r.ok) scaricaCsv(d.eventi || [], `registro-accessi_${giornoRoma(new Date())}.csv`);
    } finally { setInCorso(false); }
  };

  const vediMovimenti = (id) => {
    setPid(String(id)); setTipo("tutti");
    movimentiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (errore && !dati) return <div className="pf-errore">{errore}</div>;
  if (!dati) return <p className="pf-note">Caricamento…</p>;

  // gli amministratori (Bruno, Eduard) restano nei movimenti ma non negli elenchi «da contattare»
  const infermieri = dati.professionisti.filter((p) => !p.admin);
  const conStato = infermieri.map((p) => ({ ...p, ...statoAccessi(p.accessi, p.created_at) }));
  const bloccati = conStato.filter((p) => p.bloccato);
  const mai = conStato.filter((p) => p.stato === "mai" && !p.bloccato);
  const nonSiSa = conStato.filter((p) => p.stato === "non_si_sa" && !p.bloccato);
  const entrati = conStato.filter((p) => p.stato === "entrato")
    .sort((a, b) => new Date(b.accessi.ultimo) - new Date(a.accessi.ultimo));
  const setteGiorniFa = dati.adesso - 7 * 86400000;
  const entrati7 = entrati.filter((p) => new Date(p.accessi.ultimo).getTime() > setteGiorniFa).length;
  const perNome = dati.professionisti.slice().sort((a, b) => a.name.localeCompare(b.name, "it"));
  const tastoMovimenti = (p) => (
    <button className="pf-btn secondario compatto" style={{ marginTop: 6 }} onClick={() => vediMovimenti(p.id)}>Vedi i suoi movimenti</button>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🔑 Registro accessi</h2>
      <p className="pf-note" style={{ marginTop: 0 }}>
        Chi entra nell'area riservata e quando. Il registro parte dal <strong>{INIZIO}</strong>: degli accessi di prima non c'è traccia.
        Annotiamo data, ora, esito e tipo di dispositivo; <strong>non</strong> l'indirizzo IP. Le righe si cancellano da sole dopo 12 mesi.
      </p>

      <div className="adm-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="adm-kpi"><div className="n">{entrati7}</div><div className="l">Entrati negli ultimi 7 giorni</div></div>
        <div className="adm-kpi"><div className="n">{mai.length}</div><div className="l">Mai entrati dopo l'approvazione</div></div>
        <div className="adm-kpi"><div className="n">{bloccati.length}</div><div className="l">Non riescono a entrare</div></div>
        <div className="adm-kpi"><div className="n">{dati.numeri?.sconosciute_7g ?? 0}</div><div className="l">Email senza account (7 giorni)</div></div>
      </div>

      {bloccati.length > 0 && (
        <div className="pf-panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>⚠️ Non riescono a entrare ({bloccati.length})</h3>
          <p className="pf-note" style={{ marginTop: 0 }}>Hanno sbagliato la password dopo l'ultima volta che sono entrati (o non sono mai entrati). Per aiutarli: Infermieri → Elenco → «Correggi email e rimanda il benvenuto».</p>
          {bloccati.map((p) => (
            <div key={p.id} style={RIGA}>
              <strong style={{ fontSize: 18, color: "var(--iw-navy)" }}>{p.name}</strong>
              <div className="pf-note" style={{ margin: "2px 0", overflowWrap: "anywhere" }}>{contatti(p)}</div>
              <div>Ultimo tentativo fallito: <strong>{quando(p.accessi.ultimo_fallito)}</strong> · {volte(p.accessi.falliti, "tentativo fallito", "tentativi falliti")} in tutto{p.accessi.ultimo ? ` · ultima volta dentro: ${quando(p.accessi.ultimo)}` : " · mai entrato"}</div>
              {tastoMovimenti(p)}
            </div>
          ))}
        </div>
      )}

      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>🚪 Mai entrati dopo l'approvazione ({mai.length})</h3>
        {mai.length === 0 && <p style={{ margin: 0 }}>Nessuno: tutti gli infermieri approvati dal {INIZIO} sono entrati almeno una volta.</p>}
        {mai.map((p) => (
          <div key={p.id} style={RIGA}>
            <strong style={{ fontSize: 18, color: "var(--iw-navy)" }}>{p.name}</strong>
            <div className="pf-note" style={{ margin: "2px 0", overflowWrap: "anywhere" }}>{contatti(p)}</div>
            <div>Approvato il {dataLunga(p.created_at)} · {volte(p.servizi, "prestazione inserita", "prestazioni inserite")}</div>
          </div>
        ))}
      </div>

      {nonSiSa.length > 0 && (
        <div className="pf-panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>❔ Nessun accesso dal {INIZIO} ({nonSiSa.length})</h3>
          <p className="pf-note" style={{ marginTop: 0 }}>Erano già iscritti quando è partito il registro. Da allora non sono entrati; se fossero entrati prima, non lo possiamo sapere.</p>
          {nonSiSa.map((p) => (
            <div key={p.id} style={RIGA}>
              <strong style={{ fontSize: 18, color: "var(--iw-navy)" }}>{p.name}</strong>
              <div className="pf-note" style={{ margin: "2px 0", overflowWrap: "anywhere" }}>{contatti(p)}</div>
              <div>Approvato il {dataLunga(p.created_at)} · {volte(p.servizi, "prestazione inserita", "prestazioni inserite")}</div>
            </div>
          ))}
        </div>
      )}

      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>✅ Entrati ({entrati.length})</h3>
        {entrati.length === 0 && <p style={{ margin: 0 }}>Ancora nessun ingresso registrato.</p>}
        {entrati.map((p) => (
          <div key={p.id} style={RIGA}>
            <strong style={{ fontSize: 18, color: "var(--iw-navy)" }}>{p.name}</strong>
            <div>Ultima volta: <strong>{quando(p.accessi.ultimo)}</strong>{p.accessi.dispositivo ? ` (${p.accessi.dispositivo})` : ""}</div>
            <div className="pf-note" style={{ margin: "2px 0" }}>Prima volta registrata: {quando(p.accessi.primo)} · è entrato in {volte(p.accessi.giorni, "giorno", "giorni diversi")}</div>
            {tastoMovimenti(p)}
          </div>
        ))}
      </div>

      <div className="pf-panel" ref={movimentiRef} style={{ scrollMarginTop: 96 }}>
        <h3 style={{ marginTop: 0 }}>📜 Tutti i movimenti</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <select className="pf-book" style={{ marginBottom: 0, width: "auto", maxWidth: "100%" }} value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Di chi">
            <option value="">Tutti</option>
            {perNome.map((p) => <option key={p.id} value={p.id}>{p.name}{p.admin ? " (amministratore)" : ""}</option>)}
          </select>
          <select className="pf-book" style={{ marginBottom: 0, width: "auto", maxWidth: "100%" }} value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Che cosa">
            {FILTRI.map((f) => <option key={f.k} value={f.k}>{f.label}</option>)}
          </select>
          {eventi && eventi.length > 0 && <button className="pf-btn secondario compatto" onClick={csv} disabled={inCorso}>⬇️ Scarica CSV</button>}
        </div>
        {errore && <div className="pf-errore" style={{ marginBottom: 10 }}>{errore}</div>}
        {!eventi ? <p className="pf-note">Caricamento…</p> : eventi.length === 0 ? (
          <p style={{ margin: 0 }}>Nessun movimento{pid || tipo !== "tutti" ? " con questi filtri" : " registrato finora"}.</p>
        ) : eventi.map((e) => (
          <div key={e.id} style={{ ...RIGA, padding: "8px 0" }}>
            <div>
              <span aria-hidden="true">{ICONE[e.evento] || "•"} </span>
              <strong style={{ color: EVENTI_FALLITI.includes(e.evento) ? "#9a3412" : "var(--iw-navy)" }}>{EVENTI[e.evento] || e.evento}</strong>
            </div>
            <div className="pf-note" style={{ margin: 0, overflowWrap: "anywhere" }}>
              {quando(e.created_at)} · {e.nome ? <>{e.nome}{e.admin ? " (amministratore)" : ""}</> : e.email ? <>email scritta: <strong>{e.email}</strong></> : "profilo non più in rete"}{e.dispositivo ? ` · ${e.dispositivo}` : ""}
            </div>
          </div>
        ))}
        {altri && <button className="pf-btn secondario" style={{ marginTop: 12 }} onClick={mostraAltri} disabled={inCorso}>{inCorso ? "Carico…" : "Mostra altri"}</button>}
      </div>
    </div>
  );
}
