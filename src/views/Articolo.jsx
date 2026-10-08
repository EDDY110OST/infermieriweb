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

// Sezione dall'editor visuale: HTML già sanificato lato server (lista bianca) al salvataggio
function BloccoHtml({ html }) {
  return <div className="article-html" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Riconosce un marcatore [!nome] a inizio sezione: sintesi | documento | fonti
function analizzaSezione(section) {
  if (section.html !== undefined) return { variante: "html", content: [] };
  const content = Array.isArray(section.content) ? section.content : [section.content || ""];
  const primo = String(content[0] || "").trim();
  const m = primo.match(/^\[!(\w+)\]\s*/);
  if (!m) return { variante: "normale", content };
  const resto = primo.slice(m[0].length);
  const pulito = [resto, ...content.slice(1)].filter((x) => String(x).trim() !== "");
  return { variante: m[1], content: pulito };
}

// Firma di un articolo scritto da un infermiere della rete (8/10/26)
function FirmaAutore({ autore, data, rivisto, lettura }) {
  const nome = autore.attivo ? <a href={`/p/${autore.slug}`}>{autore.nome}</a> : <span>{autore.nome}</span>;
  const date = [
    data && `Pubblicato il ${formatData(data)}`,
    rivisto && `Rivisto il ${formatData(rivisto)}`,
    lettura,
  ].filter(Boolean).join(" · ");
  return (
    <div className="article-firma">
      <img src={autore.foto} alt={`Foto di ${autore.nome}`} width="56" height="56" loading="eager" />
      <div>
        <p className="article-firma-nome">Scritto da {nome}<span className="article-firma-albo"><span className="sep"> · </span>{autore.albo}</span></p>
        {date && <p className="article-firma-date">{date}</p>}
      </div>
    </div>
  );
}

// Fonti in fondo all'articolo (riquadro «fonti»): testo + link, se c'è
function FontiArticolo({ fonti }) {
  return (
    <section id="fonti" className="article-section article-fonti">
      <h2>Fonti</h2>
      <ul className="article-list">
        {fonti.map((f, i) => (
          <li key={i}>
            {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer nofollow">{f.testo}</a> : f.testo}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Articolo({ article, related = [], anteprima = false }) {
  const safeCategory = article?.category || "Articolo";
  const safeDate = formatData(article?.date);
  const servizioAbbinato = SERVIZIO_PER_ARTICOLO[article?.slug];
  const safeReadingTime = article?.readingTime || "";
  const fonti = Array.isArray(article?.fonti) ? article.fonti.filter((f) => f && f.testo) : [];
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

        {anteprima && (
          <div className="article-anteprima" role="status">
            👁️ <strong>Anteprima</strong>: l'articolo non è ancora pubblicato. Lo vedono solo l'autore e gli amministratori.
          </div>
        )}

        <div className="article-header">
          <span className="article-category">{safeCategory}</span>
          <h1>{article.title}</h1>
          {article.autore ? (
            <FirmaAutore autore={article.autore} data={article.date} rivisto={article.rivisto} lettura={safeReadingTime} />
          ) : (
            <div className="article-meta">
              <span>{[safeDate, safeReadingTime].filter(Boolean).join(" · ")}</span>
            </div>
          )}
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
              {fonti.length > 0 && <li><a href="#fonti">Fonti</a></li>}
            </ul>
          </aside>

          <article className="article-content">
            {(() => {
              const ctaPro = ["Normativa", "Per i professionisti", "Lavorare come infermiere"].includes(safeCategory);
              // la CTA compare una volta sola: dopo la prima sezione "di testo" (normale o html)
              const primaConCta = articleSections.findIndex((s) => ["normale", "html"].includes(analizzaSezione(s).variante));
              return articleSections.map((section, indice) => {
                const { variante, content } = analizzaSezione(section);

                if (variante === "html") {
                  const mostraCtaHtml = indice === primaConCta;
                  return (
                    <section key={section.id} id={section.id} className="article-section">
                      {section.title && <h2>{section.title}</h2>}
                      <BloccoHtml html={section.html} />
                      {mostraCtaHtml && (ctaPro ? (
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
                }

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

                const mostraCta = indice === primaConCta;
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

            {fonti.length > 0 && <FontiArticolo fonti={fonti} />}

            {article.autore && (
              <p className="article-nota-autore">
                Articolo scritto da {article.autore.nome} della rete InfermieriWeb e rivisto dalla redazione.
                Serve a informare: non sostituisce il parere del tuo medico.
              </p>
            )}

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

            {related.length > 0 && (
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
            )}
          </article>
        </div>
      </section>
    </>
  );
}
