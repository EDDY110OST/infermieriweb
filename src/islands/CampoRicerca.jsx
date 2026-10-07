import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { suggerisci, applicaSuggerimento } from "../lib/suggerimenti.js";

// Campo di ricerca dei pazienti con i suggerimenti mentre si scrive (7/10/26).
// Lo usano la home, /cerca e la pagina 404. Sotto il campo: «Comuni» (solo
// quelli coperti, con sigla e numero di infermieri) e «Prestazioni» (solo
// quelle offerte). Scegliere una voce cambia il pezzo che si sta scrivendo e
// lascia il resto; poi chi c'è intorno fa partire la ricerca (onScegli).
//
// Combobox ARIA 1.2: frecce su/giù, Invio sceglie, Esc chiude, clic o tocco
// fuori chiude. Sul telefono il campo sale in cima allo schermo, così la
// tendina resta visibile sopra la tastiera, e le voci sono alte almeno 44 px.

const IconaLuogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconaPrestazione = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
);

const sulTelefono = () => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

export default function CampoRicerca({
  valore,
  onCambia,
  onScegli,
  indice,
  verifica,
  chiediIndice, // facoltativo: chiamato al primo uso se l'indice non c'è ancora
  placeholder = "Città o prestazione",
  etichetta = "Cerca per città o prestazione",
  name,
  inputRef,
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listaId = `iw-sugg-${id}`;
  const contenitore = useRef(null);
  const campoInterno = useRef(null);
  const campo = inputRef || campoInterno;
  const [aperta, setAperta] = useState(false);
  const [scelta, setScelta] = useState({ risultato: null, i: -1 });
  const [altezza, setAltezza] = useState(null);

  const risultato = useMemo(
    () => (indice ? suggerisci(indice, valore, { verifica }) : { pezzo: null, comuni: [], prestazioni: [] }),
    [indice, valore, verifica],
  );
  const voci = useMemo(() => [...risultato.comuni, ...risultato.prestazioni], [risultato]);
  const mostra = aperta && voci.length > 0;

  // la voce evidenziata vale solo per l'elenco su cui è stata scelta:
  // quando l'elenco cambia, nessuna voce è evidenziata
  const attiva = scelta.risultato === risultato ? scelta.i : -1;
  const setAttiva = (nuova) =>
    setScelta((s) => ({ risultato, i: typeof nuova === "function" ? nuova(s.risultato === risultato ? s.i : -1) : nuova }));

  // chiude quando si tocca fuori
  useEffect(() => {
    const fuori = (e) => {
      if (contenitore.current && !contenitore.current.contains(e.target)) setAperta(false);
    };
    document.addEventListener("mousedown", fuori);
    document.addEventListener("touchstart", fuori, { passive: true });
    return () => {
      document.removeEventListener("mousedown", fuori);
      document.removeEventListener("touchstart", fuori);
    };
  }, []);

  // sul telefono la tendina non deve finire sotto la tastiera: altezza massima
  // = spazio visibile fra il campo e la tastiera
  useEffect(() => {
    if (!mostra) return undefined;
    const vv = window.visualViewport;
    const misura = () => {
      const r = campo.current?.getBoundingClientRect();
      if (!r) return;
      const visibile = vv ? vv.height + vv.offsetTop : window.innerHeight;
      setAltezza(Math.max(160, Math.min(440, Math.floor(visibile - r.bottom - 16))));
    };
    misura();
    vv?.addEventListener("resize", misura);
    vv?.addEventListener("scroll", misura);
    window.addEventListener("scroll", misura, { passive: true });
    return () => {
      vv?.removeEventListener("resize", misura);
      vv?.removeEventListener("scroll", misura);
      window.removeEventListener("scroll", misura);
    };
  }, [mostra, campo]);

  // tiene in vista la voce scelta con le frecce
  useEffect(() => {
    if (attiva < 0) return;
    document.getElementById(`${listaId}-${attiva}`)?.scrollIntoView({ block: "nearest" });
  }, [attiva, listaId]);

  const alFocus = () => {
    setAperta(true);
    if (!indice && chiediIndice) chiediIndice();
    if (!sulTelefono()) return;
    // porta il campo in alto (sotto l'intestazione fissa): sotto resta posto per la tendina
    setTimeout(() => {
      const r = campo.current?.getBoundingClientRect();
      if (!r) return;
      const testata = document.querySelector(".pf-header")?.getBoundingClientRect().height || 64;
      window.scrollTo({ top: window.scrollY + r.top - testata - 12, behavior: "smooth" });
    }, 250);
  };

  const scegli = (voce) => {
    const nuovo = applicaSuggerimento(valore, risultato.pezzo, voce);
    setAperta(false);
    setAttiva(-1);
    onCambia(nuovo);
    onScegli?.(nuovo, voce);
  };

  const tasti = (e) => {
    if (e.key === "ArrowDown" && voci.length) {
      e.preventDefault();
      setAperta(true);
      setAttiva((i) => (i + 1) % voci.length);
    } else if (e.key === "ArrowUp" && voci.length) {
      e.preventDefault();
      setAperta(true);
      setAttiva((i) => (i <= 0 ? voci.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      // senza una voce evidenziata l'Invio manda il modulo che sta intorno
      if (mostra && attiva >= 0) {
        e.preventDefault();
        scegli(voci[attiva]);
      } else {
        setAperta(false);
      }
    } else if (e.key === "Escape") {
      if (mostra) e.preventDefault();
      setAperta(false);
      setAttiva(-1);
    } else if (e.key === "Tab") {
      setAperta(false);
    }
  };

  const voce = (s, i) => (
    <div
      key={`${s.tipo}-${s.nome}-${s.sigla || ""}`}
      id={`${listaId}-${i}`}
      role="option"
      aria-selected={i === attiva}
      className={`iw-sugg-voce${i === attiva ? " attiva" : ""}`}
      onMouseDown={(e) => e.preventDefault()} // il campo non perde il fuoco
      onMouseMove={() => attiva !== i && setAttiva(i)}
      onClick={() => scegli(s)}
    >
      <span className="icona">{s.tipo === "comune" ? <IconaLuogo /> : <IconaPrestazione />}</span>
      {s.tipo === "comune" ? (
        <span className="testo">
          <strong>{s.nome}</strong>{s.sigla ? ` (${s.sigla})` : ""}
          <span className="quanti"> · {s.n} {s.n === 1 ? "infermiere" : "infermieri"}</span>
        </span>
      ) : (
        <span className="testo"><strong>{s.nome}</strong></span>
      )}
    </div>
  );

  const nC = risultato.comuni.length;

  return (
    <div className="iw-ricerca" ref={contenitore}>
      <input
        ref={campo}
        type="search"
        name={name}
        role="combobox"
        aria-expanded={mostra}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={mostra && attiva >= 0 ? `${listaId}-${attiva}` : undefined}
        aria-label={etichetta}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        value={valore}
        onChange={(e) => { onCambia(e.target.value); setAperta(true); }}
        onFocus={alFocus}
        onKeyDown={tasti}
      />
      <div
        id={listaId}
        role="listbox"
        aria-label="Suggerimenti"
        className="iw-sugg"
        hidden={!mostra}
        style={altezza ? { maxHeight: altezza } : undefined}
      >
        {nC > 0 && (
          <div role="group" aria-labelledby={`${listaId}-gc`}>
            <div className="iw-sugg-titolo" id={`${listaId}-gc`} role="presentation">Comuni</div>
            {risultato.comuni.map((s, i) => voce(s, i))}
          </div>
        )}
        {risultato.prestazioni.length > 0 && (
          <div role="group" aria-labelledby={`${listaId}-gp`}>
            <div className="iw-sugg-titolo" id={`${listaId}-gp`} role="presentation">Prestazioni</div>
            {risultato.prestazioni.map((s, i) => voce(s, nC + i))}
          </div>
        )}
      </div>
      <span className="iw-sr" aria-live="polite">
        {mostra ? `${voci.length} ${voci.length === 1 ? "suggerimento" : "suggerimenti"}: frecce per scorrere, Invio per scegliere` : ""}
      </span>
    </div>
  );
}
