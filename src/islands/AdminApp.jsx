import React, { useCallback, useEffect, useState } from "react";

const dataIt = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const dataOra = (iso) =>
  new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const euro = (cents) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
const STATI = { active: "Confermata", done: "Completata", cancelled: "Annullata", noshow: "Non presentato" };

/* ============================ IL MENÙ (struttura di Bruno) ============================ */

const MENU = [
  { icona: "📊", titolo: "Dashboard", voci: [{ k: "dashboard", label: "Panoramica e KPI" }] },
  {
    icona: "👨‍⚕️", titolo: "Infermieri", voci: [
      { k: "inf-elenco", label: "Elenco infermieri" },
      { k: "inf-nuovo", label: "Nuovo infermiere" },
      { k: "inf-verifica", label: "Verifica documenti", badge: "candidature" },
      { k: "inf-stato", label: "Stato approvazione" },
      { k: "inf-specializzazioni", label: "Specializzazioni" },
      { k: "inf-disponibilita", label: "Disponibilità" },
      { k: "inf-zone", label: "Zone coperte" },
      { k: "inf-recensioni", label: "Recensioni" },
    ],
  },
  {
    icona: "👤", titolo: "Pazienti", voci: [
      { k: "paz-anagrafica", label: "Anagrafica" },
      { k: "paz-storico", label: "Storico richieste" },
      { k: "paz-effettuate", label: "Prestazioni effettuate" },
      { k: "paz-note", label: "Note", todo: true },
      { k: "paz-documenti", label: "Documenti", todo: true },
      { k: "paz-consensi", label: "Consensi" },
    ],
  },
  {
    icona: "📅", titolo: "Prenotazioni", voci: [
      { k: "pre-calendario", label: "Calendario" },
      { k: "pre-nuova", label: "Nuova prenotazione" },
      { k: "pre-confermate", label: "Confermate" },
      { k: "pre-completate", label: "Completate" },
      { k: "pre-annullate", label: "Annullate" },
      { k: "pre-assegnazione", label: "Assegnazione infermiere", todo: true },
    ],
  },
  {
    icona: "💉", titolo: "Prestazioni", voci: [
      { k: "srv-catalogo", label: "Catalogo servizi" },
      { k: "srv-prezzi", label: "Prezzi e durata" },
      { k: "srv-materiale", label: "Materiale necessario", todo: true },
      { k: "srv-zone", label: "Zone disponibili" },
    ],
  },
  {
    icona: "📍", titolo: "Copertura territoriale", voci: [
      { k: "cop-mappa", label: "Regioni · Province · Comuni" },
      { k: "cop-distanze", label: "Distanze", todo: true },
      { k: "cop-trasferte", label: "Costi trasferta", todo: true },
    ],
  },
  {
    icona: "⭐", titolo: "Recensioni", voci: [
      { k: "rec-moderazione", label: "Moderazione", badge: "recensioni" },
      { k: "rec-interne", label: "Interne (pubblicate)" },
      { k: "rec-google", label: "Google" },
      { k: "rec-richieste", label: "Richieste recensione" },
    ],
  },
  {
    icona: "📝", titolo: "Blog", voci: [
      { k: "blog-articoli", label: "Articoli" },
      { k: "blog-categorie", label: "Categorie", todo: true },
      { k: "blog-tag", label: "Tag", todo: true },
      { k: "blog-seo", label: "SEO", todo: true },
      { k: "blog-commenti", label: "Commenti", todo: true },
    ],
  },
  { icona: "❓", titolo: "FAQ", voci: [{ k: "faq", label: "Domande e categorie", todo: true }] },
  { icona: "📂", titolo: "Documenti", voci: [{ k: "doc", label: "Contratti · Informative · Privacy", todo: true }] },
  {
    icona: "💬", titolo: "Contatti", voci: [
      { k: "con-richieste", label: "Richieste dal sito" },
      { k: "con-whatsapp", label: "WhatsApp", todo: true },
      { k: "con-email", label: "Email", todo: true },
      { k: "con-richiamata", label: "Richieste richiamata", todo: true },
    ],
  },
  {
    icona: "📈", titolo: "Marketing", voci: [
      { k: "mkt-landing", label: "Landing page", todo: true },
      { k: "mkt-banner", label: "Banner", todo: true },
      { k: "mkt-promo", label: "Codici promozionali", todo: true },
      { k: "mkt-campagne", label: "Campagne", todo: true },
      { k: "mkt-newsletter", label: "Newsletter", todo: true },
    ],
  },
  {
    icona: "📊", titolo: "Analytics", voci: [
      { k: "ana-traffico", label: "Traffico e conversioni" },
      { k: "ana-provenienza", label: "Provenienza utenti", todo: true },
      { k: "ana-whatsapp", label: "Click WhatsApp", todo: true },
    ],
  },
  {
    icona: "💰", titolo: "Fatturazione", voci: [
      { k: "fat", label: "Preventivi · Fatture · Pagamenti", todo: true, nota: "si accende con gli abbonamenti (Stripe + fatturazione elettronica): mai prima dei KPI di zona" },
    ],
  },
  {
    icona: "⚙️", titolo: "Impostazioni", voci: [
      { k: "imp-azienda", label: "Informazioni azienda", todo: true },
      { k: "imp-orari", label: "Orari e social", todo: true },
      { k: "imp-seo", label: "SEO", todo: true },
      { k: "imp-email", label: "Email" },
      { k: "imp-backup", label: "Backup" },
      { k: "imp-api", label: "API" },
      { k: "imp-sicurezza", label: "Sicurezza" },
    ],
  },
];

/* ============================ COMPONENTI DI SERVIZIO ============================ */

function InArrivo({ titolo, nota }) {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>{titolo}</h2>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        🔜 <strong>In arrivo.</strong> {nota || "Questa sezione è prevista dal piano ma si attiva quando servirà davvero: la struttura del menù è già quella definitiva."}
      </p>
    </div>
  );
}

function Caricamento() {
  return <p className="pf-note">Caricamento…</p>;
}

/* ============================ DASHBOARD ============================ */

