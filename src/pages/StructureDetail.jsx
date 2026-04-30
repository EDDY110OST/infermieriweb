import React from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Layout from "../components/Layout";
import "../styles/StructureDetail.css";

// Custom flag icon
const createFlagIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        font-size: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        border: 3px solid #0066cc;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: pulse 2s infinite;
      ">
        🚩
      </div>
    `,
    iconSize: [40, 40],
    className: "custom-div-icon",
  });
};

const structures = {
  eurofins: {
    name: "Eurofins Lamm",
    address: "Via Cavalletti, 183, 55100 Lucca LU",
    phone: "0583581491",
    coordinates: [43.8347, 10.4981],
  },
  centro_medico_d33: {
    name: "Centro Medico D33",
    address: "Via di Salicchi, 978, 55100 Lucca LU",
    phone: "05831527791",
    coordinates: [43.8328, 10.5082],
  },
  farmacia_comunale: {
    name: "Farmacia Comunale 24h Lucca",
    address: "Piazza Curtatone, 7, 55100 Lucca LU",
    phone: "0583491398",
    coordinates: [43.8375, 10.5015],
  },
};

export default function StructureDetail() {
  const { structureId } = useParams();
  const structure = structures[structureId];

  if (!structure) {
    return (
      <Layout>
        <section className="not-found">
          <h2>Ambulatorio non trovato</h2>
          <Link to="/" className="btn-primary">Torna alla home</Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="structure-detail">
        <div className="structure-header">
          <Link to="/strutture" className="back-link">← Torna agli ambulatori</Link>
          <h1>{structure.name}</h1>
        </div>

        <div className="structure-content">
          <div className="map-container">
            <MapContainer
              center={structure.coordinates}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={structure.coordinates} icon={createFlagIcon()}>
                <Popup>
                  <strong>{structure.name}</strong>
                  <br />
                  {structure.address}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="structure-info">
            <div className="info-item">
              <h3>📍 Indirizzo</h3>
              <p>{structure.address}</p>
            </div>

            <div className="info-item">
              <h3>📞 Telefono</h3>
              <a href={`tel:${structure.phone}`} className="phone-link">
                {structure.phone}
              </a>
            </div>

            <div className="cta-buttons">
              <a href={`tel:${structure.phone}`} className="btn-primary">
                Chiama struttura
              </a>
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(structure.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Apri in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
