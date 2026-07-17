// Scheduler INTERNO al server (Render è un web service sempre acceso: fa girare
// da sé i propri automatismi, senza GitHub Actions né servizi esterni).
// Chiama gli endpoint /api/cron/* protetti da CRON_SECRET, come farebbe un cron esterno.
let avviato = false;
let ultimoBackup = ""; // "YYYY-MM-DD" del giorno in cui il backup è già partito

function oraRoma() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", hour: "2-digit", hour12: false,
  }).format(new Date());
}
function giornoRoma() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
}

async function chiama(path) {
  const secret = process.env.CRON_SECRET || "";
  const base = process.env.SITE_URL || "http://127.0.0.1:" + (process.env.PORT || 10000);
  try {
    const r = await fetch(`${base}${path}`, { headers: { authorization: `Bearer ${secret}` } });
    console.log(`[scheduler] ${path} → ${r.status}`);
  } catch (e) {
    console.log(`[scheduler] ${path} errore: ${e?.message || e}`);
  }
}

async function tick() {
  // ogni ora: promemoria 24h + pulizia prenotazioni pending scadute
  await chiama("/api/cron/promemoria");
  // backup una volta al giorno, nella fascia delle 03:xx ora italiana
  const oggi = giornoRoma();
  if (oraRoma() === "03" && ultimoBackup !== oggi) {
    ultimoBackup = oggi;
    await chiama("/api/cron/backup");
  }
}

export function avviaScheduler() {
  if (avviato) return;
  avviato = true;
  // primo giro dopo 2 minuti (dà tempo al server di stabilizzarsi), poi ogni ora
  setTimeout(() => { tick(); setInterval(tick, 60 * 60 * 1000); }, 2 * 60 * 1000);
  console.log("[scheduler] avviato (promemoria orario + backup 03:00 Europe/Rome)");
}
