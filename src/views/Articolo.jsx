import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getArticleImage } from "../utils/articleImageFallback";
import { articles } from "../data/articles";

export default function Articolo() {
  const { slug } = useParams();
  const article = articles.find((item) => item.slug === slug);
  const safeCategory = article?.category || "Articolo";
  const safeDate = article?.date || "";
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

  useEffect(() => {
    if (!article) return;

    const meta = {
      title: `${article.title} | InfermieriWeb`,
      description: article.excerpt || "Scopri di più su InfermieriWeb.",
      url: `https://infermieriweb.it/articoli/${article.slug}`,
      image: getArticleImage(article),
    };

    document.title = meta.title;
    const setMeta = (selector, attr, value) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute(attr, value);
    };

    setMeta("meta[name='description']", "content", meta.description);
    setMeta("meta[property='og:type']", "content", "article");
    setMeta("meta[property='og:title']", "content", meta.title);
    setMeta("meta[property='og:description']", "content", meta.description);
    setMeta("meta[property='og:url']", "content", meta.url);
    setMeta("meta[property='og:image']", "content", meta.image);
    setMeta("meta[name='twitter:title']", "content", meta.title);
    setMeta("meta[name='twitter:description']", "content", meta.description);
    setMeta("meta[name='twitter:image']", "content", meta.image);

    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) canonical.setAttribute("href", meta.url);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt || "Scopri di più su InfermieriWeb.",
      image: [meta.image],
      author: {
        "@type": "Person",
        name: "InfermieriWeb"
      },
      publisher: {
        "@type": "Organization",
        name: "InfermieriWeb",
        logo: {
          "@type": "ImageObject",
          url: "https://infermieriweb.it/logo.jpeg"
        }
      },
      datePublished: article.date || new Date().toISOString().split("T")[0],
      dateModified: article.date || new Date().toISOString().split("T")[0],
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": meta.url
      }
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://infermieriweb.it/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Articoli",
          item: "https://infermieriweb.it/articoli"
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: meta.url
        }
      ]
    };

    const scriptArticle = document.createElement("script");
    scriptArticle.type = "application/ld+json";
    scriptArticle.id = "article-schema";
    scriptArticle.text = JSON.stringify(jsonLd);
    document.head.appendChild(scriptArticle);

    const scriptBreadcrumb = document.createElement("script");
    scriptBreadcrumb.type = "application/ld+json";
    scriptBreadcrumb.id = "breadcrumb-schema";
    scriptBreadcrumb.text = JSON.stringify(breadcrumb);
    document.head.appendChild(scriptBreadcrumb);

    return () => {
      const articleScript = document.getElementById("article-schema");
      const breadcrumbScript = document.getElementById("breadcrumb-schema");
      if (articleScript) articleScript.remove();
      if (breadcrumbScript) breadcrumbScript.remove();
    };
  }, [article]);

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

  const related = articles.filter((item) => item.slug !== article.slug).slice(0, 3);

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
            {safeDate && <span>{safeDate}</span>}
            {safeReadingTime && <span>{safeReadingTime}</span>}
          </div>
        </div>

        <div className="article-hero-image">
          <img src={getArticleImage(article)} alt={article.title} width="900" height="540" loading="lazy" />
        </div>

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
            {articleSections.map((section, index) => (
              <section key={section.id} id={section.id} className="article-section">
                <h2>{section.title}</h2>
                {Array.isArray(section.content)
                  ? section.content.map((paragraph, idx) => (
                      <p key={`${section.id}-${idx}`}>{paragraph}</p>
                    ))
                  : <p>{section.content || ""}</p>
                }
                {index === 0 && (
                  <div className="article-cta-card">
                    <h3>Hai bisogno di assistenza infermieristica?</h3>
                    <p>Scrivici su WhatsApp e ricevi supporto rapido per la tua situazione a Lucca e provincia.</p>
                    <a
                      href="https://wa.me/393313139220?text=Salve%2C%20ho%20bisogno%20di%20assistenza%20infermieristica.%20"
                      className="btn-primary"
                    >
                      Contatta su WhatsApp
                    </a>
                  </div>
                )}
              </section>
            ))}

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
