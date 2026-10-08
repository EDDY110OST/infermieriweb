import { FONTI_MAX } from "../lib/articoli-regole.js";

// Elenco delle fonti di un articolo (8/10/26): per ogni fonte «da dove viene» + link
// facoltativo. Usato nel pannello dell'infermiere e in admin (blog e «Da approvare»).
// fonti = [{testo, url}] · onChange(nuovaLista)
export default function CampoFonti({ fonti, onChange, idBase = "fonte", obbligatorie = true }) {
  const lista = Array.isArray(fonti) && fonti.length ? fonti : [{ testo: "", url: "" }];
  const cambia = (i, campo, valore) => onChange(lista.map((f, j) => (j === i ? { ...f, [campo]: valore } : f)));
  const togli = (i) => onChange(lista.filter((_, j) => j !== i));
  const aggiungi = () => onChange([...lista, { testo: "", url: "" }]);

  return (
    <fieldset className="campo-fonti">
      <legend>
        Fonti {obbligatorie ? "*" : ""}{" "}
        <span style={{ fontWeight: 400 }}>
          ({obbligatorie ? "almeno una" : "facoltative"}: Ministero della Salute, ISS, FNOPI, linee guida…)
        </span>
      </legend>
      {lista.map((f, i) => (
        <div className="campo-fonti-riga" key={i}>
          <span className="campo-fonti-num" aria-hidden="true">{i + 1}.</span>
          <div className="campo-fonti-campi">
            <label htmlFor={`${idBase}-testo-${i}`} className="sr-only">Fonte {i + 1}: da dove viene</label>
            <input id={`${idBase}-testo-${i}`} value={f.testo || ""} maxLength={200}
              onChange={(e) => cambia(i, "testo", e.target.value)}
              placeholder="Da dove viene (es. Ministero della Salute — Vaccinazioni, 2024)" />
            <label htmlFor={`${idBase}-url-${i}`} className="sr-only">Fonte {i + 1}: link (facoltativo)</label>
            <input id={`${idBase}-url-${i}`} value={f.url || ""} maxLength={500} inputMode="url"
              onChange={(e) => cambia(i, "url", e.target.value)}
              placeholder="Link, se c'è (https://…)" />
          </div>
          {lista.length > 1 && (
            <button type="button" className="pf-btn secondario compatto" onClick={() => togli(i)} aria-label={`Togli la fonte ${i + 1}`} title="Togli questa fonte">✕</button>
          )}
        </div>
      ))}
      {lista.length < FONTI_MAX && (
        <button type="button" className="pf-btn secondario compatto" onClick={aggiungi}>+ Aggiungi una fonte</button>
      )}
    </fieldset>
  );
}
