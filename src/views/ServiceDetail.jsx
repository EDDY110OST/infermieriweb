import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MdMonitorHeart, MdHealing, MdBloodtype, MdLocalHospital, MdMedication, MdShowChart, MdPeople, MdMedicalServices } from "react-icons/md";
import { FaSyringe } from "react-icons/fa";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { servicesData } from "../data/services.js";

const serviceIcons = {
  MdMonitorHeart: <MdMonitorHeart />,
  MdHealing: <MdHealing />,
  MdBloodtype: <MdBloodtype />,
  MdLocalHospital: <MdLocalHospital />,
  MdMedication: <MdMedication />,
  MdShowChart: <MdShowChart />,
  MdPeople: <MdPeople />,
  MdMedicalServices: <MdMedicalServices />,
  FaSyringe: <FaSyringe />,
};

export default function ServiceDetail() {
  const { t } = useAppSettings();
  const { serviceId } = useParams();

  const service = servicesData[serviceId];


  useEffect(() => {
    if (typeof document === "undefined") return;
    if (serviceId !== "medicazioni") return;

    // Technical SEO for the Medicazioni page (only)
    const pageTitle = "Medicazioni a domicilio a Lucca | Infermieri Web";
    const pageDescription = "Servizio di medicazioni semplici e complesse a domicilio a Lucca e provincia. Informazioni e contatti per richiedere assistenza infermieristica.";
    const canonicalUrl = "https://infermieriweb.it/servizio/medicazioni";

    document.title = pageTitle;
    const desc = document.querySelector("meta[name='description']");
    if (desc) desc.setAttribute("content", pageDescription);

    // canonical
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // Open Graph minimal update
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);
    const ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", pageDescription);
    const ogUrl = document.querySelector("meta[property='og:url']");
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    return () => {
      // Intentionally leaving metadata as-is on unmount to avoid side-effects
    };
  }, [serviceId]);

  if (!service) {
    return (
      <>
        <section className="section white">
          <h2>{t("pages.serviceDetail.serviceNotFound")}</h2>
          <p>{t("pages.serviceDetail.notFoundHome")}</p>
          <div className="page-cta">
            <Link to="/" className="btn-primary btn-home">
              <span className="btn-icon" aria-hidden="true">🏠</span>
              {t("pages.serviceDetail.backHome")}
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="section white service-detail">
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div className="page-cta" style={{ marginBottom: "20px" }}>
            <Link to="/" className="btn-primary btn-home">
              <span className="btn-icon" aria-hidden="true">🏠</span>
              {t("pages.serviceDetail.backHome")}
            </Link>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <div className="service-detail-icon">{serviceIcons[service.icon]}</div>
            {serviceId === "medicazioni" ? (
              <>
                <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Medicazioni a domicilio a Lucca</h1>
                <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>Cure delle ferite a domicilio, medicazioni semplici e complesse con personale qualificato.</p>
                <img
                  src="/images/medicazione-domiciliare-lucca.webp"
                  alt="Infermiere durante una medicazione a domicilio a Lucca"
                  width="1536"
                  height="1024"
                  loading="lazy"
                  style={{ width: "100%", maxHeight: "560px", objectFit: "cover", borderRadius: "18px", marginTop: "24px" }}
                />
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>{service.title}</h1>
                <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>{service.shortDescription}</p>
                {serviceId === "ecg" && (
                  <img
                    src="/images/ecg-domicilio-lucca.webp"
                    alt="Infermiere durante un ECG a domicilio a Lucca"
                    width="1536"
                    height="1024"
                    loading="lazy"
                    style={{ width: "100%", maxHeight: "560px", objectFit: "cover", borderRadius: "18px", marginTop: "24px" }}
                  />
                )}
                {serviceId === "prelievi" && (
                  <img
                    src="/images/prelievi-domicilio-lucca.webp"
                    alt="Infermiere durante un prelievo del sangue a domicilio a Lucca"
                    width="1536"
                    height="1024"
                    loading="lazy"
                    style={{ width: "100%", maxHeight: "560px", objectFit: "cover", borderRadius: "18px", marginTop: "24px" }}
                  />
                )}
              </>
            )}

            {/* GEO content and FAQs only for Medicazioni */}
            {serviceId === "medicazioni" && (
              <>
                <section aria-labelledby="medicazioni-overview" style={{ marginTop: "28px" }}>
                  <h2 id="medicazioni-overview" style={{ fontSize: "22px", marginBottom: "12px" }}>Che cos'è una medicazione domiciliare?</h2>
                  <p>La medicazione domiciliare è un intervento infermieristico eseguito a casa per la gestione di ferite, lesioni cutanee, ferite chirurgiche o altre situazioni che richiedono controlli periodici e sostituzione delle medicazioni.</p>

                  <h2 style={{ fontSize: "22px", marginTop: "20px", marginBottom: "12px" }}>Quando può essere richiesta?</h2>
                  <p>Il servizio può essere richiesto in caso di ferite chirurgiche, lesioni cutanee, ulcere, necessità di controlli programmati o difficoltà negli spostamenti.</p>

                  <h2 style={{ fontSize: "22px", marginTop: "20px", marginBottom: "12px" }}>Dove è disponibile il servizio?</h2>
                  <p>Il servizio è disponibile a Lucca, Capannori, Porcari, Altopascio, Montecarlo e nelle zone limitrofe.</p>
                </section>

                <section aria-labelledby="related-services" style={{ marginTop: "26px" }}>
                  <h2 id="related-services" style={{ fontSize: "22px", marginBottom: "12px" }}>Servizi correlati</h2>
                  <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", padding: 0, listStyle: "none" }}>
                    <li><Link to="/servizio/ecg">ECG a domicilio</Link></li>
                    <li><Link to="/servizio/prelievi">Prelievi a domicilio</Link></li>
                    <li><Link to="/servizio/holter-cardiaci">Holter cardiaci</Link></li>
                    <li><Link to="/servizio/holter-pressori">Holter pressori</Link></li>
                  </ul>
                </section>

                <section id="faq-medicazioni" className="faq-section" style={{ marginTop: "28px" }} aria-labelledby="faq-medicazioni-heading">
                  <h2 id="faq-medicazioni-heading" style={{ fontSize: "22px", marginBottom: "12px" }}>FAQ - Medicazioni</h2>
                  <div className="faq-grid">
                    <details className="faq-item">
                      <summary className="faq-question">Posso richiedere una medicazione a domicilio?</summary>
                      <div className="faq-answer"><p>Sì, è possibile richiedere medicazioni semplici o complesse a domicilio in base alle necessità assistenziali.</p></div>
                    </details>
                    <details className="faq-item">
                      <summary className="faq-question">In quali zone è disponibile il servizio?</summary>
                      <div className="faq-answer"><p>Cerca la tua città su InfermieriWeb: vedi subito i professionisti che coprono la tua zona.</p></div>
                    </details>
                    <details className="faq-item">
                      <summary className="faq-question">Come posso richiedere informazioni?</summary>
                      <div className="faq-answer"><p>Ogni professionista ha la sua scheda su InfermieriWeb con prestazioni, prezzi e orari liberi: prenoti online in un minuto, senza registrazione e senza costi.</p></div>
                    </details>
                  </div>
                </section>

                {/* FAQPage JSON-LD for Medicazioni (only) */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Posso richiedere una medicazione a domicilio?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Sì, è possibile richiedere medicazioni semplici o complesse a domicilio in base alle necessità assistenziali." }
                    },
                    {
                      "@type": "Question",
                      "name": "In quali zone è disponibile il servizio?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Cerca la tua città su InfermieriWeb: vedi subito i professionisti che coprono la tua zona." }
                    },
                    {
                      "@type": "Question",
                      "name": "Come posso richiedere informazioni?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Ogni professionista ha la sua scheda su InfermieriWeb con prestazioni, prezzi e orari liberi: prenoti online in un minuto, senza registrazione e senza costi." }
                    }
                  ]
                }) }} />
              </>
            )}
            {serviceId === "iniezioni" && (
              <img
                src="/images/iniezioni-domicilio-lucca.webp"
                alt="Infermiere durante una iniezione a domicilio a Lucca"
                width="1536"
                height="1024"
                loading="lazy"
                style={{ width: "100%", maxHeight: "560px", objectFit: "cover", borderRadius: "18px", marginTop: "24px" }}
              />
            )}
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>{t("pages.serviceDetail.descriptionTitle")}</h2>
            <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#333" }}>{service.fullDescription}</p>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>{t("pages.serviceDetail.featuresTitle")}</h2>
            <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#333" }}>
              {service.details.map((detail, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>✓ {detail}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>{t("pages.serviceDetail.indicationsTitle")}</h2>
            <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#333" }}>
              {service.indications.map((indication, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>→ {indication}</li>
              ))}
            </ul>
          </div>

          <div style={{ backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "40px" }}>
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>{t("pages.serviceDetail.pricingTitle")}: {service.price}</p>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>{t("pages.serviceDetail.pricingNote")}</p>
          </div>

          <div style={{ backgroundColor: "#e8f4f8", padding: "30px", borderRadius: "8px", textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", marginBottom: "15px" }}>{t("pages.serviceDetail.contactTitle")}</h3>
            <p style={{ fontSize: "16px", marginBottom: "20px" }}>{t("pages.serviceDetail.contactText")}</p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/cerca" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none" }}>
                {t("pages.serviceDetail.findPro")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
