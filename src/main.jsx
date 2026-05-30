import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppSettingsProvider } from './contexts/AppContext.jsx'
import { registerSW } from 'virtual:pwa-register'

const updateServiceWorker = registerSW({
  onOfflineReady() {
    console.info('Service worker installed and ready to work offline.')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppSettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppSettingsProvider>
  </StrictMode>,
)
