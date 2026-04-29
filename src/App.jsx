import React from "react";
import "./App.css";
import logo from "./assets/logo.jpeg";
import foto from "./assets/foto.png";

export default function App() {
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
        <img src={logo} className="logo" alt="InfermieriWeb.it" />

        <nav className="menu">
          <a href="#domicilio">Domicilio</a>
          <a href="#strutture">Strutture</a>
          <a href="#servizi">Servizi</a>
          <a href="#recensioni">Recensioni</a>
          <a href="#contatti" className="btn-menu">Chiama ora</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="badge">Lucca e provincia · 7 giorni su 7</span>

          <h1>Assistenza infermieristica professionale a domicilio</h1>

          <p>
            ECG, medicazioni, prelievi, iniezioni e flebo direttamente a casa,
            con rapidità, esperienza e attenzione alla persona.
          </p>

          <div className="hero-buttons">
            <a href="tel:3881125233" className="btn-primary">Chiama ora</a>
            <a href="https://wa.me/393881125233" className="btn-secondary">
              Scrivi su WhatsApp
            </a>
          </div>

          <div className="trust">
            <span>✓ Rapido</span>
            <span>✓ Professionale</span>
            <span>✓ Wound Care</span>
          </div>
        </div>

        <div className="hero-photo-card">
          <img src={foto} className="hero-photo" alt="Dott. Eduard G.D." />

          <div className="caption">
            <strong>Dott. Eduard G.D.</strong>
            <span>Infermiere specializzato in Wound Care</span>
          </div>
        </div>
      </section>

      <section className="section white">
        <span className="section-label">Come funziona</span>
        <h2>Semplice, rapido, chiaro</h2>

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
        <span className="section-label">Prestazioni principali</span>
        <h2>Servizi infermieristici a domicilio</h2>

        <div className="cards-grid">
          <div className="service-card">
            <div className="icon">❤️</div>
            <h3>ECG</h3>
            <p>Elettrocardiogramma a domicilio.</p>
          </div>

          <div className="service-card">
            <div className="icon">🩹</div>
            <h3>Medicazioni</h3>
            <p>Medicazioni semplici e complesse.</p>
          </div>

          <div className="service-card">
            <div className="icon">🩸</div>
            <h3>Prelievi</h3>
            <p>Prelievi ematici a domicilio.</p>
          </div>

          <div className="service-card">
            <div className="icon">💉</div>
            <h3>Iniezioni</h3>
            <p>Somministrazioni su prescrizione.</p>
          </div>

          <div className="service-card">
            <div className="icon">💧</div>
            <h3>Flebo</h3>
            <p>Terapie infusionali secondo indicazione medica.</p>
          </div>
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
        <h2>Prestazioni anche in struttura</h2>

        <div className="structure-grid">
          <div className="structure-card">Eurofins Lamm</div>
          <div className="structure-card">Centro Medico D33</div>
          <div className="structure-card">Farmacia Comunale 24h Lucca</div>
        </div>
      </section>

      <section id="recensioni" className="section white">
        <span className="section-label">Recensioni</span>
        <h2>La fiducia delle famiglie è la priorità</h2>

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
      </section>

      <section className="final-cta">
        <h2>Hai bisogno di un infermiere a domicilio?</h2>
        <p>Contattami ora per verificare disponibilità e tempi.</p>
        <a href="tel:3881125233" className="btn-white">Chiama ora</a>
      </section>

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

      <a href="https://wa.me/393881125233" className="floating-whatsapp" aria-label="WhatsApp">
        💬
      </a>
    </div>
  );
}