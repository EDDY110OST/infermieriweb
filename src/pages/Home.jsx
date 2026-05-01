import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";
import foto from "../assets/foto.png";

export default function Home() {
  const { t } = useAppSettings();
  const [showAllServices, setShowAllServices] = useState(false);
  const [recensioni, setRecensioni] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  const allServices = [
    {
      id: "ecg",
      icon: "❤️",
      title: "ECG",
      description: "Elettrocardiogramma a domicilio.",
    },
    {
      id: "medicazioni",
      icon: "🩹",
      title: "Medicazioni",
      description: "Medicazioni semplici e complesse.",
    },
    {
      id: "prelievi",
      icon: "🩸",
      title: "Prelievi",
      description: "Prelievi ematici a domicilio.",
    },
    {
      id: "iniezioni",
      icon: "💉",
      title: "Iniezioni",
      description: "Somministrazioni su prescrizione.",
    },
    {
      id: "holter-pressori",
      icon: "🩺",
      title: "Holter pressori",
      description: "Monitoraggio pressorio continuo a domicilio.",
    },
    {
      id: "holter-cardiaci",
      icon: "❤️",
      title: "Holter cardiaci",
      description: "Registrazione ECG prolungata per lo studio cardiaco.",
    },
    {
      id: "flebo",
      icon: "💧",
      title: "Flebo",
      description: "Terapie infusionali secondo indicazione medica.",
    },
    {
      id: "desutura",
      icon: "🧵",
      title: "Desutura",
      description: "Rimozione punti di sutura direttamente a domicilio.",
    },
    {
      id: "cateteri-vescicali",
      icon: "💧",
      title: "Cateteri vescicali",
      description: "Gestione e cambio di cateteri vescicali a domicilio.",
    },
    {
      id: "sondini-naso-gastrici",
      icon: "🍽️",
      title: "Sondini naso gastrici",
      description: "Posizionamento e gestione di sondini naso gastrici.",
    },
    {
      id: "gestione-peg",
      icon: "🍽️",
      title: "Gestione PEG",
      description: "Assistenza per nutrizione con gastrostomia endoscopica.",
    },
    {
      id: "terapia-orale",
      icon: "💊",
      title: "Terapia orale",
      description: "Somministrazione di terapie orali e farmaci a domicilio.",
    },
    {
      id: "parametri-vitali",
      icon: "📈",
      title: "Parametri vitali",
      description: "Rilevamento dei parametri vitali in sede domiciliare.",
    },
    {
      id: "clisteri-evacuativi",
      icon: "🚽",
      title: "Clisteri evacuativi",
      description: "Somministrazione di clisteri e supporto evacuativo.",
    },
    {
      id: "gestione-stomie",
      icon: "🗂️",
      title: "Gestione stomie",
      description: "Cura e assistenza per stomie e sistemi di raccolta.",
    },
    {
      id: "educazione-terapeutica",
      icon: "👥",
      title: "Educazione terapeutica",
      description: "Formazione paziente/caregiver per la gestione della cura.",
    },
  ];

  const featuredServices = allServices.slice(0, 6); // Mostra i primi 6 servizi
  const servicesToShow = showAllServices ? allServices : featuredServices;

  useEffect(() => {
    // Carica recensioni dal localStorage
    const recensioniSalvate = localStorage.getItem("recensioni");
    if (recensioniSalvate) {
      const recensioniParsed = JSON.parse(recensioniSalvate);
      // Mostra solo le ultime 6 recensioni nella home
      setRecensioni(recensioniParsed.slice(0, 6));
    }
  }, []);

  return (
    <Layout>
      <section className="hero">
        <div className="hero-text">
          <span className="badge">{t("hero.badge")}</span>

          <h1>
            Assistenza Infermieristica a <span className="hero-highlight">Casa Tua</span>
          </h1>

          <p>{t("hero.text")}</p>

          <div className="hero-buttons">
            <a href="tel:3881125233" className="btn-primary">{t("cta.callNow")}</a>
            <a href="https://wa.me/393881125233" className="btn-secondary">
              {t("cta.whatsapp")}
            </a>
          </div>

          <div className="trust">
            {t("hero.trust").map((item) => (
              <span key={item}>✓ {item}</span>
            ))}
          </div>
        </div>

        <div className="hero-photo-card">
          <img 
            src={foto} 
            className="hero-photo lazy-image" 
            alt="Dott. Eduard G.D. - Infermiere professionale"
            loading="lazy"
          />

          <div className="caption">
            <strong>Dott. Eduard G.D.</strong>
            <span>Infermiere specializzato in Wound Care</span>
          </div>
        </div>
      </section>

      <section className="section white">
        <span className="section-label">{t("how.label")}</span>
        <h2>{t("how.title")}</h2>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Contatto</h3>
            <p>Chiami o scrivi su WhatsApp.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Valutazione</h3>
            <p>Capisco il bisogno e ti guido.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Appuntamento</h3>
            <p>Fissiamo giorno e orario.</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Intervento</h3>
            <p>Arrivo a domicilio puntuale.</p>
          </div>
        </div>
      </section>

      <section id="servizi" className="section gray">
        <span className="section-label">{t("services.label")}</span>
        <h2>{t("services.title")}</h2>

        <div className="cards-grid">
          {servicesToShow.map((service) => (
            <Link key={service.id} to={`/servizio/${service.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="service-card">
                <div className="icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {!showAllServices && (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={() => setShowAllServices(true)}
              className="btn-secondary"
              style={{ padding: '12px 30px', fontSize: '16px' }}
            >
              {t("cta.moreServices")}
            </button>
          </div>
        )}
      </section>

      <section className="section white faq-section">
        <span className="section-label">{t("faq.label")}</span>
        <h2>{t("faq.label")}</h2>
        <p>{t("faq.intro")}</p>

        <div className="faq-grid">
          {t("faq.items").map((item) => (
            <div key={item.question} className="faq-card">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="domicilio" className="section white split-section">
        <div>
          <span className="section-label">Domicilio</span>
          <h2>Assistenza direttamente a casa tua</h2>
          <p>
            Interventi rapidi nelle zone di Lucca e provincia, con disponibilità
            7 giorni su 7 dalle 07:00 alle 22:00.
          </p>
        </div>

        <div className="info-box">
          <h3>Zone servite</h3>
          <p>Lucca, Capannori, Porcari, Altopascio e provincia.</p>
          <a href="tel:3881125233" className="btn-primary">Verifica disponibilità</a>
        </div>
      </section>

      <section id="strutture" className="section blue">
        <span className="section-label light">Dove lavoro</span>
        <h2>Prestazioni anche in ambulatori</h2>

        <div className="structure-grid">
          <Link to="/struttura/eurofins" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="structure-card">Eurofins Lamm</div>
          </Link>
          <Link to="/struttura/centro_medico_d33" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="structure-card">Centro Medico D33</div>
          </Link>
          <Link to="/struttura/farmacia_comunale" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="structure-card">Farmacia Comunale 24h Lucca</div>
          </Link>
        </div>
      </section>

      <section id="recensioni" className="section white">
        <span className="section-label">Recensioni</span>
        <h2>La fiducia delle famiglie è la priorità</h2>

        {recensioni.length === 0 ? (
          <div className="review-grid">
            <div className="review-card">
              <div>★★★★★</div>
              <p>Servizio rapido, professionale e molto umano.</p>
            </div>
            <div className="review-card">
              <div>★★★★★</div>
              <p>Disponibile, competente e attento alle esigenze della persona.</p>
            </div>
            <div className="review-card">
              <div>★★★★★</div>
              <p>Ottima assistenza a domicilio. Puntuale e preciso.</p>
            </div>
          </div>
        ) : (
          <div
            className="review-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className={`review-track ${isPaused ? 'paused' : ''}`}>
              {/* Prima serie di recensioni */}
              {recensioni.map((recensione) => (
                <div key={`first-${recensione.id}`} className="review-item">
                  <div className="review-card">
                    <div>{"★★★★★".slice(0, recensione.stelle) + "☆☆☆☆☆".slice(recensione.stelle)}</div>
                    <p>{recensione.testo.length > 80 ? recensione.testo.substring(0, 80) + "..." : recensione.testo}</p>
                    <small style={{ color: "#666", fontSize: "12px" }}>- {recensione.nome}</small>
                  </div>
                </div>
              ))}
              {/* Seconda serie per scorrimento continuo */}
              {recensioni.map((recensione) => (
                <div key={`second-${recensione.id}`} className="review-item">
                  <div className="review-card">
                    <div>{"★★★★★".slice(0, recensione.stelle) + "☆☆☆☆☆".slice(recensione.stelle)}</div>
                    <p>{recensione.testo.length > 80 ? recensione.testo.substring(0, 80) + "..." : recensione.testo}</p>
                    <small style={{ color: "#666", fontSize: "12px" }}>- {recensione.nome}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/recensioni" className="btn-primary" style={{ padding: '12px 30px' }}>
            Lascia una recensione
          </Link>
        </div>
      </section>

      <section className="final-cta">
        <h2>{t("finalCta.title")}</h2>
        <p>{t("finalCta.text")}</p>
        <a href="tel:3881125233" className="btn-white">{t("cta.callNow")}</a>
      </section>
    </Layout>
  );
}
