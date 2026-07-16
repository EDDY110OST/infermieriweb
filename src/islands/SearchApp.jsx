import React, { useEffect, useMemo, useRef, useState } from "react";

const capitalizza = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const prezzo = (cents) => (cents > 0 ? `da ${(cents / 100).toFixed(2).replace(".", ",")} €` : "");

function Stelle({ pro }) {
  if (pro.review_count > 0) {
    const piene = Math.round(Number(pro.avg_rating));
    return (
      <span className="pf-stars">
        {"★".repeat(piene)}{"☆".repeat(5 - piene)}
        <span className="n">{String(pro.avg_rating).replace(".", ",")} ({pro.review_count} recensioni)</span>
      </span>
    );
  }
  if (pro.google_rating) return <span className="pf-stars">★★★★★<span className="n">{pro.google_rating}</span></span>;
  return <span className="pf-stars"><span className="n">Nuovo sulla piattaforma</span></span>;
}

function ListaAttesa({ zona }) {
  const [email, setEmail] = useState("");
  const [fatto, setFatto] = useState(false);
  const [errore, setErrore] = useState("");

  const invia = async (e) => {
    e.preventDefault();
    setErrore("");
    const r = await fetch("/api/lista-attesa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, zona }),
    });
    const d = await r.json();
    if (!r.ok) return setErrore(d.error || "Errore");
    setFatto(true);
  };

  if (fatto) return <div className="pf-successo">✅ Grazie! Ti scriveremo appena un professionista copre la tua zona.</div>;

  return (
    <form onSubmit={invia} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="La tua email" aria-label="La tua email per la lista d'attesa"
        style={{ flex: 1, minWidth: 200, border: "1px solid var(--iw-line)", borderRadius: "var(--iw-r-ctrl)", padding: "12px 14px", fontSize: 18, fontFamily: "inherit" }}
      />
      <button className="pf-btn">Avvisatemi</button>
      {errore && <div className="pf-errore" style={{ width: "100%" }}>{errore}</div>}
    </form>
  );
}

