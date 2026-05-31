import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdMonitorHeart, MdHealing, MdBloodtype, MdLocalHospital, MdMedication, MdShowChart, MdPeople, MdMedicalServices } from "react-icons/md";
import { FaSyringe } from "react-icons/fa";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { articles } from "../data/articles";
import { getArticleImage } from "../utils/articleImageFallback";
import foto from "../assets/foto.png";

const medicalBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Infermieri Web",
  "url": "https://infermieriweb.it/",
  "areaServed": [
    {
      "@type": "City",
      "name": "Lucca"
    },
    {
      "@type": "City",
      "name": "Capannori"
    },
    {
      "@type": "City",
      "name": "Porcari"
    },
    {
      "@type": "City",
      "name": "Altopascio"
    }
  ],
  "medicalSpecialty": "Nursing",
  "serviceType": [
    "Medicazioni a domicilio",
    "ECG a domicilio",
    "Prelievi a domicilio",
    "Iniezioni a domicilio",
    "Flebo a domicilio",
    "Cateteri vescicali",
    "Gestione stomie",
    "Assistenza infermieristica personalizzata"
  ],
  "telephone": "+393313139220",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Lucca",
    "addressCountry": "IT"
  }
};

export default function Home() {
  const { t } = useAppSettings();
  const [showAllServices, setShowAllServices] = useState(false);
  const [recensioni, setRecensioni] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  const allServices = [
    {
      id: "ecg",
      icon: <MdMonitorHeart />,
      title: "ECG a domicilio",
      description: "Elettrocardiogramma eseguito a domicilio su appuntamento.",
    },
    {
      id: "medicazioni",
      icon: <MdHealing />,
      title: "Medicazioni a domicilio",
      description: "Servizio infermieristico per medicazioni semplici e complesse a domicilio.",
    },
    {
      id: "prelievi",
      icon: <MdBloodtype />,
      title: "Prelievi a domicilio",
      description: "Prelievi ematici a domicilio per persone con difficoltà di spostamento o necessità organizzative.",
    },
    {
      id: "iniezioni",
      icon: <FaSyringe />,
      title: "Iniezioni a domicilio",
      description: "Somministrazione di terapia iniettiva a domicilio secondo prescrizione.",
    },

    {
      id: "holter-pressori",
      icon: <MdMonitorHeart />,
      title: "Holter pressori",
      description: "Monitoraggio pressorio continuo a domicilio.",
    },
    {
      id: "holter-cardiaci",
      icon: <MdMonitorHeart />,
      title: "Holter cardiaci",
      description: "Registrazione ECG prolungata per lo studio cardiaco.",
    },
    {
      id: "flebo",
      icon: <MdLocalHospital />,
      title: "Flebo a domicilio",
      description: "Somministrazione di terapia infusionale a domicilio secondo prescrizione.",
    },
    {
      id: "desutura",
      icon: <MdMedicalServices />,
      title: "Desutura",
      description: "Rimozione punti di sutura direttamente a domicilio.",
    },
    {
      id: "cateteri-vescicali",
      icon: <MdHealing />,
      title: "Cateteri vescicali",
      description: "Assistenza infermieristica per gestione o sostituzione del catetere vescicale.",
    },
    {
      id: "sondini-naso-gastrici",
      icon: <MdMedicalServices />,
      title: "Sondini naso gastrici",
      description: "Posizionamento e gestione di sondini naso gastrici.",
    },
    {
      id: "gestione-peg",
      icon: <MdMedicalServices />,
      title: "Gestione PEG",
      description: "Assistenza per nutrizione con gastrostomia endoscopica.",
    },
    {
      id: "terapia-orale",
      icon: <MdMedication />,
      title: "Terapia orale",
      description: "Somministrazione di terapie orali e farmaci a domicilio.",
    },
    {
      id: "parametri-vitali",
      icon: <MdShowChart />,
      title: "Parametri vitali",
      description: "Rilevamento dei parametri vitali in sede domiciliare.",
    },
    {
      id: "clisteri-evacuativi",
      icon: <MdMedicalServices />,
      title: "Clisteri evacuativi",
      description: "Somministrazione di clisteri e supporto evacuativo.",
    },
    {
      id: "gestione-stomie",
      icon: <MdLocalHospital />,
      title: "Gestione stomie",
      description: "Supporto infermieristico per cura e gestione della stomia.",
    },
    {
      id: "educazione-terapeutica",
      icon: <MdPeople />,
      title: "Educazione terapeutica",
      description: "Formazione paziente/caregiver per la gestione della cura.",
    },
  ];

  const featuredServices = allServices.slice(0, 6); // Mostra i primi 6 servizi
  const servicesToShow = showAllServices ? allServices : featuredServices;
  const latestArticles = articles
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

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
            Infermiere a domicilio a <span className="hero-highlight">Lucca</span>
          </h1>
          <script type="application/ld+json">
            {JSON.stringify(medicalBusinessSchema)}
          </script>

          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '24px' }}>
            Servizi infermieristici a domicilio a Lucca e provincia. Medicazioni, ECG, prelievi, iniezioni e flebo direttamente a casa.
          </p>

          <div className="hero-buttons">
            <Link to="/contatti" className="btn-primary" aria-label="Richiedi informazioni su servizi infermieristici a domicilio">Richiedi informazioni</Link>
            <a href="https://wa.me/393313139220" className="btn-secondary" aria-label="Scrivici su WhatsApp per richiedere informazioni o prenotare">
              Scrivici su WhatsApp
            </a>
            <a href="tel:3313139220" className="btn-white" aria-label="Chiama ora Infermieri Web per assistenza infermieristica a domicilio">
              Chiama ora
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
            alt="Dott. Eduard G.D., infermiere a domicilio"
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
            <p>Chiami o scrivi su WhatsApp per richiedere il servizio.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Valutazione</h3>
            <p>Verifico la tua esigenza e pianifico l'intervento adeguato.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Appuntamento</h3>
            <p>Fissiamo data e orario dell'intervento a domicilio.</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Intervento</h3>
            <p>Prestazione infermieristica a casa tua nella zona di Lucca.</p>
          </div>
        </div>
      </section>

      <section id="servizi" className="section gray">
        <span className="section-label">{t("services.label")}</span>
        <h2>Servizi infermieristici a domicilio</h2>
        
        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px' }}>
          Infermieri Web offre servizi infermieristici a domicilio a Lucca e zone limitrofe. Le prestazioni includono medicazioni, ECG, prelievi, iniezioni, flebo, cateteri vescicali, gestione stomie e assistenza infermieristica personalizzata.
        </p>

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
              aria-label="Visualizza tutti i servizi infermieristici disponibili a domicilio"
            >
              Scopri tutti i servizi
            </button>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>Servizi principali disponibili:</p>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', listStyle: 'none', padding: 0, margin: 0 }}>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Medicazioni a domicilio</h3><p style={{ margin: '8px 0 0 0' }}>Medicazioni semplici e complesse direttamente a casa tua.</p></li>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>ECG a domicilio</h3><p style={{ margin: '8px 0 0 0' }}>Elettrocardiogramma con refertazione specialistica.</p></li>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Prelievi a domicilio</h3><p style={{ margin: '8px 0 0 0' }}>Prelievi ematici eseguiti a domicilio.</p></li>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Iniezioni a domicilio</h3><p style={{ margin: '8px 0 0 0' }}>Somministrazioni farmacologiche su prescrizione medica.</p></li>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Flebo a domicilio</h3><p style={{ margin: '8px 0 0 0' }}>Terapie infusionali secondo indicazione medica.</p></li>
            <li><h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '600' }}>Gestione stomie</h3><p style={{ margin: '8px 0 0 0' }}>Cura e assistenza per stomie e sistemi di raccolta.</p></li>
          </ul>
        </div>
      </section>

      <section id="articoli" className="section gray">
        <span className="section-label">Ultimi Articoli</span>
        <h2>Notizie utili per la tua assistenza infermieristica</h2>

        <div className="article-preview-grid">
          {latestArticles.map((article) => (
            <Link key={article.slug} to={`/articoli/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="article-preview-card">
                <img src={getArticleImage(article)} alt={article.title} loading="lazy" />
                <div>
                  <span className="article-preview-category">{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <span className="article-preview-link">Leggi</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link to="/articoli" className="btn-secondary" style={{ padding: '12px 30px' }} aria-label="Leggi tutti gli articoli sulla assistenza infermieristica">
            Vedi tutti gli articoli
          </Link>
        </div>
      </section>

      <section id="faq" className="section white faq-section">
        <span className="section-label">{t("faq.label")}</span>
        <h2>{t("faq.label")}</h2>
        <p>{t("faq.intro")}</p>

        <div className="faq-grid">
          {t("faq.items").map((item) => (
            <details key={item.question} className="faq-item">
              <summary className="faq-question">
                <span>{item.question}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="domicilio" className="section white split-section">
        <div>
          <span className="section-label">Domicilio</span>
          <h2>Assistenza direttamente a casa tua</h2>
          <p>
            Interventi a domicilio in Lucca e provincia 7 giorni su 7, dalle 07:00 alle 22:00.
          </p>
        </div>

        <div className="info-box">
          <h3>Zone servite</h3>
          <p>Lucca, Capannori, Porcari, Altopascio e provincia.</p>
          <a href="tel:3313139220" className="btn-primary" aria-label="Verifica disponibilità del servizio a domicilio per la tua zona">Verifica disponibilità</a>
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
              <p>Servizio puntuale e attento alle esigenze del paziente.</p>
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
          <Link to="/recensioni" className="btn-primary" style={{ padding: '12px 30px' }} aria-label="Visualizza tutte le recensioni o lascia una recensione sul servizio">
            Visualizza tutte le recensioni
          </Link>
        </div>
      </section>

      <section className="final-cta">
        <h2>Hai bisogno di un infermiere a domicilio?</h2>
        <p>Contattami ora per verificare disponibilità e tempi di intervento.</p>
        <a href="tel:3313139220" className="btn-white" aria-label="Chiama Infermieri Web per richiedere informazioni o prenotare un intervento infermieristico">📞 Chiama ora</a>
      </section>
    </Layout>
  );
}
