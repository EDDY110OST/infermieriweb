import React, { useState } from "react";
import CampoFonti from "./CampoFonti.jsx";
import { preparaCopertina } from "../lib/copertina-browser.js";
import {
  CATEGORIE_ARTICOLO, TITOLO_MAX, DESCRIZIONE_MIN, DESCRIZIONE_MAX, TESTO_MIN,
} from "../lib/articoli-regole.js";

// L'editor visuale (TipTap) pesa ~120 KB: si carica solo quando si apre il modulo
const EditorArticolo = React.lazy(() => import("./EditorArticolo.jsx"));

// Modulo di un articolo scritto da un infermiere (8/10/26): lo usano l'infermiere nel
// pannello e gli admin in «Modifica e pubblica». Stesso editor e stessa lista bianca del blog.
// valori = {title, category, excerpt, body_html, sources, cover_data, image}
// aggiorna(parziale) unisce i campi cambiati · chiave = rimonta l'editor su un altro articolo
export default function ModuloArticolo({ valori, aggiorna, chiave = "nuovo", idBase = "art" }) {
  const [caratteri, setCaratteri] = useState(null);
  const [erroreFoto, setErroreFoto] = useState("");
  const [caricoFoto, setCaricoFoto] = useState(false);

  const scegliFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErroreFoto(""); setCaricoFoto(true);
    try {
      const dati = await preparaCopertina(file);
      aggiorna({ cover_data: dati, remove_cover: false });
    } catch (err) {
      setErroreFoto(err.message);
    } finally {
      setCaricoFoto(false);
    }
  };
  const togliFoto = () => aggiorna({ cover_data: "", image: "", remove_cover: true });
  const anteprimaFoto = valori.cover_data || valori.image || "";

  const titolo = valori.title || "";
  const descrizione = valori.excerpt || "";
  const nTesto = caratteri ?? 0;

  return (
    <>
      <label htmlFor={`${idBase}-titolo`}>Titolo *</label>
      <input id={`${idBase}-titolo`} value={titolo} maxLength={TITOLO_MAX + 20}
        onChange={(e) => aggiorna({ title: e.target.value })}
        placeholder="es. Come prepararsi a un prelievo a domicilio" />
      <p className={`pf-contatore${titolo.trim().length > TITOLO_MAX ? " oltre" : ""}`}>{titolo.trim().length}/{TITOLO_MAX}</p>

      <label htmlFor={`${idBase}-categoria`}>Argomento</label>
      <select id={`${idBase}-categoria`} value={CATEGORIE_ARTICOLO.includes(valori.category) ? valori.category : CATEGORIE_ARTICOLO[0]}
        onChange={(e) => aggiorna({ category: e.target.value })}>
        {CATEGORIE_ARTICOLO.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label htmlFor={`${idBase}-descrizione`}>Breve descrizione * <span style={{ fontWeight: 400 }}>(1-2 frasi: si vede nell'elenco e su Google)</span></label>
      <textarea id={`${idBase}-descrizione`} rows={3} maxLength={DESCRIZIONE_MAX + 40} value={descrizione}
        onChange={(e) => aggiorna({ excerpt: e.target.value })} />
      <p className={`pf-contatore${descrizione.trim().length > DESCRIZIONE_MAX ? " oltre" : ""}`}>
        {descrizione.trim().length}/{DESCRIZIONE_MAX} · {descrizione.trim().length < DESCRIZIONE_MIN ? `almeno ${DESCRIZIONE_MIN}` : "va bene"}
      </p>

      <label>Immagine di copertina <span style={{ fontWeight: 400 }}>(facoltativa: se non c'è, ne usiamo una nostra)</span></label>
      {anteprimaFoto && (
        <img src={anteprimaFoto} alt="Anteprima della copertina" className="modulo-copertina" width="360" height="216" />
      )}
      <div className="pf-azioni" style={{ marginBottom: 6 }}>
        <label className="pf-btn secondario compatto" style={{ cursor: "pointer", margin: 0 }}>
          {caricoFoto ? "Preparo la foto…" : anteprimaFoto ? "Cambia immagine" : "Carica immagine"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={scegliFoto} style={{ display: "none" }} />
        </label>
        {anteprimaFoto && <button type="button" className="pf-btn pericolo compatto" onClick={togliFoto}>Togli l'immagine</button>}
      </div>
      <p className="pf-note" style={{ marginTop: 0 }}>Solo foto tue o libere da diritti, senza volti di pazienti. Si rimpicciolisce da sola.</p>
      {erroreFoto && <div className="pf-errore">{erroreFoto}</div>}

      <label>Testo * <span style={{ fontWeight: 400 }}>(«Titolo» = nuova sezione · grassetto, colori, elenchi, link)</span></label>
      <React.Suspense fallback={<p className="pf-note">Carico l'editor…</p>}>
        <EditorArticolo key={chiave} html={valori.body_html || ""}
          onChange={(h) => aggiorna({ body_html: h })}
          onTesto={(t) => setCaratteri(String(t || "").replace(/\s+/g, " ").trim().length)} />
      </React.Suspense>
      <p className={`pf-contatore${caratteri !== null && nTesto < TESTO_MIN ? " poco" : ""}`}>
        {nTesto.toLocaleString("it-IT")} caratteri · minimo {TESTO_MIN.toLocaleString("it-IT")} (circa 200 parole)
      </p>

      <CampoFonti fonti={valori.sources} onChange={(sources) => aggiorna({ sources })} idBase={`${idBase}-fonte`} />
    </>
  );
}
