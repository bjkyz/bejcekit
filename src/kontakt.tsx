import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import ContactPage from './ContactPage.tsx'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'
/* ★ projects.css NENÍ jen pro karty projektů — žije v něm ZÁKLAD stránkové
   kostry: `.page` (horní odsazení pod fixní lištou), `.page__head` i závoj
   `.nav--page::before`. Bez něj se v devu hlavička vlepila POD navigaci
   (kicker na y=14, H1 přes logo) a lišta jela bez podkladu. V produkci to
   maskovalo slepování všech CSS do každé stránky — dev a produkce se musí
   chovat stejně, jinak se testuje něco jiného, než se nasazuje. */
import './styles/projects.css'
import './styles/contact.css'

/**
 * ★ PÁTÝ VSTUPNÍ BOD. Stejná mechanika jako u ostatních podstránek: vlastní HTML
 *   v `build.rollupOptions.input`, Vercel s `cleanUrls: true` ho naservíruje
 *   na `/kontakt`. Žádný router.
 *
 * ★★ TAHLE STRÁNKA SI NEBERE ANI three.js, ANI lenis — stejně jako /projekty.
 *   Je to formulář: člověk, který na něj přišel, se rozhodl napsat a scéna by
 *   mu v tom jen překážela. A hlavně by 330 kB WebGL stálo přesně na kritické
 *   cestě k jedinému místu webu, které vydělává.
 *
 * `contact.css` je jediný přírůstek a je poslední v pořadí importů —
 * ★ ale na pořadí IMPORTŮ se v produkci spolehnout nedá (inlineCss slepuje CSS
 *   v pořadí adresáře), takže se přepisy sdílených tříd dělají specificitou.
 */
/* Třída `js` + hydratace: stejná mechanika a stejné důvody jako v main.tsx. */
document.documentElement.classList.add('js')

const app = (
  <StrictMode>
    <ContactPage />
  </StrictMode>
)

const root = document.getElementById('root')!
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
