import React, { useCallback, useState } from "react";
import CampoRicerca from "./CampoRicerca.jsx";

// Ricerca in home (e nella pagina 404) con i suggerimenti mentre si scrive:
// per il nostro pubblico "digito e non succede niente" = "il sito non funziona".
// Si suggerisce solo ciò che la rete serve davvero (comuni coperti, prestazioni
// offerte). Scelta una voce, o premuto il tasto, si va su /cerca: chi esce lo
// decide lib/ricerca.js, come sempre.
//
// `indice`: in home arriva già pronto nella pagina (nessuna richiesta in più);
// la 404 è statica e lo chiede a /api/suggerimenti al primo tocco del campo.
export default function HomeSearch({ indice: indiceIniziale = null, variante = "hero" }) {
  const [q, setQ] = useState("");
  const [indice, setIndice] = useState(indiceIniziale);

  const chiediIndice = useCallback(() => {
    fetch("/api/suggerimenti")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setIndice(d))
      .catch(() => {});
  }, []);

  const vai = (testo) => {
    const t = testo.trim();
    window.location.href = `/cerca${t ? `?q=${encodeURIComponent(t)}` : ""}`;
  };

  return (
    <form
      className={variante === "barra" ? "pf-searchbar pf-searchbar-centro" : "pf-search"}
      onSubmit={(e) => { e.preventDefault(); vai(q); }}
      role="search"
      action="/cerca"
      method="get"
    >
      <CampoRicerca
        valore={q}
        onCambia={setQ}
        onScegli={(nuovo) => vai(nuovo)}
        indice={indice}
        chiediIndice={indiceIniziale ? undefined : chiediIndice}
        name="q"
      />
      <button type="submit" className={variante === "barra" ? "pf-btn" : undefined}>
        {variante === "barra" ? "Cerca" : "Trova un infermiere"}
      </button>
    </form>
  );
}
