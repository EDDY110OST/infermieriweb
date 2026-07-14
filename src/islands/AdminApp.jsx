import React, { useCallback, useEffect, useState } from "react";

const dataIt = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default function AdminApp() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [autorizzato, setAutorizzato] = useState(null); // null=verifica, false=login, true=dentro
  const [errore, setErrore] = useState("");
  const [candidature, setCandidature] = useState([]);
  const [recensioni, setRecensioni] = useState([]);
  const [esiti, setEsiti] = useState({}); // per candidatura: credenziali mostrate una volta

  const carica = useCallback(async () => {
    const [rc, rr] = await Promise.all([
      fetch("/api/admin/candidature"),
      fetch("/api/admin/recensioni"),
    ]);
    if (rc.status === 403 || rc.status === 401) return setAutorizzato(false);
    setCandidature((await rc.json()).candidature || []);
    setRecensioni((await rr.json()).recensioni || []);
    setAutorizzato(true);
  }, []);

  useEffect(() => { carica(); }, [carica]);

  const accedi = async (e) => {
    e.preventDefault();
    setErrore("");
    const r = await fetch("/api/panel/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login),
    });
    const d = await r.json();
    if (!r.ok) return setErrore(d.error || "Errore di accesso");
    if (d.role !== "admin") return setErrore("Questo account non è amministratore");
    carica();
  };

  const gestisci = async (id, action) => {
    if (action === "reject" && !window.confirm("Rifiuto questa candidatura? Il candidato riceverà una email.")) return;
    const r = await fetch("/api/admin/candidature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const d = await r.json();
    if (!r.ok) return alert(d.error);
    if (action === "approve") setEsiti({ ...esiti, [id]: d });
    carica();
  };

  const modera = async (id, action) => {
    const r = await fetch("/api/admin/recensioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (r.ok) carica();
  };

  if (autorizzato === null) return <p className="pf-note">Verifica accesso…</p>;

  if (autorizzato === false) {
    return (
      <div className="pf-panel" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h2>Amministrazione</h2>
        <form className="pf-book" onSubmit={accedi}>
          <label htmlFor="ad-email">Email</label>
          <input id="ad-email" type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} autoComplete="username" />
          <label htmlFor="ad-pass">Password</label>
          <input id="ad-pass" type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} autoComplete="current-password" />
          {errore && <div className="pf-errore">{errore}</div>}
          <button className="pf-btn" style={{ width: "100%" }}>Entra</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: "var(--iw-navy)", marginBottom: 18 }}>
        Candidature in attesa {candidature.length > 0 && <span className="pf-badge-num">{candidature.length}</span>}
      </h2>

      {candidature.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna candidatura da esaminare. 🎉</p></div>}

      {candidature.map((c) => (
        <div className="pf-panel" key={c.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <strong style={{ fontSize: 17, color: "var(--iw-navy)" }}>{c.name}</strong>
            <span className="pf-note">{dataIt(c.created_at)}</span>
          </div>
          <p style={{ margin: "6px 0", fontSize: 14.5, color: "var(--iw-slate)" }}>
            {c.profession} · {c.albo_name} n. {c.albo_number} (dal {c.albo_date}) · P.IVA {c.vat_number}<br />
            📍 {c.address ? `${c.address}, ` : ""}{c.city} ({c.province}) · 📞 <a href={`tel:${c.phone}`}>{c.phone}</a> · ✉️ {c.email}
          </p>
          {c.message && <p style={{ fontSize: 14.5, background: "var(--iw-bg)", borderRadius: 10, padding: "8px 12px" }}>{c.message}</p>}
          <p className="pf-note">
            ✔️ Prima di approvare: verifica l'iscrizione su <a href="https://portale.fnopi.it/ricerca-iscritti" target="_blank" rel="noreferrer">portale FNOPI</a> e chiedi la polizza RC (videochiamata da checklist).
          </p>

          {esiti[c.id] ? (
            <div className="pf-successo">
              <strong>Approvato ✅ Scheda: /p/{esiti[c.id].slug}</strong>
              {esiti[c.id].emailed
                ? <p style={{ margin: "6px 0 0" }}>Email di benvenuto inviata con le credenziali.</p>
                : <p style={{ margin: "6px 0 0" }}>⚠️ Email NON partita — comunica tu le credenziali: <code>{esiti[c.id].credenziali.email}</code> / <code>{esiti[c.id].credenziali.password}</code></p>}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="pf-btn" onClick={() => gestisci(c.id, "approve")}>✅ Approva e attiva</button>
              <button className="pf-btn pericolo" onClick={() => gestisci(c.id, "reject")}>Rifiuta</button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ color: "var(--iw-navy)", margin: "30px 0 18px" }}>
        Recensioni da moderare {recensioni.length > 0 && <span className="pf-badge-num">{recensioni.length}</span>}
      </h2>

      {recensioni.length === 0 && <div className="pf-panel"><p style={{ margin: 0 }}>Nessuna recensione in attesa.</p></div>}

      {recensioni.map((r) => (
        <div className="pf-panel" key={r.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span className="pf-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span className="n">per {r.professional_name}</span></span>
            <span className="pf-note">{dataIt(r.created_at)}</span>
          </div>
          {r.text && <p style={{ margin: "8px 0", fontSize: 15 }}>{r.text}</p>}
          <p className="pf-note" style={{ margin: "0 0 10px" }}>— {r.author_name || "Anonimo"}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pf-btn" onClick={() => modera(r.id, "publish")}>Pubblica</button>
            <button className="pf-btn pericolo" onClick={() => modera(r.id, "reject")}>Rifiuta</button>
          </div>
        </div>
      ))}
    </div>
  );
}
