import React from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function ChiSiamo() {
  return (
    <Layout>
      <section className="section white" style={{ paddingTop: "60px" }}>
        <Link to="/" style={{ color: "#0066cc", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
          ← Torna alla home
        </Link>

        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "left" }}>
          <div style={{ marginBottom: "60px" }}>
            <h1 style={{ fontSize: "48px", color: "#073763", marginBottom: "20px", textAlign: "center" }}>
              Chi Siamo
            </h1>
            <p style={{ fontSize: "18px", color: "#666", textAlign: "center", fontStyle: "italic", marginBottom: "40px" }}>
              La tua assistenza infermieristica di fiducia a Lucca e provincia
            </p>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              📋 Chi è InfermieriWeb.it
            </h2>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              InfermieriWeb.it è una piattaforma di assistenza infermieristica domiciliare professionale che opera nella provincia di Lucca con dedizione e competenza. 
              Siamo specializzati nella fornitura di servizi infermieristici direttamente presso il domicilio dei pazienti, garantendo rapidità, professionalità e attenzione personalizzata.
            </p>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              La nostra missione è rendere l'assistenza sanitaria di qualità accessibile e conveniente, portandola direttamente dove i nostri pazienti ne hanno bisogno: a casa loro, in un ambiente confortevole e sicuro.
            </p>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🎯 I Nostri Obiettivi
            </h2>
            
            <div style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", marginBottom: "20px", borderLeft: "5px solid #2563eb" }}>
              <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ Qualità e Professionalità</h3>
              <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                Fornire servizi infermieristici di altissima qualità, con personale qualificato, competente e in costante aggiornamento professionale.
              </p>
            </div>

            <div style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", marginBottom: "20px", borderLeft: "5px solid #2563eb" }}>
              <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ Accessibilità e Rapidità</h3>
              <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                Essere disponibili 7 giorni su 7 dalle 07:00 alle 22:00, garantendo tempi di risposta rapidi e flessibilità negli orari per adattarci alle esigenze dei nostri pazienti.
              </p>
            </div>

            <div style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", marginBottom: "20px", borderLeft: "5px solid #2563eb" }}>
              <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ Umanità e Attenzione</h3>
              <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                Trattare ogni paziente con dignità e rispetto, considerando non solo l'aspetto medico ma anche il benessere emotivo e psicologico della persona.
              </p>
            </div>

            <div style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", marginBottom: "20px", borderLeft: "5px solid #2563eb" }}>
              <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ Competenza Specializzata</h3>
              <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                Offrire servizi specializzati come Wound Care, gestione di patologie croniche e follow-up post-ospedaliero con protocolli medici aggiornati.
              </p>
            </div>

            <div style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", borderLeft: "5px solid #2563eb" }}>
              <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ Sicurezza e Igiene</h3>
              <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                Mantenere i più alti standard di igiene e sicurezza sanitaria, utilizzando solo materiale sterile certificato e seguendo rigorosamente i protocolli di prevenzione.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              💼 I Nostri Servizi
            </h2>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              Offriamo una gamma completa di servizi infermieristici domiciliari:
            </p>
            <ul style={{ fontSize: "18px", lineHeight: "2", color: "#333" }}>
              <li>❤️ <strong>ECG</strong> - Elettrocardiogramma a domicilio per monitoraggio cardiaco</li>
              <li>🩹 <strong>Medicazioni</strong> - Medicazioni semplici e complesse, specializzate in Wound Care</li>
              <li>🩸 <strong>Prelievi Ematici</strong> - Prelievi di sangue con trasmissione rapida ai laboratori</li>
              <li>💉 <strong>Iniezioni</strong> - Somministrazione farmaci per via intramuscolare, sottocutanea e endovenosa</li>
              <li>💧 <strong>Flebo/Terapie Infusionali</strong> - Somministrazione di terapie per via endovenosa</li>
            </ul>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🌍 La Nostra Zona di Operazione
            </h2>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              Operiamo principalmente a Lucca e provincia, incluso:
            </p>
            <ul style={{ fontSize: "18px", lineHeight: "2", color: "#333" }}>
              <li>🏙️ Lucca (città)</li>
              <li>📍 Capannori</li>
              <li>📍 Porcari</li>
              <li>📍 Altopascio</li>
              <li>📍 E altri comuni della provincia</li>
            </ul>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginTop: "20px" }}>
              Disponibilità 7 giorni su 7 dalle <strong>07:00 alle 22:00</strong>
            </p>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🤝 Perché Sceglierci
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Professionalità</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Personale qualificato e specializzato con esperienza consolidata nel settore infermieristico.</p>
              </div>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Tempestività</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Tempi di risposta rapidi e possibilità di interventi in urgenza per esigenze immediate.</p>
              </div>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Comodità</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Servizio direttamente a domicilio, senza la necessità di spostarsi o attendere presso ambulatori.</p>
              </div>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Personalizzazione</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Ogni intervento è studiato sulla base delle esigenze specifiche del singolo paziente.</p>
              </div>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Continuità</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Supporto continuo e follow-up per garantire il miglior percorso di guarigione.</p>
              </div>
              <div style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>Affidabilità</h3>
                <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>Disponibili sempre, puntuali e discreti nel mantenere la massima riservatezza.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "#e8f4f8", padding: "40px", borderRadius: "16px", textAlign: "center", marginBottom: "50px" }}>
            <h2 style={{ fontSize: "28px", color: "#073763", marginBottom: "15px" }}>
              Contattaci Oggi
            </h2>
            <p style={{ fontSize: "18px", color: "#333", marginBottom: "25px" }}>
              La tua salute è la nostra priorità. Scopri come possiamo aiutarti con assistenza professionale e dedicata.
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="tel:3881125233" className="btn-primary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                📞 Chiama: 3881125233
              </a>
              <a href="https://wa.me/393881125233" className="btn-secondary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                💬 WhatsApp
              </a>
              <a href="mailto:infermieri.ef@gmail.com" className="btn-primary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                ✉️ Email
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
