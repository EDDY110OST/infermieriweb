import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAppSettings } from "../contexts/AppContext.jsx";

export default function Recensioni() {
  const { t } = useAppSettings();
  const [recensioni, setRecensioni] = useState([]);
  const [nuovaRecensione, setNuovaRecensione] = useState({
    nome: "",
    testo: "",
    stelle: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Carica recensioni dal localStorage
    const recensioniSalvate = localStorage.getItem("recensioni");
    if (recensioniSalvate) {
      setRecensioni(JSON.parse(recensioniSalvate));
    }
  }, []);

  const salvaRecensioni = (recensioniAggiornate) => {
    localStorage.setItem("recensioni", JSON.stringify(recensioniAggiornate));
    setRecensioni(recensioniAggiornate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuovaRecensione.nome.trim() || !nuovaRecensione.testo.trim()) {
      alert("Per favore compila tutti i campi");
      return;
    }

    setIsSubmitting(true);

    const recensione = {
      id: Date.now(),
      nome: nuovaRecensione.nome.trim(),
      testo: nuovaRecensione.testo.trim(),
      stelle: nuovaRecensione.stelle,
      data: new Date().toLocaleDateString("it-IT")
    };

    const recensioniAggiornate = [recensione, ...recensioni];
    salvaRecensioni(recensioniAggiornate);

    setNuovaRecensione({
      nome: "",
      testo: "",
      stelle: 5
    });

    setIsSubmitting(false);
    setSuccessMessage(t("review.successMessage"));
    window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuovaRecensione(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderStars = (stelle) => {
    return "★★★★★".slice(0, stelle) + "☆☆☆☆☆".slice(stelle);
  };

  return (
    <Layout>
      <section className="section white">
        <span className="section-label">{t("review.title")}</span>
        <h1>{t("review.title")}</h1>
        <p>{t("review.description")}</p>

        {/* Form per lasciare recensione */}
        <div style={{ maxWidth: "600px", margin: "40px auto 60px", padding: "30px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>{t("review.formTitle")}</h2>

          {successMessage && (
            <div style={{
              marginBottom: "20px",
              padding: "15px 20px",
              borderRadius: "12px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              border: "1px solid #6ee7b7",
              textAlign: "center",
              fontWeight: "700"
            }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                {t("review.name")}
              </label>
              <input
                type="text"
                name="nome"
                value={nuovaRecensione.nome}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px"
                }}
                placeholder={t("review.placeholderName")}
                required
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                {t("review.rating")}
              </label>
              <select
                name="stelle"
                value={nuovaRecensione.stelle}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px"
                }}
              >
                <option value={5}>★★★★★ Eccellente</option>
                <option value={4}>★★★★☆ Molto buono</option>
                <option value={3}>★★★☆☆ Buono</option>
                <option value={2}>★★☆☆☆ Sufficiente</option>
                <option value={1}>★☆☆☆☆ Scarso</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                {t("review.review")}
              </label>
              <textarea
                name="testo"
                value={nuovaRecensione.testo}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  minHeight: "100px",
                  resize: "vertical"
                }}
                placeholder={t("review.placeholderReview")}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#00897b",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              {isSubmitting ? t("review.publishing") : t("review.submit")}
            </button>
          </form>
        </div>

        {/* Lista recensioni esistenti */}
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
            {t("review.published")} ({recensioni.length})
          </h2>

          {recensioni.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
              {t("review.noReviews")}
            </p>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {recensioni.map((recensione) => (
                <div
                  key={recensione.id}
                  style={{
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <strong style={{ color: "#00897b" }}>{recensione.nome}</strong>
                    <span style={{ color: "#666", fontSize: "14px" }}>{recensione.data}</span>
                  </div>
                  <div style={{ marginBottom: "10px", fontSize: "18px" }}>
                    {renderStars(recensione.stelle)}
                  </div>
                  <p style={{ lineHeight: "1.6", color: "#333" }}>{recensione.testo}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}