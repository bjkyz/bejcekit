import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'

/**
 * ★ TADY SE UŽ NIC NEMĚŘÍ A NIC NESÁZÍ — a je to výhra, ne opomenutí.
 *
 * Dřív se tu synchronně, ještě před prvním renderem, sázela třída `staged`:
 * na telefonu si sekce rezervovaly horní pás obrazovky pro 3D (padding-top).
 * Muselo to být tady a ne ve scéně, protože scéna se načítá líně a rezerva
 * dodaná až po jejím mountu by byla skokem o ~350 px, tedy učebnicový CLS.
 *
 * Režim jeviště je pryč (viz lib/stage.ts): plátno je teď VŽDYCKY podklad pod
 * textem a žádnou rezervu si na něj nikdo nedělá. Tím zmizel i celý ten problém
 * — layout se o existenci 3D vůbec nezajímá, takže není co posunout.
 * CLS 0 už není vyladěné, je STRUKTURÁLNÍ.
 */

/* StrictMode ZŮSTÁVÁ. R3F v9 ho konečně dědí z react-dom, takže odhalí latentní
   double-mount chyby, které byly dřív tiše skryté. Neřeš je vypnutím StrictMode —
   napiš úklidové funkce. (useFrame je bezpečný, R3F ho při unmountu odhlásí.) */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
