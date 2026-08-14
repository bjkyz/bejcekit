import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import ProjectsPage from './ProjectsPage.tsx'
import { adoptDocumentLang } from './lib/lang'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'
import './styles/projects.css'

/**
 * ★ DRUHÝ VSTUPNÍ BOD. Web je od téhle chvíle vícestránkový (MPA), ne SPA.
 *
 * Vite dostane v `build.rollupOptions.input` dvě HTML, vyrobí `dist/index.html`
 * a `dist/projekty.html` a Vercel je díky `cleanUrls: true` naservíruje na `/`
 * a `/projekty`. Žádný router, žádná další závislost, a hlavně: každá stránka
 * má vlastní kritickou cestu.
 *
 * Konkrétně tahle si nebere three.js ani lenis (viz ProjectsPage.tsx) – stáhne
 * React a pár kilobajtů vlastního kódu. Kdyby projekty byly jen další sekce
 * hlavní stránky, platil by za ně každý návštěvník úvodu, i ten, který se
 * k referencím nikdy nedostane.
 *
 * Styly se importují všechny stejné jako na úvodu: sdílí se tokeny, typografické
 * role, tlačítka i navigace, takže se obě stránky nemůžou rozejít. `projects.css`
 * je jediný přírůstek a je poslední – přepisovat po něm už nemá co.
 */
/* Třída `js` + hydratace: stejná mechanika a stejné důvody jako v main.tsx. */
document.documentElement.classList.add('js')

/* ★ JAZYK SE NASTAVÍ PŘED HYDRATACÍ, ne během ní. Čte se z `<html lang>`, který
   do dokumentu zapsal build — viz lib/lang.ts. */
adoptDocumentLang()

const app = (
  <StrictMode>
    <ProjectsPage />
  </StrictMode>
)

const root = document.getElementById('root')!
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