function Dashboard({ vai }) {
  const [dati, setDati] = useState(null);
  useEffect(() => {
    fetch("/api/admin/statistiche").then((r) => r.json()).then(setDati);
  }, []);
  if (!dati?.kpi) return <Caricamento />;
  const k = dati.kpi;

  const kpis = [
    { n: k.richieste_oggi, label: "Richieste oggi" },
    { n: k.prenotate_future, label: "Prestazioni prenotate" },
    { n: k.richieste_7gg, label: "Richieste (7 giorni)" },
    { n: k.completate_totali, label: "Completate totali" },
    { n: k.professionisti_attivi, label: "Infermieri attivi" },
    { n: k.professionisti_nuovi_30gg, label: "Nuovi iscritti (30gg)" },
    { n: k.pazienti_unici, label: "Pazienti unici" },
    { n: `${k.recensioni_pubblicate}${k.media_recensioni ? ` · ${String(k.media_recensioni).replace(".", ",")}★` : ""}`, label: "Recensioni" },
    { n: k.articoli_online, label: "Articoli online" },
    { n: "—", label: "Fatturato (fase abbonamenti)" },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>📊 Dashboard</h2>

      {dati.task.length > 0 && (
        <div className="pf-panel" style={{ marginBottom: 14, borderLeft: "4px solid var(--iw-star)" }}>
          <strong>📌 Task in sospeso</strong>
          {dati.task.map((t) => (
            <p key={t.sezione} style={{ margin: "6px 0 0" }}>
              → <a href="#" onClick={(e) => { e.preventDefault(); vai(t.sezione); }}>{t.testo}</a>
            </p>
          ))}
        </div>
      )}

      <div className="adm-kpi-grid">
        {kpis.map((x) => (
          <div className="adm-kpi" key={x.label}>
            <div className="n">{x.n}</div>
            <div className="l">{x.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ color: "var(--iw-navy)", margin: "22px 0 10px" }}>Ultime prenotazioni</h3>
      {dati.ultime.length === 0 && <p className="pf-note">Ancora nessuna prenotazione.</p>}
      {dati.ultime.map((b) => (
        <div className="pf-panel adm-riga" key={b.id}>
          <strong>{dataOra(b.start_dt)}</strong>
          <span style={{ flex: 1 }}>{b.customer_name} · {b.service_name} <span className="pf-note">con {b.professional_name}</span></span>
          <span className={`stato ${b.status}`}>{STATI[b.status]}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================ INFERMIERI ============================ */

function Professionisti({ filtroStato }) {
  const [lista, setLista] = useState(null);
  const carica = useCallback(() => {
    fetch("/api/admin/professionisti").then((r) => r.json()).then((d) => setLista(d.professionisti || []));
  }, []);
  useEffect(carica, [carica]);

  const cambiaStato = async (p, status) => {
    const verbo = status === "suspended" ? "Sospendo" : "Riattivo";
    if (!window.confirm(`${verbo} ${p.name}?${status === "suspended" ? " La scheda sparirà dalla ricerca." : ""}`)) return;
    await fetch("/api/admin/professionisti", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, status }),
    });
    carica();
  };

  if (!lista) return <Caricamento />;
  const visibili = filtroStato ? lista.filter((p) => p.status === filtroStato) : lista;
  const badgeStato = { active: ["done", "Attivo"], pending: ["noshow", "In attesa"], suspended: ["cancelled", "Sospeso"] };

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>👨‍⚕️ {filtroStato ? "Stato approvazione" : "Elenco infermieri"} ({visibili.length})</h2>
      {visibili.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessun professionista{filtroStato ? " in questo stato" : ""}.</p></div>}
      {visibili.map((p) => (
        <div className="pf-panel" key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {p.photo_url && <img src={p.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />}
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong style={{ fontSize: 19, color: "var(--iw-navy)" }}>{p.name}</strong>
              <div className="pf-note" style={{ margin: 0 }}>
                {p.profession} · {p.city} ({p.province}) · <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">scheda</a>
              </div>
            </div>
            <span className={`stato ${badgeStato[p.status][0]}`}>{badgeStato[p.status][1]}</span>
          </div>
          <div className="pf-note" style={{ margin: "8px 0" }}>
            🪪 {p.albo_name} n. {p.albo_number} (dal {p.albo_date || "—"}) · P.IVA {p.vat_number || "—"} · 📞 {p.phone}
            {!p.lat && <> · ⚠️ senza segnaposto mappa</>}
          </div>
          <div className="pf-note" style={{ margin: "0 0 10px" }}>
            💉 {p.servizi} prestazioni · 📅 {p.prenotazioni_totali} prenotazioni ({p.prenotazioni_30gg} negli ultimi 30gg)
            {Number(p.recensioni) > 0 && <> · ⭐ {String(p.rating).replace(".", ",")} ({p.recensioni})</>}
            {p.zone?.length > 0 && <> · 📍 {p.zone.join(", ")}</>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.status !== "suspended"
              ? <button className="pf-btn pericolo compatto" onClick={() => cambiaStato(p, "suspended")}>Sospendi</button>
              : <button className="pf-btn compatto" onClick={() => cambiaStato(p, "active")}>Riattiva</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ CANDIDATURE (verifica documenti) ============================ */

function Candidature({ aggiornaBadge }) {
  const [candidature, setCandidature] = useState(null);
  const [verifiche, setVerifiche] = useState({}); // { [id]: { piva: bool, albo: bool } }
  const [esiti, setEsiti] = useState({});

  const carica = useCallback(() => {
    fetch("/api/admin/candidature").then((r) => r.json()).then((d) => {
      setCandidature(d.candidature || []);
      aggiornaBadge?.("candidature", (d.candidature || []).length);
    });
  }, [aggiornaBadge]);
  useEffect(carica, [carica]);

  const gestisci = async (id, action) => {
    if (action === "reject" && !window.confirm("Rifiuto questa candidatura? Il candidato riceverà una email.")) return;
    const v = verifiche[id] || {};
    if (action === "approve" && (!v.piva || !v.albo)) {
      alert("Prima di approvare devi confermare di aver verificato SIA la partita IVA (Agenzia delle Entrate) SIA l'iscrizione all'albo (FNOPI). Spunta entrambe le caselle.");
      return;
    }
    const r = await fetch("/api/admin/candidature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, verificaPiva: !!(verifiche[id]||{}).piva, verificaAlbo: !!(verifiche[id]||{}).albo }),
    });
    const d = await r.json();
    if (!r.ok) return alert(d.error);
    if (action === "approve") setEsiti((e) => ({ ...e, [id]: d }));
    carica();
  };

  if (!candidature) return <Caricamento />;

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🪪 Verifica documenti — candidature in attesa ({candidature.length})</h2>
      {candidature.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna candidatura da esaminare. 🎉</p></div>}
      {candidature.map((c) => (
        <div className="pf-panel" key={c.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <strong style={{ fontSize: 20, color: "var(--iw-navy)" }}>{c.name}</strong>
            <span className="pf-note">{dataIt(c.created_at)}</span>
          </div>
          <p style={{ margin: "6px 0", fontSize: 17, color: "var(--iw-slate)" }}>
            {c.profession} · {c.albo_name} n. {c.albo_number} (dal {c.albo_date}) · P.IVA {c.vat_number}<br />
            📍 {c.address ? `${c.address}, ` : ""}{c.city} ({c.province}) · 📞 <a href={`tel:${c.phone}`}>{c.phone}</a> · ✉️ {c.email}
          </p>
          {c.message && <p style={{ fontSize: 17, background: "var(--iw-bg)", borderRadius: 10, padding: "8px 12px" }}>{c.message}</p>}

          <div style={{ background: "#fff8e6", border: "1px solid #f4dfa5", borderRadius: 12, padding: "14px 16px", margin: "12px 0" }}>
            <strong style={{ color: "#0b3954" }}>🔒 Verifica obbligatoria prima di attivare</strong>
            <p className="pf-note" style={{ margin: "4px 0 10px" }}>
              Controlla i dati sui portali ufficiali (si aprono in una nuova scheda), poi spunta le due caselle.
              Restano registrati chi verifica e quando.
            </p>
            <p style={{ margin: "6px 0" }}>
              <a className="pf-btn secondario" href="https://telemanagrafici.agenziaentrate.gov.it/VerificaPIVA/Scegli.do" target="_blank" rel="noreferrer">Verifica P.IVA {c.vat_number || "(assente)"} ↗</a>{" "}
              <a className="pf-btn secondario" href="https://www.fnopi.it/gli-ordini-provinciali/ricerca-albo/" target="_blank" rel="noreferrer">Verifica albo: {c.name} — n. {c.albo_number} ↗</a>
            </p>
            <label style={{ display: "block", margin: "8px 0" }}>
              <input type="checkbox" checked={!!(verifiche[c.id]||{}).piva} onChange={(e) => setVerifiche((v) => ({ ...v, [c.id]: { ...(v[c.id]||{}), piva: e.target.checked } }))} />{" "}
              Ho verificato la <strong>partita IVA {c.vat_number}</strong> su Agenzia delle Entrate {c.vat_number ? "(risulta attiva)" : "— ATTENZIONE: candidatura senza P.IVA (solo vetrina strutture)"}
            </label>
            <label style={{ display: "block", margin: "8px 0" }}>
              <input type="checkbox" checked={!!(verifiche[c.id]||{}).albo} onChange={(e) => setVerifiche((v) => ({ ...v, [c.id]: { ...(v[c.id]||{}), albo: e.target.checked } }))} />{" "}
              Ho verificato l'<strong>iscrizione all'albo</strong> ({c.albo_name} n. {c.albo_number}) su FNOPI e corrisponde al nominativo
            </label>
          </div>
          {esiti[c.id] ? (
            <div className="pf-successo">
              <strong>Approvato ✅ Scheda: /p/{esiti[c.id].slug}</strong>
              {esiti[c.id].emailed
                ? <p style={{ margin: "6px 0 0" }}>Email di benvenuto inviata con le credenziali.</p>
                : <p style={{ margin: "6px 0 0" }}>⚠️ Email NON partita — comunica tu le credenziali: <code>{esiti[c.id].credenziali.email}</code> / <code>{esiti[c.id].credenziali.password}</code></p>}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pf-btn" disabled={!((verifiche[c.id]||{}).piva && (verifiche[c.id]||{}).albo)} onClick={() => gestisci(c.id, "approve")}>✅ Approva e attiva</button>
              <button className="pf-btn pericolo" onClick={() => gestisci(c.id, "reject")}>Rifiuta</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================ PAZIENTI ============================ */

function Pazienti() {
  const [pazienti, setPazienti] = useState(null);
  const [cerca, setCerca] = useState("");
  useEffect(() => {
    fetch("/api/admin/pazienti").then((r) => r.json()).then((d) => setPazienti(d.pazienti || []));
  }, []);
  if (!pazienti) return <Caricamento />;
  const visibili = pazienti.filter((p) =>
    !cerca || [p.nome, p.telefono, p.email, p.citta].join(" ").toLowerCase().includes(cerca.toLowerCase())
  );
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>👤 Anagrafica pazienti ({pazienti.length})</h2>
      <p className="pf-note">Ricavata dalle prenotazioni (il telefono è la chiave): per scelta i pazienti non hanno account né archiviamo dati clinici.</p>
      <div className="pf-searchbar" style={{ maxWidth: 420, marginBottom: 14 }}>
        <input placeholder="Cerca per nome, telefono, città…" value={cerca} onChange={(e) => setCerca(e.target.value)} />
      </div>
      {visibili.map((p) => (
        <div className="pf-panel adm-riga" key={p.telefono}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <strong style={{ color: "var(--iw-navy)" }}>{p.nome}</strong>
            <div className="pf-note" style={{ margin: 0 }}>
              📞 <a href={`tel:${p.telefono}`}>{p.telefono}</a>{p.email ? <> · ✉️ {p.email}</> : null}{p.citta ? <> · 📍 {p.citta}</> : null}
            </div>
          </div>
          <span className="pf-note">{p.prenotazioni} prenotazioni · {p.completate} fatte{Number(p.noshow) > 0 ? ` · ⚠️ ${p.noshow} no-show` : ""}</span>
          <span className="pf-note">ultima: {new Date(p.ultima).toLocaleDateString("it-IT")}</span>
        </div>
      ))}
    </div>
  );
}

function Consensi() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>🔏 Consensi</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Ogni prenotazione e candidatura viene registrata SOLO previo consenso esplicito (checkbox obbligatoria).
        Il consenso è legato al momento dell'invio del modulo. Non raccogliamo dati clinici per scelta di progetto.
      </p>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        📄 Le informative complete (pazienti, professionisti, registro trattamenti) arrivano con il pacchetto legale
        dell'avvocato — voce già nel piano: <em>Manuale Anti-Fallimento, rischio R07</em>.
      </p>
    </div>
  );
}

/* ============================ PRENOTAZIONI ============================ */

function Prenotazioni({ stato, titolo, futureSolo }) {
  const [lista, setLista] = useState(null);
  useEffect(() => {
    fetch(`/api/admin/prenotazioni?stato=${stato || "tutte"}`)
      .then((r) => r.json()).then((d) => setLista(d.prenotazioni || []));
  }, [stato]);
  if (!lista) return <Caricamento />;

  let visibili = lista;
  if (futureSolo) visibili = lista.filter((b) => new Date(b.start_dt) > new Date()).sort((a, b) => new Date(a.start_dt) - new Date(b.start_dt));

  const perGiorno = futureSolo
    ? visibili.reduce((acc, b) => {
        const g = new Date(b.start_dt).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" });
        (acc[g] = acc[g] || []).push(b);
        return acc;
      }, {})
    : null;

  const Riga = ({ b }) => (
    <div className="pf-panel adm-riga" key={b.id}>
      <strong style={{ minWidth: 110 }}>{dataOra(b.start_dt)}</strong>
      <div style={{ flex: 1, minWidth: 220 }}>
        {b.customer_name} · <a href={`tel:${b.customer_phone}`}>{b.customer_phone}</a>
        <div className="pf-note" style={{ margin: 0 }}>
          {b.service_name} ({euro(b.price_cents)}) con {b.professional_name}
          {b.address ? ` · ${b.address}${b.city ? ", " + b.city : ""}` : ""} · {b.source === "manual" ? "telefonica" : "online"}
        </div>
      </div>
      <span className={`stato ${b.status}`}>{STATI[b.status]}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>📅 {titolo} ({visibili.length})</h2>
      {visibili.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Niente da mostrare qui.</p></div>}
      {perGiorno
        ? Object.entries(perGiorno).map(([g, rows]) => (
            <div key={g}>
              <h3 style={{ color: "var(--iw-navy)", margin: "16px 0 8px", textTransform: "capitalize" }}>{g}</h3>
              {rows.map((b) => <Riga b={b} key={b.id} />)}
            </div>
          ))
        : visibili.map((b) => <Riga b={b} key={b.id} />)}
    </div>
  );
}

function NuovaPrenotazione() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>➕ Nuova prenotazione</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Le prenotazioni manuali (prese al telefono) si inseriscono <strong>dal pannello del professionista</strong>,
        così finiscono nella SUA agenda e la disponibilità online resta vera:
      </p>
      <a className="pf-btn" href="/area-professionisti" target="_blank" rel="noreferrer">Apri l'Area professionisti</a>
      <p className="pf-note" style={{ marginTop: 10 }}>
        (In futuro, con più infermieri, qui arriverà l'inserimento centralizzato con scelta del professionista.)
      </p>
    </div>
  );
}

/* ============================ PRESTAZIONI ============================ */

function Servizi() {
  const [servizi, setServizi] = useState(null);
  useEffect(() => {
    fetch("/api/admin/servizi").then((r) => r.json()).then((d) => setServizi(d.servizi || []));
  }, []);
  if (!servizi) return <Caricamento />;

  const perProfessionista = servizi.reduce((acc, s) => {
    (acc[s.professional_name] = acc[s.professional_name] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>💉 Catalogo prestazioni ({servizi.length})</h2>
      <p className="pf-note">Ogni professionista gestisce le sue prestazioni e i suoi prezzi dal proprio pannello (autonomia = zero colli di bottiglia).</p>
      {Object.entries(perProfessionista).map(([nome, rows]) => (
        <div className="pf-panel" key={nome} style={{ marginBottom: 14 }}>
          <strong style={{ color: "var(--iw-navy)", fontSize: 18 }}>{nome} <span className="pf-note">· {rows[0].city}</span></strong>
          {rows.map((s) => (
            <div key={s.id} className="pf-servizio-row">
              <div>
                <span className="nome">{s.name}</span> {!s.active && <span className="stato cancelled">disattivata</span>}
                <div className="durata">{s.duration_min} min · {s.prenotazioni} prenotazioni ricevute</div>
              </div>
              <div className="prezzo">da {euro(s.price_cents)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================ COPERTURA ============================ */

function Copertura() {
  const [professionisti, setProfessionisti] = useState(null);
  useEffect(() => {
    fetch("/api/admin/professionisti").then((r) => r.json()).then((d) => setProfessionisti(d.professionisti || []));
  }, []);
  if (!professionisti) return <Caricamento />;

  const attivi = professionisti.filter((p) => p.status === "active");
  const zone = {};
  for (const p of attivi) {
    for (const z of (p.zone?.length ? p.zone : [p.city])) {
      zone[z] = zone[z] || [];
      zone[z].push(p.name);
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>📍 Copertura territoriale</h2>
      <p className="pf-note">
        Strategia macchia d'olio (Manuale, R03): una zona è "aperta" con almeno 2 professionisti.
        Le richieste dalla lista d'attesa (sezione Contatti) dicono DOVE aprire dopo.
      </p>
      <div className="adm-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="adm-kpi"><div className="n">{new Set(attivi.map((p) => p.province)).size}</div><div className="l">Province</div></div>
        <div className="adm-kpi"><div className="n">{Object.keys(zone).length}</div><div className="l">Comuni coperti</div></div>
        <div className="adm-kpi"><div className="n">{attivi.length}</div><div className="l">Professionisti attivi</div></div>
      </div>
      {Object.entries(zone).sort((a, b) => b[1].length - a[1].length).map(([citta, professionistiZona]) => (
        <div className="pf-panel adm-riga" key={citta}>
          <strong style={{ minWidth: 140, color: "var(--iw-navy)" }}>📍 {citta}</strong>
          <span style={{ flex: 1 }} className="pf-note">{professionistiZona.join(", ")}</span>
          <span className={`stato ${professionistiZona.length >= 2 ? "done" : "noshow"}`}>
            {professionistiZona.length >= 2 ? "Aperta" : "In costruzione"}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================ RECENSIONI ============================ */

function RecensioniModerazione({ aggiornaBadge }) {
  const [recensioni, setRecensioni] = useState(null);
  const carica = useCallback(() => {
    fetch("/api/admin/recensioni").then((r) => r.json()).then((d) => {
      setRecensioni(d.recensioni || []);
      aggiornaBadge?.("recensioni", (d.recensioni || []).length);
    });
  }, [aggiornaBadge]);
  useEffect(carica, [carica]);

  const modera = async (id, action) => {
    await fetch("/api/admin/recensioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, verificaPiva: !!(verifiche[id]||{}).piva, verificaAlbo: !!(verifiche[id]||{}).albo }),
    });
    carica();
  };

  if (!recensioni) return <Caricamento />;
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>⭐ Recensioni da moderare ({recensioni.length})</h2>
      {recensioni.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna recensione in attesa.</p></div>}
      {recensioni.map((r) => (
        <div className="pf-panel" key={r.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span className="pf-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span className="n">per {r.professional_name}</span></span>
            <span className="pf-note">{dataIt(r.created_at)}</span>
          </div>
          {r.text && <p style={{ margin: "8px 0", fontSize: 18 }}>{r.text}</p>}
          <p className="pf-note" style={{ margin: "0 0 10px" }}>— {r.author_name || "Anonimo"}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pf-btn" onClick={() => modera(r.id, "publish")}>Pubblica</button>
            <button className="pf-btn pericolo" onClick={() => modera(r.id, "reject")}>Rifiuta</button>
          </div>
        </div>
      ))}
      <p className="pf-note">
        Regola (dal Manuale, R06): mai cancellazioni silenziose — se rifiuti una recensione autentica, avvisa il paziente del motivo.
      </p>
    </div>
  );
}

function RecensioniPubblicate() {
  const [recensioni, setRecensioni] = useState(null);
  useEffect(() => {
    fetch("/api/admin/recensioni?stato=published").then((r) => r.json()).then((d) => setRecensioni(d.recensioni || []));
  }, []);
  if (!recensioni) return <Caricamento />;
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>⭐ Recensioni pubblicate ({recensioni.length})</h2>
      {recensioni.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Ancora nessuna recensione pubblicata: arriveranno con le prime prestazioni completate.</p></div>}
      {recensioni.map((r) => (
        <div className="pf-panel adm-riga" key={r.id}>
          <span className="pf-stars" style={{ minWidth: 110 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
          <span style={{ flex: 1 }}>{r.text || <em className="pf-note">solo stelle</em>} <span className="pf-note">— {r.author_name || "Anonimo"} per {r.professional_name}</span></span>
          <span className="pf-note">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
        </div>
      ))}
    </div>
  );
}

function RecensioniGoogle() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>⭐ Recensioni Google</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Le recensioni Google restano su Google (importarle è vietato dai loro termini) ma le VALORIZZIAMO:
        ogni professionista può mostrare il badge del proprio profilo Google nella scheda — per Eduard è già attivo
        («5,0 su Google · 50 recensioni»).
      </p>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        Il nostro vantaggio è l'altra metà del campo: <strong>le recensioni interne sono verificate</strong> (solo da
        prenotazione completata) — cosa che Google non può garantire. Le due cose insieme = massima fiducia.
      </p>
    </div>
  );
}

function RecensioniRichieste() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>💌 Richieste di recensione</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Sono <strong>automatiche</strong>: quando il professionista segna una prestazione come «Fatta»,
        il paziente riceve l'email con il link personale per recensire (valido una sola volta, anti-fake).
      </p>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        Non serve fare nulla qui: le recensioni in arrivo compaiono in <strong>Moderazione</strong>.
      </p>
    </div>
  );
}

/* ============================ CONTATTI ============================ */

function Contatti() {
  const [dati, setDati] = useState(null);
  useEffect(() => {
    fetch("/api/admin/contatti").then((r) => r.json()).then(setDati);
  }, []);
  if (!dati) return <Caricamento />;
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>💬 Richieste dal sito — lista d'attesa zone scoperte ({dati.listaAttesa.length})</h2>
      <p className="pf-note">Chi cerca in una zona senza professionisti lascia l'email: è la mappa di DOVE aprire dopo.</p>
      {dati.perZona?.length > 0 && (
        <div className="adm-kpi-grid" style={{ marginBottom: 14 }}>
          {dati.perZona.slice(0, 6).map((z) => (
            <div className="adm-kpi" key={z.zona}><div className="n">{z.n}</div><div className="l">📍 {z.zona || "zona non indicata"}</div></div>
          ))}
        </div>
      )}
      {dati.listaAttesa.map((r) => (
        <div className="pf-panel adm-riga" key={r.id}>
          <strong style={{ minWidth: 140 }}>📍 {r.zona || "—"}</strong>
          <span style={{ flex: 1 }}>{r.email}</span>
          <span className="pf-note">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
        </div>
      ))}
      {dati.listaAttesa.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna richiesta per ora.</p></div>}
    </div>
  );
}

/* ============================ ANALYTICS ============================ */

function Analytics() {
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>📈 Traffico e conversioni</h2>
      <div className="pf-panel" style={{ marginBottom: 12 }}>
        <strong>Google Analytics 4</strong>
        <p style={{ color: "var(--iw-slate)", margin: "6px 0 10px" }}>
          Il sito traccia già visite e <strong>prenotazioni completate</strong> (evento <code>prenotazione_completata</code>,
          con prestazione e valore). Lì trovi traffico, provenienza e conversioni.
        </p>
        <a className="pf-btn secondario" href="https://analytics.google.com" target="_blank" rel="noreferrer">Apri Google Analytics</a>
      </div>
      <div className="pf-panel">
        <strong>I numeri interni</strong>
        <p style={{ color: "var(--iw-slate)", margin: "6px 0 0" }}>
          Prenotazioni, pazienti e visite alle schede sono nella <strong>Dashboard</strong> (dati dal database, sempre veri).
          Le visite scheda per professionista sono nel pannello di ciascun professionista.
        </p>
      </div>
    </div>
  );
}

/* ============================ IMPOSTAZIONI ============================ */

function ImpostazioniEmail() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>✉️ Email</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Mittente: <strong>prenotazioni@infermieriweb.it</strong> (dominio autenticato DKIM+DMARC il 14/7/26 — le email
        arrivano in inbox). Motore: Brevo, piano gratuito 300 email/giorno.
      </p>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        Email attive: conferma prenotazione + link disdetta · notifica al professionista · disdette (entrambe le direzioni)
        · promemoria 24h prima · benvenuto professionista con credenziali · richiesta recensione · backup notturno del database.
      </p>
    </div>
  );
}

function ImpostazioniBackup() {
  const [stato, setStato] = useState(null);
  const esegui = async () => {
    setStato("in corso…");
    const r = await fetch("/api/admin/backup", { method: "POST" });
    const d = await r.json();
    setStato(r.ok ? `✅ Backup spedito via email (${d.dimensioneKB} KB)` : `Errore: ${d.error || "invio non riuscito"}`);
  };
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>🗄️ Backup</h2>
      <p style={{ color: "var(--iw-slate)" }}>
        Ogni notte alle 03:00 il database viene spedito via email come copia di sicurezza (allegato di testo).
        Puoi anche farne uno adesso:
      </p>
      <button className="pf-btn secondario" onClick={esegui} disabled={stato === "in corso…"}>Backup adesso</button>
      {stato && <p className="pf-note" style={{ marginTop: 8 }}>{stato}</p>}
    </div>
  );
}

function ImpostazioniApi() {
  return (
    <div className="pf-panel">
      <h2 style={{ marginTop: 0 }}>🔌 API e integrazioni</h2>
      <p style={{ color: "var(--iw-slate)", margin: 0 }}>
        Servizi collegati: <strong>Netlify</strong> (hosting+funzioni+database, 9$/mese) · <strong>Neon</strong> (Postgres)
        · <strong>Brevo</strong> (email) · <strong>GitHub</strong> (codice) · <strong>OpenStreetMap/Leaflet</strong> (mappe).
        Chiavi e credenziali: nel registro riservato dei soci (mai qui). Principio di portabilità: nessun servizio è
        insostituibile, tutto è standard.
      </p>
    </div>
  );
}

/* ============================ SICUREZZA (password + 2FA) ============================ */

function Sicurezza() {
  // cambio password
  const [pw, setPw] = useState({ attuale: "", nuova: "", conferma: "" });
  const [pwStato, setPwStato] = useState(null);
  // 2FA
  const [tfa, setTfa] = useState(null); // {enabled}
  const [setup, setSetup] = useState(null); // {qr, secret}
  const [codice, setCodice] = useState("");
  const [disattiva, setDisattiva] = useState({ password: "", code: "" });
  const [tfaMsg, setTfaMsg] = useState(null);

  const caricaTfa = useCallback(() => {
    fetch("/api/panel/2fa").then((r) => r.json()).then(setTfa);
  }, []);
  useEffect(caricaTfa, [caricaTfa]);

  const cambiaPassword = async (e) => {
    e.preventDefault();
    setPwStato(null);
    if (pw.nuova !== pw.conferma) return setPwStato({ err: "La conferma non coincide con la nuova password" });
    const r = await fetch("/api/panel/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attuale: pw.attuale, nuova: pw.nuova }),
    });
    const d = await r.json();
    if (!r.ok) return setPwStato({ err: d.error });
    setPw({ attuale: "", nuova: "", conferma: "" });
    setPwStato({ ok: "Password aggiornata ✅ Dal prossimo accesso vale quella nuova." });
  };

  const avviaSetup = async () => {
    setTfaMsg(null);
    const r = await fetch("/api/panel/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup" }),
    });
    const d = await r.json();
    if (r.ok) setSetup(d);
  };

  const attivaTfa = async (e) => {
    e.preventDefault();
    const r = await fetch("/api/panel/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable", code: codice }),
    });
    const d = await r.json();
    if (!r.ok) return setTfaMsg({ err: d.error });
    setSetup(null);
    setCodice("");
    setTfaMsg({ ok: "Due fattori ATTIVI ✅ Da ora al login serve anche il codice dell'app." });
    caricaTfa();
  };

  const spegniTfa = async (e) => {
    e.preventDefault();
    if (!window.confirm("Disattivo la verifica in due passaggi? L'account resterà protetto dalla sola password.")) return;
    const r = await fetch("/api/panel/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", password: disattiva.password, code: disattiva.code }),
    });
    const d = await r.json();
    if (!r.ok) return setTfaMsg({ err: d.error });
    setDisattiva({ password: "", code: "" });
    setTfaMsg({ ok: "Due fattori disattivati." });
    caricaTfa();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🔐 Sicurezza</h2>

      <div className="pf-panel" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, color: "var(--iw-navy)" }}>Cambia password</h3>
        <form className="pf-book" onSubmit={cambiaPassword}>
          <label>Password attuale</label>
          <input type="password" required value={pw.attuale} onChange={(e) => setPw({ ...pw, attuale: e.target.value })} autoComplete="current-password" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Nuova password <span style={{ fontWeight: 400 }}>(min 10 caratteri)</span></label>
              <input type="password" required minLength={10} value={pw.nuova} onChange={(e) => setPw({ ...pw, nuova: e.target.value })} autoComplete="new-password" />
            </div>
            <div>
              <label>Conferma nuova</label>
              <input type="password" required value={pw.conferma} onChange={(e) => setPw({ ...pw, conferma: e.target.value })} autoComplete="new-password" />
            </div>
          </div>
          {pwStato?.err && <div className="pf-errore">{pwStato.err}</div>}
          {pwStato?.ok && <div className="pf-successo">{pwStato.ok}</div>}
          <button className="pf-btn">Aggiorna password</button>
        </form>
      </div>

      <div className="pf-panel">
        <h3 style={{ marginTop: 0, color: "var(--iw-navy)" }}>
          Verifica in due passaggi (2FA) {tfa?.enabled ? <span className="stato done">ATTIVA</span> : <span className="stato noshow">spenta</span>}
        </h3>
        {tfaMsg?.err && <div className="pf-errore">{tfaMsg.err}</div>}
        {tfaMsg?.ok && <div className="pf-successo">{tfaMsg.ok}</div>}

        {tfa && !tfa.enabled && !setup && (
          <div>
            <p style={{ color: "var(--iw-slate)" }}>
              Oltre alla password, al login verrà chiesto un codice a 6 cifre generato dal tuo telefono
              (app gratuite: <strong>Google Authenticator</strong>, Microsoft Authenticator, o le password di iPhone).
              È la protezione più efficace contro i furti di password.
            </p>
            <button className="pf-btn" onClick={avviaSetup}>Attiva la verifica in due passaggi</button>
          </div>
        )}

        {setup && (
          <form className="pf-book" onSubmit={attivaTfa}>
            <p style={{ color: "var(--iw-slate)" }}>
              1) Apri l'app di autenticazione → «Aggiungi account» → <strong>inquadra questo QR</strong>:
            </p>
            <img src={setup.qr} alt="QR code per l'app di autenticazione" width="220" height="220" style={{ borderRadius: 12, border: "1px solid var(--iw-line)" }} />
            <p className="pf-note">Non riesci a inquadrarlo? Inserisci manualmente questo codice: <code style={{ userSelect: "all" }}>{setup.secret}</code></p>
            <label>2) Scrivi il codice a 6 cifre che vedi nell'app</label>
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={codice} onChange={(e) => setCodice(e.target.value.replace(/\D/g, ""))} placeholder="123456" style={{ maxWidth: 160, letterSpacing: 4, fontSize: 22 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pf-btn">Conferma e attiva</button>
              <button className="pf-btn secondario" type="button" onClick={() => setSetup(null)}>Annulla</button>
            </div>
          </form>
        )}

        {tfa?.enabled && (
          <form className="pf-book" onSubmit={spegniTfa}>
            <p style={{ color: "var(--iw-slate)" }}>La verifica in due passaggi è attiva su questo account. Per disattivarla servono password E codice:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Password</label>
                <input type="password" required value={disattiva.password} onChange={(e) => setDisattiva({ ...disattiva, password: e.target.value })} />
              </div>
              <div>
                <label>Codice dall'app</label>
                <input inputMode="numeric" maxLength={6} required value={disattiva.code} onChange={(e) => setDisattiva({ ...disattiva, code: e.target.value.replace(/\D/g, "") })} />
              </div>
            </div>
            <button className="pf-btn pericolo">Disattiva 2FA</button>
          </form>
        )}
        <p className="pf-note" style={{ marginTop: 10 }}>
          Vale per l'account con cui sei collegato ora. Ogni admin/professionista attiva la sua dalla stessa pagina
          (per i professionisti: pannello → Sicurezza, in arrivo col prossimo aggiornamento del pannello).
        </p>
      </div>
    </div>
  );
}

/* ============================ BLOG (esistente) ============================ */

function BlogAdmin() {
  const [articoli, setArticoli] = useState(null);
  const [editor, setEditor] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [messaggio, setMessaggio] = useState(null);

  const carica = useCallback(() => {
    fetch("/api/admin/blog").then((r) => r.json()).then((d) => setArticoli(d.articoli || []));
  }, []);
  useEffect(carica, [carica]);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 5000);
  };

  const nuovo = () => setEditor({ title: "", category: "Salute", excerpt: "", image: "", body_raw: "", cover_data: "" });

  // Copertina: ridimensionata nel browser (max 1200px, JPEG) e inviata come data URI
  const caricaCopertina = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const maxW = 1200;
      const scala = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scala);
      const h = Math.round(img.height * scala);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const data = canvas.toDataURL("image/jpeg", 0.82);
      setEditor((ed) => ({ ...ed, cover_data: data, image: "", remove_cover: false }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };
  const rimuoviCopertina = () => setEditor((ed) => ({ ...ed, cover_data: "", image: "", remove_cover: true }));

  const salva = async (publish) => {
    setSalvo(true);
    const metodo = editor.id ? "PATCH" : "POST";
    const r = await fetch("/api/admin/blog", {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editor, publish }),
    });
    const d = await r.json();
    setSalvo(false);
    if (!r.ok) return avvisa("err", d.error);
    setEditor(null);
    avvisa("ok", publish ? "Articolo pubblicato ✅ È già online." : "Bozza salvata ✅");
    carica();
  };

  const cambiaStato = async (art) => {
    const publish = art.status !== "published";
    const r = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: art.id, [publish ? "publish" : "unpublish"]: true }),
    });
    if (r.ok) { avvisa("ok", publish ? "Pubblicato ✅" : "Riportato in bozza."); carica(); }
  };

  const elimina = async (art) => {
    if (!window.confirm(`Elimino definitivamente "${art.title}"?`)) return;
    await fetch(`/api/admin/blog?id=${art.id}`, { method: "DELETE" });
    carica();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h2 style={{ color: "var(--iw-navy)", margin: 0 }}>📝 Articoli del blog</h2>
        {!editor && <button className="pf-btn" onClick={nuovo}>+ Nuovo articolo</button>}
      </div>

      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {editor && (
        <div className="pf-panel pf-book" style={{ marginBottom: 18 }}>
          <h2>{editor.id ? "Modifica articolo" : "Nuovo articolo"}</h2>
          <label>Titolo *</label>
          <input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} placeholder="es. Come prepararsi a un prelievo a domicilio" />
          <label>Categoria</label>
          <input value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} placeholder="es. Prelievi" />

          <label>Immagine di copertina <span style={{ fontWeight: 400 }}>(compare in cima all'articolo e nell'elenco · facoltativa)</span></label>
          {(editor.cover_data || editor.image) && (
            <div style={{ marginBottom: 8 }}>
              <img
                src={editor.cover_data || editor.image}
                alt="Anteprima copertina"
                style={{ width: "100%", maxWidth: 360, aspectRatio: "5 / 3", objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }}
              />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
            <label className="pf-btn secondario compatto" style={{ cursor: "pointer", margin: 0 }}>
              {editor.cover_data || editor.image ? "Cambia immagine" : "Carica immagine"}
              <input type="file" accept="image/*" onChange={caricaCopertina} style={{ display: "none" }} />
            </label>
            {(editor.cover_data || editor.image) && (
              <button type="button" className="pf-btn pericolo compatto" onClick={rimuoviCopertina}>Rimuovi</button>
            )}
            <span className="pf-note" style={{ margin: 0 }}>Si ridimensiona da sola. Se la lasci vuota, viene usata una copertina grafica automatica.</span>
          </div>
          <label>Sommario * <span style={{ fontWeight: 400 }}>(1-2 frasi: compare in elenco e su Google)</span></label>
          <textarea rows={2} maxLength={300} value={editor.excerpt} onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })} />
          <label>Testo * <span style={{ fontWeight: 400 }}>(riga con «## Titolo» = nuova sezione · riga vuota = nuovo paragrafo · «- » = elenco)</span></label>
          <textarea rows={16} value={editor.body_raw} onChange={(e) => setEditor({ ...editor, body_raw: e.target.value })} style={{ fontFamily: "inherit" }} placeholder={"## Introduzione\n\nPrimo paragrafo...\n\n## Quando serve\n\n- primo punto\n- secondo punto"} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pf-btn" disabled={salvo} onClick={() => salva(true)}>{salvo ? "Salvo…" : "Pubblica"}</button>
            <button className="pf-btn secondario" disabled={salvo} onClick={() => salva(false)}>Salva bozza</button>
            <button className="pf-btn pericolo" type="button" onClick={() => setEditor(null)}>Annulla</button>
          </div>
        </div>
      )}

      {!articoli && <Caricamento />}
      {articoli && articoli.map((art) => (
        <div className="pf-panel" key={art.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ color: "var(--iw-navy)" }}>{art.title}</strong>
            <div className="pf-note" style={{ margin: 0 }}>
              {art.category} · {art.status === "published" ? `pubblicato il ${new Date(art.published_at).toLocaleDateString("it-IT")}` : "BOZZA"}
              {art.status === "published" && <> · <a href={`/articoli/${art.slug}`} target="_blank" rel="noreferrer">vedi</a></>}
            </div>
          </div>
          <span className={`stato ${art.status === "published" ? "done" : "noshow"}`}>{art.status === "published" ? "Online" : "Bozza"}</span>
          <span style={{ display: "flex", gap: 6 }}>
            <button className="pf-btn secondario compatto" onClick={() => setEditor({ id: art.id, title: art.title, category: art.category, excerpt: art.excerpt, image: art.image, body_raw: art.body_raw })}>Modifica</button>
            <button className="pf-btn secondario compatto" onClick={() => cambiaStato(art)}>{art.status === "published" ? "Ritira" : "Pubblica"}</button>
            <button className="pf-btn pericolo compatto" onClick={() => elimina(art)}>Elimina</button>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================ APP PRINCIPALE ============================ */

export default function AdminApp() {
  const [login, setLogin] = useState({ email: "", password: "", totp: "" });
  const [serveTotp, setServeTotp] = useState(false);
  const [autorizzato, setAutorizzato] = useState(null);
  const [errore, setErrore] = useState("");
  const [sezione, setSezione] = useState("dashboard");
  const [badges, setBadges] = useState({ candidature: 0, recensioni: 0 });
  const [menuAperto, setMenuAperto] = useState(false);
  const [utente, setUtente] = useState(null);

  const verificaAccesso = useCallback(async () => {
    const r = await fetch("/api/admin/statistiche");
    if (r.status === 401 || r.status === 403) return setAutorizzato(false);
    const d = await r.json();
    setUtente(d.utente || null);
    setBadges({
      candidature: Number(d.kpi?.candidature_in_attesa || 0),
      recensioni: Number(d.kpi?.recensioni_da_moderare || 0),
    });
    setAutorizzato(true);
  }, []);

  useEffect(() => { verificaAccesso(); }, [verificaAccesso]);

  const aggiornaBadge = useCallback((chiave, n) => {
    setBadges((b) => (b[chiave] === n ? b : { ...b, [chiave]: n }));
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
    if (!r.ok) {
      if (d.need_totp) setServeTotp(true);
      return setErrore(d.error || "Errore di accesso");
    }
    if (d.role !== "admin") return setErrore("Questo account non è amministratore");
    verificaAccesso();
  };

  const esci = async () => {
    await fetch("/api/panel/logout", { method: "POST" });
    setAutorizzato(false);
  };

  const vai = (k) => { setSezione(k); setMenuAperto(false); };

  if (autorizzato === null) return <Caricamento />;

  if (autorizzato === false) {
    return (
      <div className="pf-panel" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2>Amministrazione</h2>
        <form className="pf-book" onSubmit={accedi}>
          <label htmlFor="ad-email">Email</label>
          <input id="ad-email" type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} autoComplete="username" />
          <label htmlFor="ad-pass">Password</label>
          <input id="ad-pass" type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password" />
          {serveTotp && (
            <>
              <label htmlFor="ad-totp">Codice a 6 cifre (app di autenticazione)</label>
              <input id="ad-totp" inputMode="numeric" maxLength={6} value={login.totp} onChange={(e) => setLogin({ ...login, totp: e.target.value.replace(/\D/g, "") })} placeholder="123456" style={{ letterSpacing: 4, fontSize: 22, maxWidth: 180 }} />
            </>
          )}
          {errore && <div className="pf-errore">{errore}</div>}
          <button className="pf-btn" style={{ width: "100%" }}>Entra</button>
        </form>
      </div>
    );
  }

  const VISTE = {
    dashboard: <Dashboard vai={vai} />,
    "inf-elenco": <Professionisti />,
    "inf-nuovo": (
      <div className="pf-panel">
        <h2 style={{ marginTop: 0 }}>➕ Nuovo infermiere</h2>
        <p style={{ color: "var(--iw-slate)" }}>
          I professionisti entrano dalla <strong>candidatura</strong> (così i dati arrivano già completi e col consenso):
          manda al collega il link del modulo, poi approvi da «Verifica documenti» — scheda, credenziali ed email di
          benvenuto si creano da sole in un click.
        </p>
        <a className="pf-btn" href="/lavora-con-noi" target="_blank" rel="noreferrer">Apri il modulo di candidatura</a>
      </div>
    ),
    "inf-verifica": <Candidature aggiornaBadge={aggiornaBadge} />,
    "inf-stato": <Professionisti filtroStato="pending" />,
    "inf-specializzazioni": <Servizi />,
    "inf-disponibilita": (
      <div className="pf-panel">
        <h2 style={{ marginTop: 0 }}>🗓️ Disponibilità</h2>
        <p style={{ color: "var(--iw-slate)", margin: 0 }}>
          Orari, ferie e blocchi li gestisce ogni professionista dal proprio pannello (autonomia = agenda sempre vera).
          Da admin li vedi riflessi negli slot pubblici della scheda di ciascuno.
        </p>
      </div>
    ),
    "inf-zone": <Copertura />,
    "inf-recensioni": <RecensioniPubblicate />,
    "paz-anagrafica": <Pazienti />,
    "paz-storico": <Prenotazioni stato="tutte" titolo="Storico richieste" />,
    "paz-effettuate": <Prenotazioni stato="done" titolo="Prestazioni effettuate" />,
    "paz-consensi": <Consensi />,
    "pre-calendario": <Prenotazioni stato="active" titolo="Calendario — prossimi appuntamenti" futureSolo />,
    "pre-nuova": <NuovaPrenotazione />,
    "pre-confermate": <Prenotazioni stato="active" titolo="Confermate" />,
    "pre-completate": <Prenotazioni stato="done" titolo="Completate" />,
    "pre-annullate": <Prenotazioni stato="cancelled" titolo="Annullate" />,
    "srv-catalogo": <Servizi />,
    "srv-prezzi": <Servizi />,
    "srv-zone": <Copertura />,
    "cop-mappa": <Copertura />,
    "rec-moderazione": <RecensioniModerazione aggiornaBadge={aggiornaBadge} />,
    "rec-interne": <RecensioniPubblicate />,
    "rec-google": <RecensioniGoogle />,
    "rec-richieste": <RecensioniRichieste />,
    "blog-articoli": <BlogAdmin />,
    "con-richieste": <Contatti />,
    "ana-traffico": <Analytics />,
    "imp-email": <ImpostazioniEmail />,
    "imp-backup": <ImpostazioniBackup />,
    "imp-api": <ImpostazioniApi />,
    "imp-sicurezza": <Sicurezza />,
  };

  const voceCorrente = MENU.flatMap((g) => g.voci).find((v) => v.k === sezione);
  const vista = VISTE[sezione] || <InArrivo titolo={voceCorrente?.label || "Sezione"} nota={voceCorrente?.nota} />;

  return (
    <div className="adm-layout">
      <button className="pf-btn secondario adm-menu-mobile" onClick={() => setMenuAperto(!menuAperto)}>
        ☰ Menu amministrazione
      </button>

      <aside className={`adm-sidebar${menuAperto ? " aperta" : ""}`}>
        {utente && (
          <div className="adm-utente">
            <span className="adm-avatar">{utente.nome.charAt(0).toUpperCase()}</span>
            <span>
              <strong>{utente.nome}</strong>
              <small>Connesso come amministratore</small>
            </span>
          </div>
        )}
        {MENU.map((g) => (
          <div className="adm-gruppo" key={g.titolo}>
            <div className="adm-gruppo-titolo">{g.icona} {g.titolo}</div>
            {g.voci.map((v) => (
              <button
                key={v.k}
                className={`adm-voce${sezione === v.k ? " attiva" : ""}${v.todo && !VISTE[v.k] ? " futura" : ""}`}
                onClick={() => vai(v.k)}
              >
                {v.label}
                {v.badge && badges[v.badge] > 0 && <span className="adm-badge">{badges[v.badge]}</span>}
                {v.todo && !VISTE[v.k] && <span className="adm-presto">presto</span>}
              </button>
            ))}
          </div>
        ))}
        <button className="pf-btn pericolo" style={{ margin: "14px 12px", width: "calc(100% - 24px)" }} onClick={esci}>Esci</button>
      </aside>

      <main className="adm-contenuto">{vista}</main>
    </div>
  );
}
