import { useCallback, useEffect, useRef, useState } from "react";
import ConfermaInline from "./ConfermaInline.jsx";
import ModuloArticolo from "./ModuloArticolo.jsx";
import { STATI_ARTICOLO, MAX_IN_REVISIONE, mancanzePerInvio, validaFonti } from "../lib/articoli-regole.js";

// Scheda «📰 I miei articoli» del pannello (8/10/26). L'infermiere scrive un articolo,
// salva la bozza e la invia agli amministratori. Dopo l'invio non si modifica più; se torna
// «da correggere» si corregge e si reinvia; un articolo pubblicato lo cambiano solo gli admin.

// Come nel resto del pannello: un 401 vuol dire sessione scaduta → si torna al login
function panelFetch(url, opts) {
  return fetch(url, opts).then((r) => {
    if (r.status === 401 && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("iw-sessione-scaduta"));
    return r;
  });
}

const dataBreve = (iso) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : "");
const testoDaHtml = (html) => {
  if (typeof DOMParser === "undefined") return String(html || "").replace(/<[^>]+>/g, " ");
  return new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent || "";
};
const VUOTO = { title: "", category: "Assistenza Domiciliare", excerpt: "", body_html: "", sources: [{ testo: "", url: "" }], cover_data: "", image: "" };

function Regole() {
  return (
    <div className="pf-panel art-regole">
      <h2 style={{ marginTop: 0 }}>📰 I miei articoli</h2>
      <p style={{ margin: "0 0 8px" }}>Puoi scrivere un articolo per il blog. Esce con la tua firma. Prima di scrivere, leggi queste regole:</p>
      <ul>
        <li>Scrivi di quello che conosci per mestiere.</li>
        <li>Niente pubblicità. Niente prezzi diversi da quelli della tua scheda.</li>
        <li>Niente diagnosi e niente consigli che sostituiscono il medico.</li>
        <li>Cita le fonti: Ministero della Salute, ISS, FNOPI, linee guida.</li>
        <li>Niente testi copiati, nemmeno in parte.</li>
        <li>L'articolo esce con il tuo nome, il numero OPI e il link alla tua scheda.</li>
      </ul>
      <p className="pf-note" style={{ margin: 0 }}>
        Prima di uscire lo leggiamo noi. Dopo l'invio non puoi più cambiarlo. Puoi avere al massimo {MAX_IN_REVISIONE} articoli in revisione.
      </p>
    </div>
  );
}

