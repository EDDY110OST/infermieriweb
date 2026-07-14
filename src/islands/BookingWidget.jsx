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

export default function BookingWidget({ professionalId, services }) {
  const giorni = useMemo(() => prossimiGiorni(14), []);
  const [servizio, setServizio] = useState(services[0]?.id || 0);
  const [giorno, setGiorno] = useState(giorni[0].iso);
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [caricamento, setCaricamento] = useState(false);
  const [dati, setDati] = useState({ name: "", phone: "", email: "", address: "", city: "", privacy: false });
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState("");
  const [fatto, setFatto] = useState(null);

  useEffect(() => {
    if (!servizio || !giorno) return;
    setCaricamento(true);
    setSlot(null);
    fetch(`/api/slots?professional_id=${professionalId}&service_id=${servizio}&date=${giorno}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setCaricamento(false));
  }, [professionalId, servizio, giorno]);

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
        body: JSON.stringify({ professional_id: professionalId, service_id: servizio, start: slot.start, ...dati }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore imprevisto");
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
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            Il professionista è stato avvisato. Ti abbiamo inviato una <strong>email di conferma</strong> con
            il riepilogo e il link per disdire (controlla anche lo spam). Riceverai un promemoria 24 ore prima.
          </p>
        ) : (
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            Il professionista è stato avvisato. Se devi disdire,{" "}
            <a href={`/prenotazione?token=${fatto.cancel_token}`}>usa questa pagina</a> (salvala tra i preferiti).
          </p>
        )}
      </div>
    );
  }

  const servizioSel = services.find((s) => s.id === Number(servizio));

  return (
    <form className="pf-book" onSubmit={prenota}>
      <label htmlFor="bw-servizio">Prestazione</label>
      <select id="bw-servizio" value={servizio} onChange={(e) => setServizio(Number(e.target.value))}>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {s.duration_min} min · {euro(s.price_cents)}
          </option>
        ))}
      </select>

      <label>Giorno</label>
      <div className="pf-days" role="listbox" aria-label="Scegli il giorno">
        {giorni.map((g) => (
          <button
            type="button"
            key={g.iso}
            className={`pf-day${giorno === g.iso ? " sel" : ""}`}
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
        <p className="pf-note">Nessun orario libero in questo giorno: prova il successivo.</p>
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

      {slot && (
        <>
          <label htmlFor="bw-nome">Nome e cognome *</label>
          <input id="bw-nome" required minLength={2} value={dati.name} onChange={(e) => setDati({ ...dati, name: e.target.value })} autoComplete="name" />

          <label htmlFor="bw-tel">Telefono *</label>
          <input id="bw-tel" required type="tel" minLength={6} value={dati.phone} onChange={(e) => setDati({ ...dati, phone: e.target.value })} autoComplete="tel" />

          <label htmlFor="bw-email">Email * <span style={{ fontWeight: 400 }}>(riceverai conferma e link per disdire)</span></label>
          <input id="bw-email" type="email" required value={dati.email} onChange={(e) => setDati({ ...dati, email: e.target.value })} autoComplete="email" />

          <label htmlFor="bw-indirizzo">Indirizzo della visita (per prestazioni a domicilio)</label>
          <input id="bw-indirizzo" value={dati.address} onChange={(e) => setDati({ ...dati, address: e.target.value })} autoComplete="street-address" placeholder="Via, numero civico" />

          <label htmlFor="bw-citta">Città</label>
          <input id="bw-citta" value={dati.city} onChange={(e) => setDati({ ...dati, city: e.target.value })} autoComplete="address-level2" />

          <div className="pf-check">
            <input id="bw-privacy" type="checkbox" checked={dati.privacy} onChange={(e) => setDati({ ...dati, privacy: e.target.checked })} />
            <label htmlFor="bw-privacy" style={{ margin: 0, fontWeight: 400 }}>
              Acconsento al trattamento dei miei dati (nome, telefono, email, indirizzo) al solo fine di gestire
              la prenotazione. Nessun dato clinico viene richiesto o conservato. *
            </label>
          </div>

          {errore && <div className="pf-errore">{errore}</div>}

          <button className="pf-btn" style={{ width: "100%" }} disabled={invio}>
            {invio ? "Invio…" : `Conferma prenotazione${servizioSel ? ` · ${euro(servizioSel.price_cents)}` : ""}`}
          </button>
          <p className="pf-note" style={{ marginTop: 8 }}>
            Non paghi nulla online: il compenso si regola direttamente con il professionista.
          </p>
        </>
      )}
      {!slot && errore && <div className="pf-errore">{errore}</div>}
    </form>
  );
}
