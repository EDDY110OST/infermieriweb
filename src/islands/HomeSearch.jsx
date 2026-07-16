import React, { useRef, useState } from "react";

// Ricerca in home con suggerimenti visibili: per il nostro pubblico
// "digito e non succede niente" = "il sito non funziona".
const CITTA = ["Lucca", "Capannori", "Porcari", "Altopascio", "Montecarlo"];
const PRESTAZIONI = [
  { nome: "Prelievo del sangue", href: "/servizio/prelievi" },
  { nome: "Medicazioni", href: "/servizio/medicazioni" },
  { nome: "Iniezioni", href: "/servizio/iniezioni" },
  { nome: "ECG a domicilio", href: "/servizio/ecg" },
  { nome: "Flebo e terapie", href: "/servizio/flebo" },
  { nome: "Rimozione punti di sutura", href: "/servizio/desutura" },
  { nome: "Catetere vescicale", href: "/servizio/cateteri-vescicali" },
  { nome: "Holter cardiaco", href: "/servizio/holter-cardiaci" },
  { nome: "Holter pressorio", href: "/servizio/holter-pressori" },
  { nome: "Gestione stomie", href: "/servizio/gestione-stomie" },
  { nome: "Gestione PEG", href: "/servizio/gestione-peg" },
  { nome: "Parametri vitali", href: "/servizio/parametri-vitali" },
];

const norma = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function HomeSearch() {
  const [q, setQ] = useState("");
  const [aperto, setAperto] = useState(false);
  const box = useRef(null);

  const chiave = norma(q.trim());
  const cittaMatch = chiave.length >= 2 ? CITTA.filter((c) => norma(c).startsWith(chiave)) : [];
  const prestMatch = chiave.length >= 2
    ? PRESTAZIONI.filter((p) => norma(p.nome).includes(chiave) || chiave.split(/\s+/).some((w) => w.length >= 3 && norma(p.nome).includes(w)))
    : [];
  const suggerimenti = [...cittaMatch.map((c) => ({ tipo: "citta", nome: c, href: `/cerca?q=${encodeURIComponent(c)}` })),
    ...prestMatch.map((p) => ({ tipo: "prestazione", ...p }))].slice(0, 6);

  const alFocus = () => {
    setAperto(true);
    // il campo sta in fondo allo schermo del telefono: portalo in vista sopra la tastiera
    setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  };

  const invia = (e) => {
    e.preventDefault();
    if (suggerimenti.length === 1) return (window.location.href = suggerimenti[0].href);
    window.location.href = `/cerca${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`;
  };

  return (
    <form ref={box} className="pf-search" onSubmit={invia} role="search" style={{ position: "relative" }}>
      <input
        type="search"
        name="q"
        placeholder="Città o prestazione"
        aria-label="Cerca per città o prestazione"
        value={q}
        autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setAperto(true); }}
        onFocus={alFocus}
        onBlur={() => setTimeout(() => setAperto(false), 200)}
      />
      <button type="submit">Trova un infermiere</button>

      {aperto && suggerimenti.length > 0 && (
        <div className="pf-suggerimenti" role="listbox">
          {suggerimenti.map((s) => (
            <a key={s.href} href={s.href} role="option">
              <span className="tipo" aria-hidden="true">
                {s.tipo === "citta" ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                )}
              </span>
              <span className="nome">{s.nome}</span>
              
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
