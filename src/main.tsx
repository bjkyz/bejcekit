import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'

/* StrictMode ZŮSTÁVÁ. R3F v9 ho konečně dědí z react-dom, takže odhalí latentní
   double-mount chyby, které byly dřív tiše skryté. Neřeš je vypnutím StrictMode —
   napiš úklidové funkce. (useFrame je bezpečný, R3F ho při unmountu odhlásí.) */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
