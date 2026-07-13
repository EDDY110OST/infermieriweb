import React, { useState } from "react";
import Layout from "../components/Layout";

const benefits = [
  {
    title: "Richieste già filtrate",
    description: "Ricevi solo richieste verificate e in linea con la tua esperienza, senza perdere tempo a cercare clienti.",
  },
  {
    title: "Libertà di disponibilità",
    description: "Organizza i tuoi turni in base ai tuoi impegni e scegli quando accettare le visite domiciliari.",
  },
  {
    title: "Valorizzazione professionale",
    description: "Lavora con autonomia e rispetto, in una rete che premia la tua competenza infermieristica.",
  },
  {
    title: "Supporto e organizzazione",
    description: "Ricevi assistenza nella gestione degli appuntamenti e del coordinamento con i pazienti.",
  },
  {
    title: "Visibilità locale",
    description: "Compari nei risultati della tua area di Lucca e provincia e aumenti la domanda nella tua zona.",
  },
];

const faqs = [
  {
    question: "Quanto costa entrare nella rete?",
    answer: "Lavorare con InfermieriWeb non ha costi di iscrizione per te: ti mettiamo in contatto con richieste domiciliari e puoi valutare ogni proposta in totale libertà.",
  },
  {
    question: "Devo essere libero professionista?",
    answer: "Sì, cerchiamo infermieri iscritti all'OPI e operanti come libero professionista o con partita IVA, in modo da garantire trasparenza e correttezza.",
  },
  {
    question: "Posso scegliere quando lavorare?",
    answer: "Assolutamente: decidi tu le tue disponibilità, accetti solo le richieste che si adattano al tuo calendario e mantieni la tua autonomia organizzativa.",
  },
  {
    question: "In quali zone operate?",
    answer: "Operiamo principalmente a Lucca e provincia, con specializzazione nelle aree limitrofe per garantire rapidità, puntualità e servizio di qualità.",
  },
];

export default function LavoraConNoi() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <Layout>
      <section className="hero jobs-hero">
        <div className="hero-text">
          <span className="badge">Lavora con noi</span>
          <h1>Lavora con noi come infermiere a domicilio a Lucca e provincia</h1>
          <p>
            Entra nella rete InfermieriWeb e ricevi richieste di prestazioni domiciliari nella tua zona,
            mantenendo autonomia, professionalità e libertà organizzativa.
          </p>

          <div className="hero-buttons">
            <a
              href="https://wa.me/393313139220?text=Salve%2C%20voglio%20candidarmi%20su%20InfermieriWeb%20come%20infermiere%20a%20domicilio."
              className="btn-primary"
            >
              Candidati ora su WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section white jobs-section">
        <span className="section-label">Perché collaborare con InfermieriWeb?</span>
        <h2>Scopri i vantaggi di far parte della nostra rete</h2>

        <div className="cards-grid why-grid">
          {benefits.map(({ title, description }) => (
            <article key={title} className="job-card">
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section gray">
        <span className="section-label">Chi cerchiamo</span>
        <h2>Infermieri qualificati per prestazioni domiciliari</h2>
        <p>
          Cerchiamo infermieri iscritti all’OPI, seri, puntuali e disponibili a svolgere prestazioni domiciliari come medicazioni,
          iniezioni, flebo, prelievi, ECG, gestione cateteri, stomie e assistenza personalizzata.
        </p>
      </section>

      <section className="section white">
        <span className="section-label">FAQ</span>
        <h2>Domande frequenti</h2>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <button
              key={faq.question}
              type="button"
              className={`faq-item${openFaq === index ? " open" : ""}`}
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              aria-expanded={openFaq === index}
            >
              <div className="faq-question">
                <span>{faq.question}</span>
                <span>{openFaq === index ? "−" : "+"}</span>
              </div>
              <div className="faq-answer" aria-hidden={openFaq !== index}>
                <p>{faq.answer}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="final-cta jobs-final-cta">
        <h2>Vuoi collaborare con InfermieriWeb?</h2>
        <p>Scrivici ora e raccontaci chi sei, dove lavori e quali prestazioni puoi offrire.</p>
        <a
          href="https://wa.me/393313139220?text=Salve%2C%20vorrei%20collaborare%20con%20InfermieriWeb.%20Sono%20infermiere%20e%20vorrei%20raccontare%20chi%20sono%20e%20le%20mie%20prestazioni."
          className="btn-white"
        >
          Contattaci su WhatsApp
        </a>
      </section>
    </Layout>
  );
}
