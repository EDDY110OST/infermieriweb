import React from "react";
import { useAppSettings } from "../contexts/AppContext.jsx";
import { Link } from "react-router-dom";

export default function ChiSiamo() {
  const { t } = useAppSettings();
  const whoParagraphs = t("pages.about.whoParagraphs");
  const goals = t("pages.about.goals");
  const servicesList = t("pages.about.servicesList");
  const areaListLucca = t("pages.about.areaListLucca");
  const areaListPescia = t("pages.about.areaListPescia");
  const whyItems = t("pages.about.whyItems");

  return (
    <>
      <section className="section white" style={{ paddingTop: "60px" }}>
        <Link to="/" style={{ color: "#0066cc", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
          {t("pages.about.backToHome")}
        </Link>

        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "left" }}>
          <div style={{ marginBottom: "60px" }}>
            <h1 style={{ fontSize: "48px", color: "#073763", marginBottom: "20px", textAlign: "center" }}>
              {t("pages.about.title")}
            </h1>
            <p style={{ fontSize: "18px", color: "#666", textAlign: "center", fontStyle: "italic", marginBottom: "40px" }}>
              {t("pages.about.subtitle")}
            </p>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              📋 {t("pages.about.whoTitle")}
            </h2>
            {whoParagraphs.map((paragraph, index) => (
              <p key={index} style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🎯 {t("pages.about.goalsTitle")}
            </h2>
            {goals.map((goal, index) => (
              <div key={index} style={{ backgroundColor: "#f0f9ff", padding: "25px", borderRadius: "12px", marginBottom: "20px", borderLeft: "5px solid #2563eb" }}>
                <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>✓ {goal.title}</h3>
                <p style={{ fontSize: "17px", color: "#333", margin: "0", lineHeight: "1.6" }}>
                  {goal.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              💼 {t("pages.about.servicesTitle")}
            </h2>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              {t("pages.about.servicesIntro")}
            </p>
            <ul style={{ fontSize: "18px", lineHeight: "2", color: "#333" }}>
              {servicesList.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🌍 {t("pages.about.areaTitle")}
            </h2>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginBottom: "20px" }}>
              {t("pages.about.areaDescription")}
            </p>
            <ul style={{ fontSize: "18px", lineHeight: "2", color: "#333" }}>
              {areaListLucca.map((item, index) => (
                <li key={index}>📍 {item}</li>
              ))}
            </ul>
            <ul style={{ fontSize: "18px", lineHeight: "2", color: "#333", marginTop: "20px" }}>
              {areaListPescia.map((item, index) => (
                <li key={index}>📍 {item}</li>
              ))}
            </ul>
            <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#333", marginTop: "20px" }}>
              {t("pages.about.availability")}
            </p>
          </div>

          <div style={{ marginBottom: "50px" }}>
            <h2 style={{ fontSize: "32px", color: "#2563eb", marginBottom: "20px" }}>
              🤝 {t("pages.about.whyTitle")}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {whyItems.map((item, index) => (
                <div key={index} style={{ backgroundColor: "#e8f4f8", padding: "25px", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "20px", color: "#073763", marginBottom: "10px" }}>{item.title}</h3>
                  <p style={{ fontSize: "16px", color: "#333", margin: "0" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: "#e8f4f8", padding: "40px", borderRadius: "16px", textAlign: "center", marginBottom: "50px" }}>
            <h2 style={{ fontSize: "28px", color: "#073763", marginBottom: "15px" }}>
              {t("pages.about.ctaTitle")}
            </h2>
            <p style={{ fontSize: "18px", color: "#333", marginBottom: "25px" }}>
              {t("pages.about.ctaText")}
            </p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="tel:3313139220" className="btn-primary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                {t("pages.about.ctaCall")}
              </a>
              <a href="https://wa.me/393313139220" className="btn-secondary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                {t("pages.about.ctaWhatsApp")}
              </a>
              <a href="mailto:infermieri.ef@gmail.com" className="btn-primary" style={{ padding: "14px 28px", textDecoration: "none" }}>
                {t("pages.about.ctaEmail")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
