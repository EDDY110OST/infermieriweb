import React from "react";
import "./App.css";
import logo from "./assets/logo.jpeg";
import foto from "./assets/foto.png";

export default function App() {
  return (
    <div className="page">
      {/* TOP BAR */}
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

      {/* NAVBAR */}
      <header className="navbar">
        <img src={logo} className="logo" alt="InfermieriWeb.it" />

        <nav className="menu">
          <a href="#domicilio">Domicilio</a>
          <a href="#servizi">Servizi</a>
          <a href="#strutture">Strutture</a>
          <a href="#recensioni">Recensioni</a>
          <a href="#contatti" className="btn-menu">Chiama ora</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <span className="badge">Lucca e provincia · 7 giorni su 7</span>

          <h1>Infermiere a domicilio a Lucca</h1>

          <p>
            Assistenza infermieristica professionale: ECG, medicazioni,
            prelievi, iniezioni e flebo direttamente a casa tua.
          </p>

          <div className="hero-buttons">
            <a href="tel:3881125233" className="btn-primary">Chiama ora</a>
            <a href="https://wa.me/393881125233" className="btn-secondary">
              Scrivi su WhatsApp
            </a>
          </div>

          <div className="trust">
            <span>✔ Rapido</span>
            <span>✔ Professionale</span>
            <span>✔ Wound Care</span>
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

      {/* COME FUNZIONA */}
      <section className="section white">
        <span className="section-label">Come funziona</span>
        <h2>Semplice, rapido, chiaro</h2>

        <div className="steps-grid">
          {[
            ["1", "Contatto", "Chiami o scrivi su WhatsApp"],
            ["2", "Valutazione", "Capisco il bisogno e ti guido"],
            ["3", "Appuntamento", "Fissiamo giorno e orario"],
            ["4", "Intervento", "Arrivo a domicilio puntuale"],
          ].map((step, i) => (
            <div className="step-card" key={i}>
              <div className="step-number">{step[0]}</div>
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVIZI */}
      <section id="servizi" className="section gray">
        <span className="section-label">Prestazioni principali</span>
        <h2>Servizi infermieristici a domicilio</h2>

        <div className="cards-grid">
          {[
            ["❤️", "ECG", "Elettrocardiogramma a domicilio."],
            ["🩹", "Medicazioni", "Medicazioni semplici e complesse."],
            ["🩸", "Prelievi", "Prelievi ematici a domicilio."],
            ["💉", "Iniezioni", "Somministrazioni su prescrizione."],
            ["💧", "Flebo", "Terapie infusionali secondo indicazione medica."],
          ].map((item, i) => (
            <div className="service-card" key={i}>
              <div className="icon">{item[0]}</div>
              <h3>{item[1]}</h3>
              <p>{item[2]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STRUTTURE */}
      <section id="strutture" className="section blue">
        <span className="section-label light">Dove lavoro</span>
        <h2>Prestazioni anche in struttura</h2>

        <div className="structure-grid">
          <div className="structure-card">Eurofins Lamm</div>
          <div className="structure-card">Centro Medico D33</div>
          <div className="structure-card">Farmacia Comunale 24h Lucca</div>
        </div>
      </section>

      {/* RECENSIONI */}
      <section id="recensioni" className="section white">
        <span className="section-label">Recensioni</span>
        <h2>La fiducia delle famiglie è la priorità</h2>

        <div className="review-grid">
          <div className="review-card">★★★★★<p>Servizio rapido e professionale.</p></div>
          <div className="review-card">★★★★★<p>Molto disponibile e competente.</p></div>
          <div className="review-card">★★★★★<p>Ottima assistenza a domicilio.</p></div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <h2>Hai bisogno di un infermiere a domicilio?</h2>
        <p>Contattami ora per verificare disponibilità e tempi.</p>
        <a href="tel:3881125233" className="btn-white">Chiama ora</a>
      </section>

      {/* FOOTER */}
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

      <a href="https://wa.me/393881125233" className="floating-whatsapp">
        💬
      </a>
    </div>
  );
}