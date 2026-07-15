import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { getArticleImage } from "../utils/articleImageFallback";

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

const formatData = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? iso || "" : d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

export default function Articoli({ articles = [] }) {
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
    <>


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
                  <img src={getArticleImage(article)} alt={article.title} width="900" height="540" loading="lazy" />
                  <span className="article-card-category">{article.category}</span>
                </div>
                <div className="article-card-body">
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="article-card-meta">
                    <span>{[formatData(article.date), article.readingTime].filter(Boolean).join(" · ")}</span>
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
    </>
  );
}
