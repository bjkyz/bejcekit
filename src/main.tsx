import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { detectTier } from './lib/quality'
import { fitsStage, markStage } from './lib/stage'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'

/**
 * ★ JEVIŠTĚ SE SÁZÍ SYNCHRONNĚ, JEŠTĚ PŘED PRVNÍM RENDEREM. Tohle není optimalizace,
 *   tohle je jediné správné místo.
 *
 * Na úzkém displeji si sekce rezervují horní pás pro 3D (padding-top: --stage-h).
 * Scéna se ale načítá LÍNĚ — její kód dorazí až dávno po tom, co se vykreslí text.
 * Kdyby tu třídu sázel až on, stalo by se tohle:
 *
 *     1. snímek:  sekce se vysází BEZ rezervy, nadpis je nahoře
 *     ~800 ms:    domountuje se scéna, naskočí --stage-h
 *     další sn.:  VŠECHNY sekce poskočí o ~350 px dolů
 *
 * To je učebnicový Cumulative Layout Shift — a zrovna tenhle web se Core Web Vitals
 * ohání v sekci 01 jako svým hlavním důkazem. Rozbít si CLS kvůli 3D dekoraci by
 * bylo to nejtrapnější, co se tady může stát.
 *
 * detectTier() je synchronní a levný (matchMedia + probe na WebGL2 kontext), takže
 * se odpověď zná dřív, než React vůbec začne. Když WebGL není nebo je zapnutý
 * omezený pohyb, scéna nebude — a jeviště se tedy nerezervuje vůbec.
 */
markStage(detectTier() !== 'off' && fitsStage())

/* StrictMode ZŮSTÁVÁ. R3F v9 ho konečně dědí z react-dom, takže odhalí latentní
   double-mount chyby, které byly dřív tiše skryté. Neřeš je vypnutím StrictMode —
   napiš úklidové funkce. (useFrame je bezpečný, R3F ho při unmountu odhlásí.) */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
