# Fix Routing - InfermieriWeb

## Problema Risolto ✅
Il service worker era configurato con `navigateFallback: '/offline.html'` che reindirizzava TUTTE le rotte non trovate direttamente alla pagina offline, anche quando l'utente era online. Per una SPA React, il fallback deve essere `/index.html`.

## Modifiche Apportate

### 1. **vite.config.js** (PRINCIPALE)
- Cambiato `navigateFallback: '/offline.html'` → `navigateFallback: '/index.html'`
- Aggiunto `navigateFallbackDenylist` per escludere file statici e risorse non HTML
- Aggiunte strategie di caching intelligenti per CDN e API

Questo consente al React Router di gestire tutte le rotte mentre il service worker:
- Cache i bundle JS/CSS
- Network-first per le API (per aggiornamenti in tempo reale)
- Serve offline.html SOLO quando è realmente offline

## ✅ Come Testare

### Passo 1: Pulire il Service Worker nel Browser
**Chrome/Edge:**
1. Apri DevTools (F12)
2. Vai a **Application** tab
3. Seleziona **Service Workers** (a sinistra)
4. Clicca **Unregister** su tutti i service workers
5. Vai a **Cache Storage** e cancella tutte le cache
6. Vai a **Cookies** → **Cookies** e cancella i cookie del dominio
7. Chiudi completamente il tab e riaprilo

**Safari:**
1. Preferenze → Privacy
2. Rimuovi Storage per infermieriweb.it
3. Chiudi il tab e riaprilo

**Firefox:**
1. about:config
2. Cerca `dom.serviceWorkers.enabled` → disabilita temporaneamente
3. Svuota cache (Ctrl+Shift+Canc)
4. Riabilita service workers
5. Ricarica il sito

### Passo 2: Verificare il Fix
Una volta pulito il browser, testa questi URL:
- [ ] `https://infermieriweb.it/` - Home
- [ ] `https://infermieriweb.it/articoli` - Articoli
- [ ] `https://infermieriweb.it/servizi` - Servizi  
- [ ] `https://infermieriweb.it/chi-siamo` - Chi Siamo
- [ ] `https://infermieriweb.it/contatti` - Contatti
- [ ] Clicca sui link nel menu di navigazione

Se tutti gli URL funzionano → ✅ Fix riuscito!

### Passo 3: Test Offline (Opzionale)
Con DevTools aperto:
1. Vai a **Application** tab
2. Spunta "Offline" in **Service Workers**
3. Naviga a qualsiasi pagina che hai visitato prima
4. Dovresti vedere il contenuto cached
5. Clicca "Ritenta" per tornare online

Se vedi "Sei offline" → ✅ Fallback offline funziona correttamente!

## 📝 Dettagli Tecnici

### Perché `/index.html` e non `/offline.html`?
```javascript
// CORRETTO (Nuovo):
navigateFallback: '/index.html'
```
- Il file `index.html` contiene l'app React completa
- React Router gestisce tutte le rotte
- Se il server non trova una risorsa, l'app React la gestisce
- L'app decide se mostrare la pagina o il messaggio offline

```javascript
// ERRATO (Vecchio):
navigateFallback: '/offline.html'
```
- Reindirizzava TUTTE le rotte a `/offline.html`
- React Router non poteva gestire la navigazione
- L'utente vedeva "Sei offline" anche quando online

### Cache Strategy
```javascript
runtimeCaching: [
  // CDN (CSS, JS): Cache-first (velocità)
  // API: Network-first (dati aggiornati)
]
```

### Denylist
Esclude dal fallback:
- File di configurazione (`.json`)
- Risorse statiche (`.svg`, `.png`, `.jpg`)
- API calls (`/api/`)

## 🚀 Deploy
Dopo questi test, puoi:
1. `npm run build` - Crea la versione di produzione
2. `git add vite.config.js`
3. `git commit -m "Fix: Routing PWA - navigateFallback to /index.html"`
4. `git push` - Deploy automatico (se usato Netlify/Vercel)

## ❓ Se il Problema Persiste
- Attendere 15-30 minuti per cache CDN
- Eseguire Full Reload (Ctrl+Shift+R o Cmd+Shift+R)
- Verificare che il build sia stato fatto con il nuovo vite.config.js
- Controllare Console DevTools per errori

## 📋 File Modificati
- ✅ `vite.config.js` - Configurazione service worker corretta
- ✅ `public/_redirects` - Già corretto (Netlify)
- ✅ `public/offline.html` - Mantiene il pulsante "Ritenta"
- ✅ `src/components/Layout.jsx` - Usa React Router Link (corretto)
- ✅ `src/App.jsx` - Routes definite correttamente
