import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function Domicilio() {
  return (
    <Layout>
      <section className="section white" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <span className="section-label">Domicilio</span>
        <h1>Assistenza infermieristica a domicilio</h1>
        <p>
          Offriamo prestazioni infermieristiche direttamente a casa tua, con un servizio
          dedicato e professionale in tutte le zone di Lucca e provincia.
        </p>

        <div className="info-box" style={{ marginTop: "30px", padding: "25px", borderRadius: "12px" }}>
          <h2>Come funziona la prestazione a domicilio</h2>
          <p>
            Dopo il contatto telefonico o via WhatsApp, valutiamo il tipo di intervento e fissiamo
            insieme giorno e orario più comodi. Ti raggiungiamo a domicilio per effettuare ECG,
            medicazioni, prelievi, iniezioni, flebo e altre prestazioni infermieristiche.
          </p>
          <ul style={{ marginTop: "20px", lineHeight: "1.8" }}>
            <li>Valutazione del bisogno e organizzazione dell'intervento</li>
            <li>Arrivo puntuale nell'orario concordato</li>
            <li>Prestazione eseguita in ambiente igienico e sicuro</li>
            <li>Consigli e supporto post-intervento</li>
          </ul>
        </div>

        <div className="section gray" style={{ marginTop: "40px", padding: "25px", borderRadius: "12px" }}>
          <h2>Zone servite</h2>
          <p>Di seguito le frazioni coperte nella zona di Lucca e Pescia:</p>

          <div style={{ marginTop: "20px" }}>
            <h3 className="zone-heading">Lucca</h3>
            <ul style={{ columnCount: 2, gap: "20px", lineHeight: "1.8" }}>
              <li>Altopascio</li>
              <li>Bagni di Lucca</li>
              <li>Barga</li>
              <li>Borgo a Mozzano</li>
              <li>Camaiore</li>
              <li>Camporgiano</li>
              <li>Capannori</li>
              <li>Careggine</li>
              <li>Castelnuovo di Garfagnana</li>
              <li>Castiglione di Garfagnana</li>
              <li>Coreglia Antelminelli</li>
              <li>Fabbriche di Vergemoli</li>
              <li>Fosciandora</li>
              <li>Forte dei Marmi</li>
              <li>Gallicano</li>
              <li>Lucca</li>
              <li>Massarosa</li>
              <li>Minucciano</li>
              <li>Molazzana</li>
              <li>Montecarlo</li>
              <li>Pescaglia</li>
              <li>Piazza al Serchio</li>
              <li>Pietrasanta</li>
              <li>Pieve Fosciana</li>
              <li>Porcari</li>
              <li>San Romano in Garfagnana</li>
              <li>San Quirico</li>
              <li>Seravezza</li>
              <li>Sillano Giuncugnano</li>
              <li>Stazzema</li>
              <li>Vagli Sotto</li>
              <li>Viareggio</li>
              <li>Villa Basilica</li>
              <li>Villa Collemandina</li>
            </ul>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3 className="zone-heading">Pescia</h3>
            <ul style={{ columnCount: 2, gap: "20px", lineHeight: "1.8" }}>
              <li>Alberghi</li>
              <li>Aramo</li>
              <li>Castellare</li>
              <li>Castelvecchio</li>
              <li>Chiodo</li>
              <li>Collodi</li>
              <li>Collodi Castello</li>
              <li>Fibbialla</li>
              <li>Macchino</li>
              <li>Medicina</li>
              <li>Monte a Pescia</li>
              <li>Pescia Morta</li>
              <li>Pietrabuona</li>
              <li>Pontito</li>
              <li>Santa Margherita</li>
              <li>San Lorenzo</li>
              <li>San Quirico</li>
              <li>Sorana</li>
              <li>Stiappa</li>
              <li>Vellano</li>
              <li>Veneri</li>
            </ul>
          </div>

          <p style={{ marginTop: "20px" }}>
            Se ti trovi in un'altra località della provincia di Lucca o nelle aree vicine,
            contattaci subito e verifichiamo insieme la copertura nella tua zona.
          </p>
        </div>

        <div className="section white" style={{ marginTop: "40px", padding: "25px", borderRadius: "12px" }}>
          <h2>Costi e distanza</h2>
          <p>
            Il costo della prestazione varia in base alla zona e alla distanza. Le tariffe sono
            calcolate in modo trasparente a seconda del luogo di intervento e del tempo di viaggio.
          </p>
          <p>
            Per avere un preventivo preciso, contattaci specificando la tua località: ti forniremo
            subito un'indicazione chiara e personalizzata.
          </p>
          <div style={{ marginTop: "20px" }}>
            <strong>Nota:</strong> il prezzo finale dipende dalla distanza dalla base operativa e dal tipo di prestazione richiesto.
          </div>
        </div>

        <div className="final-cta" style={{ marginTop: "40px", textAlign: "center" }}>
          <h2>Vuoi prenotare una prestazione a domicilio?</h2>
          <p style={{ color: "#fff" }}>Chiama o scrivi subito per verificare disponibilità e costo nella tua zona.</p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="tel:3881125233" className="btn-primary">📞 Chiama ora</a>
            <a href="https://wa.me/393881125233" className="btn-secondary">💬 WhatsApp</a>
          </div>
        </div>

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link to="/" className="btn-secondary">← Torna alla home</Link>
        </div>
      </section>
    </Layout>
  );
}