export default function SearchApp() {
  const [q, setQ] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : ""
  );
  const [tutti, setTutti] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    fetch("/api/professionisti")
      .then((r) => r.json())
      .then((d) => setTutti(d.professionisti || []))
      .finally(() => setCaricamento(false));
  }, []);

  // Ricerca a parole: "infermiere a Lucca" e "medicazioni Lucca" devono funzionare,
  // non solo la frase esatta. Le parole di servizio non contano.
  const STOPWORD = new Set(["a", "ad", "di", "da", "in", "per", "il", "lo", "la", "un", "uno", "una", "vicino", "zona", "casa", "domicilio", "e"]);
  // La ricerca deve capire il paziente, non pretendere la parola esatta del listino:
  // "prelievo"≈"prelievi" (radice), "puntura"→iniezioni (sinonimo), "analisi"→prelievi.
  const SINONIMI = {
    puntura: "iniezioni", punture: "iniezioni", iniezione: "iniezioni",
    sangue: "prelievi", analisi: "prelievi", prelievo: "prelievi",
    medicazione: "medicazioni", ferita: "medicazioni", ferite: "medicazioni", piaga: "medicazioni", piaghe: "medicazioni",
    elettrocardiogramma: "ecg", catetere: "cateteri", stomia: "stomie",
    infermiera: "infermiere", infermieri: "infermiere", flebo: "flebo",
  };
  const radice = (w) =>
    w.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[aeiou]+$/, "");

  const risultati = useMemo(() => {
    const parole = q.trim().toLowerCase().split(/\s+/).filter((t) => t && !STOPWORD.has(t));
    if (!parole.length) return tutti;
    return tutti.filter((p) => {
      const radiciCampi = [p.name, p.city, p.province, p.region, p.profession, ...(p.coverage || []), ...(p.servizi || [])]
        .join(" ").toLowerCase().split(/[^a-zà-ù0-9]+/).map(radice).filter(Boolean);
      return parole.every((t) => {
        const rt = radice(SINONIMI[t] || t);
        // confronto per radice: "prelievo"≈"prelievi", "medicazione"≈"medicazioni", "capannoni"≈"capannori" no ma "capannor"≈ sì
        return radiciCampi.some((w) => w.startsWith(rt) || rt.startsWith(w));
      });
    });
  }, [q, tutti]);

  // Mappa Leaflet
  useEffect(() => {
    let attivo = true;
    import("leaflet").then((mod) => {
      if (!attivo || leafletRef.current) return;
      const L = mod.default;
      import("leaflet/dist/leaflet.css");
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([42.3, 12.3], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      leafletRef.current = { L, map };
    });
    return () => { attivo = false; };
  }, []);

  useEffect(() => {
    const ctx = leafletRef.current;
    if (!ctx) return;
    const { L, map } = ctx;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const icona = L.divIcon({
      html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#00897b;border:3px solid #fff;box-shadow:0 4px 12px rgba(11,57,84,.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:15px;">🩺</span></div>',
      className: "", iconSize: [34, 34], iconAnchor: [17, 34],
    });
    const conPin = risultati.filter((p) => p.lat && p.lng);
    for (const p of conPin) {
      const marker = L.marker([p.lat, p.lng], { icon: icona }).addTo(map)
        .bindPopup(`<div class="pf-pin-popup"><img src="${p.photo_url}" alt=""/><div><div class="nome">${p.name}</div><div class="prof">${capitalizza(p.profession)} · ${p.city}</div><a href="/p/${p.slug}">Vedi scheda e prenota →</a></div></div>`);
      markersRef.current.push(marker);
    }
    if (conPin.length === 1) map.setView([conPin[0].lat, conPin[0].lng], 10);
    else if (conPin.length > 1) map.fitBounds(conPin.map((p) => [p.lat, p.lng]), { padding: [40, 40] });
  }, [risultati, caricamento]);

  return (
    <div className="pf-search-layout">
      <div>
        <form className="pf-searchbar" onSubmit={(e) => e.preventDefault()} role="search">
          <input
            type="search"
            placeholder="Città o prestazione (es. Lucca, ECG)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cerca un professionista per città o prestazione"
          />
        </form>

        {caricamento && <p className="pf-note">Caricamento professionisti…</p>}

        {!caricamento && risultati.length === 0 && (
          <div className="pf-panel">
            <h2>{tutti.length ? "Non ci siamo ancora arrivati" : "Nessun professionista disponibile"}</h2>
            <p style={{ color: "var(--iw-slate)" }}>
              In questa zona non c'è ancora un professionista della rete. Lasciaci la tua email:
              ti avvisiamo appena arriviamo — di solito apriamo prima le zone da cui riceviamo più richieste.
            </p>
            <ListaAttesa zona={q} />
            <p className="pf-note" style={{ marginTop: 14 }}>
              Oppure <a href="/professionisti">guarda le zone già coperte</a>.
            </p>
            <p className="pf-note" style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--iw-line)" }}>
              Sei un infermiere di questa zona? <a href="/lavora-con-noi">Entra nella rete (gratis)</a>.
            </p>
          </div>
        )}

        <div className="pf-pro-list">
          {risultati.map((p) => (
            <div className="pf-pro-card" key={p.id}>
              <img className="foto" src={p.photo_url} alt={`Foto di ${p.name}`} loading="lazy" />
              <div className="info">
                <a className="nome" href={`/p/${p.slug}`}>{p.name}</a>
                <div className="prof">{capitalizza(p.profession)}</div>
                <Stelle pro={p} />
                <div className="zona">📍 {p.city}{p.coverage?.length > 1 ? ` e altre ${p.coverage.length - 1} zone` : ""} ({p.province})</div>
                
              </div>
              <a className="pf-btn" href={`/p/${p.slug}`}>Prenota servizio</a>
            </div>
          ))}
        </div>
      </div>

      <div className="pf-map" ref={mapRef} aria-label="Mappa dei risultati" />
    </div>
  );
}
