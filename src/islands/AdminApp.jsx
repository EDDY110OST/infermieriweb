import React, { useCallback, useEffect, useRef, useState } from "react";
import CampoPassword from "./CampoPassword.jsx";
import CercaComune from "./CercaComune.jsx";
import ConfermaInline from "./ConfermaInline.jsx";

// L'editor visuale degli articoli (TipTap) si carica solo quando serve: pesa ~120 KB
const EditorArticolo = React.lazy(() => import("./EditorArticolo.jsx"));
import { eConsulenza, TIPI_ATTIVITA } from "../data/listino.js";

const dataIt = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const dataOra = (iso) =>
  new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const euro = (cents) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
const STATI = { active: "Confermata", done: "Completata", cancelled: "Annullata", noshow: "Non presentato", pending: "In attesa conferma", expired: "Scaduta (non confermata)" };

/* ============================ IL MENÙ (struttura di Bruno) ============================ */

const MENU = [
  { icona: "📊", titolo: "Dashboard", voci: [{ k: "dashboard", label: "Panoramica e KPI" }] },
  {
    icona: "👨‍⚕️", titolo: "Infermieri", voci: [
      { k: "inf-elenco", label: "Elenco infermieri" },
      { k: "inf-scrivi", label: "✉️ Scrivi agli infermieri" },
      { k: "inf-prenotazioni", label: "Prenotazioni per infermiere" },
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
      { k: "srv-listino", label: "Listino (lo decidiamo noi)" },
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

/* ============================ MODIFICA SCHEDA INFERMIERE ============================ */

const eaCent = (x) => {
  const n = Math.round(parseFloat(String(x).replace(",", ".")) * 100);
  return Number.isFinite(n) ? n : 0;
};

function ModificaScheda({ pid, nome, onIndietro }) {
  const [prof, setProf] = useState(null);
  const [servizi, setServizi] = useState(null);
  const [zone, setZone] = useState(null);
  const [msg, setMsg] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [nuovoServizio, setNuovoServizio] = useState({ key: "", prezzo: "" });
  // Listino disponibile per QUESTO professionista: le voci generali + le sue su misura
  const [listino, setListino] = useState(null);
  const [suMisura, setSuMisura] = useState({ aperto: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" });
  // Specializzazioni: lista fra cui scegliere (globali + su misura per lui) e scelte attuali
  const [spec, setSpec] = useState({ voci: [], scelte: [], massimo: 5 });
  const [nuovaSpec, setNuovaSpec] = useState("");

  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => { setMsg({ tipo, testo }); clearTimeout(timerMsg.current); timerMsg.current = setTimeout(() => setMsg(null), 8000); };
  const inScheda = (k) => (servizi || []).some((s) => s.catalog_key === k);
  const vocePerKey = (k) => (listino || []).find((v) => v.key === k);

  // L'editor sostituisce l'elenco, ma la pagina resta scorsa dov'era la card cliccata:
  // si riparte dall'intestazione, così la scheda si vede dall'inizio (anche da telefono).
  // BUG (collaudo in produzione 7/10): l'effetto scattava su [pid] mentre il componente
  // rendeva ancora «Caricamento…» (topRef null) e non ripartiva all'arrivo dei dati →
  // dalla 10ª scheda in poi l'editor restava migliaia di px sopra lo schermo. Ora dipende
  // dall'arrivo del profilo e ricontrolla a 0,3 e 0,9 s (stesso rimedio dell'editor blog).
  const topRef = useRef(null);
  const profiloCaricato = !!prof;
  useEffect(() => {
    if (!profiloCaricato) return;
    const vai = () => topRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    vai();
    const fuori = () => { const r = topRef.current?.getBoundingClientRect(); return r && (r.top < 0 || r.top > 160); };
    const timer = [300, 900].map((ms) => setTimeout(() => { if (fuori()) vai(); }, ms));
    return () => timer.forEach(clearTimeout);
  }, [pid, profiloCaricato]);
  // Esito delle azioni (Togli, prezzo…): va portato in vista, altrimenti chi ha scorso
  // in fondo all'elenco delle prestazioni non lo vede e crede che non sia successo nulla.
  const msgRef = useRef(null);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);

  const carica = useCallback(() => {
    fetch(`/api/panel/profilo?pid=${pid}`).then((r) => r.json()).then((d) => setProf(d.profilo || null));
    fetch(`/api/panel/servizi?pid=${pid}`).then((r) => r.json()).then((d) => setServizi(d.servizi || []));
    fetch(`/api/panel/zone?pid=${pid}`).then((r) => r.json()).then((d) => setZone(d.zone || []));
    fetch(`/api/panel/listino?pid=${pid}`).then((r) => r.json()).then((d) => setListino(d.voci || []));
    fetch(`/api/panel/specializzazioni?pid=${pid}`).then((r) => r.json()).then((d) => setSpec({ voci: d.voci || [], scelte: d.scelte || [], massimo: d.massimo || 5 }));
  }, [pid]);

  // La spunta cambia subito (risposta immediata al clic); se il salvataggio fallisce torna indietro
  const salvaSpecializzazioni = async (scelte, prima) => {
    let r, d;
    try {
      r = await fetch("/api/panel/specializzazioni", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid, keys: scelte }) });
      d = await r.json().catch(() => ({}));
    } catch {
      setSpec((s) => ({ ...s, scelte: prima }));
      return avvisa("err", "Errore di rete: riprova tra poco");
    }
    if (!r.ok) { setSpec((s) => ({ ...s, scelte: prima })); return avvisa("err", d.error || "Errore nel salvataggio delle specializzazioni"); }
    avvisa("ok", "Specializzazioni salvate ✅");
  };
  const toggleSpec = (key) => {
    const gia = spec.scelte.includes(key);
    const scelte = gia ? spec.scelte.filter((k) => k !== key) : [...spec.scelte, key];
    if (scelte.length > spec.massimo) return avvisa("err", `Al massimo ${spec.massimo} specializzazioni`);
    const prima = spec.scelte;
    setSpec((s) => ({ ...s, scelte }));
    salvaSpecializzazioni(scelte, prima);
  };
  // Specializzazione su misura: solo per questo professionista (come le prestazioni su misura)
  const creaSpecSuMisura = async () => {
    const r = await fetch("/api/admin/specializzazioni", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: nuovaSpec, professional_id: pid }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return avvisa("err", d.error || "Errore");
    setNuovaSpec("");
    avvisa("ok", `"${nuovaSpec}" creata solo per ${nome}: ora può essere spuntata qui sotto.`);
    carica();
  };
  useEffect(carica, [carica]);

  // Email sospetta (gmail.co…): il server non salva e chiede conferma → riquadro sopra «Salva»
  const [avvisoEmailScheda, setAvvisoEmailScheda] = useState("");
  const salvaProfilo = async (confermaEmail = false) => {
    setSalvo(true);
    try {
      const r = await fetch("/api/panel/profilo", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid, name: prof.name, full_name: prof.full_name, gender: prof.gender, profession: prof.profession,
          email: prof.email, phone: prof.phone, bio: prof.bio, bio_consulenza: prof.bio_consulenza, address: prof.address,
          city: prof.city, sigla: prof._sigla, albo_name: prof.albo_name, albo_number: prof.albo_number,
          albo_date: prof.albo_date, vat_number: prof.vat_number, confermaEmail,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.conferma_email) return setAvvisoEmailScheda(d.error);
      setAvvisoEmailScheda("");
      if (!r.ok) return avvisa("err", d.error || "Errore nel salvataggio: riprova");
      avvisa("ok", "Dati salvati ✅" + (d.posizioneCambiata ? " (segnaposto mappa aggiornato)" : "")
        + (d.emailAccessoCambiata ? ` Email cambiata anche per entrare: da ora ${nome} entra con ${d.emailAccessoCambiata}.` : "")); carica();
    } catch {
      avvisa("err", "Errore di rete: riprova tra poco");
    } finally {
      setSalvo(false);
    }
  };

  const caricaFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      const lato = 480;
      const scala = Math.max(lato / img.width, lato / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = lato; canvas.height = lato;
      canvas.getContext("2d").drawImage(img, (lato - img.width * scala) / 2, (lato - img.height * scala) / 2, img.width * scala, img.height * scala);
      const data = canvas.toDataURL("image/jpeg", 0.85);
      const r = await fetch("/api/panel/foto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid, data }) });
      const d = await r.json();
      if (r.ok) { setProf((p) => ({ ...p, photo_url: d.photo_url })); avvisa("ok", "Foto aggiornata ✅"); }
      else avvisa("err", d.error);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  const salvaServizio = async (s, campi) => {
    const r = await fetch("/api/panel/servizi", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid, id: s.id, ...campi }) });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    carica();
  };
  const creaSuMisura = async () => {
    const r = await fetch("/api/admin/listino", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        professional_id: pid, nome: suMisura.nome, categoria: suMisura.categoria,
        min_cents: eaCent(suMisura.min || "0"), sugg_cents: eaCent(suMisura.sugg || suMisura.min || "0"),
        durata_min: suMisura.categoria === "consulenza" ? 60 : Number(suMisura.durata) || 30,
      }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", `"${suMisura.nome}" creata: ora la trovi nell'elenco qui sopra, pronta da aggiungere alla sua scheda.`);
    setSuMisura({ aperto: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" });
    carica();
  };

  // Togli dalla scheda. La conferma è in pagina (ConfermaInline), non window.confirm:
  // le finestre native vengono soppresse dal browser dopo qualche clic di fila e il tasto
  // sembrava morto. Dopo la risposta la riga sparisce subito e si spiega cos'è successo.
  const rimuoviServizio = async (s) => {
    let r, d;
    try {
      r = await fetch(`/api/panel/servizi?id=${s.id}&pid=${pid}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      d = await r.json().catch(() => ({}));
    } catch {
      return avvisa("err", "Errore di rete: riprova tra poco");
    }
    if (!r.ok) return avvisa("err", d.error || "Non sono riuscito a togliere la prestazione: riprova");
    setServizi((lista) => (lista || []).filter((x) => x.id !== s.id));
    avvisa("ok", d.archiviata
      ? `«${s.name}» tolta dalla scheda ✅ Aveva ${d.prenotazioni} prenotazion${d.prenotazioni === 1 ? "e" : "i"} nello storico: lì resta leggibile, ma non è più visibile né prenotabile.`
      : `«${s.name}» tolta dalla scheda ✅`);
    carica();
  };
  const aggiungiServizio = async () => {
    const voce = vocePerKey(nuovoServizio.key);
    if (!voce) return avvisa("err", "Scegli una prestazione");
    const r = await fetch("/api/panel/servizi", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid, catalog_key: nuovoServizio.key, price_cents: nuovoServizio.prezzo ? eaCent(nuovoServizio.prezzo) : voce.sugg_cents, duration_min: voce.durata_min }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    setNuovoServizio({ key: "", prezzo: "" }); avvisa("ok", "Prestazione aggiunta ✅"); carica();
  };

  const aggiungiZona = async (comune) => {
    const r = await fetch("/api/panel/zone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid, city: comune.nome, sigla: comune.sigla }) });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    carica();
  };
  const rimuoviZona = async (z) => {
    const r = await fetch("/api/panel/zone", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid, id: z.id }) });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    carica();
  };

  if (!prof) return <Caricamento />;
  const disponibili = (listino || []).filter((v) => v.categoria !== "consulenza" && !inScheda(v.key));
  const disponibiliConsulenze = (listino || []).filter((v) => v.categoria === "consulenza" && !inScheda(v.key));

  // Griglie dei campi: su telefono le colonne fisse facevano sbordare la pagina (il
  // campo data non si restringe sotto ~150px) → colonne che vanno a capo da sole.
  const griglia2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 };
  const griglia3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 };

  return (
    <div ref={topRef} className="adm-editor-top">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, color: "var(--iw-navy)" }}>✏️ Modifica scheda — {nome}</h2>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {prof.status === "active" && <a className="pf-btn secondario compatto" href={`/p/${prof.slug}`} target="_blank" rel="noreferrer">Vedi scheda</a>}
          <button className="pf-btn secondario compatto" onClick={onIndietro}>← Torna all'elenco</button>
        </span>
      </div>
      {prof.edited_by && <p className="pf-note" style={{ marginTop: 0 }}>Ultima modifica da: <strong>{prof.edited_by}</strong>{prof.edited_at ? ` · ${new Date(prof.edited_at).toLocaleString("it-IT")}` : ""}</p>}
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}

      {/* FOTO */}
      <div className="pf-panel" style={{ marginBottom: 14, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {prof.photo_url && <img src={prof.photo_url} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />}
        <label className="pf-btn secondario compatto" style={{ cursor: "pointer", margin: 0 }}>
          Cambia foto
          <input type="file" accept="image/*" onChange={caricaFoto} style={{ display: "none" }} />
        </label>
      </div>

      {/* DATI */}
      <div className="pf-panel pf-book" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Dati e identità</h3>
        <div style={griglia2}>
          <div><label>Nome pubblico (es. Inf. Mario R.)</label><input value={prof.name || ""} onChange={(e) => setProf({ ...prof, name: e.target.value })} /></div>
          <div><label>Nome completo (riservato)</label><input value={prof.full_name || ""} onChange={(e) => setProf({ ...prof, full_name: e.target.value })} /></div>
          <div><label>Sesso (appellativo)</label>
            <select value={prof.gender || ""} onChange={(e) => setProf({ ...prof, gender: e.target.value })}>
              <option value="">—</option><option value="m">Uomo</option><option value="f">Donna</option>
            </select>
          </div>
          <div><label>Professione</label>
            <select value={prof.profession || ""} onChange={(e) => setProf({ ...prof, profession: e.target.value })}>
              <option value="">—</option><option value="Infermiere">Infermiere</option><option value="Infermiera">Infermiera</option>
            </select>
          </div>
          <div><label>Email <span style={{ fontWeight: 400 }}>(prenotazioni e accesso)</span></label><input type="email" value={prof.email || ""} onChange={(e) => { setProf({ ...prof, email: e.target.value }); setAvvisoEmailScheda(""); }} />
            {prof.email_accesso && prof.email_accesso.toLowerCase() !== String(prof.email || "").trim().toLowerCase()
              ? <p className="pf-note" style={{ marginTop: -6, overflowWrap: "anywhere" }}>Oggi per entrare usa <strong>{prof.email_accesso}</strong>. Salvando, anche l'accesso passa all'email qui sopra.</p>
              : <p className="pf-note" style={{ marginTop: -6 }}>È anche l'email con cui entra nel pannello.</p>}
          </div>
          <div><label>Telefono</label><input value={prof.phone || ""} onChange={(e) => setProf({ ...prof, phone: e.target.value })} /></div>
        </div>
        <label>Comune (base della scheda)</label>
        <CercaComune id="ms-city" valore={prof.city} onTesto={(t) => setProf({ ...prof, city: t, _sigla: null })} onScegli={(c) => setProf({ ...prof, city: c.nome, province: c.provincia, region: c.regione, _sigla: c.sigla })} />
        <label>Indirizzo (facoltativo)</label>
        <input value={prof.address || ""} onChange={(e) => setProf({ ...prof, address: e.target.value })} />
        <div style={griglia3}>
          <div><label>OPI di Appartenenza</label><input value={prof.albo_name || ""} onChange={(e) => setProf({ ...prof, albo_name: e.target.value })} /></div>
          <div><label>N. iscrizione</label><input value={prof.albo_number || ""} onChange={(e) => setProf({ ...prof, albo_number: e.target.value })} /></div>
          <div style={{ minWidth: 0 }}><label>Data iscrizione</label><input type="date" style={{ minWidth: 0 }} value={prof.albo_date || ""} onChange={(e) => setProf({ ...prof, albo_date: e.target.value })} /></div>
        </div>
        <label>Partita IVA (11 cifre, oppure vuota)</label>
        <input value={prof.vat_number || ""} onChange={(e) => setProf({ ...prof, vat_number: e.target.value })} />
        <label>Presentazione (bio)</label>
        <textarea rows={4} value={prof.bio || ""} onChange={(e) => setProf({ ...prof, bio: e.target.value })} />
        <label>Presentazione per i colleghi (pagine delle consulenze) <span style={{ fontWeight: 400 }}>— vuota = si usa la bio</span></label>
        <textarea rows={3} value={prof.bio_consulenza || ""} onChange={(e) => setProf({ ...prof, bio_consulenza: e.target.value })} />
        {avvisoEmailScheda && (
          <div style={BOX_AVVISO}>
            ⚠️ {avvisoEmailScheda}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button className="pf-btn compatto" disabled={salvo} onClick={() => salvaProfilo(true)}>Sì, è giusta: salva</button>
              <button className="pf-btn secondario compatto" disabled={salvo} onClick={() => setAvvisoEmailScheda("")}>La correggo</button>
            </div>
          </div>
        )}
        {!avvisoEmailScheda && <button className="pf-btn" disabled={salvo} onClick={() => salvaProfilo(false)}>{salvo ? "Salvo…" : "Salva dati"}</button>}
      </div>

      {/* PRESTAZIONI */}
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Prestazioni e prezzi</h3>
        {!servizi ? <Caricamento /> : servizi.map((s) => {
          const voce = vocePerKey(s.catalog_key);
          return (
            <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "8px 0", borderBottom: "1px solid var(--iw-line, #eee)" }}>
              <strong style={{ flex: 1, minWidth: 160 }}>{s.name}{eConsulenza(s.catalog_key) && <span className="pf-note" style={{ margin: 0 }}> · consulenza/ora</span>}{!s.active && <span className="pf-note" style={{ margin: 0 }}> · disattivata</span>}</strong>
              <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                €<input style={{ width: 80, marginBottom: 0 }} defaultValue={(s.price_cents / 100).toString().replace(".", ",")} onBlur={(e) => { const c = eaCent(e.target.value); if (c && c !== s.price_cents) salvaServizio(s, { price_cents: c }); }} />
              </label>
              {voce && <span className="pf-note" style={{ margin: 0 }}>min {euro(voce.min_cents)}{voce.su_misura ? " · su misura" : ""}</span>}
              <button className="pf-btn secondario compatto" onClick={() => salvaServizio(s, { active: !s.active })}>{s.active ? "Disattiva" : "Attiva"}</button>
              <ConfermaInline etichetta="Togli" domanda={`Tolgo «${s.name}» dalla scheda?`} onConferma={() => rimuoviServizio(s)} />
            </div>
          );
        })}
        {servizi && servizi.length === 0 && <p className="pf-note">Nessuna prestazione in scheda.</p>}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }} className="pf-book">
          <select style={{ marginBottom: 0, flex: 1, minWidth: 200 }} value={nuovoServizio.key} onChange={(e) => { const v = vocePerKey(e.target.value); setNuovoServizio({ key: e.target.value, prezzo: v ? (v.sugg_cents / 100).toFixed(2).replace(".", ",") : "" }); }}>
            <option value="">+ Aggiungi prestazione…</option>
            <optgroup label="A domicilio (per i pazienti)">
              {disponibili.map((v) => <option key={v.key} value={v.key}>{v.nome} (min {euro(v.min_cents)}){v.su_misura ? " ·su misura" : ""}</option>)}
            </optgroup>
            <optgroup label="Consulenze a ora (per i colleghi)">
              {disponibiliConsulenze.map((v) => <option key={v.key} value={v.key}>{v.nome} (min {euro(v.min_cents)}/ora){v.su_misura ? " ·su misura" : ""}</option>)}
            </optgroup>
          </select>
          {nuovoServizio.key && <>€<input style={{ width: 80, marginBottom: 0 }} value={nuovoServizio.prezzo} onChange={(e) => setNuovoServizio({ ...nuovoServizio, prezzo: e.target.value })} /></>}
          <button className="pf-btn compatto" disabled={!nuovoServizio.key} onClick={aggiungiServizio}>Aggiungi</button>
        </div>

        {/* Prestazione SU MISURA: la creiamo noi per questo professionista soltanto.
            Lui non può inventarsene: sceglie solo dal listino che gli diamo. */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--iw-line, #ddd)" }}>
          {!suMisura.aperto ? (
            <button className="pf-btn secondario compatto" onClick={() => setSuMisura({ ...suMisura, aperto: true })}>
              ✚ Crea una prestazione su misura solo per {nome}
            </button>
          ) : (
            <div className="pf-book" style={{ maxWidth: 520 }}>
              <strong style={{ color: "var(--iw-navy)" }}>Prestazione su misura (la vedrà solo {nome})</strong>
              <p className="pf-note" style={{ marginTop: 4 }}>
                Serve per i casi particolari: la voce non entra nel listino generale e nessun altro
                professionista potrà sceglierla. La trovi poi qui sopra, pronta da aggiungere alla sua scheda.
              </p>
              <label>Nome della prestazione *</label>
              <input value={suMisura.nome} onChange={(e) => setSuMisura({ ...suMisura, nome: e.target.value })} placeholder="es. Gestione drenaggio toracico" />
              <label>Tipo</label>
              <select value={suMisura.categoria} onChange={(e) => setSuMisura({ ...suMisura, categoria: e.target.value })}>
                <option value="domicilio">A domicilio (per i pazienti)</option>
                <option value="consulenza">Consulenza a ora (per i colleghi)</option>
              </select>
              <div style={{ ...griglia3, gap: 8 }}>
                <div><label>Minimo (€)</label><input inputMode="decimal" value={suMisura.min} onChange={(e) => setSuMisura({ ...suMisura, min: e.target.value })} /></div>
                <div><label>Consigliato (€)</label><input inputMode="decimal" value={suMisura.sugg} onChange={(e) => setSuMisura({ ...suMisura, sugg: e.target.value })} /></div>
                <div><label>Durata (min)</label><input type="number" min={5} max={480} step={5} disabled={suMisura.categoria === "consulenza"} value={suMisura.categoria === "consulenza" ? 60 : suMisura.durata} onChange={(e) => setSuMisura({ ...suMisura, durata: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="pf-btn compatto" onClick={creaSuMisura} disabled={!suMisura.nome.trim()}>Crea</button>
                <button className="pf-btn secondario compatto" onClick={() => setSuMisura({ aperto: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" })}>Annulla</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ZONE */}
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Zone coperte</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {(zone || []).map((z) => (
            <span key={z.id} className="stato done" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {z.city} ({z.province})
              <button onClick={() => rimuoviZona(z)} title="Togli" style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 700 }}>×</button>
            </span>
          ))}
          {zone && zone.length === 0 && <span className="pf-note" style={{ margin: 0 }}>Nessuna zona.</span>}
        </div>
        <div className="pf-book">
          <label>Aggiungi un comune coperto</label>
          <CercaComune id="ms-zona" valore="" onTesto={() => {}} onScegli={aggiungiZona} placeholder="Scrivi e scegli il comune…" />
        </div>
      </div>

      {/* SPECIALIZZAZIONI */}
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Specializzazioni <span className="pf-note" style={{ margin: 0, fontWeight: 400 }}>(dichiarate dal professionista · al massimo {spec.massimo})</span></h3>
        {spec.voci.length === 0 && <p className="pf-note">La lista è vuota: aggiungi le voci da Infermieri → Specializzazioni.</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
          {spec.voci.map((v) => (
            <label key={v.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={spec.scelte.includes(v.key)} onChange={() => toggleSpec(v.key)} /> {v.nome}{v.su_misura ? <span className="pf-note" style={{ margin: 0 }}> · su misura</span> : null}
            </label>
          ))}
        </div>
        <p className="pf-note" style={{ marginTop: 10 }}>Le spunte si salvano da sole. Sulla scheda pubblica compaiono sotto il nome, con la nota «dichiarate dal professionista».</p>
        <div className="pf-book" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <input style={{ marginBottom: 0, flex: 1, minWidth: 220 }} value={nuovaSpec} onChange={(e) => setNuovaSpec(e.target.value)} placeholder={`Specializzazione su misura solo per ${nome}`} />
          <button className="pf-btn secondario compatto" disabled={nuovaSpec.trim().length < 3} onClick={creaSpecSuMisura}>✚ Crea su misura</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ INFERMIERI ============================ */

// «Correggi email e rimanda il benvenuto» (7/10/26). Caso vero: «gmail.co» nella
// candidatura; l'admin aveva corretto solo la scheda e l'email per entrare era rimasta
// sbagliata. Qui cambiano INSIEME (scheda + accesso) e il benvenuto riparte. Tre passi in
// pagina, niente window.confirm: scrivi → controlla e conferma → esito.
const BOX_AVVISO = { background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 10, padding: "8px 12px", marginBottom: 10 };

function CorreggiEmail({ p, onFatto }) {
  const [fase, setFase] = useState("chiuso"); // chiuso | scrivi | conferma | fatto
  const [email, setEmail] = useState("");
  const [verifica, setVerifica] = useState(null);
  const [esito, setEsito] = useState(null);
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const boxRef = useRef(null);
  const tastiRef = useRef(null);
  // ogni passo (e ogni errore) resta in vista con i suoi tasti, anche su telefono
  useEffect(() => {
    if (fase === "chiuso") return;
    boxRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => tastiRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 350);
    return () => clearTimeout(t);
  }, [fase, errore]);

  const chiama = async (extra) => {
    const r = await fetch("/api/admin/email-professionista", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, email, ...extra }) });
    return { r, d: await r.json().catch(() => ({})) };
  };
  const controlla = async () => {
    setInCorso(true); setErrore("");
    try {
      const { r, d } = await chiama({ verifica: true });
      if (!r.ok) return setErrore(d.error || "Non sono riuscito a controllare l'email");
      setVerifica(d); setFase("conferma");
    } catch {
      setErrore("Errore di rete: riprova tra poco");
    } finally {
      setInCorso(false);
    }
  };
  const conferma = async () => {
    setInCorso(true); setErrore("");
    try {
      const { r, d } = await chiama({ forza: !!verifica?.avviso });
      if (!r.ok) return setErrore(d.error || "Non sono riuscito ad aggiornare l'email");
      setEsito(d); setFase("fatto");
      onFatto?.(d);
    } catch {
      setErrore("Errore di rete: riprova tra poco");
    } finally {
      setInCorso(false);
    }
  };

  if (fase === "chiuso") {
    return <button className="pf-btn secondario compatto" onClick={() => { setEmail(p.email || p.email_accesso || ""); setErrore(""); setVerifica(null); setFase("scrivi"); }}>✉️ Correggi email e rimanda il benvenuto</button>;
  }
  return (
    <div ref={boxRef} className="pf-book" style={{ width: "100%", marginTop: 10, padding: "12px 14px", border: "1px solid var(--iw-line)", borderRadius: 12, background: "var(--iw-bg)", scrollMarginTop: 96 }}>
      {fase === "scrivi" && (
        <>
          <label htmlFor={`ce-${p.id}`}>Email giusta di {p.name} <span style={{ fontWeight: 400 }}>(vale per le prenotazioni e per entrare)</span></label>
          <input id={`ce-${p.id}`} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrore(""); }} onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) { e.preventDefault(); controlla(); } }} autoComplete="off" autoFocus />
          <p className="pf-note" style={{ marginTop: -6 }}>Poi controlli e confermi. Al nuovo indirizzo riparte il benvenuto. La password non cambia.</p>
        </>
      )}
      {fase === "conferma" && verifica && (
        <>
          <strong style={{ color: "var(--iw-navy)" }}>Controlla e conferma</strong>
          {verifica.cambiata ? (
            <p style={{ margin: "6px 0 8px", overflowWrap: "anywhere" }}>Prima: <span style={{ textDecoration: "line-through", color: "var(--iw-muted)" }}>{verifica.prima || "(vuota)"}</span><br />Dopo: <strong>{verifica.email}</strong></p>
          ) : (
            <p style={{ margin: "6px 0 8px", overflowWrap: "anywhere" }}>L'email resta <strong>{verifica.email}</strong>: rimando solo il benvenuto.</p>
          )}
          <p className="pf-note" style={{ marginTop: 0 }}>Cambiano insieme l'email delle prenotazioni e quella per entrare. Il benvenuto riparte a questo indirizzo. La password non cambia.</p>
          {verifica.avviso && <div style={BOX_AVVISO}>⚠️ {verifica.avviso}</div>}
        </>
      )}
      {fase === "fatto" && esito && (
        esito.emailed
          ? <div className="pf-successo" style={{ marginBottom: 10, overflowWrap: "anywhere" }}>✅ Fatto. {esito.cambiata ? <>Da ora per entrare usa <strong>{esito.email}</strong>. </> : null}Benvenuto rimandato a <strong>{esito.email}</strong>.</div>
          : <div className="pf-errore" style={{ marginBottom: 10, overflowWrap: "anywhere" }}>{esito.cambiata ? <>Email aggiornata: <strong>{esito.email}</strong>. </> : null}⚠️ Il benvenuto però NON è partito. Riprova più tardi con lo stesso tasto.</div>
      )}
      {errore && <div className="pf-errore" style={{ marginBottom: 10 }}>{errore}</div>}
      <div ref={tastiRef} style={{ display: "flex", gap: 8, flexWrap: "wrap", scrollMarginBottom: 16 }}>
        {fase === "scrivi" && <button className="pf-btn compatto" disabled={inCorso || !email.trim()} onClick={controlla}>{inCorso ? "Controllo…" : "Controlla"}</button>}
        {fase === "conferma" && <button className="pf-btn compatto" disabled={inCorso} onClick={conferma}>{inCorso ? "Invio…" : verifica?.avviso ? "Sì, è giusta: aggiorna e rimanda" : "Sì, aggiorna e rimanda il benvenuto"}</button>}
        {fase === "conferma" && <button className="pf-btn secondario compatto" disabled={inCorso} onClick={() => setFase("scrivi")}>Correggi ancora</button>}
        <button className="pf-btn secondario compatto" disabled={inCorso} onClick={() => setFase("chiuso")}>{fase === "fatto" ? "Chiudi" : "Annulla"}</button>
      </div>
    </div>
  );
}

// Email di una candidatura in attesa: si corregge PRIMA di approvare, così il benvenuto e
// l'accesso nascono già giusti. Un dominio sospetto (gmail.co…) si vede subito.
function EmailCandidatura({ c, onCambiata }) {
  const [aperto, setAperto] = useState(false);
  const [email, setEmail] = useState(c.email || "");
  const [avviso, setAvviso] = useState("");
  const [esito, setEsito] = useState(null);
  const [inCorso, setInCorso] = useState(false);
  const salva = async (forza) => {
    setInCorso(true); setEsito(null);
    try {
      const r = await fetch("/api/admin/candidature", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, email, forza }) });
      const d = await r.json().catch(() => ({}));
      if (d.conferma_email) return setAvviso(d.error);
      if (!r.ok) return setEsito({ tipo: "err", testo: d.error || "Errore nel salvataggio" });
      setEsito({ tipo: "ok", testo: `✅ Email corretta: ${d.email}. Il benvenuto partirà a questo indirizzo quando approvi.` });
      setAperto(false); setAvviso("");
      onCambiata?.();
    } catch {
      setEsito({ tipo: "err", testo: "Errore di rete: riprova tra poco" });
    } finally {
      setInCorso(false);
    }
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", maxWidth: "100%" }}>
      {!aperto ? (
        <>
          <span style={{ overflowWrap: "anywhere" }}>{c.email}</span>
          <button type="button" className="pf-btn secondario compatto" onClick={() => { setEmail(c.email || ""); setEsito(null); setAvviso(""); setAperto(true); }}>Correggi email</button>
          {c.avviso_email && !esito && <span style={{ ...BOX_AVVISO, display: "block", width: "100%", margin: "4px 0 0", fontSize: 15 }}>⚠️ {c.avviso_email}</span>}
        </>
      ) : (
        <span className="pf-book" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", width: "100%" }}>
          <input type="email" aria-label="Email giusta del candidato" style={{ marginBottom: 0, width: 280, maxWidth: "100%" }} value={email} onChange={(e) => { setEmail(e.target.value); setAvviso(""); }} autoComplete="off" autoFocus />
          {!avviso && <button type="button" className="pf-btn compatto" disabled={inCorso || !email.trim()} onClick={() => salva(false)}>{inCorso ? "Salvo…" : "Salva email"}</button>}
          {avviso && <span style={{ ...BOX_AVVISO, display: "block", width: "100%", margin: 0, fontSize: 15 }}>⚠️ {avviso}</span>}
          {avviso && <button type="button" className="pf-btn compatto" disabled={inCorso} onClick={() => salva(true)}>Sì, è giusta: salva</button>}
          <button type="button" className="pf-btn secondario compatto" disabled={inCorso} onClick={() => { setAperto(false); setAvviso(""); }}>Annulla</button>
        </span>
      )}
      {esito && <span className={esito.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ display: "block", width: "100%", padding: "6px 10px", margin: "4px 0 0", fontSize: 15 }}>{esito.testo}</span>}
    </span>
  );
}

// Eliminazione definitiva di un professionista (solo se SOSPESO): doppia conferma,
// la seconda scrivendo lo slug. Mostra prima cosa succederà (numeri dall'anteprima).
function EliminaProfessionista({ p, onFatto }) {
  const [aperto, setAperto] = useState(false);
  const [anteprima, setAnteprima] = useState(null);
  const [slug, setSlug] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState("");

  const apri = async () => {
    setAperto(true); setErrore("");
    const r = await fetch(`/api/admin/professionisti?anteprima=${p.id}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setErrore(d.error || "Errore");
    setAnteprima(d.anteprima);
  };
  const elimina = async () => {
    setInCorso(true); setErrore("");
    try {
      const r = await fetch("/api/admin/professionisti", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, conferma: slug.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setErrore(d.error || "Non sono riuscito a eliminare il profilo");
      onFatto(d);
    } catch {
      setErrore("Errore di rete: riprova tra poco");
    } finally {
      setInCorso(false);
    }
  };

  if (!aperto) return <button className="pf-btn pericolo compatto" onClick={apri}>Elimina definitivamente…</button>;
  return (
    <div style={{ width: "100%", marginTop: 10, padding: "14px 16px", border: "2px solid #fca5a5", borderRadius: 12, background: "#fff5f5" }}>
      <strong style={{ color: "#b91c1c" }}>Eliminazione definitiva di {p.name}</strong>
      {!anteprima && !errore && <p className="pf-note">Controllo cosa succederà…</p>}
      {anteprima && (
        <ul style={{ margin: "8px 0 10px", paddingLeft: 20, color: "var(--iw-slate)", fontSize: 16 }}>
          <li><strong>{anteprima.future}</strong> prenotazioni future verranno annullate{anteprima.future_con_email ? ` (${anteprima.future_con_email} pazienti avvisati via email, con il link per scegliere un altro infermiere)` : ""}</li>
          <li><strong>{anteprima.passate}</strong> prenotazioni passate restano, senza i suoi dati: comparirà «Professionista rimosso»</li>
          <li><strong>{anteprima.recensioni}</strong> recensioni cancellate · <strong>{anteprima.servizi}</strong> prestazioni e <strong>{anteprima.zone}</strong> zone tolte · {anteprima.candidature ? `la candidatura cancellata · ` : ""}accesso, 2FA, foto e contatti cancellati</li>
          <li>La scheda pubblica sparisce (404). Resta solo una riga di registro senza dati personali.</li>
        </ul>
      )}
      {anteprima && (
        <div className="pf-book" style={{ maxWidth: 420 }}>
          <label>Per confermare scrivi lo slug del profilo: <code>{anteprima.slug}</code></label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={anteprima.slug} autoComplete="off" />
        </div>
      )}
      {errore && <div className="pf-errore" style={{ marginBottom: 10 }}>{errore}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="pf-btn pericolo compatto" disabled={!anteprima || inCorso || slug.trim() !== anteprima.slug} onClick={elimina}>{inCorso ? "Elimino…" : "Elimina per sempre"}</button>
        <button className="pf-btn secondario compatto" disabled={inCorso} onClick={() => { setAperto(false); setSlug(""); }}>Annulla</button>
      </div>
    </div>
  );
}

function Professionisti({ filtroStato }) {
  const [lista, setLista] = useState(null);
  const [msg, setMsg] = useState(null);
  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => { setMsg({ tipo, testo }); clearTimeout(timerMsg.current); timerMsg.current = setTimeout(() => setMsg(null), 9000); };
  const [modifica, setModifica] = useState(null); // { id, nome }
  const carica = useCallback(() => {
    fetch("/api/admin/professionisti").then((r) => r.json()).then((d) => setLista(d.professionisti || []));
  }, []);
  useEffect(carica, [carica]);

  // Messaggio di esito in cima all'elenco: dopo un'azione su una card in fondo va portato in vista
  const msgRef = useRef(null);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);

  // Sospendi / Riattiva: la domanda è in pagina (ConfermaInline), non window.confirm
  const cambiaStato = async (p, status) => {
    try {
      const r = await fetch("/api/admin/professionisti", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, status }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return avvisa("err", d.error || "Non sono riuscito a cambiare lo stato: riprova");
      avvisa("ok", status === "suspended"
        ? `${p.name} sospeso ✅ La scheda non compare più nella ricerca.`
        : d.status === "network"
          ? `${p.name} riattivato ✅ È senza P.IVA: resta «in rete», non prenotabile.`
          : `${p.name} riattivato ✅ La scheda torna nella ricerca.`);
    } catch {
      avvisa("err", "Errore di rete: riprova tra poco");
    }
    carica();
  };

  if (modifica) return <ModificaScheda pid={modifica.id} nome={modifica.nome} onIndietro={() => { setModifica(null); carica(); }} />;
  if (!lista) return <Caricamento />;
  const visibili = filtroStato ? lista.filter((p) => p.status === filtroStato) : lista;
  const badgeStato = { active: ["done", "Attivo"], pending: ["noshow", "In attesa"], suspended: ["cancelled", "Sospeso"], network: ["active", "In rete (senza P.IVA)"] };
  // fallback: uno status non previsto non deve MAI far sparire tutta la lista
  const statoDi = (s) => badgeStato[s] || ["noshow", s || "—"];

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>👨‍⚕️ {filtroStato ? "Stato approvazione" : "Elenco infermieri"} ({visibili.length})</h2>
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}
      {visibili.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessun professionista{filtroStato ? " in questo stato" : ""}.</p></div>}
      {visibili.map((p) => (
        <div className="pf-panel" key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {p.photo_url && <img src={p.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />}
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong style={{ fontSize: 19, color: "var(--iw-navy)" }}>{p.name}</strong>
              <div className="pf-note" style={{ margin: 0 }}>
                {p.profession} · {p.city} ({p.province}){p.status === "active" ? <> · <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">scheda</a></> : <> · <span style={{ color: "var(--iw-muted)" }}>scheda non pubblica</span></>}
              </div>
            </div>
            <span className={`stato ${statoDi(p.status)[0]}`}>{statoDi(p.status)[1]}</span>
          </div>
          <div className="pf-note" style={{ margin: "8px 0" }}>
            🪪 {p.albo_name} n. {p.albo_number} (dal {p.albo_date || "—"}) · P.IVA {p.vat_number || "—"} · 📞 {p.phone} · ✉️ <span style={{ overflowWrap: "anywhere" }}>{p.email || "—"}</span>
            {/* la mappa prende i segnaposti dalle zone coperte: manca davvero solo se non c'è né l'una né l'altra cosa */}
            {!p.lat && !p.zone?.length && <> · ⚠️ senza segnaposto mappa</>}
          </div>
          {p.email_accesso && p.email_accesso.toLowerCase() !== String(p.email || "").toLowerCase() && (
            <div style={{ ...BOX_AVVISO, fontSize: 15, overflowWrap: "anywhere" }}>⚠️ Per entrare usa ancora <strong>{p.email_accesso}</strong>, diversa dall'email della scheda. Allineale con «Correggi email e rimanda il benvenuto».</div>
          )}
          {p.avviso_email && <div style={{ ...BOX_AVVISO, fontSize: 15 }}>⚠️ {p.avviso_email}</div>}
          <div className="pf-note" style={{ margin: "0 0 10px" }}>
            💉 {p.servizi} prestazioni · 📅 {p.prenotazioni_totali} richieste · ✅ {p.completate} completate · ❌ {p.annullate} annullate <span style={{ color: "var(--iw-muted)" }}>({p.prenotazioni_30gg} richieste negli ultimi 30 gg)</span>
            {Number(p.recensioni) > 0 && <> · ⭐ {String(p.rating).replace(".", ",")} ({p.recensioni})</>}
            {p.zone?.length > 0 && <> · 📍 {p.zone.join(", ")}</>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="pf-btn compatto" onClick={() => setModifica({ id: p.id, nome: p.name })}>✏️ Modifica scheda</button>
            {p.status !== "deleted" && p.status !== "suspended" && <CorreggiEmail p={p} onFatto={carica} />}
            {p.status !== "suspended"
              ? <ConfermaInline etichetta="Sospendi" domanda={`Sospendo ${p.name}? La scheda sparirà dalla ricerca.`} conferma="Sì, sospendi" onConferma={() => cambiaStato(p, "suspended")} />
              : <ConfermaInline etichetta="Riattiva" className="pf-btn compatto" classeConferma="pf-btn compatto" domanda={`Riattivo ${p.name}?`} conferma="Sì, riattiva" onConferma={() => cambiaStato(p, "active")} />}
            {p.status === "suspended" && (
              <EliminaProfessionista p={p} onFatto={(d) => {
                avvisa("ok", `Profilo eliminato ✅ Prenotazioni future annullate: ${d.future_annullate} (email inviate: ${d.email_inviate}) · passate conservate senza dati: ${d.passate_conservate} · recensioni cancellate: ${d.recensioni_cancellate}.`);
                carica();
              }} />
            )}
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

  // Errori e rifiuti: messaggio in pagina (niente alert/confirm: i browser li sopprimono)
  const [msg, setMsg] = useState(null);
  const msgRef = useRef(null);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);

  const gestisci = async (id, action) => {
    const nome = (candidature.find((x) => x.id === id) || {}).name || "la candidatura";
    const v = verifiche[id] || {};
    if (action === "approve" && (!v.piva || !v.albo)) {
      return setMsg({ tipo: "err", testo: "Prima di approvare spunta le due caselle: partita IVA verificata (Agenzia delle Entrate) e iscrizione all'albo verificata (FNOPI)." });
    }
    let r, d;
    try {
      r = await fetch("/api/admin/candidature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, verificaPiva: !!v.piva, verificaAlbo: !!v.albo }),
      });
      d = await r.json().catch(() => ({}));
    } catch {
      return setMsg({ tipo: "err", testo: "Errore di rete: riprova tra poco" });
    }
    if (!r.ok) return setMsg({ tipo: "err", testo: d.error || "Operazione non riuscita: riprova" });
    // la card sparisce dall'elenco (non è più «in attesa»): l'esito resta in cima, in vista
    if (action === "approve") { setMsg(null); setEsiti((e) => ({ ...e, [id]: { ...d, nome } })); }
    else setMsg({ tipo: "ok", testo: `Candidatura di ${nome} rifiutata. Gli è arrivata una email.` });
    carica();
  };
  const esitiRef = useRef(null);
  const nEsiti = Object.keys(esiti).length;
  useEffect(() => { if (nEsiti) esitiRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [nEsiti]);

  if (!candidature) return <Caricamento />;

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🪪 Verifica documenti — candidature in attesa ({candidature.length})</h2>
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}
      {nEsiti > 0 && (
        <div ref={esitiRef} style={{ scrollMarginTop: 96 }}>
          {Object.entries(esiti).map(([id, e]) => (
            <div key={id} className="pf-successo" style={{ marginBottom: 12, overflowWrap: "anywhere" }}>
              <strong>✅ {e.nome || "Candidatura"} approvato. Scheda: /p/{e.slug}</strong>
              {e.emailed
                ? <p style={{ margin: "6px 0 0" }}>Benvenuto inviato a <strong>{e.credenziali?.email}</strong>.</p>
                : <p style={{ margin: "6px 0 0" }}>⚠️ Email NON partita — comunica tu le credenziali: <code>{e.credenziali?.email}</code>{e.credenziali?.password ? <> / <code>{e.credenziali.password}</code></> : " (password scelta da lui in candidatura)"}</p>}
            </div>
          ))}
        </div>
      )}
      {candidature.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna candidatura da esaminare. 🎉</p></div>}
      {candidature.map((c) => (
        <div className="pf-panel" key={c.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <strong style={{ fontSize: 20, color: "var(--iw-navy)" }}>{c.name}</strong>
            <span className="pf-note">{dataIt(c.created_at)}</span>
          </div>
          <p style={{ margin: "6px 0", fontSize: 17, color: "var(--iw-slate)" }}>
            {c.profession} · {c.albo_name} n. {c.albo_number} (dal {c.albo_date}) · P.IVA {c.vat_number}<br />
            🧭 Attività: <strong>{(TIPI_ATTIVITA.find((t) => t.key === c.tipo) || TIPI_ATTIVITA[0]).nome}</strong><br />
            📍 {c.address ? `${c.address}, ` : ""}{c.city} ({c.province}) · 📞 <a href={`tel:${c.phone}`}>{c.phone}</a> · ✉️ <EmailCandidatura c={c} onCambiata={carica} />
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
              Ho verificato la <strong>partita IVA {c.vat_number}</strong> su Agenzia delle Entrate {c.vat_number ? "(risulta attiva)" : "— ATTENZIONE: candidatura SENZA P.IVA (pre-iscrizione: profilo non prenotabile finché non apre la P.IVA)"}
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
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="pf-btn" disabled={!((verifiche[c.id]||{}).piva && (verifiche[c.id]||{}).albo)} onClick={() => gestisci(c.id, "approve")}>✅ Approva e attiva</button>
              <ConfermaInline etichetta="Rifiuta" className="pf-btn pericolo" domanda={`Rifiuto la candidatura di ${c.name}? Riceverà una email.`} conferma="Sì, rifiuta" onConferma={() => gestisci(c.id, "reject")} />
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
  const [msg, setMsg] = useState(null);
  const msgRef = useRef(null);
  const carica = useCallback(() => {
    fetch("/api/admin/servizi").then((r) => r.json()).then((d) => setServizi(d.servizi || []));
  }, []);
  useEffect(carica, [carica]);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);
  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => { setMsg({ tipo, testo }); clearTimeout(timerMsg.current); timerMsg.current = setTimeout(() => setMsg(null), 8000); };

  // Le prestazioni "disattivate" comparivano qui senza nessun modo di toglierle:
  // bisognava sapere che si fa da Infermieri → Modifica scheda. Stesso endpoint, stessa regola
  // (con prenotazioni nello storico = archiviata, altrimenti cancellata).
  const togli = async (s) => {
    let r, d;
    try {
      r = await fetch(`/api/panel/servizi?id=${s.id}&pid=${s.professional_id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      d = await r.json().catch(() => ({}));
    } catch {
      return avvisa("err", "Errore di rete: riprova tra poco");
    }
    if (!r.ok) return avvisa("err", d.error || "Non sono riuscito a togliere la prestazione: riprova");
    setServizi((lista) => (lista || []).filter((x) => x.id !== s.id));
    avvisa("ok", d.archiviata
      ? `«${s.name}» tolta dalla scheda di ${s.professional_name} ✅ Aveva ${d.prenotazioni} prenotazion${d.prenotazioni === 1 ? "e" : "i"} nello storico: lì resta leggibile, ma non è più visibile né prenotabile.`
      : `«${s.name}» tolta dalla scheda di ${s.professional_name} ✅`);
    carica();
  };

  if (!servizi) return <Caricamento />;

  const perProfessionista = servizi.reduce((acc, s) => {
    (acc[s.professional_name] = acc[s.professional_name] || []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>💉 Catalogo prestazioni ({servizi.length})</h2>
      <p className="pf-note">
        Qui vedi cosa ha scelto ciascun professionista dal listino, col suo prezzo. Il <strong>listino</strong> —
        cioè quali prestazioni possono scegliere — lo decidiamo noi dalla sezione «Listino (lo decidiamo noi)».
        <br /><strong>Togli</strong> fa sparire la prestazione dalla scheda dell'infermiere (prezzi, attiva/disattiva e nuove prestazioni: da Infermieri → Modifica scheda).
      </p>
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}
      {Object.entries(perProfessionista).map(([nome, rows]) => (
        <div className="pf-panel" key={nome} style={{ marginBottom: 14 }}>
          <strong style={{ color: "var(--iw-navy)", fontSize: 18 }}>{nome} <span className="pf-note">· {rows[0].city}</span></strong>
          {rows.map((s) => (
            <div key={s.id} className="pf-servizio-row">
              <div>
                <span className="nome">{s.name}</span> {!s.active && <span className="stato cancelled">disattivata</span>}
                <div className="durata">{s.duration_min} min · {s.prenotazioni} prenotazioni ricevute</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div className="prezzo">da {euro(s.price_cents)}</div>
                <ConfermaInline etichetta="Togli" domanda={`Tolgo «${s.name}» dalla scheda di ${nome}?`} onConferma={() => togli(s)} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}


/* ============================ LISTINO (gestito da noi) ============================ */

// Il listino è l'elenco di prestazioni fra cui il professionista può scegliere.
// Lo decidono gli amministratori (Bruno ed Eduard): l'infermiere non può
// inventarsi voci nuove. Le voci "su misura" valgono per un solo professionista.
function Listino() {
  const [voci, setVoci] = useState(null);
  const [msg, setMsg] = useState(null);
  const [modifica, setModifica] = useState(null); // {id, nome, min, sugg, durata}
  const [nuova, setNuova] = useState({ aperta: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" });

  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => { setMsg({ tipo, testo }); clearTimeout(timerMsg.current); timerMsg.current = setTimeout(() => setMsg(null), 8000); };
  const carica = useCallback(() => {
    fetch("/api/admin/listino").then((r) => r.json()).then((d) => setVoci(d.voci || []));
  }, []);
  useEffect(carica, [carica]);

  const crea = async () => {
    const r = await fetch("/api/admin/listino", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nuova.nome, categoria: nuova.categoria,
        min_cents: eaCent(nuova.min || "0"), sugg_cents: eaCent(nuova.sugg || nuova.min || "0"),
        durata_min: nuova.categoria === "consulenza" ? 60 : Number(nuova.durata) || 30,
      }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", `"${nuova.nome}" aggiunta al listino: da ora i professionisti possono sceglierla.`);
    setNuova({ aperta: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" });
    carica();
  };

  const salva = async (v) => {
    const r = await fetch("/api/admin/listino", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, nome: modifica.nome, min_cents: eaCent(modifica.min), sugg_cents: eaCent(modifica.sugg), durata_min: Number(modifica.durata) || v.durata_min }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", d.rinominate ? `Salvato. Il nome nuovo è stato aggiornato anche su ${d.rinominate} scheda/e.` : "Salvato ✅");
    setModifica(null); carica();
  };

  const ritira = async (v) => {
    const r = await fetch("/api/admin/listino", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: v.id, active: !v.active }),
    });
    const d = await r.json();
    if (!r.ok) return avvisa("err", d.error);
    avvisa("ok", v.active
      ? `"${v.nome}" ritirata: nessuno può più aggiungerla. Chi ce l'ha già la mantiene.`
      : `"${v.nome}" di nuovo disponibile nel listino.`);
    carica();
  };

  // Elimina in due passaggi IN PAGINA (niente window.confirm): «Elimino X?» e, se la voce è
  // nelle schede di qualcuno, una seconda domanda: «la tolgo anche dalle loro schede?».
  const [eliminando, setEliminando] = useState(null); // { id, fase: "domanda" | "in-uso", testo }
  const [inCorsoElimina, setInCorsoElimina] = useState(false);
  const elimina = async (v, ancheDalleSchede = false) => {
    setInCorsoElimina(true);
    try {
      const r = await fetch(`/api/admin/listino?id=${v.id}${ancheDalleSchede ? "&anche_dalle_schede=1" : ""}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      const d = await r.json().catch(() => ({}));
      if (r.status === 409 && !ancheDalleSchede) return setEliminando({ id: v.id, fase: "in-uso", testo: d.error });
      setEliminando(null);
      if (!r.ok) return avvisa("err", d.error || "Non sono riuscito a eliminarla: riprova");
      avvisa("ok", `"${v.nome}" eliminata dal listino${d.archiviate || d.cancellate ? ` (tolta da ${(d.archiviate || 0) + (d.cancellate || 0)} scheda/e)` : ""}.`);
      carica();
    } catch {
      avvisa("err", "Errore di rete: riprova tra poco");
    } finally {
      setInCorsoElimina(false);
    }
  };
  const msgRef = useRef(null);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);

  if (!voci) return <Caricamento />;
  const generali = voci.filter((v) => !v.professional_id);
  const perGruppo = (cat) => generali.filter((v) => v.categoria === cat);
  const suMisura = voci.filter((v) => v.professional_id);

  const riga = (v) => (
    <div key={v.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid var(--iw-line, #eee)", opacity: v.active ? 1 : 0.55 }}>
      {modifica && modifica.id === v.id ? (
        <>
          <input style={{ flex: 1, minWidth: 200, marginBottom: 0 }} value={modifica.nome} onChange={(e) => setModifica({ ...modifica, nome: e.target.value })} />
          <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 4 }}>min €<input style={{ width: 76, marginBottom: 0 }} value={modifica.min} onChange={(e) => setModifica({ ...modifica, min: e.target.value })} /></label>
          <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 4 }}>cons. €<input style={{ width: 76, marginBottom: 0 }} value={modifica.sugg} onChange={(e) => setModifica({ ...modifica, sugg: e.target.value })} /></label>
          {v.categoria !== "consulenza" && (
            <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 4 }}>min.<input type="number" min={5} max={480} step={5} style={{ width: 76, marginBottom: 0 }} value={modifica.durata} onChange={(e) => setModifica({ ...modifica, durata: e.target.value })} /></label>
          )}
          <button className="pf-btn compatto" onClick={() => salva(v)}>Salva</button>
          <button className="pf-btn secondario compatto" onClick={() => setModifica(null)}>Annulla</button>
        </>
      ) : (
        <>
          <strong style={{ flex: 1, minWidth: 180, color: "var(--iw-navy)" }}>
            {v.nome}
            {!v.active && <span className="pf-note" style={{ margin: 0 }}> · ritirata</span>}
            {v.professional_name && <span className="pf-note" style={{ margin: 0 }}> · solo per {v.professional_name}</span>}
          </strong>
          <span className="pf-note" style={{ margin: 0 }}>
            min {euro(v.min_cents)} · consigliato {euro(v.sugg_cents)}{v.categoria === "consulenza" ? "/ora" : ` · ${v.durata_min} min`}
          </span>
          <span className="pf-note" style={{ margin: 0 }}>{Number(v.in_uso) > 0 ? `usata da ${v.in_uso}` : "non usata"}</span>
          <button className="pf-btn secondario compatto" onClick={() => setModifica({ id: v.id, nome: v.nome, min: (v.min_cents / 100).toFixed(2).replace(".", ","), sugg: (v.sugg_cents / 100).toFixed(2).replace(".", ","), durata: String(v.durata_min) })}>Modifica</button>
          <button className="pf-btn secondario compatto" onClick={() => ritira(v)}>{v.active ? "Ritira" : "Rimetti"}</button>
          {eliminando?.id !== v.id && <button className="pf-btn pericolo compatto" onClick={() => setEliminando({ id: v.id, fase: "domanda" })}>Elimina</button>}
          {eliminando?.id === v.id && (
            <span className="pf-conferma-inline" role="group" aria-label={`Elimina ${v.nome}`} style={{ width: "100%" }}>
              <span style={{ flex: "1 1 220px" }}>{eliminando.fase === "domanda" ? `Elimino «${v.nome}» dal listino?` : eliminando.testo}</span>
              <button type="button" className="pf-btn pericolo compatto" disabled={inCorsoElimina} onClick={() => elimina(v, eliminando.fase === "in-uso")}>
                {inCorsoElimina ? "…" : eliminando.fase === "domanda" ? "Sì, elimina" : "Sì, toglila anche dalle schede"}
              </button>
              <button type="button" className="pf-btn secondario compatto" disabled={inCorsoElimina} onClick={() => setEliminando(null)}>{eliminando.fase === "domanda" ? "No" : "No, lascia stare"}</button>
            </span>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>💉 Listino prestazioni</h2>
      <p className="pf-note">
        Questo è l'elenco fra cui i professionisti possono scegliere: lo decidiamo noi.
        Loro scelgono le voci e il proprio prezzo (mai sotto il minimo), ma non possono aggiungerne di nuove.
        <br /><strong>Ritira</strong> = nessuno può più sceglierla, chi ce l'ha già la mantiene.
        <strong> Elimina</strong> = via del tutto (se è in uso te lo diciamo prima).
        Per una prestazione destinata a <strong>un solo infermiere</strong>, aprila da Infermieri → «✏️ Modifica scheda».
      </p>
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}

      <div className="pf-panel" style={{ marginBottom: 14 }}>
        {!nuova.aperta ? (
          <button className="pf-btn" onClick={() => setNuova({ ...nuova, aperta: true })}>✚ Aggiungi una prestazione al listino</button>
        ) : (
          <div className="pf-book" style={{ maxWidth: 560 }}>
            <label>Nome della prestazione *</label>
            <input value={nuova.nome} onChange={(e) => setNuova({ ...nuova, nome: e.target.value })} placeholder="es. Terapia iniettiva intramuscolo" />
            <label>Tipo</label>
            <select value={nuova.categoria} onChange={(e) => setNuova({ ...nuova, categoria: e.target.value })}>
              <option value="domicilio">A domicilio (per i pazienti)</option>
              <option value="consulenza">Consulenza a ora (per i colleghi)</option>
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><label>Prezzo minimo (€) *</label><input inputMode="decimal" value={nuova.min} onChange={(e) => setNuova({ ...nuova, min: e.target.value })} /></div>
              <div><label>Consigliato (€)</label><input inputMode="decimal" value={nuova.sugg} onChange={(e) => setNuova({ ...nuova, sugg: e.target.value })} /></div>
              <div><label>Durata (min)</label><input type="number" min={5} max={480} step={5} disabled={nuova.categoria === "consulenza"} value={nuova.categoria === "consulenza" ? 60 : nuova.durata} onChange={(e) => setNuova({ ...nuova, durata: e.target.value })} /></div>
            </div>
            <p className="pf-note" style={{ marginTop: -4 }}>Le consulenze durano sempre un'ora e il prezzo si intende all'ora.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="pf-btn compatto" onClick={crea} disabled={!nuova.nome.trim()}>Aggiungi al listino</button>
              <button className="pf-btn secondario compatto" onClick={() => setNuova({ aperta: false, nome: "", categoria: "domicilio", min: "", sugg: "", durata: "30" })}>Annulla</button>
            </div>
          </div>
        )}
      </div>

      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>🏠 A domicilio, per i pazienti ({perGruppo("domicilio").length})</h3>
        {perGruppo("domicilio").map(riga)}
      </div>

      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>🎓 Consulenze a ora, per i colleghi ({perGruppo("consulenza").length})</h3>
        {perGruppo("consulenza").map(riga)}
      </div>

      {suMisura.length > 0 && (
        <div className="pf-panel">
          <h3 style={{ marginTop: 0 }}>✚ Prestazioni su misura ({suMisura.length})</h3>
          <p className="pf-note" style={{ marginTop: 0 }}>Valgono per un solo professionista: nessun altro le vede nel proprio pannello.</p>
          {suMisura.map(riga)}
        </div>
      )}
    </div>
  );
}

/* ============================ SPECIALIZZAZIONI (lista gestita da noi) ============================ */

function Specializzazioni() {
  const [voci, setVoci] = useState(null);
  const [msg, setMsg] = useState(null);
  const [nuova, setNuova] = useState("");
  const [modifica, setModifica] = useState(null); // {id, nome}
  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => { setMsg({ tipo, testo }); clearTimeout(timerMsg.current); timerMsg.current = setTimeout(() => setMsg(null), 8000); };
  const carica = useCallback(() => {
    fetch("/api/admin/specializzazioni").then((r) => r.json()).then((d) => setVoci(d.voci || []));
  }, []);
  useEffect(carica, [carica]);

  const chiama = async (metodo, body, query = "") => {
    const r = await fetch(`/api/admin/specializzazioni${query}`, { method: metodo, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { avvisa("err", d.error || "Errore"); return null; }
    return d;
  };
  const crea = async () => {
    const d = await chiama("POST", { nome: nuova });
    if (!d) return;
    avvisa("ok", `"${nuova}" aggiunta: da ora gli infermieri possono spuntarla.`); setNuova(""); carica();
  };
  const salva = async (v) => {
    const d = await chiama("PATCH", { id: v.id, nome: modifica.nome });
    if (!d) return;
    avvisa("ok", "Salvato ✅"); setModifica(null); carica();
  };
  const ritira = async (v) => {
    const d = await chiama("PATCH", { id: v.id, active: !v.active });
    if (!d) return;
    avvisa("ok", v.active ? `"${v.nome}" ritirata: non compare più né nei pannelli né sulle schede.` : `"${v.nome}" di nuovo disponibile.`); carica();
  };
  const elimina = async (v) => {
    const d = await chiama("DELETE", null, `?id=${v.id}`);
    if (!d) return;
    avvisa("ok", `"${v.nome}" eliminata${d.tolte_da ? ` (tolta da ${d.tolte_da} scheda/e)` : ""}.`); carica();
  };

  if (!voci) return <Caricamento />;
  const generali = voci.filter((v) => !v.professional_id);
  const suMisura = voci.filter((v) => v.professional_id);
  const riga = (v) => (
    <div key={v.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid var(--iw-line, #eee)", opacity: v.active ? 1 : 0.55 }}>
      {modifica && modifica.id === v.id ? (
        <>
          <input className="pf-book" style={{ flex: 1, minWidth: 200, marginBottom: 0 }} value={modifica.nome} onChange={(e) => setModifica({ ...modifica, nome: e.target.value })} />
          <button className="pf-btn compatto" onClick={() => salva(v)}>Salva</button>
          <button className="pf-btn secondario compatto" onClick={() => setModifica(null)}>Annulla</button>
        </>
      ) : (
        <>
          <strong style={{ flex: 1, minWidth: 180, color: "var(--iw-navy)" }}>
            {v.nome}{!v.active && <span className="pf-note" style={{ margin: 0 }}> · ritirata</span>}
            {v.professional_name && <span className="pf-note" style={{ margin: 0 }}> · solo per {v.professional_name}</span>}
          </strong>
          <span className="pf-note" style={{ margin: 0 }}>{Number(v.in_uso) > 0 ? `scelta da ${v.in_uso}` : "non ancora scelta"}</span>
          <button className="pf-btn secondario compatto" onClick={() => setModifica({ id: v.id, nome: v.nome })}>Rinomina</button>
          <button className="pf-btn secondario compatto" onClick={() => ritira(v)}>{v.active ? "Ritira" : "Rimetti"}</button>
          <ConfermaInline etichetta="Elimina" domanda={`Elimino «${v.nome}»${Number(v.in_uso) > 0 ? ` anche da ${v.in_uso} scheda/e` : ""}?`} conferma="Sì, elimina" onConferma={() => elimina(v)} />
        </>
      )}
    </div>
  );

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>🎓 Specializzazioni</h2>
      <p className="pf-note">
        La lista fra cui gli infermieri possono scegliere (fino a 5 a testa, dal loro pannello o da «Modifica scheda»).
        Sono <strong>dichiarate dal professionista</strong>: sulla scheda pubblica compaiono con questa nota.
        <strong> Ritira</strong> = sparisce da pannelli e schede ma resta in lista. <strong>Elimina</strong> = via del tutto.
      </p>
      {msg && <div className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{msg.testo}</div>}
      <div className="pf-panel pf-book" style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input style={{ marginBottom: 0, flex: 1, minWidth: 240 }} value={nuova} onChange={(e) => setNuova(e.target.value)} placeholder="Nuova specializzazione (es. Ventilazione domiciliare)" />
        <button className="pf-btn compatto" disabled={nuova.trim().length < 3} onClick={crea}>✚ Aggiungi alla lista</button>
      </div>
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Per tutti ({generali.length})</h3>
        {generali.map(riga)}
      </div>
      {suMisura.length > 0 && (
        <div className="pf-panel">
          <h3 style={{ marginTop: 0 }}>Su misura ({suMisura.length})</h3>
          <p className="pf-note" style={{ marginTop: 0 }}>Valgono per un solo professionista (si creano da Infermieri → Modifica scheda).</p>
          {suMisura.map(riga)}
        </div>
      )}
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

  // esito in pagina (niente alert: i browser lo sopprimono) e portato in vista
  const [msg, setMsg] = useState(null);
  const msgRef = useRef(null);
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);
  const modera = async (id, action) => {
    try {
      const r = await fetch("/api/admin/recensioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); return setMsg({ tipo: "err", testo: d.error || "Errore nella moderazione" }); }
      setMsg({ tipo: "ok", testo: action === "publish" ? "Recensione pubblicata ✅" : "Recensione rifiutata." });
    } catch {
      return setMsg({ tipo: "err", testo: "Errore di rete: riprova tra poco" });
    }
    carica();
  };

  if (!recensioni) return <Caricamento />;
  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>⭐ Recensioni da moderare ({recensioni.length})</h2>
      {msg && <div ref={msgRef} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{msg.testo}</div>}
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
        Le recensioni Google restano su Google (importarle è vietato dai loro termini): un professionista PUÒ
        mostrare il badge del proprio profilo Google nella scheda (campo google_rating), ma oggi nessuno lo usa
        (Eduard l'ha tolto dalla sua scheda il 17/8/26).
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

// Scarica una tabella come CSV (per newsletter, richieste, ecc.)
function scaricaCsv(righe, colonne, nomeFile) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const testo = [colonne.map((c) => esc(c.label)).join(",")]
    .concat(righe.map((r) => colonne.map((c) => esc(c.get(r))).join(",")))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + testo], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = nomeFile; a.click();
  URL.revokeObjectURL(url);
}

function Contatti() {
  const [dati, setDati] = useState(null);
  useEffect(() => {
    fetch("/api/admin/contatti").then((r) => r.json()).then(setDati);
  }, []);
  if (!dati) return <Caricamento />;
  const data = (d) => new Date(d).toLocaleDateString("it-IT");
  const richieste = dati.richieste || [], newsletter = dati.newsletter || [];

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>💬 Richieste dal sito</h2>

      {/* Modulo "Richiedi informazioni" */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, margin: "18px 0 8px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, color: "var(--iw-navy)" }}>📩 Richiedi informazioni ({richieste.length})</h3>
        {richieste.length > 0 && <button className="pf-btn secondario compatto" onClick={() => scaricaCsv(richieste, [
          { label: "Data", get: (r) => data(r.created_at) }, { label: "Tipo", get: (r) => r.reason },
          { label: "Nome", get: (r) => r.name }, { label: "Email", get: (r) => r.email },
          { label: "Telefono", get: (r) => r.phone }, { label: "Città", get: (r) => r.city },
          { label: "Messaggio", get: (r) => r.message }, { label: "Newsletter", get: (r) => r.newsletter ? "sì" : "no" },
        ], "richieste-info.csv")}>⬇️ CSV</button>}
      </div>
      {richieste.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna richiesta di informazioni.</p></div>}
      {richieste.map((r) => (
        <div className="pf-panel" key={r.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <strong>{r.name} {r.reason && <span className="stato noshow" style={{ marginLeft: 6 }}>{r.reason}</span>}</strong>
            <span className="pf-note">{data(r.created_at)}</span>
          </div>
          <div className="pf-note" style={{ margin: "4px 0" }}>
            ✉️ <a href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <> · 📞 <a href={`tel:${r.phone}`}>{r.phone}</a></>}{r.city && <> · 📍 {r.city}</>}
          </div>
          {r.message && <div style={{ fontSize: 15.5 }}>{r.message}</div>}
        </div>
      ))}

      {/* Newsletter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, margin: "24px 0 8px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, color: "var(--iw-navy)" }}>📰 Iscritti newsletter ({newsletter.length})</h3>
        {newsletter.length > 0 && <button className="pf-btn secondario compatto" onClick={() => scaricaCsv(newsletter, [
          { label: "Email", get: (r) => r.email }, { label: "Fonte", get: (r) => r.source },
          { label: "Consenso del", get: (r) => new Date(r.consent_at).toLocaleString("it-IT") },
        ], "iscritti-newsletter.csv")}>⬇️ Scarica CSV</button>}
      </div>
      {newsletter.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessun iscritto alla newsletter.</p></div>}
      {newsletter.length > 0 && <div className="pf-panel"><p className="pf-note" style={{ margin: 0 }}>{newsletter.length} consensi raccolti. Scarica il CSV per spedire con lo strumento email.</p></div>}

      {/* Lista d'attesa zone scoperte */}
      <h3 style={{ margin: "24px 0 8px", color: "var(--iw-navy)" }}>📍 Lista d'attesa — zone scoperte ({dati.listaAttesa.length})</h3>
      <p className="pf-note" style={{ marginTop: 0 }}>Chi cerca in una zona senza professionisti lascia l'email: è la mappa di DOVE aprire dopo.</p>
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
          <span className="pf-note">{data(r.created_at)}</span>
        </div>
      ))}
      {dati.listaAttesa.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna zona in lista d'attesa.</p></div>}
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
    const r = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" } });
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

  // Disattiva 2FA: prima la domanda IN PAGINA (niente window.confirm), poi la richiesta
  const [chiediSpegni, setChiediSpegni] = useState(false);
  const [spegnendo, setSpegnendo] = useState(false);
  const tfaMsgRef = useRef(null);
  useEffect(() => { if (tfaMsg) tfaMsgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [tfaMsg]);
  const spegniTfa = (e) => {
    e.preventDefault();
    setTfaMsg(null);
    setChiediSpegni(true);
  };
  const confermaSpegniTfa = async () => {
    setSpegnendo(true);
    try {
      const r = await fetch("/api/panel/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", password: disattiva.password, code: disattiva.code }),
      });
      const d = await r.json().catch(() => ({}));
      setChiediSpegni(false);
      if (!r.ok) return setTfaMsg({ err: d.error || "Non sono riuscito a disattivarla" });
      setDisattiva({ password: "", code: "" });
      setTfaMsg({ ok: "Due fattori disattivati." });
      caricaTfa();
    } catch {
      setTfaMsg({ err: "Errore di rete: riprova tra poco" });
    } finally {
      setSpegnendo(false);
    }
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
        {tfaMsg && <div ref={tfaMsgRef} className={tfaMsg.err ? "pf-errore" : "pf-successo"} style={{ scrollMarginTop: 96 }}>{tfaMsg.err || tfaMsg.ok}</div>}

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
            {!chiediSpegni ? <button className="pf-btn pericolo">Disattiva 2FA</button> : (
              <span className="pf-conferma-inline" role="group" aria-label="Disattiva la verifica in due passaggi">
                <span>Disattivo la verifica in due passaggi? L'account resterà protetto dalla sola password.</span>
                <button type="button" className="pf-btn pericolo compatto" disabled={spegnendo} onClick={confermaSpegniTfa}>{spegnendo ? "…" : "Sì, disattiva"}</button>
                <button type="button" className="pf-btn secondario compatto" disabled={spegnendo} onClick={() => setChiediSpegni(false)}>No</button>
              </span>
            )}
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

  // il timer del messaggio precedente non deve cancellare quello nuovo (azioni di fila)
  const timerMsg = useRef(null);
  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    clearTimeout(timerMsg.current);
    timerMsg.current = setTimeout(() => setMessaggio(null), 8000);
  };

  // BUG (7/10/26): l'editor si apre SOPRA l'elenco; cliccando «Modifica» su un articolo in
  // basso il browser tiene fermo l'elenco (scroll anchoring) e l'editor resta fuori dallo
  // schermo, 1.300-2.000 px più in alto → sembra che il tasto non faccia nulla. Dal 5° articolo
  // in poi su computer, dal 3° su telefono. Rimedio: si scorre all'editor appena si apre e,
  // mentre si modifica, l'elenco sparisce (torna con Annulla o dopo il salvataggio).
  const editorRef = useRef(null);
  const msgRef = useRef(null);
  const editorAperto = editor ? String(editor.id || "nuovo") : null; // chiave stabile (l'oggetto cambia a ogni tasto)
  useEffect(() => {
    if (!editorAperto) return;
    const vai = () => editorRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    // Il primo scorrimento è immediato; poi si ricontrolla un paio di volte perché su
    // telefono il browser "riallinea" lo scroll da solo quando la pagina si accorcia
    // (l'elenco sparisce) e quando arriva l'anteprima della copertina: se l'editor è
    // finito fuori dalla parte alta dello schermo, lo si riporta in cima.
    vai();
    const fuori = () => { const r = editorRef.current?.getBoundingClientRect(); return r && (r.top < 0 || r.top > 160); };
    const timer = [300, 900].map((ms) => setTimeout(() => { if (fuori()) vai(); }, ms));
    return () => timer.forEach(clearTimeout);
  }, [editorAperto]);
  useEffect(() => {
    if (messaggio) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messaggio]);

  const nuovo = () => setEditor({ title: "", category: "Salute", excerpt: "", image: "", body_raw: "", body_html: "", body_format: "html", cover_data: "" });

  // Un articolo «raw» (testo con ## Titolo) si apre com'è; con questo tasto lo si porta
  // nell'editor visuale (conversione fatta dal server). Diventa definitivo solo salvando.
  const [converto, setConverto] = useState(false);
  const convertiInVisuale = async () => {
    setConverto(true);
    try {
      const r = await fetch(`/api/admin/blog?converti=${editor.id}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return avvisa("err", d.error || "Conversione non riuscita");
      setEditor((ed) => ({ ...ed, body_format: "html", body_html: d.html }));
      avvisa("ok", "Articolo convertito nell'editor visuale: controlla il testo e salva. I riquadri speciali (sintesi, fonti, modulo) restano solo nel formato testo.");
    } finally {
      setConverto(false);
    }
  };

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
    let r, d;
    try {
      r = await fetch("/api/admin/blog", {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editor, publish }),
      });
      d = await r.json().catch(() => ({}));
    } catch {
      // senza questo, un errore di rete lasciava il tasto su "Salvo…" per sempre
      setSalvo(false);
      return avvisa("err", "Errore di rete: l'articolo non è stato salvato, riprova tra poco");
    }
    setSalvo(false);
    if (!r.ok) return avvisa("err", d.error || `Salvataggio non riuscito (errore ${r.status}): riprova`);
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
    else { const d = await r.json().catch(() => ({})); avvisa("err", d.error || "Errore nell'operazione"); }
  };

  // Elimina: la domanda è in pagina (ConfermaInline). Con window.confirm, dopo qualche
  // finestra il browser la sopprimeva e il tasto sembrava morto (stesso bug delle prestazioni).
  const elimina = async (art) => {
    try {
      const r = await fetch(`/api/admin/blog?id=${art.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return avvisa("err", d.error || "Errore nell'eliminazione: riprova");
      setArticoli((lista) => (lista || []).filter((a) => a.id !== art.id)); // sparisce subito
      avvisa("ok", `«${art.title}» eliminato ✅ Non è più sul sito.`);
    } catch {
      avvisa("err", "Errore di rete: l'articolo non è stato eliminato, riprova tra poco");
    }
    carica();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h2 style={{ color: "var(--iw-navy)", margin: 0 }}>📝 Articoli del blog</h2>
        {!editor && <button className="pf-btn" onClick={nuovo}>+ Nuovo articolo</button>}
      </div>

      {messaggio && <div ref={msgRef} className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }}>{messaggio.testo}</div>}

      {editor && (
        <div ref={editorRef} className="pf-panel pf-book adm-editor-top" style={{ marginBottom: 18 }}>
          <h2>{editor.id ? "Modifica articolo" : "Nuovo articolo"}</h2>
          {editor.id && <p className="pf-note" style={{ marginTop: -6 }}>Stai modificando «{editor.title}». L'elenco degli articoli torna con <strong>Annulla</strong> o dopo il salvataggio.</p>}
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
          {editor.body_format === "html" ? (
            <>
              <label>Testo * <span style={{ fontWeight: 400 }}>(grassetto, corsivo, sottolineato, colore, titoli, elenchi, link · «Titolo» = nuova sezione nell'indice)</span></label>
              <React.Suspense fallback={<p className="pf-note">Carico l'editor…</p>}>
                <EditorArticolo html={editor.body_html || ""} onChange={(h) => setEditor((ed) => ({ ...ed, body_html: h }))} />
              </React.Suspense>
            </>
          ) : (
            <>
              <label>Testo * <span style={{ fontWeight: 400 }}>(riga con «## Titolo» = nuova sezione · riga vuota = nuovo paragrafo · «- » = elenco)</span></label>
              <textarea rows={16} value={editor.body_raw} onChange={(e) => setEditor({ ...editor, body_raw: e.target.value })} style={{ fontFamily: "inherit" }} placeholder={"## Introduzione\n\nPrimo paragrafo...\n\n## Quando serve\n\n- primo punto\n- secondo punto"} />
              {editor.id && (
                <p className="pf-note" style={{ marginTop: -4 }}>
                  Questo articolo è nel formato testo. <button type="button" className="pf-btn secondario compatto" disabled={converto} onClick={convertiInVisuale}>{converto ? "Converto…" : "Converti nell'editor visuale"}</button>
                  {" "}(colori, grassetto, link cliccabili). Se usa i riquadri speciali «sintesi», «fonti» o «modulo», meglio lasciarlo così.
                </p>
              )}
            </>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pf-btn" disabled={salvo} onClick={() => salva(true)}>{salvo ? "Salvo…" : "Pubblica"}</button>
            <button className="pf-btn secondario" disabled={salvo} onClick={() => salva(false)}>Salva bozza</button>
            <button className="pf-btn pericolo" type="button" onClick={() => setEditor(null)}>Annulla</button>
          </div>
        </div>
      )}

      {!articoli && <Caricamento />}
      {articoli && !editor && articoli.map((art) => (
        <div className="pf-panel" key={art.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ color: "var(--iw-navy)" }}>{art.title}</strong>
            <div className="pf-note" style={{ margin: 0 }}>
              {art.category} · {art.status === "published" ? `pubblicato il ${new Date(art.published_at).toLocaleDateString("it-IT")}` : "BOZZA"}
              {art.status === "published" && <> · <a href={`/articoli/${art.slug}`} target="_blank" rel="noreferrer">vedi</a></>}
            </div>
          </div>
          <span className={`stato ${art.status === "published" ? "done" : "noshow"}`}>{art.status === "published" ? "Online" : "Bozza"}</span>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="pf-btn secondario compatto" onClick={() => setEditor({ id: art.id, title: art.title, category: art.category, excerpt: art.excerpt, image: art.image, body_raw: art.body_raw, body_html: art.body_html || "", body_format: art.body_format === "html" ? "html" : "raw" })}>Modifica</button>
            <button className="pf-btn secondario compatto" onClick={() => cambiaStato(art)}>{art.status === "published" ? "Ritira" : "Pubblica"}</button>
            <ConfermaInline etichetta="Elimina" domanda={`Elimino «${art.title}» per sempre?`} conferma="Sì, elimina" onConferma={() => elimina(art)} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================ SCRIVI AGLI INFERMIERI ============================ */

// «✉️ Scrivi agli infermieri» (7/10/26): una comunicazione a tutti gli infermieri scelti,
// una email per persona (Brevo, ~400 ms fra l'una e l'altra). Non è la «Newsletter».
// La bozza resta nel browser mentre si scrive: un testo lungo non si perde ricaricando.
// La chiave anti-doppio-invio fa parte della bozza: un doppio clic o una pagina
// ricaricata non rimandano niente; cambiando il testo nasce una comunicazione nuova.
const BOZZA_SCRIVI = "iw_admin_scrivi_bozza_v1";
const nuovaChiave = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
const leggiBozzaScrivi = () => { try { return JSON.parse(localStorage.getItem(BOZZA_SCRIVI) || "null") || {}; } catch { return {}; } };
const scriviBozzaScrivi = (b) => {
  try {
    if (b) localStorage.setItem(BOZZA_SCRIVI, JSON.stringify(b));
    else localStorage.removeItem(BOZZA_SCRIVI);
  } catch { /* browser senza memoria (privata, piena): la pagina funziona lo stesso */ }
};
const numeroIt = (n) => Number(n || 0).toLocaleString("it-IT");
const escTesto = (r) => r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// passaggi fra «Testo semplice» ed editor (la regola vera, per la mail, la applica il server)
const testoInHtml = (t) => String(t || "").replace(/\r\n?/g, "\n").split(/\n[ \t]*\n/).filter((b) => b.trim())
  .map((b) => `<p>${b.replace(/^\n+|\n+$/g, "").split("\n").map(escTesto).join("<br>")}</p>`).join("");
const htmlInTesto = (h) => {
  const conAcapo = String(h || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n\n");
  const doc = new DOMParser().parseFromString(conAcapo, "text/html"); // non esegue nulla
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
};
const STATO_DEST = { active: ["done", "Attivo"], network: ["active", "Rete"], suspended: ["cancelled", "Sospeso"] };
const ETICHETTE_STATI = [["active", "Attivi"], ["network", "Rete (senza P.IVA)"], ["suspended", "Sospesi"]];

// La mail come la riceve una persona, in una cornice chiusa (niente script)
function AnteprimaEmail({ html, titolo }) {
  const ref = useRef(null);
  const adatta = () => {
    try { const doc = ref.current?.contentDocument; if (doc) ref.current.style.height = `${doc.documentElement.scrollHeight + 4}px`; } catch { /* niente */ }
  };
  return (
    <iframe ref={ref} title={titolo} className="iw-scrivi-anteprima" sandbox="allow-same-origin" onLoad={adatta}
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:12px 8px;background:#f6f9f9">${html}</body></html>`} />
  );
}

function EsitoInvio({ c }) {
  const fatte = Number(c.riuscite || 0) + Number(c.non_riuscite || 0);
  const ko = Array.isArray(c.elenco_non_riuscite) ? c.elenco_non_riuscite : [];
  return (
    <div>
      {c.stato === "in_corso" && (
        <div className="pf-successo" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" }}>
          ⏳ Invio in corso: <strong>{fatte} di {c.destinatari}</strong>. Puoi restare su questa pagina.
          <div style={{ height: 8, background: "#dbeafe", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((fatte / Math.max(1, c.destinatari)) * 100)}%`, background: "#2563eb" }} />
          </div>
        </div>
      )}
      {c.stato === "finita" && (
        <div className={Number(c.non_riuscite) ? "pf-errore" : "pf-successo"}>
          {Number(c.non_riuscite) ? "⚠️" : "✅"} Inviate: <strong>{c.riuscite}</strong> · Non riuscite: <strong>{c.non_riuscite}</strong>
        </div>
      )}
      {c.stato === "interrotta" && (
        <div className="pf-errore">⚠️ Invio interrotto: ne sono partite <strong>{c.riuscite} di {c.destinatari}</strong>. Le altre non sono partite.</div>
      )}
      {ko.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Non riuscite:</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
            {ko.map((k) => <li key={k.id} style={{ overflowWrap: "anywhere" }}>{k.nome} — {k.email} <span className="pf-note" style={{ margin: 0 }}>({k.errore})</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScriviInfermieri() {
  const [bozza0] = useState(leggiBozzaScrivi);
  const [dati, setDati] = useState(null);
  const [errCarica, setErrCarica] = useState("");
  const [stati, setStati] = useState(bozza0.stati || { active: true, network: true, suspended: false });
  const [tolti, setTolti] = useState(Array.isArray(bozza0.tolti) ? bozza0.tolti : null); // null = di base (amministratori tolti)
  const [mostraElenco, setMostraElenco] = useState(true);
  const [oggetto, setOggetto] = useState(bozza0.oggetto || "");
  const [formato, setFormato] = useState(bozza0.formato === "testo" ? "testo" : "visuale");
  const [html, setHtml] = useState(bozza0.html || "");
  const [testo, setTesto] = useState(bozza0.testo || "");
  const [caratteriEditor, setCaratteriEditor] = useState(0);
  const [chiave, setChiave] = useState(bozza0.chiave || nuovaChiave);
  const [inviata, setInviata] = useState(!!bozza0.inviata);
  const [editorKey, setEditorKey] = useState(0);
  const [anteprima, setAnteprima] = useState(null);
  const [msg, setMsg] = useState(null);
  const [occupato, setOccupato] = useState("");
  const [conferma, setConferma] = useState(false);
  const [invio, setInvio] = useState(null);
  const [dettaglio, setDettaglio] = useState(null);
  const inviando = useRef(false);
  const msgRef = useRef(null);
  const invioRef = useRef(null);
  const anteprimaRef = useRef(null);
  const testoRef = useRef(null);

  const nMsg = useRef(0); // ogni messaggio è «nuovo» (si riporta in vista anche se il testo è uguale)
  const avvisa = (tipo, t) => { nMsg.current += 1; setMsg({ tipo, testo: t, n: nMsg.current }); };
  useEffect(() => { if (msg) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msg]);
  useEffect(() => { if (anteprima) anteprimaRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [anteprima]);
  const statoInvio = invio ? `${invio.id}-${invio.stato}` : "";
  useEffect(() => { if (statoInvio) invioRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [statoInvio]);

  const carica = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/comunicazioni");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore");
      setDati(d);
      return d;
    } catch (e) {
      setErrCarica(e.message || "Errore di rete");
      return null;
    }
  }, []);
  // primo caricamento (scritto per esteso: carica() serve dopo, per aggiornare)
  useEffect(() => {
    fetch("/api/admin/comunicazioni")
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Errore"); return d; })
      .then((d) => {
        setDati(d);
        // di base gli amministratori (soci) sono tolti: si rimettono con un clic
        setTolti((t) => t ?? d.destinatari.filter((x) => x.admin).map((x) => x.id));
        // la bozza era già partita (pagina ricaricata dopo l'invio)? allora si mostra com'è andata
        const gia = d.storico.find((c) => c.chiave === chiave);
        if (gia) { setInviata(true); setInvio(gia); return; }
        const corso = d.storico.find((c) => c.stato === "in_corso");
        if (corso) setInvio(corso);
      })
      .catch((e) => setErrCarica(e.message || "Errore di rete"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // progressi dell'invio, ogni secondo, finché non finisce
  const idInvio = invio?.id;
  const inCorsoInvio = invio?.stato === "in_corso";
  useEffect(() => {
    if (!idInvio || !inCorsoInvio) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/admin/comunicazioni?id=${idInvio}&progressi=1`);
        const d = await r.json();
        if (d.comunicazione) {
          setInvio(d.comunicazione);
          if (d.comunicazione.stato !== "in_corso") carica();
        }
      } catch { /* si riprova al giro dopo */ }
    }, 1000);
    return () => clearInterval(t);
  }, [idInvio, inCorsoInvio, carica]);

  // bozza salvata nel browser a ogni modifica
  useEffect(() => {
    if (!oggetto && !html && !testo) return scriviBozzaScrivi(null);
    scriviBozzaScrivi({ oggetto, formato, html, testo, chiave, inviata, stati, tolti });
  }, [oggetto, formato, html, testo, chiave, inviata, stati, tolti]);

  // il campo di testo semplice si allunga col testo
  useEffect(() => {
    const el = testoRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [testo, formato]);

  // Qualsiasi modifica dopo un invio = una comunicazione nuova (chiave nuova)
  const modificato = () => {
    setAnteprima(null);
    setConferma(false);
    if (inviata) { setChiave(nuovaChiave()); setInviata(false); setInvio(null); }
  };

  if (errCarica) return <div className="pf-errore">{errCarica}</div>;
  if (!dati || tolti === null) return <Caricamento />;

  const tutti = dati.destinatari;
  const perStato = (k) => tutti.filter((d) => d.status === k).length;
  const nelloStato = tutti.filter((d) => stati[d.status]);
  const scelti = nelloStato.filter((d) => !tolti.includes(d.id));
  const toltiVisibili = nelloStato.filter((d) => tolti.includes(d.id));
  const caratteri = formato === "testo" ? testo.length : caratteriEditor;
  const vuoto = formato === "testo" ? !testo.trim() : caratteriEditor === 0;
  const corpo = () => ({ oggetto, formato, ...(formato === "testo" ? { testo } : { html }) });

  const chiama = async (dati_) => {
    const r = await fetch("/api/admin/comunicazioni", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dati_) });
    return { r, d: await r.json().catch(() => ({})) };
  };
  const vediAnteprima = async () => {
    setOccupato("anteprima"); setMsg(null);
    try {
      const { r, d } = await chiama({ azione: "anteprima", ...corpo(), esempio_id: scelti[0]?.id });
      if (!r.ok) return avvisa("err", d.error || "Anteprima non riuscita");
      setAnteprima(d);
    } catch { avvisa("err", "Errore di rete: riprova tra poco"); } finally { setOccupato(""); }
  };
  const mandaProva = async () => {
    setOccupato("prova"); setMsg(null);
    try {
      const { r, d } = await chiama({ azione: "prova", ...corpo() });
      if (!r.ok) return avvisa("err", d.error || "La prova non è partita");
      avvisa("ok", `✅ Prova mandata solo a te: ${d.a}. Guarda nella casella (anche nello spam).`);
    } catch { avvisa("err", "Errore di rete: riprova tra poco"); } finally { setOccupato(""); }
  };
  const invia = async () => {
    if (inviando.current) return; // doppio clic: il secondo non fa nulla
    inviando.current = true;
    setOccupato("invio"); setConferma(false); setMsg(null);
    try {
      const { r, d } = await chiama({ azione: "invia", chiave, ids: scelti.map((x) => x.id), ...corpo() });
      if (!r.ok) return avvisa("err", d.error || "L'invio non è partito");
      setInviata(true);
      setInvio(d.comunicazione);
      if (d.gia) avvisa("ok", "Questa comunicazione è già partita: non la rimando. Qui sotto vedi com'è andata.");
      carica();
    } catch {
      avvisa("err", "Errore di rete. Puoi premere di nuovo «Invia»: se era già partita, non parte una seconda volta.");
    } finally {
      inviando.current = false;
      setOccupato("");
    }
  };
  const svuota = () => {
    setOggetto(""); setHtml(""); setTesto(""); setCaratteriEditor(0);
    setChiave(nuovaChiave()); setInviata(false); setInvio(null); setAnteprima(null); setConferma(false); setMsg(null);
    setEditorKey((k) => k + 1);
    scriviBozzaScrivi(null);
  };
  const cambiaFormato = (nuovo) => {
    if (nuovo === formato) return;
    if (nuovo === "testo") setTesto(htmlInTesto(html));
    else { setHtml(testoInHtml(testo)); setEditorKey((k) => k + 1); }
    setFormato(nuovo);
    modificato();
  };
  const conFormattazione = /<(strong|em|u|s|span|h2|h3|a)\b/.test(html);

  return (
    <div className="iw-scrivi">
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>✉️ Scrivi agli infermieri</h2>
      <p className="pf-note" style={{ marginTop: -4 }}>Parte una email per ogni persona, dal mittente del sito. Chi risponde scrive a info@infermieriweb.it.</p>

      {/* 1. A CHI */}
      <div className="pf-panel" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>1. A chi</h3>
        <div style={{ display: "flex", gap: "8px 18px", flexWrap: "wrap", marginBottom: 10 }}>
          {ETICHETTE_STATI.map(([k, nome]) => (
            <label key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={!!stati[k]} onChange={(e) => { setStati({ ...stati, [k]: e.target.checked }); modificato(); }} /> {nome} ({perStato(k)})
            </label>
          ))}
        </div>
        <p style={{ fontSize: 20, margin: "4px 0 8px" }}>Destinatari: <strong data-n-destinatari={scelti.length}>{scelti.length}</strong></p>
        <p className="pf-note" style={{ marginTop: 0 }}>Mai gli eliminati e mai chi non ha un'email valida{dati.senza_email ? ` (${dati.senza_email} senza email valida)` : ""}. Gli amministratori partono tolti: se vuoi, rimettili.</p>
        {scelti.length > dati.soglia && (
          <div style={BOX_AVVISO}>⚠️ Sono più di {dati.soglia}. Brevo gratuito manda circa 300 email al giorno in tutto, comprese prenotazioni e promemoria: alcune potrebbero non partire oggi.</div>
        )}
        <button type="button" className="pf-btn secondario compatto" onClick={() => setMostraElenco(!mostraElenco)}>{mostraElenco ? "Nascondi l'elenco" : `Mostra l'elenco (${scelti.length})`}</button>
        {mostraElenco && (
          <div style={{ marginTop: 8 }}>
            {scelti.map((d) => (
              <div key={d.id} className="iw-scrivi-riga" data-destinatario={d.id}>
                <span style={{ flex: "1 1 150px", minWidth: 0 }}>
                  <strong>{d.name}</strong> <span className={`stato ${STATO_DEST[d.status]?.[0] || "noshow"}`} style={{ fontSize: 13 }}>{STATO_DEST[d.status]?.[1] || d.status}</span>
                  <br /><span className="pf-note" style={{ margin: 0, overflowWrap: "anywhere" }}>{d.email} · {"{nome}"} = {d.nome}</span>
                </span>
                <button type="button" className="pf-btn secondario compatto" onClick={() => { setTolti([...tolti, d.id]); modificato(); }} aria-label={`Togli ${d.name}`}>Togli</button>
              </div>
            ))}
            {scelti.length === 0 && <p className="pf-note">Nessun destinatario: spunta almeno un gruppo.</p>}
            {toltiVisibili.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed var(--iw-line)" }}>
                <strong>Tolti ({toltiVisibili.length})</strong>
                {toltiVisibili.map((d) => (
                  <div key={d.id} className="iw-scrivi-riga" data-tolto={d.id} style={{ opacity: 0.75 }}>
                    <span style={{ flex: "1 1 150px", minWidth: 0 }}>{d.name}{d.admin ? <span className="pf-note" style={{ margin: 0 }}> · amministratore</span> : null}<br /><span className="pf-note" style={{ margin: 0, overflowWrap: "anywhere" }}>{d.email}</span></span>
                    <button type="button" className="pf-btn secondario compatto" onClick={() => { setTolti(tolti.filter((x) => x !== d.id)); modificato(); }} aria-label={`Rimetti ${d.name}`}>Rimetti</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. COSA SCRIVI */}
      <div className="pf-panel pf-book" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>2. Cosa scrivi</h3>
        <label htmlFor="sc-oggetto">Oggetto *</label>
        <input id="sc-oggetto" value={oggetto} maxLength={150} onChange={(e) => { setOggetto(e.target.value); modificato(); }} placeholder="es. Novità su InfermieriWeb" />
        <div role="group" aria-label="Come vuoi scrivere" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0 10px" }}>
          <button type="button" className={`pf-btn compatto${formato === "visuale" ? "" : " secondario"}`} aria-pressed={formato === "visuale"} onClick={() => cambiaFormato("visuale")}>✏️ Con grassetto e colori</button>
          <button type="button" className={`pf-btn compatto${formato === "testo" ? "" : " secondario"}`} aria-pressed={formato === "testo"} onClick={() => cambiaFormato("testo")}>📝 Testo semplice</button>
        </div>
        <p className="pf-note" style={{ marginTop: 0 }}>
          Scrivi <strong>{"{nome}"}</strong> dove vuoi il nome: «Ciao {"{nome}"},» diventa «Ciao Maria,».{" "}
          {formato === "testo"
            ? "Riga vuota = nuovo paragrafo. Puoi incollare da WhatsApp, Note o Word."
            : "Puoi incollare da WhatsApp, Note o Word: i paragrafi restano, gli stili strani no."}
        </p>
        {formato === "visuale" ? (
          <React.Suspense fallback={<p className="pf-note">Carico l'editor…</p>}>
            <EditorArticolo key={editorKey} html={html} onChange={(h) => { setHtml(h); modificato(); }} onTesto={(t) => setCaratteriEditor(t.trim() ? t.length : 0)} />
          </React.Suspense>
        ) : (
          <>
            {conFormattazione && <p className="pf-note" style={{ marginTop: 0 }}>Nel testo semplice grassetto, colori e link non ci sono: gli indirizzi web diventano link da soli.</p>}
            <textarea ref={testoRef} id="sc-testo" className="iw-scrivi-testo" value={testo} onChange={(e) => { setTesto(e.target.value); modificato(); }} placeholder={"Ciao {nome},\n\nscrivi qui il messaggio.\n\nBuon lavoro,\nBruno ed Eduard"} />
          </>
        )}
        <p className="pf-note" style={{ margin: "4px 0 12px" }} aria-live="polite"><span data-caratteri={caratteri}>{numeroIt(caratteri)} caratteri</span> · la bozza resta salvata in questo browser</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="pf-btn secondario" disabled={!!occupato || vuoto || !oggetto.trim()} onClick={vediAnteprima}>{occupato === "anteprima" ? "Preparo…" : "👁️ Anteprima"}</button>
          <button type="button" className="pf-btn secondario" disabled={!!occupato || vuoto || !oggetto.trim()} onClick={mandaProva}>{occupato === "prova" ? "Mando…" : "🧪 Mandami una prova"}</button>
          <ConfermaInline etichetta="Svuota" domanda="Cancello oggetto e testo?" conferma="Sì, svuota" disabled={occupato === "invio" || inCorsoInvio} onConferma={svuota} />
        </div>
        {dati.admin_email && <p className="pf-note" style={{ marginBottom: 0 }}>La prova arriva solo a te: {dati.admin_email}</p>}
      </div>

      {msg && <div ref={msgRef} key={msg.n} className={msg.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 14, scrollMarginTop: 96, overflowWrap: "anywhere" }}>{msg.testo}</div>}

      {anteprima && (
        <div ref={anteprimaRef} className="pf-panel" style={{ marginBottom: 14, scrollMarginTop: 96 }}>
          <h3 style={{ marginTop: 0 }}>Anteprima <span className="pf-note" style={{ margin: 0, fontWeight: 400 }}>(come la riceve {anteprima.nome})</span></h3>
          <p style={{ margin: "0 0 8px", overflowWrap: "anywhere" }}><span className="pf-note" style={{ margin: 0 }}>Oggetto:</span> <strong>{anteprima.oggetto}</strong></p>
          <AnteprimaEmail html={anteprima.html} titolo="Anteprima della mail" />
        </div>
      )}

      {/* 3. INVIA */}
      <div ref={invioRef} className="pf-panel" style={{ marginBottom: 14, scrollMarginTop: 96 }}>
        <h3 style={{ marginTop: 0 }}>3. Invia</h3>
        {invio && <EsitoInvio c={invio} />}
        {!inviata && !conferma && (
          <button type="button" className="pf-btn" disabled={!!occupato || vuoto || !oggetto.trim() || scelti.length === 0 || inCorsoInvio} onClick={() => setConferma(true)}>
            {occupato === "invio" ? "Invio…" : `✉️ Invia a ${scelti.length} infermier${scelti.length === 1 ? "e" : "i"}`}
          </button>
        )}
        {!inviata && conferma && (
          <div style={{ ...BOX_AVVISO, background: "#f0fdfa", borderColor: "#99f6e4", color: "var(--iw-navy)" }}>
            <strong>Invio a {scelti.length} infermier{scelti.length === 1 ? "e" : "i"}?</strong> Parte una email per ognuno. Non si può annullare.
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button type="button" className="pf-btn compatto" disabled={!!occupato} onClick={invia}>{occupato === "invio" ? "Invio…" : "Sì, invia"}</button>
              <button type="button" className="pf-btn secondario compatto" disabled={!!occupato} onClick={() => setConferma(false)}>No</button>
            </div>
          </div>
        )}
        {inviata && (
          <p className="pf-note" style={{ marginBottom: 0 }}>Questa comunicazione è partita. Se cambi il testo o i destinatari, diventa una comunicazione nuova. Per ripartire da zero usa «Svuota».</p>
        )}
      </div>

      {/* STORICO */}
      <div className="pf-panel">
        <h3 style={{ marginTop: 0 }}>Comunicazioni mandate ({dati.storico.length})</h3>
        {dati.storico.length === 0 && <p className="pf-note" style={{ margin: 0 }}>Ancora nessuna.</p>}
        {dati.storico.map((c) => (
          <div key={c.id} className="iw-scrivi-riga" data-storico={c.id} style={{ alignItems: "flex-start" }}>
            <span style={{ flex: "1 1 240px", minWidth: 0 }}>
              <strong style={{ overflowWrap: "anywhere" }}>{c.oggetto}</strong><br />
              <span className="pf-note" style={{ margin: 0 }}>
                {dataOra(c.created_at)} · da {c.mandata_da || "—"} · {c.destinatari} destinatari · ✅ {c.riuscite} · ❌ {c.non_riuscite}
                {c.stato === "in_corso" ? " · in corso…" : c.stato === "interrotta" ? " · interrotta" : ""}
              </span>
            </span>
            <button type="button" className="pf-btn secondario compatto" onClick={async () => {
              if (dettaglio?.id === c.id) return setDettaglio(null);
              const r = await fetch(`/api/admin/comunicazioni?id=${c.id}`);
              const d = await r.json().catch(() => ({}));
              if (d.comunicazione) setDettaglio(d.comunicazione);
            }}>{dettaglio?.id === c.id ? "Chiudi" : "Vedi"}</button>
            {dettaglio?.id === c.id && (
              <div style={{ width: "100%" }}>
                <EsitoInvio c={dettaglio} />
                <AnteprimaEmail html={dettaglio.anteprima} titolo={`Testo di «${c.oggetto}»`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ PRENOTAZIONI PER INFERMIERE (contatori) ============================ */

const PERIODI = [
  { k: "30", label: "Ultimi 30 giorni", giorni: 30 },
  { k: "90", label: "Ultimi 90 giorni", giorni: 90 },
  { k: "365", label: "Ultimo anno", giorni: 365 },
  { k: "tutto", label: "Da sempre", giorni: 0 },
];
const isoGiorniFa = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function PrenotazioniPerInfermiere() {
  const [periodo, setPeriodo] = useState("90");
  const [da, setDa] = useState(isoGiorniFa(90));
  const [a, setA] = useState(new Date().toISOString().slice(0, 10));
  const [su, setSu] = useState("created");
  const [righe, setRighe] = useState(null);

  const scegliPeriodo = (k) => {
    setPeriodo(k);
    const p = PERIODI.find((x) => x.k === k);
    if (p && p.giorni) { setDa(isoGiorniFa(p.giorni)); setA(new Date().toISOString().slice(0, 10)); }
    if (p && !p.giorni) { setDa(""); setA(""); }
  };

  useEffect(() => {
    const q = new URLSearchParams({ su });
    if (da) q.set("da", da);
    if (a) q.set("a", a);
    fetch(`/api/admin/prenotazioni-per-infermiere?${q}`).then((r) => r.json()).then((d) => setRighe(d.righe || []));
  }, [da, a, su]);

  const COLONNE = [
    { label: "Infermiere", get: (r) => r.name },
    { label: "Comune", get: (r) => r.city },
    { label: "Stato", get: (r) => r.status },
    { label: "Richieste", get: (r) => r.richieste },
    { label: "Mai convalidate", get: (r) => r.mai_convalidate },
    { label: "Confermate (future)", get: (r) => r.confermate },
    { label: "Accettate dall'infermiere", get: (r) => r.accettate },
    { label: "Completate", get: (r) => r.completate },
    { label: "Non presentati", get: (r) => r.no_show },
    { label: "Annullate dal paziente", get: (r) => r.annullate_paziente },
    { label: "Annullate dall'infermiere", get: (r) => r.annullate_professionista },
    { label: "Annullate (altro/non noto)", get: (r) => r.annullate_altro },
    { label: "Ultima richiesta", get: (r) => (r.ultima_richiesta ? new Date(r.ultima_richiesta).toLocaleDateString("it-IT") : "") },
  ];
  const somma = (campo) => (righe || []).reduce((t, r) => t + Number(r[campo] || 0), 0);
  const nomeFile = `prenotazioni-per-infermiere_${da || "inizio"}_${a || "oggi"}_${su === "start" ? "appuntamento" : "richiesta"}.csv`;

  return (
    <div>
      <h2 style={{ marginTop: 0, color: "var(--iw-navy)" }}>📅 Prenotazioni per infermiere</h2>
      <p className="pf-note">
        Quante richieste porta la piattaforma a ciascuno e come finiscono. <strong>Richieste</strong> = tutte le
        prenotazioni create, anche quelle mai convalidate dal paziente. «Da chi» è annullata lo sappiamo dal 7/10/2026:
        prima compare in <em>altro/non noto</em>.
      </p>
      <div className="pf-panel" style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {PERIODI.map((p) => (
          <button key={p.k} className={`pf-btn compatto${periodo === p.k ? "" : " secondario"}`} onClick={() => scegliPeriodo(p.k)}>{p.label}</button>
        ))}
        <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>dal
          <input type="date" style={{ marginBottom: 0, width: "auto" }} value={da} onChange={(e) => { setPeriodo("custom"); setDa(e.target.value); }} />
        </label>
        <label className="pf-book" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>al
          <input type="date" style={{ marginBottom: 0, width: "auto" }} value={a} onChange={(e) => { setPeriodo("custom"); setA(e.target.value); }} />
        </label>
        <select className="pf-book" style={{ marginBottom: 0, width: "auto" }} value={su} onChange={(e) => setSu(e.target.value)} aria-label="Conta sulla data di">
          <option value="created">conta sulla data di richiesta</option>
          <option value="start">conta sulla data dell'appuntamento</option>
        </select>
        {righe && righe.length > 0 && <button className="pf-btn secondario compatto" onClick={() => scaricaCsv(righe, COLONNE, nomeFile)}>⬇️ Scarica CSV</button>}
      </div>
      {!righe ? <Caricamento /> : (
        <div className="pf-panel adm-tabella-wrap">
          <table className="adm-tabella">
            <thead><tr>{COLONNE.filter((c) => !["Comune", "Stato"].includes(c.label)).map((c) => <th key={c.label}>{c.label}</th>)}</tr></thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.id} style={{ opacity: r.status === "active" ? 1 : 0.6 }}>
                  <td><strong>{r.name}</strong><div className="pf-note" style={{ margin: 0, fontSize: 13 }}>{r.city}{r.status !== "active" ? ` · ${r.status}` : ""}</div></td>
                  <td>{r.richieste}</td><td>{r.mai_convalidate}</td><td>{r.confermate}</td><td>{r.accettate}</td>
                  <td>{r.completate}</td><td>{r.no_show}</td><td>{r.annullate_paziente}</td><td>{r.annullate_professionista}</td><td>{r.annullate_altro}</td>
                  <td>{r.ultima_richiesta ? new Date(r.ultima_richiesta).toLocaleDateString("it-IT") : "—"}</td>
                </tr>
              ))}
              <tr className="totale">
                <td>Totale ({righe.length} infermieri)</td>
                <td>{somma("richieste")}</td><td>{somma("mai_convalidate")}</td><td>{somma("confermate")}</td><td>{somma("accettate")}</td>
                <td>{somma("completate")}</td><td>{somma("no_show")}</td><td>{somma("annullate_paziente")}</td><td>{somma("annullate_professionista")}</td><td>{somma("annullate_altro")}</td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
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
    await fetch("/api/panel/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
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
          <CampoPassword id="ad-pass" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password" />
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
    "inf-prenotazioni": <PrenotazioniPerInfermiere />,
    "inf-scrivi": <ScriviInfermieri />,
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
    "inf-specializzazioni": <Specializzazioni />,
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
    "srv-listino": <Listino />,
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
