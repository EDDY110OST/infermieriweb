import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/Structures.css";

const structures = [
  {
    id: "eurofins",
    name: "Eurofins Lamm",
    address: "Via Cavalletti, 183, 55100 Lucca LU",
    phone: "0583581491",
    icon: "🏥",
  },
  {
    id: "centro_medico_d33",
    name: "Centro Medico D33",
    address: "Via di Salicchi, 978, 55100 Lucca LU",
    phone: "05831527791",
    icon: "⚕️",
  },
  {
    id: "farmacia_comunale",
    name: "Farmacia Comunale 24h Lucca",
    address: "Piazza Curtatone, 7, 55100 Lucca LU",
    phone: "0583491398",
    icon: "💊",
  },
];

export default function Structures() {
  return (
    <Layout>
      <section className="structures-page">
        <div className="structures-header">
          <h1>Gli ambulatori con cui collaboro</h1>
          <p>Clicca su un ambulatorio per visualizzare la mappa e i dettagli</p>
        </div>

        <div className="structures-list">
          {structures.map((structure) => (
            <Link
              key={structure.id}
              to={`/struttura/${structure.id}`}
              className="structure-item-link"
            >
              <div className="structure-item">
                <div className="structure-icon">{structure.icon}</div>
                <div className="structure-details">
                  <h2>{structure.name}</h2>
                  <p className="address">
                    📍 {structure.address}
                  </p>
                  <p className="phone">
                    📞 {structure.phone}
                  </p>
                </div>
                <div className="structure-arrow">→</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
