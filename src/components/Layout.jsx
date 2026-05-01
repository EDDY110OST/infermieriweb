import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../contexts/AppContext.jsx";
import logo from "../assets/logo.jpeg";

export default function Layout({ children }) {
  const { t, language, theme, switchLanguage, toggleTheme } = useAppSettings();
  const [showServizi, setShowServizi] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const toggleMobileNav = () => setMobileNavOpen((current) => !current);
  const closeMobileNav = () => setMobileNavOpen(false);

  const servizi = [
    { id: "ecg", title: "ECG" },
    { id: "medicazioni", title: "Medicazioni" },
    { id: "prelievi", title: "Prelievi" },
    { id: "iniezioni", title: "Iniezioni" },
    { id: "holter-pressori", title: "Holter pressori" },
    { id: "holter-cardiaci", title: "Holter cardiaci" },
    { id: "flebo", title: "Flebo" },
    { id: "desutura", title: "Desutura" },
    { id: "cateteri-vescicali", title: "Cateteri vescicali" },
    { id: "sondini-naso-gastrici", title: "Sondini naso gastrici" },
    { id: "gestione-peg", title: "Gestione PEG" },
    { id: "terapia-orale", title: "Terapia orale" },
    { id: "parametri-vitali", title: "Parametri vitali" },
    { id: "clisteri-evacuativi", title: "Clisteri evacuativi" },
    { id: "gestione-stomie", title: "Gestione stomie" },
    { id: "educazione-terapeutica", title: "Educazione terapeutica" },
  ];

  return (
    <div className="page">
      <div className="top-bar">
        <div className="top-left">
          <span>📞 3881125233</span>
          <span>✉️ infermieri.ef@gmail.com</span>
          <span>🕒 Lun-Dom 07:00 - 22:00</span>
        </div>

        <div className="top-social">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">◎</a>
          <a href="#" aria-label="TikTok">♪</a>
        </div>
      </div>

      <header className="navbar">
        <Link to="/">
          <img src={logo} className="logo" alt="InfermieriWeb.it" loading="lazy" decoding="async" />
        </Link>

        <div className="navbar-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={t("aria.themeToggle")}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          <label className="language-switcher-label" htmlFor="language-select">
            <span className="sr-only">{t("aria.languageSwitcher")}</span>
            <select
              id="language-select"
              value={language}
              onChange={(e) => switchLanguage(e.target.value)}
              className="language-switcher"
              aria-label={t("aria.languageSwitcher")}
            >
              <option value="it">{t("languages.it")}</option>
              <option value="en">{t("languages.en")}</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={toggleMobileNav}
          aria-label={t("aria.menuToggle")}
          aria-expanded={mobileNavOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`menu${mobileNavOpen ? " open" : ""}`}>
          <Link to="/" onClick={closeMobileNav}>{t("nav.home")}</Link>
          <Link to="/chi-siamo" onClick={closeMobileNav}>{t("nav.about")}</Link>
          <Link to="/domicilio" onClick={closeMobileNav}>{t("nav.domicile") ?? t("nav.domicile")}</Link>
          <Link to="/strutture" onClick={closeMobileNav}>{t("nav.structures")}</Link>
          <div className="menu-dropdown">
            <button 
              className="menu-dropdown-button"
              onClick={() => {
                setShowServizi(!showServizi);
                setMobileNavOpen(true);
              }}
            >
              {t("nav.services")} ▼
            </button>
            {showServizi && (
              <div className="menu-dropdown-content">
                {servizi.map((servizio) => (
                  <Link 
                    key={servizio.id}
                    to={`/servizio/${servizio.id}`}
                    className="menu-dropdown-item"
                    onClick={() => {
                      setShowServizi(false);
                      closeMobileNav();
                    }}
                  >
                    {servizio.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/recensioni" onClick={closeMobileNav}>{t("nav.reviews")}</Link>
          <a href="tel:3881125233" className="btn-menu">{t("cta.callNow")}</a>
        </nav>
      </header>

      <main id="main-content">{children}</main>

      <footer id="contatti" className="footer">
        <div>
          <img src={logo} className="footer-logo" alt="InfermieriWeb.it" />
          <p>Assistenza infermieristica domiciliare su Lucca e provincia.</p>
        </div>

        <div>
          <h3>Contatti</h3>
          <p>📞 3881125233</p>
          <p>✉️ infermieri.ef@gmail.com</p>
        </div>

        <div>
          <h3>Orari</h3>
          <p>Lun-Dom 07:00 - 22:00</p>
          <p>7 giorni su 7</p>
        </div>
      </footer>

      <div className="fixed-cta-bar" role="contentinfo" aria-label="CTA fissa per chiamare o scrivere">
        <a href="tel:3881125233" aria-label={t("aria.callNow")}>{t("cta.call")}</a>
        <a href="https://wa.me/393881125233" aria-label={t("aria.whatsapp")}>{t("cta.write")}</a>
      </div>

      <button
        type="button"
        className={`scroll-top-button${showScrollTop ? " show" : ""}`}
        onClick={scrollToTop}
        aria-label="Torna su"
      >
        ↑
      </button>

      <a href="https://wa.me/393881125233" className="floating-whatsapp" aria-label="WhatsApp">
        💬
      </a>
    </div>
  );
}
