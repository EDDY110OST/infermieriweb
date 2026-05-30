import React from "react";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";

export default function Recensioni() {
  const { t } = useAppSettings();

  return (
    <Layout>
      <section className="section white">
        <span className="section-label">{t("pages.reviews.label")}</span>
        <h1>{t("pages.reviews.title")}</h1>
        <p>{t("pages.reviews.description")}</p>

        <div style={{
          maxWidth: "720px",
          margin: "50px auto",
          padding: "40px 30px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.10)",
          textAlign: "center",
          border: "1px solid #ccfbf1"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>⭐</div>

          <h2 style={{ fontSize: "32px", marginBottom: "10px", color: "#064e3b" }}>
            {t("pages.reviews.rating")}
          </h2>

          <div style={{ fontSize: "28px", color: "#f59e0b", marginBottom: "10px" }}>
            ★★★★★
          </div>

          <p style={{ fontSize: "18px", color: "#334155", marginBottom: "8px" }}>
            {t("pages.reviews.reviewCount")}
          </p>

          <p style={{
            fontSize: "16px",
            color: "#64748b",
            maxWidth: "560px",
            margin: "0 auto 30px",
            lineHeight: "1.6"
          }}>
            {t("pages.reviews.prompt")}
          </p>

          <a
            href="https://g.page/r/CblrQcuM1y1GEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "16px 28px",
              borderRadius: "999px",
              backgroundColor: "#00897b",
              color: "white",
              textDecoration: "none",
              fontWeight: "800",
              fontSize: "16px",
              boxShadow: "0 10px 24px rgba(0,137,123,0.25)"
            }}
          >
            {t("pages.reviews.googleButton")}
          </a>
        </div>
      </section>
    </Layout>
  );
}