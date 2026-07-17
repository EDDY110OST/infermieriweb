import React, { useEffect, useRef, useState } from "react";

// Campo comune con tendina di suggerimenti sui comuni italiani veri (elenco ISTAT).
// Chi scrive "luc" vede Lucca, Lucca Sicula, Lucca…: sceglie e comune+provincia+regione
// si compilano da soli. Niente zone inventate, niente "Lucca e dintorni".
//
// onScegli riceve il comune intero { nome, sigla, provincia, regione }.
export default function CercaComune({
  valore,
  onScegli,
  onTesto,
  id,
  required = false,
  placeholder = "Inizia a scrivere il comune…",
}) {
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [aperta, setAperta] = useState(false);
  const [evidenziato, setEvidenziato] = useState(-1);
  const [caricamento, setCaricamento] = useState(false);
  const contenitore = useRef(null);
  const ultimaRichiesta = useRef(0);

  // chiude la tendina quando si tocca fuori (su telefono capita di continuo)
  useEffect(() => {
    const fuori = (e) => {
      if (contenitore.current && !contenitore.current.contains(e.target)) setAperta(false);
    };
    document.addEventListener("mousedown", fuori);
    return () => document.removeEventListener("mousedown", fuori);
  }, []);

  // cerca mentre si scrive, con una pausa: non una chiamata per ogni lettera
  useEffect(() => {
    const q = (valore || "").trim();
    if (q.length < 2) {
      setSuggerimenti([]);
      return;
    }
    const mio = ++ultimaRichiesta.current;
    setCaricamento(true);
    const attesa = setTimeout(() => {
      fetch(`/api/comuni?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          // risposta vecchia arrivata in ritardo: la ignoro, sennò la tendina "torna indietro"
          if (mio !== ultimaRichiesta.current) return;
          setSuggerimenti(d.comuni || []);
          setEvidenziato(-1);
          setCaricamento(false);
        })
        .catch(() => setCaricamento(false));
    }, 180);
    return () => clearTimeout(attesa);
  }, [valore]);

  const scegli = (c) => {
    onScegli(c);
    setAperta(false);
    setSuggerimenti([]);
  };

  const tasti = (e) => {
    if (!aperta || !suggerimenti.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEvidenziato((i) => (i + 1) % suggerimenti.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEvidenziato((i) => (i <= 0 ? suggerimenti.length - 1 : i - 1));
    } else if (e.key === "Enter" && evidenziato >= 0) {
      e.preventDefault();
      scegli(suggerimenti[evidenziato]);
    } else if (e.key === "Escape") {
      setAperta(false);
    }
  };

  const mostra = aperta && (suggerimenti.length > 0 || (valore || "").trim().length >= 2);

  return (
    <div className="iw-comune" ref={contenitore}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={mostra}
        aria-controls={`${id}-tendina`}
        aria-autocomplete="list"
        required={required}
        placeholder={placeholder}
        value={valore || ""}
        onChange={(e) => {
          onTesto(e.target.value);
          setAperta(true);
        }}
        onFocus={() => setAperta(true)}
        onKeyDown={tasti}
      />
      {mostra && (
        <ul className="iw-comune-tendina" id={`${id}-tendina`} role="listbox">
          {suggerimenti.map((c, i) => (
            <li
              key={`${c.nome}-${c.sigla}`}
              role="option"
              aria-selected={i === evidenziato}
              className={i === evidenziato ? "attivo" : ""}
              onMouseEnter={() => setEvidenziato(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => scegli(c)}
            >
              <strong>{c.nome}</strong>
              <small>{c.provincia} ({c.sigla}) · {c.regione}</small>
            </li>
          ))}
          {!suggerimenti.length && !caricamento && (
            <li className="iw-comune-vuoto">Nessun comune trovato. Controlla come l'hai scritto.</li>
          )}
        </ul>
      )}
    </div>
  );
}
