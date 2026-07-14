import React from "react";
import { Link } from "react-router-dom";
import { useAppSettings } from "../contexts/AppContext.jsx";

export default function Domicilio() {
  const { t } = useAppSettings();
  const lucaZones = t("pages.domicile.zonesLucca");
  const pesciaZones = t("pages.domicile.zonesPescia");

  return (
    <>
      <section className="section white" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <span className="section-label">{t("pages.domicile.label")}</span>
        <h1>{t("pages.domicile.title")}</h1>
        <p>{t("pages.domicile.description")}</p>

        <div className="info-box" style={{ marginTop: "30px", padding: "25px", borderRadius: "12px" }}>
          <h2>{t("pages.domicile.howTitle")}</h2>
          <p>{t("pages.domicile.howText")}</p>
          <ul style={{ marginTop: "20px", lineHeight: "1.8" }}>
            {t("pages.domicile.howItems").map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="section gray" style={{ marginTop: "40px", padding: "25px", borderRadius: "12px" }}>
          <h2>{t("pages.domicile.zonesTitle")}</h2>
          <p>{t("pages.domicile.zonesDescription")}</p>

          <div style={{ marginTop: "20px" }}>
            <h3 className="zone-heading">Lucca</h3>
            <ul style={{ columnCount: 2, gap: "20px", lineHeight: "1.8" }}>
              {lucaZones.map((zone, index) => (
                <li key={index}>{zone}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3 className="zone-heading">Pescia</h3>
            <ul style={{ columnCount: 2, gap: "20px", lineHeight: "1.8" }}>
              {pesciaZones.map((zone, index) => (
                <li key={index}>{zone}</li>
              ))}
            </ul>
          </div>

          <p style={{ marginTop: "20px" }}>
            {t("pages.domicile.otherAreaText")}
          </p>
        </div>

        <div className="section white" style={{ marginTop: "40px", padding: "25px", borderRadius: "12px" }}>
          <h2>{t("pages.domicile.costsTitle")}</h2>
          <p>{t("pages.domicile.costsParagraph1")}</p>
          <p>{t("pages.domicile.costsParagraph2")}</p>
          <div style={{ marginTop: "20px" }}>
            <strong>Nota:</strong> {t("pages.domicile.costsNote")}
          </div>
        </div>

        <div className="final-cta" style={{ marginTop: "40px", textAlign: "center" }}>
          <h2>{t("pages.domicile.ctaTitle")}</h2>
          <p style={{ color: "#fff" }}>{t("pages.domicile.ctaText")}</p>
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="tel:3313139220" className="btn-primary">{t("pages.domicile.ctaCallNow")}</a>
            <a href="https://wa.me/393313139220" className="btn-secondary">{t("pages.domicile.ctaWhatsApp")}</a>
          </div>
        </div>

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link to="/" className="btn-primary btn-home">
            <span className="btn-icon" aria-hidden="true">🏠</span>
            {t("pages.domicile.backHome")}
          </Link>
        </div>
      </section>
    </>
  );
}
