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

  const risultati = useMemo(() => {
    const testo = q.trim().toLowerCase();
    if (!testo) return tutti;
    // cerca per nome, zona E prestazione offerta ("chi fa l'ECG vicino a me?")
    return tutti.filter((p) =>
      [p.name, p.city, p.province, p.region, p.profession, ...(p.coverage || []), ...(p.servizi || [])]
        .join(" ").toLowerCase().includes(testo)
    );
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
            placeholder="Città o prestazione (es. Lucca, ECG, medicazioni…)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cerca un professionista per città o prestazione"
          />
        </form>

        {caricamento && <p className="pf-note">Caricamento professionisti…</p>}

        {!caricamento && risultati.length === 0 && (
          <div className="pf-panel">
            <h2>Nessun professionista in questa zona, per ora</h2>
            <p style={{ color: "var(--iw-slate)" }}>
              La rete sta crescendo in tutta Italia. Sei un professionista sanitario di questa zona?
            </p>
            <a className="pf-btn" href="/lavora-con-noi">Unisciti gratis alla piattaforma</a>
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
                {p.min_price_cents > 0 && <div className="prezzo">Prestazioni {prezzo(p.min_price_cents)}</div>}
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
