import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { structuresData } from "../data/structures.js";
import "../styles/StructureDetail.css";

export default function StructureDetail() {
  const { t } = useAppSettings();
  const { structureId } = useParams();
  const structure = structuresData[structureId];

  // La mappa (Leaflet) funziona solo nel browser: si carica dopo il mount.
  const [MapComponent, setMapComponent] = useState(null);
  useEffect(() => {
    let active = true;
    import("../components/StructureMap.jsx").then((module) => {
      if (active) setMapComponent(() => module.default);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!structure) {
    return (
      <>
        <section className="not-found">
          <h2>{t("pages.structureDetail.notFoundTitle")}</h2>
          <Link to="/strutture" className="btn-primary">{t("pages.structureDetail.backToStructures")}</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="structure-detail">
        <div className="structure-header">
          <Link to="/strutture" className="back-link">{t("pages.structureDetail.backToStructures")}</Link>
          <h1>{structure.name}</h1>
        </div>

        <div className="structure-content">
          <div className="map-container">
            {MapComponent ? (
              <MapComponent structure={structure} />
            ) : (
              <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Caricamento mappa…
              </div>
            )}
          </div>

          <div className="structure-info">
            <div className="info-item">
              <h3>{t("pages.structureDetail.address")}</h3>
              <p>{structure.address}</p>
            </div>

            <div className="info-item">
              <h3>{t("pages.structureDetail.phone")}</h3>
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
    </>
  );
}
