import { useCallback, useEffect, useRef, useState } from "react";
import ConfermaInline from "./ConfermaInline.jsx";
import ModuloArticolo from "./ModuloArticolo.jsx";
import { NOTA_MIN, etichettaAlbo } from "../lib/articoli-regole.js";

// Admin → Blog → «Da approvare» (8/10/26): gli articoli inviati dagli infermieri.
// Per ognuno: anteprima com'è sul sito, autore con il link alla scheda e quattro scelte:
// Approva e pubblica · Modifica e pubblica · Rimanda da correggere (nota) · Rifiuta (nota).
// Conferme in pagina (ConfermaInline), mai window.confirm.

const dataOra = (iso) => (iso ? new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "");

function Anteprima({ a }) {
  const fonti = Array.isArray(a.sources) ? a.sources : [];
  return (
    <div className="rev-anteprima">
      <span className="article-category">{a.category}</span>
      <h3 className="rev-titolo">{a.title}</h3>
      <p className="rev-descrizione"><strong>Descrizione per Google:</strong> {a.excerpt || <em>manca</em>}</p>
      {a.image && <img src={a.image} alt={`Copertina di ${a.title}`} className="rev-copertina" width="640" height="384" loading="lazy" />}
      {/* HTML già passato dalla lista bianca al salvataggio (lib/blog-html.js) */}
      <div className="article-html rev-corpo" dangerouslySetInnerHTML={{ __html: a.body_html || "<p><em>Testo vuoto</em></p>" }} />
      <div className="article-fonti rev-fonti">
        <strong>Fonti</strong>
        {fonti.length ? (
          <ul className="article-list">
            {fonti.map((f, i) => <li key={i}>{f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">{f.testo}</a> : f.testo}{f.url && <span className="rev-url"> — {f.url}</span>}</li>)}
          </ul>
        ) : <p className="pf-errore" style={{ margin: "6px 0 0" }}>Nessuna fonte</p>}
      </div>
    </div>
  );
}

function SchedaRevisione({ a, onFatto, avvisa }) {
  const [modo, setModo] = useState(null);   // null | modifica | rimanda | rifiuta
  const [nota, setNota] = useState("");
  const [modulo, setModulo] = useState(null);
  const [inCorso, setInCorso] = useState(false);
  const occupato = useRef(false);

  const decidi = async (azione, extra = {}) => {
    if (occupato.current) return;
    occupato.current = true; setInCorso(true);
    try {
      const r = await fetch("/api/admin/articoli-revisione", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, azione, ...extra }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return avvisa("err", d.error || `Operazione non riuscita (errore ${r.status})`, d.errori);
      const email = d.email_inviata ? " L'infermiere riceve un'email." : " Attenzione: l'email all'infermiere non è partita.";
      const testi = {
        approva: `Pubblicato ✅ «${a.title}» è online.`,
        modifica: `Pubblicato con le tue modifiche ✅ «${a.title}» è online.`,
        rimanda: `Rimandato da correggere ↩️ «${a.title}».`,
        rifiuta: `Rifiutato ⛔ «${a.title}».`,
      };
      avvisa("ok", testi[azione] + email, null, d.slug ? `/articoli/${d.slug}` : null);
      onFatto(d.da_approvare);
    } catch {
      avvisa("err", "Errore di rete: riprova tra poco");
    } finally {
      occupato.current = false; setInCorso(false);
    }
  };

  const apriModifica = () => {
    setModo("modifica");
    setModulo({ title: a.title, category: a.category, excerpt: a.excerpt, body_html: a.body_html, sources: a.sources?.length ? a.sources : [{ testo: "", url: "" }], cover_data: "", image: a.image });
  };
  const notaOk = nota.trim().length >= NOTA_MIN;

  return (
    <div className="pf-panel rev-voce" data-articolo={a.id}>
      <div className="rev-autore">
        <img src={a.autore_foto || "/avatar-infermiere.svg"} alt="" width="48" height="48" />
        <div>
          <a href={`/p/${a.autore_slug}`} target="_blank" rel="noreferrer"><strong>{a.autore_nome}</strong></a>
          <span className="pf-note" style={{ display: "block", margin: 0 }}>
            {etichettaAlbo(a.autore_albo, a.autore_numero)} · inviato il {dataOra(a.submitted_at)}
            {a.autore_stato !== "active" && <strong style={{ color: "var(--iw-danger)" }}> · profilo non attivo</strong>}
          </span>
        </div>
      </div>
      {a.review_note && (
        <div className="art-nota"><strong>Era stato rimandato con questa nota:</strong><br />{a.review_note}</div>
      )}

      {modo === "modifica" && modulo ? (
        <div className="pf-book" style={{ marginTop: 12 }}>
          <ModuloArticolo valori={modulo} aggiorna={(p) => setModulo((m) => ({ ...m, ...p }))} chiave={`rev-${a.id}`} idBase={`rev-${a.id}`} />
          <div className="pf-azioni" style={{ marginTop: 14 }}>
            <ConfermaInline etichetta="✅ Pubblica con le modifiche" className="pf-btn" classeConferma="pf-btn compatto"
              domanda="Pubblico l'articolo corretto?" conferma="Sì, pubblica" disabled={inCorso}
              onConferma={() => decidi("modifica", {
                title: modulo.title, category: modulo.category, excerpt: modulo.excerpt, body_html: modulo.body_html, sources: modulo.sources,
                ...(modulo.cover_data ? { cover_data: modulo.cover_data } : {}), ...(modulo.remove_cover ? { remove_cover: true } : {}),
              })} />
            <button type="button" className="pf-btn secondario" disabled={inCorso} onClick={() => { setModo(null); setModulo(null); }}>Annulla</button>
          </div>
        </div>
      ) : (
        <>
          <Anteprima a={a} />
          <p style={{ margin: "10px 0 0" }}>
            <a href={`/articoli/anteprima/${a.id}`} target="_blank" rel="noreferrer">👁️ Apri l'anteprima com'è sul sito</a>
          </p>
        </>
      )}

      {(modo === "rimanda" || modo === "rifiuta") && (
        <div className="pf-book rev-nota" style={{ marginTop: 12 }}>
          <label htmlFor={`nota-${a.id}`}>
            {modo === "rimanda" ? "Cosa deve correggere? *" : "Perché non lo pubblichiamo? *"}{" "}
            <span style={{ fontWeight: 400 }}>(la legge l'infermiere, nell'email e nel pannello)</span>
          </label>
          <textarea id={`nota-${a.id}`} rows={4} maxLength={2000} value={nota} onChange={(e) => setNota(e.target.value)}
            placeholder={modo === "rimanda" ? "es. Togli il prezzo nel secondo paragrafo e aggiungi il link alla linea guida." : "es. Il testo è copiato da un altro sito."} />
          {!notaOk && <p className="pf-note" style={{ marginTop: 0 }}>Almeno {NOTA_MIN} caratteri.</p>}
          <div className="pf-azioni">
            {modo === "rimanda" ? (
              <button type="button" className="pf-btn" disabled={!notaOk || inCorso} onClick={() => decidi("rimanda", { nota })}>{inCorso ? "Invio…" : "↩️ Rimanda all'infermiere"}</button>
            ) : (
              <ConfermaInline etichetta="⛔ Rifiuta l'articolo" domanda="Lo rifiuto? L'infermiere riceve la nota." conferma="Sì, rifiuta"
                disabled={!notaOk || inCorso} onConferma={() => decidi("rifiuta", { nota })} />
            )}
            <button type="button" className="pf-btn secondario" disabled={inCorso} onClick={() => { setModo(null); setNota(""); }}>Annulla</button>
          </div>
        </div>
      )}

      {!modo && (
        <div className="pf-azioni" style={{ marginTop: 14 }}>
          <ConfermaInline etichetta="✅ Approva e pubblica" className="pf-btn" classeConferma="pf-btn compatto"
            domanda="Lo pubblico così com'è?" conferma="Sì, pubblica" disabled={inCorso} onConferma={() => decidi("approva")} />
          <button type="button" className="pf-btn secondario" onClick={apriModifica}>✏️ Modifica e pubblica</button>
          <button type="button" className="pf-btn secondario" onClick={() => setModo("rimanda")}>↩️ Rimanda da correggere</button>
          <button type="button" className="pf-btn pericolo" onClick={() => setModo("rifiuta")}>⛔ Rifiuta</button>
        </div>
      )}
    </div>
  );
}

export default function ArticoliDaApprovare({ aggiornaBadge }) {
  const [coda, setCoda] = useState(null);
  const [messaggio, setMessaggio] = useState(null);
  const msgRef = useRef(null);

  // La coda si (ri)carica a ogni cambio di «versione»: carica() dopo ogni decisione
  const [versione, setVersione] = useState(0);
  const carica = useCallback(() => setVersione((v) => v + 1), []);
  useEffect(() => {
    let vivo = true;
    fetch("/api/admin/articoli-revisione")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) return setMessaggio({ tipo: "err", testo: d.error || "Non riesco a caricare la coda" });
        setCoda(d.coda || []);
        aggiornaBadge?.("articoli", Number(d.da_approvare || 0));
      })
      .catch(() => { if (vivo) setMessaggio({ tipo: "err", testo: "Errore di rete: ricarica la pagina" }); });
    return () => { vivo = false; };
  }, [versione, aggiornaBadge]);
  useEffect(() => { if (messaggio) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [messaggio]);

  const avvisa = (tipo, testo, elenco = null, link = null) => setMessaggio({ tipo, testo, elenco, link });

  return (
    <div>
      <h2 style={{ color: "var(--iw-navy)", marginTop: 0 }}>📰 Articoli da approvare{coda ? ` (${coda.length})` : ""}</h2>
      <p className="pf-note" style={{ marginTop: -4 }}>
        Li scrivono gli infermieri della rete. Controlla: niente pubblicità, niente prezzi diversi dalla scheda, niente diagnosi,
        niente testi copiati, fonti vere. Ogni decisione arriva all'infermiere per email.
      </p>
      {messaggio && (
        <div ref={msgRef} className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12, scrollMarginTop: 96 }} role={messaggio.tipo === "ok" ? "status" : "alert"}>
          {messaggio.testo}
          {messaggio.link && <> <a href={messaggio.link} target="_blank" rel="noreferrer">Vedi l'articolo</a></>}
          {messaggio.elenco && <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>{messaggio.elenco.map((m) => <li key={m}>{m}</li>)}</ul>}
        </div>
      )}
      {!coda && <p className="pf-note">Carico…</p>}
      {coda && coda.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessun articolo da approvare. 👌</p></div>}
      {coda && coda.map((a) => (
        <SchedaRevisione key={a.id} a={a} avvisa={avvisa} onFatto={(n) => { aggiornaBadge?.("articoli", Number(n || 0)); carica(); }} />
      ))}
    </div>
  );
}
