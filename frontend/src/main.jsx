import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadConfig } from './config.js'

// On attend que config.json (URL de l'API) soit chargé avant de monter
// l'app : ça évite tout appel API avec une URL de repli erronée pendant
// une fraction de seconde au démarrage.
loadConfig().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

