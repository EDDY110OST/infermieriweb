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
    desutura: {
      icon: "🧵",
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
      icon: "💧",
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
      icon: "🩺",
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
      price: "Da € 45,00",
    },
    "holter-cardiaci": {
      icon: "❤️",
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
      price: "Da € 45,00",
    },
    "sondini-naso-gastrici": {
      icon: "🍽️",
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
      price: "Da € 35,00",
    },
    "gestione-peg": {
      icon: "🍽️",
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
      price: "Da € 40,00",
    },
    "terapia-orale": {
      icon: "💊",
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
      icon: "📈",
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
      icon: "🚽",
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
      price: "Da € 35,00",
    },
    "gestione-stomie": {
      icon: "🗂️",
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
      icon: "👥",
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
      price: "Da € 30,00",
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
