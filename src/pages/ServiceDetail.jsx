import React from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function ServiceDetail() {
  const { serviceId } = useParams();

  const servicesData = {
    ecg: {
      icon: "❤️",
      title: "ECG - Elettrocardiogramma",
      shortDescription: "Monitoraggio cardiaco a domicilio",
      fullDescription: "L'elettrocardiogramma (ECG) è un esame diagnostico fondamentale per valutare la salute del cuore. Viene effettuato a domicilio per garantire massima comodità e rapidità.",
      details: [
        "Esame non invasivo e indolore",
        "Esecuzione rapida, circa 5-10 minuti",
        "Disponibile anche in urgenza",
        "Risultati elaborati e trasmessi al medico curante",
        "Adatto a pazienti di tutte le età",
      ],
      indications: [
        "Dolori al petto o difficoltà respiratoria",
        "Monitoraggio di pazienti cardiaci",
        "Controllo preventivo",
        "Valutazione pre-operatoria",
        "Screening preventivo per fattori di rischio",
      ],
      price: "Da € 30,00",
    },
    medicazioni: {
      icon: "🩹",
      title: "Medicazioni",
      shortDescription: "Cure delle ferite a domicilio",
      fullDescription: "Offriamo servizi di medicazione sia semplice che complessa, con utilizzo di materiali sterili e secondo i protocolli medici più aggiornati.",
      details: [
        "Medicazioni semplici e complesse",
        "Wound care specializzato",
        "Utilizzo di materiali di qualità",
        "Igiene e sterilità garantite",
        "Cambio medicazioni secondo prescrizione",
      ],
      indications: [
        "Ferite post-chirurgiche",
        "Ulcere da decubito",
        "Piaghe da pressione",
        "Ferite traumatiche",
        "Gestione di cateteri e drenaggi",
      ],
      price: "Da € 25,00",
    },
    prelievi: {
      icon: "🩸",
      title: "Prelievi Ematici",
      shortDescription: "Prelievi di sangue a domicilio",
      fullDescription: "Eseguiamo prelievi ematici a domicilio con massima professionalità e igiene, garantendo risultati affidabili.",
      details: [
        "Prelievi venosi per esami di laboratorio",
        "Personale qualificato e esperto",
        "Materiale sterile monouso",
        "Trasporto campioni in contenitori idonei",
        "Risultati disponibili nel laboratorio convenzionato",
      ],
      indications: [
        "Esami di routine",
        "Monitoraggio di patologie croniche",
        "Screening preventivo",
        "Controlli clinici periodici",
        "Monitoraggio terapeutico",
      ],
      price: "Da € 15,00",
    },
    iniezioni: {
      icon: "💉",
      title: "Iniezioni",
      shortDescription: "Somministrazione farmaci per via iniettiva",
      fullDescription: "Somministriamo farmaci per via intramuscolare, sottocutanea o endovenosa secondo prescrizione medica.",
      details: [
        "Iniezioni intramuscolari",
        "Iniezioni sottocutanee",
        "Iniezioni endovenose",
        "Somministrazione secondo prescrizione",
        "Monitoraggio dopo l'iniezione",
      ],
      indications: [
        "Terapie antibiotiche",
        "Terapie vitaminiche",
        "Terapie antinfiammatorie",
        "Terapie anticoagulanti",
        "Altre terapie prescritte dal medico",
      ],
      price: "Da € 20,00",
    },
    flebo: {
      icon: "💧",
      title: "Flebo - Terapie Infusionali",
      shortDescription: "Somministrazione di terapie per via endovenosa",
      fullDescription: "Eseguiamo posizionamento di accessi venosi periferici e somministrazione di terapie infusionali secondo prescrizione medica.",
      details: [
        "Posizionamento accesso venoso",
        "Somministrazione di soluzioni",
        "Terapie antibiotiche endovenose",
        "Monitoraggio durante l'infusione",
        "Gestione post-somministrazione",
      ],
      indications: [
        "Terapie antibiotiche endovenose",
        "Idratazione",
        "Terapie oncologiche",
        "Nutrizione parenterale",
        "Altre terapie prescritte dal medico",
      ],
      price: "Da € 35,00",
    },
  };

  const service = servicesData[serviceId];

  if (!service) {
    return (
      <Layout>
        <section className="section white">
          <h2>Servizio non trovato</h2>
          <p>Il servizio che cerchi non è disponibile.</p>
          <Link to="/" className="btn-primary">Torna alla home</Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section white service-detail">
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <Link to="/" style={{ color: "#0066cc", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
            ← Torna alla home
          </Link>

          <div style={{ marginBottom: "40px" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px" }}>{service.icon}</div>
            <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>{service.title}</h1>
            <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>{service.shortDescription}</p>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>Descrizione</h2>
            <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333" }}>{service.fullDescription}</p>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>Caratteristiche</h2>
            <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#333" }}>
              {service.details.map((detail, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>✓ {detail}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>Indicazioni</h2>
            <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#333" }}>
              {service.indications.map((indication, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>→ {indication}</li>
              ))}
            </ul>
          </div>

          <div style={{ backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "40px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>Tariffe: {service.price}</p>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>*Le tariffe possono variare in base alla complessità dell'intervento. Contattaci per una consulenza personalizzata.</p>
          </div>

          <div style={{ backgroundColor: "#e8f4f8", padding: "30px", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>Contattaci per prenotare</h3>
            <p style={{ fontSize: "16px", marginBottom: "20px" }}>Chiama o invia un messaggio su WhatsApp</p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="tel:3881125233" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none" }}>
                📞 Chiama
              </a>
              <a href="https://wa.me/393881125233" className="btn-secondary" style={{ padding: "12px 30px", textDecoration: "none" }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
