import React, { useEffect, useMemo, useState } from "react";

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function prossimiGiorni(n = 14) {
  const out = [];
  const oggi = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      giorno: GIORNI[(d.getDay() + 6) % 7],
      numero: d.getDate(),
      mese: MESI[d.getMonth()],
    });
  }
  return out;
}

const euro = (cents) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

export default function BookingWidget({ professionalId, services, servizioIniziale, telefono }) {
  const giorni = useMemo(() => prossimiGiorni(14), []);
  // Nessuna prestazione preselezionata: un utente frettoloso confermerebbe
  // l'esame sbagliato (es. ECG da 50€ invece della medicazione che gli serve)
  const [servizio, setServizio] = useState(
    () => (servizioIniziale && services.some((s) => s.id === servizioIniziale) ? servizioIniziale : 0)
  );
  const [giorno, setGiorno] = useState(giorni[0].iso);
  const [giorniPieni, setGiorniPieni] = useState({});
  const [cercoPrimoLibero, setCercoPrimoLibero] = useState(true);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [dati, setDati] = useState({ name: "", phone: "", email: "", address: "", city: "", privacy: false });
  const [perAltri, setPerAltri] = useState(false);
  const [paziente, setPaziente] = useState("");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(null);

  useEffect(() => {
    if (!servizio || !giorno) return;
    setCaricamento(true);
    setSlot(null);
    fetch(`/api/slots?professional_id=${professionalId}&service_id=${servizio}&date=${giorno}`)
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setGiorniPieni((g) => ({ ...g, [giorno]: (d.slots || []).length === 0 }));
      })
      .catch(() => setSlots([]))
      .finally(() => setCaricamento(false));
  }, [professionalId, servizio, giorno]);

  // Il paziente non deve MAI atterrare su "nessun orario": si apre sul primo giorno utile
  // (di sera "oggi" è quasi sempre pieno e sembrerebbe un professionista senza disponibilità)
  useEffect(() => {
    if (!servizio) return;
    let attivo = true;
    setCercoPrimoLibero(true);
    (async () => {
      for (const g of giorni.slice(0, 14)) {
        if (!attivo) return;
        try {
          const r = await fetch(`/api/slots?professional_id=${professionalId}&service_id=${servizio}&date=${g.iso}`);
          const d = await r.json();
          if (!attivo) return;
          setGiorniPieni((prec) => ({ ...prec, [g.iso]: (d.slots || []).length === 0 }));
          if ((d.slots || []).length > 0) {
            setGiorno(g.iso);
            setSlots(d.slots);
            break;
          }
        } catch { /* si prosegue col giorno dopo */ }
      }
      if (attivo) setCercoPrimoLibero(false);
    })();
    return () => { attivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, servizio]);

  const servizioSel = services.find((s) => s.id === Number(servizio));

  const prenota = async (e) => {
    e.preventDefault();
    setErrore("");
    if (!slot) return setErrore("Scegli un orario");
    if (!dati.privacy) return setErrore("Serve il consenso al trattamento dei dati");
    setInvio(true);
    try {
      const r = await fetch("/api/prenota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional_id: professionalId, service_id: servizio, start: slot.start, ...dati,
          name: perAltri && paziente.trim() ? `${paziente.trim()} (prenotato da ${dati.name})` : dati.name,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore imprevisto");
      // Conversione: la misura che conta (GA4)
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "prenotazione_completata", {
          professionista: professionalId,
          prestazione: servizioSel?.name,
          valore_da: servizioSel ? servizioSel.price_cents / 100 : undefined,
          currency: "EUR",
        });
      }
      setFatto(d);
    } catch (err) {
      setErrore(err.message);
      // lo slot potrebbe non essere più libero: ricarico
      fetch(`/api/slots?professional_id=${professionalId}&service_id=${servizio}&date=${giorno}`)
        .then((r) => r.json()).then((d) => setSlots(d.slots || []));
    } finally {
      setInvio(false);
    }
  };

  if (fatto) {
    const quando = new Date(fatto.start).toLocaleString("it-IT", {
      timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
    });
    return (
      <div className="pf-successo">
        <strong>Prenotazione confermata ✅</strong>
        <p style={{ margin: "8px 0" }}>
          {fatto.service} con {fatto.professional}<br />
          <strong>{quando}</strong>
        </p>
        {fatto.emailed ? (
          <p style={{ margin: "8px 0", fontSize: 17 }}>
            Il professionista è stato avvisato. Ti abbiamo inviato una <strong>email di conferma</strong> con
            il riepilogo (controlla anche lo spam). Riceverai un promemoria 24 ore prima.
          </p>
        ) : (
          <p style={{ margin: "8px 0", fontSize: 17 }}>
            Il professionista è stato avvisato.
          </p>
        )}
        {fatto.cancel_token && (
          <p style={{ margin: "8px 0", fontSize: 16 }}>
            🔗 Se devi disdire: <a href={`/prenotazione?token=${fatto.cancel_token}`}>gestisci la prenotazione da qui</a>
            {" "}(il link è anche nell'email — salvalo tra i preferiti).
          </p>
        )}
        {telefono && (
          <p style={{ margin: "8px 0", fontSize: 16 }}>
            📞 Per qualsiasi problema dell'ultimo minuto: <a href={`tel:${telefono}`}>{telefono}</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="pf-book" onSubmit={prenota}>
      <label htmlFor="bw-servizio">Prestazione *</label>
      <select id="bw-servizio" required value={servizio} onChange={(e) => setServizio(Number(e.target.value))}>
        <option value={0} disabled>Scegli la prestazione…</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.duration_min} min · {euro(s.price_cents)}
          </option>
        ))}
      </select>
      {!servizio && <p className="pf-note">Scegli la prestazione che ti serve: vedrai giorni e orari disponibili.</p>}

      {servizio > 0 && <>
      <label>Giorno</label>
      <div className="pf-days" role="listbox" aria-label="Scegli il giorno">
        {giorni.map((g) => (
          <button
            type="button"
            key={g.iso}
            className={`pf-day${giorno === g.iso ? " sel" : ""}${giorniPieni[g.iso] ? " pieno" : ""}`}
            onClick={() => setGiorno(g.iso)}
            aria-selected={giorno === g.iso}
          >
            <span className="g">{g.giorno}</span>
            <span className="n">{g.numero}</span>
            <span className="g">{g.mese}</span>
          </button>
        ))}
      </div>

      <label>Orari disponibili</label>
      {caricamento ? (
        <p className="pf-note">Cerco gli orari liberi…</p>
      ) : slots.length === 0 ? (
        <p className="pf-note">
          {cercoPrimoLibero ? "Cerco il primo giorno disponibile…" : "Nessun orario libero in questo giorno: scegline un altro qui sopra (i giorni pieni sono in grigio)."}
        </p>
      ) : (
        <div className="pf-slots" role="listbox" aria-label="Scegli l'orario">
          {slots.map((s) => (
            <button
              type="button"
              key={s.start}
              className={`pf-slot${slot?.start === s.start ? " sel" : ""}`}
              onClick={() => setSlot(s)}
              aria-selected={slot?.start === s.start}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      </>}

      {slot && (
        <>
          <label>Per chi è la prestazione?</label>
          <div className="pf-scelta">
            <button type="button" className={`pf-scelta-btn${!perAltri ? " sel" : ""}`} onClick={() => setPerAltri(false)}>Per me</button>
            <button type="button" className={`pf-scelta-btn${perAltri ? " sel" : ""}`} onClick={() => setPerAltri(true)}>Per un familiare</button>
          </div>

          {perAltri && (
            <>
              <label htmlFor="bw-paziente">Nome del paziente *</label>
              <input id="bw-paziente" required={perAltri} minLength={2} value={paziente} onChange={(e) => setPaziente(e.target.value)} placeholder="es. Maria Rossi" />
            </>
          )}

          <label htmlFor="bw-nome">{perAltri ? "Il tuo nome e cognome *" : "Nome e cognome *"}</label>
          <input id="bw-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} autoComplete="name" />

          <label htmlFor="bw-tel">{perAltri ? "Il tuo telefono *" : "Telefono *"}</label>
          <input id="bw-tel" required type="tel" minLength={6} value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

          <label htmlFor="bw-email">Email * <span style={{ fontWeight: 400 }}>(riceverai conferma e link per disdire)</span></label>
          <input id="bw-email" type="email" required value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

          <label htmlFor="bw-indirizzo">Dove deve venire l'infermiere? *</label>
          <input id="bw-indirizzo" required minLength={5} value={dati.address} onChange={(e) => setDati({ ...dati, address: e.target.value })} autoComplete="street-address" placeholder="Via e numero civico" />

          <label htmlFor="bw-citta">Città *</label>
          <input id="bw-citta" required minLength={2} value={dati.city} onChange={(e) => setDati({ ...dati, city: e.target.value })} autoComplete="address-level2" />

          <div className="pf-check">
            <input id="bw-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
            <label htmlFor="bw-privacy" style={{ margin: 0, fontWeight: 400 }}>
              Acconsento al trattamento dei miei dati (nome, telefono, email, indirizzo) al solo fine di gestire
              la prenotazione. Nessun dato clinico viene richiesto o conservato. *
            </label>
          </div>

          {errore && <div className="pf-errore">{errore}</div>}

          {servizioSel && slot && (
            <div style={{ background: "var(--iw-primary-soft)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 16 }}>
              📋 <strong>{servizioSel.name}</strong> · {new Date(slot.start).toLocaleDateString("it-IT", { timeZone: "Europe/Rome", weekday: "long", day: "numeric", month: "long" })} alle <strong>{slot.label}</strong> · da {euro(servizioSel.price_cents)}
            </div>
          )}

          <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
            {invio ? "Invio…" : `Conferma prenotazione${servizioSel ? ` · da ${euro(servizioSel.price_cents)}` : ""}`}
          </button>
          <p className="pf-note" style={{ marginTop: 8 }}>
            Non paghi nulla online, nessuna carta richiesta: paghi direttamente all'infermiere dopo la prestazione.
          </p>
        </>
      )}
      {!slot && errore && <div className="pf-errore">{errore}</div>}
    </form>
  );
}