export default function ArticoliPannello() {
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState("");
  const [modulo, setModulo] = useState(null);       // l'articolo aperto nell'editor
  const [modificato, setModificato] = useState(false);
  const [messaggio, setMessaggio] = useState(null);  // {tipo: ok|err, testo, elenco?}
  const [salvo, setSalvo] = useState(false);
  const occupato = useRef(false);                     // niente doppio salvataggio / doppio invio
  const msgRef = useRef(null);
  const moduloRef = useRef(null);

  // L'elenco si (ri)carica a ogni cambio di «versione»: carica() dopo ogni salvataggio
  const [versione, setVersione] = useState(0);
  const carica = useCallback(() => setVersione((v) => v + 1), []);
  useEffect(() => {
    let vivo = true;
    panelFetch("/api/panel/articoli")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!vivo) return;
        if (!r.ok) return setErrore(d.error || "Non riesco a caricare i tuoi articoli");
        setErrore("");
        setDati(d);
      })
      .catch(() => { if (vivo) setErrore("Problema di connessione: riprova tra poco"); });
    return () => { vivo = false; };
  }, [versione]);
  useEffect(() => { if (messaggio) msgRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [messaggio]);
  const apertoId = modulo ? String(modulo.id || "nuovo") : null;
  useEffect(() => { if (apertoId) moduloRef.current?.scrollIntoView({ block: "start" }); }, [apertoId]);

  const aggiorna = (parziale) => { setModulo((m) => ({ ...m, ...parziale })); setModificato(true); };

  const nuovo = () => { setMessaggio(null); setModificato(false); setModulo({ ...VUOTO, sources: [{ testo: "", url: "" }] }); };
  const apri = async (id) => {
    setMessaggio(null);
    const r = await panelFetch(`/api/panel/articoli?id=${id}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessaggio({ tipo: "err", testo: d.error || "Non riesco ad aprire l'articolo" });
    const a = d.articolo;
    setModificato(false);
    setModulo({ ...a, sources: a.sources?.length ? a.sources : [{ testo: "", url: "" }], cover_data: "" });
  };

  const salva = async (invia) => {
    if (occupato.current) return;
    // Prima dell'invio, gli stessi controlli del server: l'elenco di cosa manca, tutto insieme
    if (invia) {
      const f = validaFonti(modulo.sources);
      const mancanze = f.errore ? [f.errore] : mancanzePerInvio({ titolo: modulo.title, descrizione: modulo.excerpt, testo: testoDaHtml(modulo.body_html), fonti: f.fonti });
      if (mancanze.length) return setMessaggio({ tipo: "err", testo: "Prima di inviarlo manca ancora qualcosa:", elenco: mancanze });
    }
    occupato.current = true;
    setSalvo(true);
    setMessaggio(null);
    const corpo = {
      id: modulo.id, title: modulo.title, category: modulo.category, excerpt: modulo.excerpt,
      body_html: modulo.body_html, sources: modulo.sources, invia,
      ...(modulo.cover_data ? { cover_data: modulo.cover_data } : {}),
      ...(modulo.remove_cover ? { remove_cover: true } : {}),
    };
    try {
      const r = await panelFetch("/api/panel/articoli", {
        method: modulo.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d.id) setModulo((m) => ({ ...m, id: d.id })); // la bozza è salvata anche se l'invio no
        if (d.gia_inviato) { setModulo(null); carica(); }
        return setMessaggio({ tipo: "err", testo: d.error || `Salvataggio non riuscito (errore ${r.status})`, elenco: d.errori?.length > 1 ? d.errori : null });
      }
      if (invia) {
        setModulo(null);
        // l'elenco mostra subito «In revisione» (poi si ricarica dal server)
        setDati((x) => x && ({ ...x, articoli: x.articoli.map((a) => (a.id === d.id ? { ...a, status: "review", submitted_at: new Date().toISOString() } : a)) }));
        setMessaggio({ tipo: "ok", testo: "Inviato ✅ Ora lo leggono gli amministratori. Ti rispondiamo per email: se va bene lo pubblichiamo, se serve qualcosa te lo scriviamo." });
      } else {
        setModulo((m) => ({ ...m, id: d.id, cover_data: "", image: m.cover_data || m.image, remove_cover: false }));
        setModificato(false);
        setMessaggio({ tipo: "ok", testo: "Bozza salvata ✅ La trovi qui sotto quando vuoi. Nessuno la vede finché non la invii." });
      }
      carica();
    } catch {
      setMessaggio({ tipo: "err", testo: "Problema di connessione: l'articolo non è stato salvato. Riprova tra poco." });
    } finally {
      occupato.current = false;
      setSalvo(false);
    }
  };

  const elimina = async (a) => {
    const r = await panelFetch(`/api/panel/articoli?id=${a.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMessaggio({ tipo: "err", testo: d.error || "Non sono riuscito a eliminarlo" });
    setMessaggio({ tipo: "ok", testo: `«${a.title}» eliminato.` });
    if (modulo?.id === a.id) setModulo(null);
    carica();
  };

  if (errore && !dati) return <div className="pf-panel"><div className="pf-errore">{errore}</div></div>;
  if (!dati) return <div className="pf-panel"><p className="pf-note">Carico i tuoi articoli…</p></div>;

  const articoli = dati.articoli || [];
  const inRevisione = dati.inRevisione || 0;

  return (
    <div>
      <Regole />

      {!dati.puoScrivere && <div className="pf-errore" style={{ marginBottom: 14 }}>{dati.motivo}</div>}

      {messaggio && (
        <div ref={msgRef} className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 14, scrollMarginTop: 96 }} role={messaggio.tipo === "ok" ? "status" : "alert"}>
          {messaggio.testo}
          {messaggio.elenco && <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>{messaggio.elenco.map((m) => <li key={m}>{m}</li>)}</ul>}
        </div>
      )}

      {modulo && (
        <div ref={moduloRef} className="pf-panel pf-book adm-editor-top" style={{ marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>{modulo.id ? (modulo.status === "changes" ? "Correggi l'articolo" : "Modifica la bozza") : "Scrivi un articolo"}</h2>
          {modulo.status === "changes" && modulo.review_note && (
            <div className="art-nota"><strong>Cosa ti chiedono gli amministratori:</strong><br />{modulo.review_note}</div>
          )}
          <ModuloArticolo valori={modulo} aggiorna={aggiorna} chiave={String(modulo.id || "nuovo")} idBase="mio-art" />
          <div className="pf-azioni" style={{ marginTop: 16 }}>
            <button type="button" className="pf-btn secondario" disabled={salvo || !dati.puoScrivere} onClick={() => salva(false)}>{salvo ? "Salvo…" : "💾 Salva bozza"}</button>
            <ConfermaInline etichetta="📨 Invia per la revisione" className="pf-btn" classeConferma="pf-btn compatto"
              domanda="Dopo l'invio non potrai più cambiarlo. Lo invio?" conferma="Sì, invia"
              disabled={salvo || !dati.puoScrivere} onConferma={() => salva(true)} />
            {modificato ? (
              <ConfermaInline etichetta="Chiudi" className="pf-btn pericolo" domanda="Chiudo senza salvare le modifiche?" conferma="Sì, chiudi"
                onConferma={() => { setModulo(null); setModificato(false); }} />
            ) : (
              <button type="button" className="pf-btn pericolo" onClick={() => setModulo(null)}>Chiudi</button>
            )}
          </div>
          <p className="pf-note" style={{ marginBottom: 0 }}>
            {inRevisione >= MAX_IN_REVISIONE
              ? `Hai già ${MAX_IN_REVISIONE} articoli in revisione: puoi salvare la bozza e inviarla quando ti rispondiamo.`
              : "«Salva bozza» la tiene solo per te. «Invia per la revisione» la manda agli amministratori."}
          </p>
        </div>
      )}

      {!modulo && dati.puoScrivere && (
        <p style={{ margin: "0 0 16px" }}>
          <button type="button" className="pf-btn" onClick={nuovo}>✏️ Scrivi un articolo</button>
        </p>
      )}

      {articoli.length === 0 && !modulo && (
        <div className="pf-panel"><p className="pf-note" style={{ margin: 0 }}>Non hai ancora scritto articoli. Il primo può essere su una cosa che spieghi spesso ai tuoi pazienti.</p></div>
      )}

      {articoli.map((a) => {
        const stato = STATI_ARTICOLO[a.status] || { nome: a.status, classe: "expired" };
        const quando = a.status === "published" ? `Pubblicato il ${dataBreve(a.published_at)}`
          : a.status === "review" ? `Inviato il ${dataBreve(a.submitted_at)}`
            : ["changes", "rejected"].includes(a.status) ? `Risposta del ${dataBreve(a.reviewed_at)}`
              : `Salvato il ${dataBreve(a.updated_at)}`;
        return (
          <div className="pf-panel art-voce" key={a.id}>
            <div className="art-voce-testa">
              <strong>{a.title}</strong>
              <span className={`stato ${stato.classe}`}>{stato.nome}</span>
            </div>
            <p className="pf-note" style={{ margin: "2px 0 0" }}>{a.category} · {quando}</p>
            {["changes", "rejected"].includes(a.status) && a.review_note && (
              <div className="art-nota"><strong>Nota degli amministratori:</strong><br />{a.review_note}</div>
            )}
            {a.status === "review" && <p className="pf-note" style={{ margin: "6px 0 0" }}>Lo stanno leggendo gli amministratori. Ti scriviamo per email.</p>}
            {a.status === "published" && <p className="pf-note" style={{ margin: "6px 0 0" }}>Per cambiare qualcosa scrivi a info@infermieriweb.it.</p>}
            <div className="pf-azioni" style={{ marginTop: 10 }}>
              {["draft", "changes"].includes(a.status) && dati.puoScrivere && (
                <button type="button" className="pf-btn compatto" onClick={() => apri(a.id)}>{a.status === "changes" ? "✏️ Correggi" : "✏️ Modifica"}</button>
              )}
              {a.status === "published"
                ? <a className="pf-btn secondario compatto" href={`/articoli/${a.slug}`} target="_blank" rel="noreferrer">Vedi sul sito</a>
                : <a className="pf-btn secondario compatto" href={`/articoli/anteprima/${a.id}`} target="_blank" rel="noreferrer">👁️ Anteprima</a>}
              {["draft", "changes", "rejected"].includes(a.status) && (
                <ConfermaInline etichetta="Elimina" domanda={`Elimino «${a.title}»?`} conferma="Sì, elimina" onConferma={() => elimina(a)} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
