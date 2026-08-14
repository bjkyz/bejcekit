import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import ServicesPage from './ServicesPage.tsx'
import { adoptDocumentLang } from './lib/lang'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'
import './styles/projects.css'
import './styles/journal.css'
import './styles/services.css'

/**
 * ★ ČTVRTÝ VSTUPNÍ BOD. Katalog nabídky, který se nevešel na šest stěn krychle
 *   (viz ServicesPage.tsx a README). Stejně jako /projekty si nebere three.js
 *   ani lenis — stáhne React, tenhle strom, jeden obrázek certifikátu a nic víc.
 *
 * Styly se importují všechny sdílené; `services.css` je poslední, protože
 * přepisovat po něm už nemá co. (V produkci o pořadí importů stejně nejde,
 * viz komentář v services.css — proto tam mají přepisy vyšší specificitu.)
 */
document.documentElement.classList.add('js')

/* ★ JAZYK SE NASTAVÍ PŘED HYDRATACÍ, ne během ní. Čte se z `<html lang>`, který
   do dokumentu zapsal build — viz lib/lang.ts. */
adoptDocumentLang()

const app = (
  <StrictMode>
    <ServicesPage />
  </StrictMode>
)

const root = document.getElementById('root')!
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
