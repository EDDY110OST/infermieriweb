import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { getArticleImage } from "../utils/articleImageFallback";
import { articles } from "../data/articles";

const categories = [
  "Tutti",
  "Assistenza Domiciliare",
  "ECG",
  "Holter",
  "Medicazioni",
  "Prelievi",
  "Iniezioni",
  "Flebo",
  "Cateteri",
  "Stomie",
];

export default function Articoli() {
  const { t } = useAppSettings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tutti");

  useEffect(() => {
    const meta = {
      title: "Guide e Consigli Infermieristici | InfermieriWeb",
      description:
        "Articoli informativi realizzati da professionisti sanitari per aiutarti a comprendere meglio la tua salute e le prestazioni infermieristiche disponibili a Lucca e provincia.",
      url: "https://infermieriweb.it/articoli",
      image: "https://infermieriweb.it/logo.jpeg",
    };

    document.title = meta.title;
    const setMeta = (selector, attr, value) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute(attr, value);
    };

    setMeta("meta[name='description']", "content", meta.description);
    setMeta("meta[property='og:title']", "content", meta.title);
    setMeta("meta[property='og:description']", "content", meta.description);
    setMeta("meta[property='og:url']", "content", meta.url);
    setMeta("meta[property='og:image']", "content", meta.image);
    setMeta("meta[name='twitter:title']", "content", meta.title);
    setMeta("meta[name='twitter:description']", "content", meta.description);
    setMeta("meta[name='twitter:image']", "content", meta.image);

    const canonical = document.querySelector("link[rel='canonical']");
    if (canonical) canonical.setAttribute("href", meta.url);
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = category === "Tutti" || article.category === category;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  return (
    <Layout>
      <section className="hero articles-hero">
        <div className="hero-text">
          <span className="badge">Articoli</span>
          <h1>Guide e Consigli Infermieristici</h1>
          <p>
            Articoli informativi realizzati da professionisti sanitari per aiutarti a comprendere meglio la tua salute e le principali prestazioni infermieristiche disponibili a Lucca e provincia.
          </p>
          <div className="hero-buttons">
            <a
              href="https://wa.me/393313139220?text=Salve%2C%20vorrei%20richiedere%20assistenza%20infermieristica.%20"
              className="btn-primary"
            >
              Richiedi Assistenza
            </a>
          </div>
        </div>
      </section>

      <section className="section white articles-listing">
        <div className="article-toolbar">
          <div className="search-wrap">
            <label htmlFor="article-search" className="sr-only">
              Cerca un argomento...
            </label>
            <input
              id="article-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca un argomento..."
              className="search-input"
            />
          </div>

          <div className="filters-row" role="tablist" aria-label="Filtri categoria articoli">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-pill${category === item ? " active" : ""}`}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="article-grid">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Link
                key={article.slug}
                to={`/articoli/${article.slug}`}
                className="article-card"
              >
                <div className="article-card-image">
                  <img src={getArticleImage(article)} alt={article.title} loading="lazy" />
                  <span className="article-card-category">{article.category}</span>
                </div>
                <div className="article-card-body">
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="article-card-meta">
                    <span>{article.date}</span>
                    <span>{article.readingTime}</span>
                  </div>
                  <span className="article-card-link">Leggi articolo</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <p>Non abbiamo trovato articoli che corrispondono alla tua ricerca.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
