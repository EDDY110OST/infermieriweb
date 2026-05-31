import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MdMonitorHeart, MdHealing, MdBloodtype, MdLocalHospital, MdMedication, MdShowChart, MdPeople, MdMedicalServices } from "react-icons/md";
import { FaSyringe } from "react-icons/fa";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";

export default function ServiceDetail() {
  const { t } = useAppSettings();
  const { serviceId } = useParams();

  const servicesData = {
    ecg: {
      icon: <MdMonitorHeart />,
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
      price: "Da € 50,00",
    },
    medicazioni: {
      icon: <MdHealing />,
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
      price: "Da € 30,00",
    },
    prelievi: {
      icon: <MdBloodtype />,
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
      price: "Da € 20,00",
    },
    iniezioni: {
      icon: <FaSyringe />,
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
      icon: <MdLocalHospital />,
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
    desutura: {
      icon: <MdMedicalServices />,
      title: "Desutura",
      shortDescription: "Rimozione punti di sutura a domicilio",
      fullDescription: "Eseguiamo la rimozione dei punti di sutura direttamente a casa tua, con attenzione alla cicatrizzazione e rispetto delle indicazioni mediche.",
      details: [
        "Rimozione punti di sutura in modo delicato",
        "Valutazione della ferita e della guarigione",
        "Consigli per il post-trattamento",
        "Igiene professionale garantita",
        "Assistenza personalizzata in base al tipo di sutura",
      ],
      indications: [
        "Rimozione punti dopo intervento chirurgico",
        "Follow-up post-operatorio",
        "Controllo di ferite chiuse con punti",
        "Cura di cicatrici recenti",
      ],
      price: "Da € 30,00",
    },
    "cateteri-vescicali": {
      icon: <MdHealing />,
      title: "Cateteri vescicali",
      shortDescription: "Gestione e cambio cateteri vescicali a domicilio",
      fullDescription: "Offriamo assistenza a domicilio per l'inserimento, il cambio e la gestione dei cateteri vescicali, garantendo comfort, igiene e controllo medico.",
      details: [
        "Cambio catetere vescicale sterile",
        "Controllo del posizionamento e del funzionamento",
        "Istruzioni per la cura quotidiana",
        "Gestione di problemi e occlusioni",
        "Supporto per raccoglitori e accessori",
      ],
      indications: [
        "Cateterismo uretrale temporaneo",
        "Cateterismo vescicale prolungato",
        "Assistenza in caso di svuotamento incompleto della vescica",
        "Gestione post-operatoria o post-traumatica",
      ],
      price: "Da € 40,00",
    },
    "holter-pressori": {
      icon: <MdMonitorHeart />,
      title: "Holter pressori",
      shortDescription: "Monitoraggio pressorio continuo a domicilio",
      fullDescription: "Installiamo il monitor per lo studio dell'andamento della pressione arteriosa nelle 24 ore, direttamente a casa tua.",
      details: [
        "Posizionamento del dispositivo",
        "Registrazione pressoria continua",
        "Istruzioni per il paziente",
        "Rilevamento di variazioni giornaliere",
        "Consegna del referto al medico curante",
      ],
      indications: [
        "Ipertensione sospetta",
        "Controllo dell'efficacia della terapia anti-ipertensiva",
        "Valutazione di pressione variabile",
        "Monitoraggio post-degenza",
      ],
      price: "Da € 80,00",
    },
    "holter-cardiaci": {
      icon: <MdMonitorHeart />,
      title: "Holter cardiaci",
      shortDescription: "Registrazione ECG prolungata a domicilio",
      fullDescription: "Forniamo il monitoraggio cardiaco continuativo con Holter ECG per rilevare aritmie e variazioni del ritmo cardiaco.",
      details: [
        "Installazione del dispositivo ECG",
        "Registrazione delle attività cardiache",
        "Consigli comportamentali durante il monitoraggio",
        "Raccolta dei dati e analisi specialistica",
        "Consegna del referto a medico o cardiologo",
      ],
      indications: [
        "Palpitazioni o sensazione di battito irregolare",
        "Sospette aritmie",
        "Controllo post-infarto",
        "Screening cardiaco in corso di terapia",
      ],
      price: "Da € 100,00",
    },
    "sondini-naso-gastrici": {
      icon: <MdLocalHospital />,
      title: "Sondini naso gastrici",
      shortDescription: "Posizionamento e gestione di sondini naso gastrici",
      fullDescription: "Effettuiamo il posizionamento, la gestione e la verifica del sondino naso gastrico con attenzione all'igiene e al comfort del paziente.",
      details: [
        "Posizionamento corretto del sondino",
        "Verifica della funzionalità e del fissaggio",
        "Controlli periodici e sostituzione se necessario",
        "Consigli su alimentazione e gestione domiciliare",
        "Igiene e prevenzione delle complicanze",
      ],
      indications: [
        "Nutrizione enterale temporanea",
        "Somministrazione di farmaci via sondino",
        "Supporto a pazienti con deglutizione compromessa",
      ],
      price: "Da € 60,00",
    },
    "gestione-peg": {
      icon: <MdLocalHospital />,
      title: "Gestione PEG",
      shortDescription: "Assistenza per nutrizione con gastrostomia endoscopica",
      fullDescription: "Forniamo assistenza domiciliare per la cura, il cambio e la gestione della PEG, garantendo sicurezza e supporto nutrizionale.",
      details: [
        "Controllo e cura della stomia PEG",
        "Cambio del cerotto e pulizia del sito",
        "Gestione della nutrizione enterale",
        "Prevenzione delle infezioni",
        "Supporto a caregiver e familiari",
      ],
      indications: [
        "Nutrizione enterale a lungo termine",
        "Assistenza post-operatoria PEG",
        "Supporto in pazienti neurologici o oncologici",
      ],
      price: "Da € 50,00",
    },
    "terapia-orale": {
      icon: <MdMedication />,
      title: "Terapia orale",
      shortDescription: "Somministrazione di terapie orali a domicilio",
      fullDescription: "Somministriamo terapie farmacologiche orali con attenzione alla posologia, allo stato del paziente e alle interazioni.",
      details: [
        "Assunzione controllata dei farmaci",
        "Gestione di scadenze e dosaggi",
        "Controllo della deglutizione",
        "Registrazione delle terapie somministrate",
        "Supporto a pazienti fragili e anziani",
      ],
      indications: [
        "Terapie antibiotiche orali",
        "Terapie croniche e di mantenimento",
        "Supporto in caso di difficoltà di deglutizione",
      ],
      price: "Da € 25,00",
    },
    "parametri-vitali": {
      icon: <MdShowChart />,
      title: "Parametri vitali",
      shortDescription: "Rilevamento dei parametri vitali a domicilio",
      fullDescription: "Misuriamo pressione, frequenza cardiaca, saturazione, temperatura e altri parametri vitali direttamente a casa tua.",
      details: [
        "Misurazione della pressione arteriosa",
        "Rilevamento della saturazione ossigeno",
        "Controllo della frequenza cardiaca",
        "Misurazione della temperatura corporea",
        "Registrazione e report per il medico curante",
      ],
      indications: [
        "Monitoraggio di pazienti cronici",
        "Controlli dopo dimissione ospedaliera",
        "Verifica di eventuali alterazioni cliniche",
      ],
      price: "Da € 25,00",
    },
    "clisteri-evacuativi": {
      icon: <MdMedicalServices />,
      title: "Clisteri evacuativi",
      shortDescription: "Somministrazione di clisteri e supporto evacuativo",
      fullDescription: "Forniamo assistenza domiciliare per l'esecuzione di clisteri evacuativi in modo sicuro e rispettoso della privacy.",
      details: [
        "Somministrazione di clisteri evacuativi",
        "Scelta del prodotto più adatto",
        "Controllo del comfort del paziente",
        "Gestione delle intime esigenze dell'assistito",
        "Consigli per la corretta evacuazione",
      ],
      indications: [
        "Stitichezza ostinata",
        "Preparazione per esami diagnostici",
        "Supporto in pazienti neurologici o anziani",
      ],
      price: "Da € 40,00",
    },
    "gestione-stomie": {
      icon: <MdLocalHospital />,
      title: "Gestione stomie",
      shortDescription: "Cura e assistenza per stomie a domicilio",
      fullDescription: "Assistiamo nella gestione delle stomie, con cambio di sacche, cura della pelle circostante e controlli costanti.",
      details: [
        "Cambio delle sacche per stomie",
        "Igiene e protezione della cute peristomale",
        "Controllo dei materiali e dell'aderenza",
        "Supporto nella gestione quotidiana",
        "Educazione del paziente e del caregiver",
      ],
      indications: [
        "Stomia ileale o colostomica",
        "Stomia urinaria",
        "Assistenza a pazienti con problemi di digestione",
      ],
      price: "Da € 40,00",
    },
    "educazione-terapeutica": {
      icon: <MdPeople />,
      title: "Educazione terapeutica",
      shortDescription: "Formazione paziente/caregiver per la gestione della cura",
      fullDescription: "Offriamo sessioni di educazione terapeutica per pazienti e caregiver su terapie, igiene e gestione domiciliare delle patologie.",
      details: [
        "Supporto nella comprensione del piano terapeutico",
        "Istruzioni sull'uso dei dispositivi medici",
        "Consigli per l'alimentazione e l'igiene",
        "Strategie per la prevenzione di complicanze",
        "Assistenza nella gestione quotidiana della cura",
      ],
      indications: [
        "Pazienti con patologie croniche",
        "Caregiver che supportano assistiti fragili",
        "Persone in dimissione dall'ospedale",
      ],
      price: "Da € 80,00",
    },
  };

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
      <Layout>
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
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section white service-detail">
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
          <div className="page-cta" style={{ marginBottom: "20px" }}>
            <Link to="/" className="btn-primary btn-home">
              <span className="btn-icon" aria-hidden="true">🏠</span>
              {t("pages.serviceDetail.backHome")}
            </Link>
          </div>

          <div style={{ marginBottom: "40px" }}>
            <div className="service-detail-icon">{service.icon}</div>
            {serviceId === "medicazioni" ? (
              <>
                <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Medicazioni a domicilio a Lucca</h1>
                <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>Cure delle ferite a domicilio, medicazioni semplici e complesse con personale qualificato.</p>
                <img
                  src="/images/medicazione-domiciliare-lucca.png"
                  alt="Infermiere durante una medicazione a domicilio a Lucca"
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
                    src="/images/ecg-domicilio-lucca.png"
                    alt="Infermiere durante un ECG a domicilio a Lucca"
                    loading="lazy"
                    style={{ width: "100%", maxHeight: "560px", objectFit: "cover", borderRadius: "18px", marginTop: "24px" }}
                  />
                )}
                {serviceId === "prelievi" && (
                  <img
                    src="/images/prelievi-domicilio-lucca.png"
                    alt="Infermiere durante un prelievo del sangue a domicilio a Lucca"
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
                      <div className="faq-answer"><p>Il servizio è disponibile a Lucca e nei comuni limitrofi.</p></div>
                    </details>
                    <details className="faq-item">
                      <summary className="faq-question">Come posso richiedere informazioni?</summary>
                      <div className="faq-answer"><p>È possibile contattare Infermieri Web telefonicamente o tramite WhatsApp.</p></div>
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
                      "acceptedAnswer": { "@type": "Answer", "text": "Il servizio è disponibile a Lucca e nei comuni limitrofi." }
                    },
                    {
                      "@type": "Question",
                      "name": "Come posso richiedere informazioni?",
                      "acceptedAnswer": { "@type": "Answer", "text": "È possibile contattare Infermieri Web telefonicamente o tramite WhatsApp." }
                    }
                  ]
                }) }} />
              </>
            )}
            {serviceId === "iniezioni" && (
              <img
                src="/images/iniezioni-domicilio-lucca.png"
                alt="Infermiere durante una iniezione a domicilio a Lucca"
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
              <a href="tel:3313139220" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none" }}>
                {t("pages.serviceDetail.call")}
              </a>
              <a href="https://wa.me/393313139220" className="btn-secondary" style={{ padding: "12px 30px", textDecoration: "none" }}>
                {t("pages.serviceDetail.whatsapp")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
