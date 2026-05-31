import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAppSettings } from "../contexts/AppContext.jsx";
import logo from "../assets/logo.jpeg";

export default function Layout({ children }) {
  const location = useLocation();
  const { t, language, theme, switchLanguage, toggleTheme } = useAppSettings();
  const [showServizi, setShowServizi] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
      setIsSticky(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setShowServizi(false);
    setShowInfo(false);
    setMobileNavOpen(false);
  }, [location.pathname]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const toggleMobileNav = () => setMobileNavOpen((current) => !current);
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    setShowServizi(false);
    setShowInfo(false);
  };

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
          <span>📞 3313139220</span>
          <span>✉️ infermieri.ef@gmail.com</span>
          <span>🕒 Lun-Dom 07:00 - 22:00</span>
        </div>

        <div className="top-right">
          <div className="top-social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="TikTok">♪</a>
          </div>

          <label className="language-switcher-label" htmlFor="language-select">
            <span className="sr-only">{t("aria.languageSwitcher")}</span>
            <select
              id="language-select"
              value={language}
              onChange={(e) => switchLanguage(e.target.value)}
              className="language-switcher"
              aria-label={t("aria.languageSwitcher")}
            >
              <option value="it">🇮🇹</option>
              <option value="en">🇬🇧</option>
            </select>
          </label>
        </div>
      </div>

      <header className={`navbar${isSticky ? " sticky" : ""}`}>
        <Link to="/">
          <img src={logo} className="logo" alt="InfermieriWeb.it" loading="lazy" decoding="async" />
        </Link>

        <div className="navbar-controls">
          <button
            type="button"
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            aria-label={t("aria.themeToggle")}
          >
            <span className="theme-toggle__icon" aria-hidden="true">
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
            <span className="theme-toggle__label">
              {t(`theme.${theme}`)}
            </span>
          </button>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={toggleMobileNav}
          aria-label={t("aria.menuToggle")}
          aria-expanded={mobileNavOpen}
          aria-controls="main-navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-navigation" className={`menu${mobileNavOpen ? " open" : ""}`} aria-label="Menu principale">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMobileNav}>
            {t("nav.home")}
          </NavLink>

          <div className={`menu-dropdown${showServizi ? " open" : ""}`}>
            <button
              type="button"
              className="menu-dropdown-button"
              aria-haspopup="menu"
              aria-expanded={showServizi}
              aria-controls="services-panel"
              onClick={() => {
                setShowServizi((current) => !current);
                setShowInfo(false);
              }}
            >
              {t("nav.services")} ▼
            </button>

            {showServizi && (
              <div id="services-panel" className="menu-dropdown-content" role="menu">
                <div className="dropdown-section">
                  <p className="dropdown-title">Percorsi</p>
                  <NavLink
                    to="/domicilio"
                    className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")}
                    onClick={closeMobileNav}
                  >
                    Servizi Domiciliari
                  </NavLink>
                  <NavLink
                    to="/strutture"
                    className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")}
                    onClick={closeMobileNav}
                  >
                    Servizi Ambulatoriali
                  </NavLink>
                </div>
                <div className="dropdown-divider" aria-hidden="true" />
                <div className="dropdown-section">
                  <p className="dropdown-title">Prestazioni</p>
                  <NavLink to="/servizio/ecg" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>ECG</NavLink>
                  <NavLink to="/servizio/holter-cardiaci" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Holter Cardiaco</NavLink>
                  <NavLink to="/servizio/holter-pressori" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Holter Pressorio</NavLink>
                  <NavLink to="/servizio/medicazioni" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Medicazioni</NavLink>
                  <NavLink to="/servizio/prelievi" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Prelievi</NavLink>
                  <NavLink to="/servizio/iniezioni" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Iniezioni</NavLink>
                  <NavLink to="/servizio/flebo" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Flebo</NavLink>
                  <NavLink to="/servizio/cateteri-vescicali" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Cateteri Vescicali</NavLink>
                  <NavLink to="/servizio/gestione-stomie" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Gestione Stomie</NavLink>
                  <NavLink to="/servizio/desutura" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Rimozione Punti di Sutura</NavLink>
                  <NavLink to="/servizio/clisteri-evacuativi" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Clisteri Evacuativi</NavLink>
                  <NavLink to="/servizio/educazione-terapeutica" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>Piano Assistenziale Personalizzato</NavLink>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/articoli" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeMobileNav}>
            {t("nav.articles")}
          </NavLink>

          <div className={`menu-dropdown${showInfo ? " open" : ""}`}>
            <button
              type="button"
              className="menu-dropdown-button"
              aria-haspopup="menu"
              aria-expanded={showInfo}
              aria-controls="info-panel"
              onClick={() => {
                setShowInfo((current) => !current);
                setShowServizi(false);
              }}
            >
              {t("nav.info")} ▼
            </button>

            {showInfo && (
              <div id="info-panel" className="menu-dropdown-content" role="menu">
                <NavLink to="/chi-siamo" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>
                  {t("nav.about")}
                </NavLink>
                <a href="/#faq" className="menu-dropdown-item" onClick={closeMobileNav}>
                  FAQ
                </a>
                <NavLink to="/recensioni" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>
                  {t("nav.reviews")}
                </NavLink>
                <NavLink to="/lavora-con-noi" className={({ isActive }) => (isActive ? "menu-dropdown-item active" : "menu-dropdown-item")} onClick={closeMobileNav}>
                  {t("nav.workWithUs")}
                </NavLink>
                <a href="#contatti" className="menu-dropdown-item" onClick={closeMobileNav}>
                  Contatti
                </a>
              </div>
            )}
          </div>

          <a href="tel:3313139220" className="btn-menu btn-call" aria-label="Chiama Infermieri Web">
            📞 Chiama Ora
          </a>
          <a href="https://wa.me/393313139220" className="btn-menu btn-whatsapp" aria-label="Scrivi a Infermieri Web su WhatsApp">
            💬 WhatsApp
          </a>
        </nav>
      </header>

      <main id="main-content">{children}</main>

      <footer id="contatti" className="footer">
        <div className="footer-column">
          <h3>Informazioni</h3>
          <NavLink to="/" onClick={closeMobileNav}>Home</NavLink>
          <NavLink to="/chi-siamo" onClick={closeMobileNav}>Chi Siamo</NavLink>
          <a href="/#faq">FAQ</a>
          <NavLink to="/recensioni" onClick={closeMobileNav}>Recensioni</NavLink>
          <NavLink to="/lavora-con-noi" onClick={closeMobileNav}>Lavora con Noi</NavLink>
          <a href="#contatti">Contatti</a>
        </div>

        <div className="footer-column">
          <h3>Servizi</h3>
          <NavLink to="/domicilio" onClick={closeMobileNav}>Servizi Domiciliari</NavLink>
          <NavLink to="/strutture" onClick={closeMobileNav}>Servizi Ambulatoriali</NavLink>
          <NavLink to="/servizio/ecg" onClick={closeMobileNav}>ECG</NavLink>
          <NavLink to="/servizio/holter-cardiaci" onClick={closeMobileNav}>Holter</NavLink>
          <NavLink to="/servizio/medicazioni" onClick={closeMobileNav}>Medicazioni</NavLink>
          <NavLink to="/servizio/prelievi" onClick={closeMobileNav}>Prelievi</NavLink>
          <NavLink to="/servizio/iniezioni" onClick={closeMobileNav}>Iniezioni</NavLink>
        </div>

        <div className="footer-column">
          <h3>Contatti</h3>
          <p>📞 3313139220</p>
          <a href="https://wa.me/393313139220" target="_blank" rel="noreferrer" aria-label="Scrivi a Infermieri Web su WhatsApp">💬 WhatsApp</a>
          <p>✉️ infermieri.ef@gmail.com</p>
          <p>Area operativa: Lucca e provincia</p>
        </div>
      </footer>

      <button
        type="button"
        className={`scroll-top-button${showScrollTop ? " show" : ""}`}
        onClick={scrollToTop}
        aria-label="Torna su"
      >
        ↑
      </button>

      <a href="https://wa.me/393313139220" className="floating-whatsapp" aria-label="Scrivi a Infermieri Web su WhatsApp">
        💬
      </a>
    </div>
  );
}
