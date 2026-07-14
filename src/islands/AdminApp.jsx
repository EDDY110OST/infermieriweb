import React, { useCallback, useEffect, useState } from "react";

const dataIt = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });


function BlogAdmin() {
  const [articoli, setArticoli] = useState(null);
  const [editor, setEditor] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [messaggio, setMessaggio] = useState(null);

  const carica = useCallback(() => {
    fetch("/api/admin/blog").then((r) => r.json()).then((d) => setArticoli(d.articoli || []));
  }, []);
  useEffect(carica, [carica]);

  const avvisa = (tipo, testo) => {
    setMessaggio({ tipo, testo });
    setTimeout(() => setMessaggio(null), 5000);
  };

  const nuovo = () => setEditor({ title: "", category: "Salute", excerpt: "", image: "", body_raw: "" });

  const salva = async (publish) => {
    setSalvo(true);
    const metodo = editor.id ? "PATCH" : "POST";
    const r = await fetch("/api/admin/blog", {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editor, publish }),
    });
    const d = await r.json();
    setSalvo(false);
    if (!r.ok) return avvisa("err", d.error);
    setEditor(null);
    avvisa("ok", publish ? "Articolo pubblicato ✅ È già online." : "Bozza salvata ✅");
    carica();
  };

  const cambiaStato = async (art) => {
    const publish = art.status !== "published";
    const r = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: art.id, [publish ? "publish" : "unpublish"]: true }),
    });
    if (r.ok) { avvisa("ok", publish ? "Pubblicato ✅" : "Riportato in bozza."); carica(); }
  };

  const elimina = async (art) => {
    if (!window.confirm(`Elimino definitivamente "${art.title}"?`)) return;
    await fetch(`/api/admin/blog?id=${art.id}`, { method: "DELETE" });
    carica();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, margin: "30px 0 18px" }}>
        <h2 style={{ color: "var(--iw-navy)", margin: 0 }}>📝 Blog</h2>
        {!editor && <button className="pf-btn" onClick={nuovo}>+ Nuovo articolo</button>}
      </div>

      {messaggio && <div className={messaggio.tipo === "ok" ? "pf-successo" : "pf-errore"} style={{ marginBottom: 12 }}>{messaggio.testo}</div>}

      {editor && (
        <div className="pf-panel pf-book" style={{ marginBottom: 18 }}>
          <h2>{editor.id ? "Modifica articolo" : "Nuovo articolo"}</h2>
          <label>Titolo *</label>
          <input value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} placeholder="es. Come prepararsi a un prelievo a domicilio" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label>Categoria</label>
              <input value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} placeholder="es. Prelievi" />
            </div>
            <div>
              <label>Copertina (URL, facoltativa)</label>
              <input value={editor.image} onChange={(e) => setEditor({ ...editor, image: e.target.value })} placeholder="vuota = copertina automatica" />
            </div>
          </div>
          <label>Sommario * <span style={{ fontWeight: 400 }}>(1-2 frasi: compare in elenco e su Google)</span></label>
          <textarea rows={2} maxLength={300} value={editor.excerpt} onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })} />
          <label>Testo * <span style={{ fontWeight: 400 }}>(riga con «## Titolo» = nuova sezione · riga vuota = nuovo paragrafo · «- » = elenco)</span></label>
          <textarea rows={16} value={editor.body_raw} onChange={(e) => setEditor({ ...editor, body_raw: e.target.value })} style={{ fontFamily: "inherit" }} placeholder={"## Introduzione\n\nPrimo paragrafo...\n\n## Quando serve\n\n- primo punto\n- secondo punto"} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="pf-btn" disabled={salvo} onClick={() => salva(true)}>{salvo ? "Salvo…" : "Pubblica"}</button>
            <button className="pf-btn secondario" disabled={salvo} onClick={() => salva(false)}>Salva bozza</button>
            <button className="pf-btn pericolo" type="button" onClick={() => setEditor(null)}>Annulla</button>
          </div>
        </div>
      )}

      {!articoli && <p className="pf-note">Caricamento…</p>}
      {articoli && articoli.map((art) => (
        <div className="pf-panel" key={art.id} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ color: "var(--iw-navy)" }}>{art.title}</strong>
            <div className="pf-note" style={{ margin: 0 }}>
              {art.category} · {art.status === "published" ? `pubblicato il ${new Date(art.published_at).toLocaleDateString("it-IT")}` : "BOZZA"}
              {art.status === "published" && <> · <a href={`/articoli/${art.slug}`} target="_blank" rel="noreferrer">vedi</a></>}
            </div>
          </div>
          <span className={`stato ${art.status === "published" ? "done" : "noshow"}`}>{art.status === "published" ? "Online" : "Bozza"}</span>
          <span style={{ display: "flex", gap: 6 }}>
            <button className="pf-btn secondario compatto" onClick={() => setEditor({ id: art.id, title: art.title, category: art.category, excerpt: art.excerpt, image: art.image, body_raw: art.body_raw })}>Modifica</button>
            <button className="pf-btn secondario compatto" onClick={() => cambiaStato(art)}>{art.status === "published" ? "Ritira" : "Pubblica"}</button>
            <button className="pf-btn pericolo compatto" onClick={() => elimina(art)}>Elimina</button>
          </span>
        </div>
      ))}
    </div>
  );
}

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
            <strong style={{ fontSize: 20, color: "var(--iw-navy)" }}>{c.name}</strong>
            <span className="pf-note">{dataIt(c.created_at)}</span>
          </div>
          <p style={{ margin: "6px 0", fontSize: 17, color: "var(--iw-slate)" }}>
            {c.profession} · {c.albo_name} n. {c.albo_number} (dal {c.albo_date}) · P.IVA {c.vat_number}<br />
            📍 {c.address ? `${c.address}, ` : ""}{c.city} ({c.province}) · 📞 <a href={`tel:${c.phone}`}>{c.phone}</a> · ✉️ {c.email}
          </p>
          {c.message && <p style={{ fontSize: 17, background: "var(--iw-bg)", borderRadius: 10, padding: "8px 12px" }}>{c.message}</p>}
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
          {r.text && <p style={{ margin: "8px 0", fontSize: 18 }}>{r.text}</p>}
          <p className="pf-note" style={{ margin: "0 0 10px" }}>— {r.author_name || "Anonimo"}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="pf-btn" onClick={() => modera(r.id, "publish")}>Pubblica</button>
            <button className="pf-btn pericolo" onClick={() => modera(r.id, "reject")}>Rifiuta</button>
          </div>
        </div>
      ))}

      <BlogAdmin />

      <h2 style={{ color: "var(--iw-navy)", margin: "30px 0 12px" }}>🛡️ Manutenzione</h2>
      <div className="pf-panel">
        <p style={{ margin: "0 0 10px", fontSize: 17, color: "var(--iw-slate)" }}>
          Ogni notte il database viene spedito via email come copia di sicurezza. Puoi anche farlo adesso:
        </p>
        <BackupOra />
      </div>
    </div>
  );
}

function BackupOra() {
  const [stato, setStato] = useState(null);
  const esegui = async () => {
    setStato("in corso…");
    const r = await fetch("/api/admin/backup", { method: "POST" });
    const d = await r.json();
    setStato(r.ok ? `✅ Backup spedito via email (${d.dimensioneKB} KB)` : `Errore: ${d.error || "invio non riuscito"}`);
  };
  return (
    <div>
      <button className="pf-btn secondario" onClick={esegui} disabled={stato === "in corso…"}>🗄️ Backup adesso</button>
      {stato && <p className="pf-note" style={{ marginTop: 8 }}>{stato}</p>}
    </div>
  );
}
