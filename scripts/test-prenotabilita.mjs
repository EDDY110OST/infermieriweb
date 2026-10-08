// Prove del calcolo «si può prenotare?» (lib/prenotabilita.js) e dei testi dei blocchi: nessun database.
//   NODE_OPTIONS="--import ./scripts/prova-locale/hook.mjs" DATABASE_URL=local node scripts/test-prenotabilita.mjs
// (il hook serve solo perché lib/db.js apre la connessione all'avvio; nessuna query parte)
import { calcolaPrenotabilita } from "../src/lib/prenotabilita.js";
import { descriviBlocco, durataBlocco, giorniBlocco, sottotitoloBlocco } from "../src/lib/blocchi-testo.js";
const now = new Date("2026-10-08T10:00:00+02:00");
const prof = { id: 1, status: "active", lead_minutes: 60 };
const serv = [{ id: 1, duration_min: 30, price_notte_cents: 0 }];
const orariTutti = [0,1,2,3,4,5,6].map((w) => ({ weekday: w, start_min: 9*60, end_min: 13*60 }));
const iso = (s) => new Date(s).toISOString();
let ok = 0, ko = 0;
const t = (nome, cond, extra = "") => { if (cond) ok++; else { ko++; console.log("KO", nome, extra); } };
let r = calcolaPrenotabilita({ prof, servizi: serv, orari: orariTutti, now });
t("libero oggi", r.prenotabile && r.prima.testo === "oggi alle 11:00", JSON.stringify(r.prima));
r = calcolaPrenotabilita({ prof, servizi: [], orari: orariTutti, now });
t("nessuna prestazione", !r.prenotabile && r.motivi[0].tipo === "nessuna_prestazione");
r = calcolaPrenotabilita({ prof, servizi: serv, orari: [], now });
t("nessun orario", !r.prenotabile && r.motivi[0].tipo === "nessun_orario");
r = calcolaPrenotabilita({ prof, servizi: serv, orari: [], eccezioni: [{ day: "2026-10-12", fasce: [[600, 720]] }], now });
t("solo giorni aperti a mano → prenotabile", r.prenotabile && r.prima.testo.includes("12 ott"), JSON.stringify(r.prima));
const blocco = { id: 2, start_dt: iso("2026-10-05T00:00:00+02:00"), end_dt: iso("2026-12-31T00:00:00+01:00"), reason: "" };
r = calcolaPrenotabilita({ prof, servizi: serv, orari: orariTutti, blocchi: [blocco], now });
t("blocco di mesi", !r.prenotabile && r.motivi[0].tipo === "blocco", JSON.stringify(r.motivi));
t("testo blocco", r.motivi[0].testo.startsWith("Blocco dal lun 5 ottobre 2026 al mer 30 dicembre 2026 (87 giorni)"), r.motivi[0].testo);
const chiusi = Array.from({ length: 30 }, (_, i) => ({ day: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date(now.getTime() + i * 86400000)), fasce: [] }));
r = calcolaPrenotabilita({ prof, servizi: serv, orari: orariTutti, eccezioni: chiusi, now });
t("30 giorni chiusi a mano", !r.prenotabile && r.motivi[0].tipo === "giorni_chiusi" && r.motivi[0].testo.startsWith("30 giorni chiusi uno a uno (dal gio 8 ottobre 2026 al"), JSON.stringify(r.motivi));
r = calcolaPrenotabilita({ prof, servizi: serv, orari: orariTutti, eccezioni: chiusi, blocchi: [blocco], now });
t("blocco + chiusi: due motivi", !r.prenotabile && r.motivi.map((m) => m.tipo).join() === "blocco,giorni_chiusi", JSON.stringify(r.motivi.map((m) => m.tipo)));
r = calcolaPrenotabilita({ prof, servizi: serv, orari: [0,1,2,3,4,5,6].map((w) => ({ weekday: w, start_min: 23*60, end_min: 24*60 })), now });
t("solo notte senza prezzo", !r.prenotabile && r.motivi[0].tipo === "solo_notte", JSON.stringify(r.motivi));
r = calcolaPrenotabilita({ prof, servizi: [{ id: 1, duration_min: 60, price_notte_cents: 0 }], orari: [0,1,2,3,4,5,6].map((w) => ({ weekday: w, start_min: 9*60, end_min: 9*60+30 })), now });
t("fasce corte", !r.prenotabile && r.motivi[0].tipo === "fasce_corte", JSON.stringify(r.motivi));
r = calcolaPrenotabilita({ prof: { ...prof, status: "network" }, servizi: serv, orari: orariTutti, now });
t("network", !r.prenotabile && r.motivi[0].tipo === "non_attivo");
// chiuso a mano un giorno senza orari fissi: NON è una causa
r = calcolaPrenotabilita({ prof, servizi: serv, orari: [{ weekday: 0, start_min: 540, end_min: 780 }], eccezioni: [{ day: "2026-10-10", fasce: [] }], blocchi: [blocco], now });
t("chiuso un sabato senza orari: solo blocco", r.motivi.map((m) => m.tipo).join() === "blocco", JSON.stringify(r.motivi.map((m) => m.tipo)));
// testi dei blocchi
t("descrivi giorni interi", descriviBlocco(blocco.start_dt, blocco.end_dt) === "dal lun 5 ottobre 2026 al mer 30 dicembre 2026 (87 giorni)", descriviBlocco(blocco.start_dt, blocco.end_dt));
t("descrivi ore", descriviBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-10T16:00:00+02:00")) === "sab 10 ottobre 2026 dalle 14:00 alle 16:00", descriviBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-10T16:00:00+02:00")));
t("descrivi un giorno intero", descriviBlocco(iso("2026-10-10T00:00:00+02:00"), iso("2026-10-11T00:00:00+02:00")) === "sab 10 ottobre 2026, tutto il giorno", descriviBlocco(iso("2026-10-10T00:00:00+02:00"), iso("2026-10-11T00:00:00+02:00")));
t("descrivi a cavallo", descriviBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-11T10:00:00+02:00")) === "dal sab 10 ottobre 2026 alle 14:00 al dom 11 ottobre 2026 alle 10:00 (2 giorni)", descriviBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-11T10:00:00+02:00")));
t("durata ore", durataBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-10T16:30:00+02:00")) === "2 ore e 30 minuti", durataBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-10T16:30:00+02:00")));
t("sottotitolo: giorni interi → solo il motivo", sottotitoloBlocco(blocco.start_dt, blocco.end_dt, "ferie") === "ferie", sottotitoloBlocco(blocco.start_dt, blocco.end_dt, "ferie"));
t("sottotitolo: ore → durata e motivo", sottotitoloBlocco(iso("2026-10-10T14:00:00+02:00"), iso("2026-10-10T16:00:00+02:00"), "pausa") === "2 ore · pausa");
t("durata anno 2027", giorniBlocco(iso("2027-01-01T00:00:00+01:00"), iso("2027-12-31T23:59:00+01:00")) === 365);
console.log(`prove: ${ok} ok, ${ko} ko`);
process.exit(ko ? 1 : 0);
