import React from "react";
import { Link } from "react-router-dom";
import { SERVIZIO_PER_ARTICOLO, NOMI_COLLOQUIALI } from "../data/servizi-extra.js";

const formatData = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? iso || "" : d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

// Rende cliccabili gli URL dentro un testo semplice
const URL_RE = /(https?:\/\/[^\s)]+)/g;
function linkify(text) {
  return String(text).split(URL_RE).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noreferrer noopener">
        {parte.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </a>
    ) : (
      parte
    )
  );
}

// Dal contenuto (array di paragrafi) ai blocchi: "- " diventa elenco puntato,
// "> " una nota evidenziata, il resto paragrafi. Gli URL diventano link.
function renderBlocchi(content, chiave) {
  const righe = Array.isArray(content) ? content : [content || ""];
  const blocchi = [];
  let lista = null;
  const chiudiLista = () => {
    if (lista) {
      blocchi.push(<ul key={`${chiave}-ul-${blocchi.length}`} className="article-list">{lista}</ul>);
      lista = null;
    }
  };
  righe.forEach((riga, idx) => {
    const testo = String(riga);
    if (testo.startsWith("- ")) {
      if (!lista) lista = [];
      lista.push(<li key={`${chiave}-li-${idx}`}>{linkify(testo.slice(2))}</li>);
      return;
    }
    chiudiLista();
    if (testo.startsWith("> ")) {
      blocchi.push(<p key={`${chiave}-nota-${idx}`} className="article-note">{linkify(testo.slice(2))}</p>);
    } else {
      blocchi.push(<p key={`${chiave}-p-${idx}`}>{linkify(testo)}</p>);
    }
  });
  chiudiLista();
  return blocchi;
}

// Riconosce un marcatore [!nome] a inizio sezione: sintesi | documento | fonti
function analizzaSezione(section) {
  const content = Array.isArray(section.content) ? section.content : [section.content || ""];
  const primo = String(content[0] || "").trim();
  const m = primo.match(/^\[!(\w+)\]\s*/);
  if (!m) return { variante: "normale", content };
  const resto = primo.slice(m[0].length);
  const pulito = [resto, ...content.slice(1)].filter((x) => String(x).trim() !== "");
  return { variante: m[1], content: pulito };
}

export default function Articolo({ article, related = [] }) {
  const safeCategory = article?.category || "Articolo";
  const safeDate = formatData(article?.date);
  const servizioAbbinato = SERVIZIO_PER_ARTICOLO[article?.slug];
  const safeReadingTime = article?.readingTime || "";
  const articleSections = Array.isArray(article?.sections) && article.sections.length
    ? article.sections
    : [
        {
          id: "overview",
          title: article?.title || "Dettagli articolo",
          content: [article?.excerpt || "Non ci sono dettagli aggiuntivi disponibili."],
        },
      ];


  if (!article) {
    return (
      <>
        <section className="section white">
          <span className="section-label">Articolo</span>
          <h2>Articolo non trovato</h2>
          <p>Ci dispiace, l'articolo richiesto non è disponibile.</p>
          <Link to="/articoli" className="btn-secondary">
            Torna agli articoli
          </Link>
        </section>
      </>
    );
  }


  return (
    <>
      <section className="section white article-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/articoli">Articoli</Link>
          <span> / </span>
          <span>{article.title}</span>
        </nav>

        <div className="article-header">
          <span className="article-category">{safeCategory}</span>
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span>{[safeDate, safeReadingTime].filter(Boolean).join(" · ")}</span>
          </div>
        </div>

        {article?.image && (
          <div className="article-hero-image">
            <img src={article.image} alt={article.title} width="900" height="540" loading="eager" fetchpriority="high" />
          </div>
        )}

        <div className="article-content-wrap">
          <aside className="article-toc">
            <h3>Indice</h3>
            <ul>
              {articleSections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </aside>

          <article className="article-content">
            {(() => {
              let ctaMostrata = false;
              const ctaPro = ["Normativa", "Per i professionisti", "Lavorare come infermiere"].includes(safeCategory);
              return articleSections.map((section) => {
                const { variante, content } = analizzaSezione(section);

                if (variante === "sintesi") {
                  return (
                    <section key={section.id} id={section.id} className="article-section article-sintesi">
                      <span className="article-sintesi-tag">In sintesi</span>
                      <h2>{section.title}</h2>
                      {renderBlocchi(content, section.id)}
                    </section>
                  );
                }

                if (variante === "documento") {
                  return (
                    <section key={section.id} id={section.id} className="article-section">
                      <div className="doc-toolbar no-print">
                        <button
                          type="button"
                          className="btn-primary"
                          data-print
                          onClick={() => { if (typeof window !== "undefined") window.print(); }}
                        >
                          🖨️ Stampa o salva in PDF
                        </button>
                        <span className="doc-hint">Viene stampato solo il modulo qui sotto.</span>
                      </div>
                      <div className="print-sheet">
                        <h2>{section.title}</h2>
                        {renderBlocchi(content, section.id)}
                      </div>
                    </section>
                  );
                }

                if (variante === "fonti") {
                  return (
                    <section key={section.id} id={section.id} className="article-section article-fonti">
                      <h2>{section.title}</h2>
                      {renderBlocchi(content, section.id)}
                    </section>
                  );
                }

                const mostraCta = !ctaMostrata;
                if (mostraCta) ctaMostrata = true;
                return (
                  <section key={section.id} id={section.id} className="article-section">
                    <h2>{section.title}</h2>
                    {renderBlocchi(content, section.id)}
                    {mostraCta && (ctaPro ? (
                      <div className="article-cta-card">
                        <h3>Sei un infermiere in regola?</h3>
                        <p>Crea la tua scheda gratuita su InfermieriWeb: ti trovano i pazienti della tua zona e gestisci gli appuntamenti dall'agenda online.</p>
                        <a href="/lavora-con-noi" className="btn-primary">Crea la tua scheda</a>
                      </div>
                    ) : (
                      <div className="article-cta-card">
                        <h3>Hai bisogno di assistenza infermieristica?</h3>
                        <p>Trova un infermiere che copre la tua zona: prezzi chiari, recensioni verificate e prenotazione online in un minuto. Gratis per te.</p>
                        <a href="/cerca" className="btn-primary">Trova un infermiere</a>
                      </div>
                    ))}
                  </section>
                );
              });
            })()}

            {servizioAbbinato && (
              <div className="article-cta-card">
                <h3>Ti serve questa prestazione?</h3>
                <p>
                  Guarda la guida completa con prezzi, domande frequenti e i professionisti
                  che la offrono nella tua zona.
                </p>
                <a href={`/servizio/${servizioAbbinato}`} className="btn-primary">
                  {NOMI_COLLOQUIALI[servizioAbbinato] || "Vedi la prestazione"}
                </a>
              </div>
            )}

            <div className="article-bottom-actions">
              <div className="share-box">
                <span>Condividi:</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${article.title} - https://infermieriweb.it/articoli/${article.slug}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://infermieriweb.it/articoli/${article.slug}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Facebook
                </a>
              </div>
            </div>

            <div className="related-articles">
              <h3>Articoli correlati</h3>
              <div className="related-grid">
                {related.map((item) => (
                  <Link key={item.slug} to={`/articoli/${item.slug}`} className="related-card">
                    <span>{item.category}</span>
                    <h4>{item.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
