import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.jpeg";

export default function Layout({ children }) {
  const [showServizi, setShowServizi] = useState(false);

  const servizi = [
    { id: "ecg", title: "ECG" },
    { id: "medicazioni", title: "Medicazioni" },
    { id: "prelievi", title: "Prelievi" },
    { id: "iniezioni", title: "Iniezioni" },
    { id: "flebo", title: "Flebo" },
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
          <img src={logo} className="logo" alt="InfermieriWeb.it" />
        </Link>

        <nav className="menu">
          <Link to="/">Home</Link>
          <Link to="/chi-siamo">Chi Siamo</Link>
          <Link to="/#domicilio">Domicilio</Link>
          <Link to="/#strutture">Strutture</Link>
          <div className="menu-dropdown">
            <button 
              className="menu-dropdown-button"
              onClick={() => setShowServizi(!showServizi)}
            >
              Servizi ▼
            </button>
            {showServizi && (
              <div className="menu-dropdown-content">
                {servizi.map((servizio) => (
                  <Link 
                    key={servizio.id}
                    to={`/servizio/${servizio.id}`}
                    className="menu-dropdown-item"
                    onClick={() => setShowServizi(false)}
                  >
                    {servizio.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/#recensioni">Recensioni</Link>
          <a href="tel:3881125233" className="btn-menu">Chiama ora</a>
        </nav>
      </header>

      {children}

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
