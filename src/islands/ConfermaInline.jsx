import { useState } from "react";

// Conferma "in pagina" al posto di window.confirm(). Le finestre native hanno due
// difetti che fanno sembrare rotto il tasto: i browser le sopprimono dopo averne
// mostrate diverse di fila (Chrome: "impedisci a questa pagina di creare altre
// finestre") e in alcune app installate (PWA) non compaiono affatto; in entrambi
// i casi confirm() torna false e il clic non fa nulla, senza spiegazione.
// Qui la domanda compare accanto al tasto, sempre, con Sì/No.
export default function ConfermaInline({ etichetta, domanda, conferma = "Sì, togli", className = "pf-btn pericolo compatto", title, disabled, onConferma }) {
  const [aperta, setAperta] = useState(false);
  const [inCorso, setInCorso] = useState(false);

  if (!aperta) {
    return (
      <button type="button" className={className} title={title} aria-label={title} disabled={disabled} onClick={() => setAperta(true)}>
        {etichetta}
      </button>
    );
  }

  const esegui = async () => {
    setInCorso(true);
    try { await onConferma(); } finally { setInCorso(false); setAperta(false); }
  };

  return (
    <span className="pf-conferma-inline" role="group" aria-label={domanda}>
      <span>{domanda}</span>
      <button type="button" className="pf-btn pericolo compatto" disabled={inCorso} onClick={esegui}>{inCorso ? "…" : conferma}</button>
      <button type="button" className="pf-btn secondario compatto" disabled={inCorso} onClick={() => setAperta(false)}>No</button>
    </span>
  );
}
