# InfermieriWeb — piattaforma prenotazioni professionisti sanitari

Piattaforma che mette in contatto pazienti e professionisti sanitari a domicilio.
**Nessun pagamento transita dalla piattaforma**: il compenso si regola tra paziente e professionista.

## Stack (volutamente standard e portabile)

- **Astro** (pagine statiche + SSR) con isole **React** — deploy automatico su **Netlify** dal branch `main`
- **Postgres** (Netlify DB / Neon) — accesso via `@neondatabase/serverless`
- **Email**: Brevo, isolate in `src/lib/mailer.js` (cambiare provider = ~10 righe)
- Nessuna dipendenza esclusiva di un fornitore: tutto migrabile (vedi "Principio di portabilità" nel progetto)

## Come si lavora

```bash
npm install
npx netlify dev        # sviluppo locale (inietta le variabili ambiente)
npx astro build        # build di verifica
```

- Branch di lavoro: `piattaforma` → anteprima automatica su
  `https://piattaforma--effulgent-lollipop-e88c76.netlify.app`
- Pubblicazione: merge `piattaforma` → `main` (deploy automatico su infermieriweb.it)
- **Migrazioni database**: cartelle SQL in `netlify/database/migrations/` — si applicano
  DA SOLE al deploy. Mai modificare una migrazione già applicata: crearne una nuova.

## Mappa del codice

| Percorso | Cosa contiene |
|---|---|
| `src/pages/*.astro` | Pagine (quelle con `prerender = false` sono SSR dal database) |
| `src/pages/api/**` | API: prenota, slots, disdetta, candidatura, recensione, panel/*, admin/* |
| `src/islands/*.jsx` | Componenti interattivi (pannello, admin, ricerca, prenotazione…) |
| `src/views/*.jsx` | Viste ereditate dal vecchio sito (blog, guide prestazioni…) |
| `src/lib/*.js` | db, auth (sessioni HMAC), mailer, slots (agenda), geocode, ratelimit, backup, blog |
| `netlify/functions/` | Funzioni schedulate: `promemoria` (ogni ora), `backup-notturno` (03:00 UTC) |
| `src/styles/platform.css` | Design system della piattaforma |

## Variabili ambiente (Netlify → Environment variables)

`NETLIFY_DATABASE_URL` (connessione Postgres — ⚠️ production punta al DB del branch `piattaforma`),
`SESSION_SECRET` (firma sessioni e token), `BREVO_API_KEY`, `EMAIL_FROM`,
`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`PUBLIC_VAPID_PUBLIC_KEY` (notifiche push),
`BACKUP_EMAIL` (facoltativa, destinatario dei backup).

## Backup e ripristino

- **Automatico**: ogni notte alle 03:00 UTC la funzione `backup-notturno` spedisce
  l'intero database (JSON compresso) via email. Backup manuale: `/admin` → Manutenzione.
- **Ripristino**: decomprimere l'allegato (`gunzip file.json.gz`); il JSON contiene
  `{ tabelle: { nome: [righe…] } }`. Reinserire con uno script Node usando
  `sql.query('INSERT INTO … VALUES …')` tabella per tabella (rispettare l'ordine:
  professionals → professional_users/services/coverage_areas/opening_hours →
  bookings → reviews). In emergenza: chiedere a qualunque sviluppatore
  Node/Postgres, è un ripristino standard.

## Accessi e ruoli

- `/area-professionisti` — pannello del professionista (agenda, servizi, orari, statistiche, profilo)
- `/admin` — soci/amministratori (`professional_users.role = 'admin'`): candidature, recensioni, blog, backup
- Le credenziali operative sono nel file `CREDENZIALI InfermieriWeb.md` (cartella progetto, fuori dal repo)

## Sentinella uptime

`.github/workflows/uptime.yml` controlla il sito ogni 15 minuti: se home o API
falliscono, GitHub invia l'email di workflow fallito al proprietario del repository.

## Anti-bot

Limiti in `src/lib/ratelimit.js` (tabella `rate_events`): login 5/15min,
prenotazioni 10/ora per IP + max 3 future per telefono, candidature 3/ora per IP.
