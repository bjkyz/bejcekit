import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import ProjectsPage from './ProjectsPage.tsx'

/**
 * ═══════════ VSTUP PRO BUILD-TIME PRERENDER ═══════════
 *
 * Spouští ho scripts/prerender.mjs po `vite build`: vyrenderuje obě stránky
 * do řetězce a vloží je do <div id="root"> v hotovém dist/*.html. Klient pak
 * v main.tsx/projekty.tsx hotové DOM jen HYDRATUJE, nerenderuje od nuly.
 *
 * Proč: web byl čistě klientský, takže FCP i LCP čekaly na stažení a spuštění
 * Reactu — mobilní Lighthouse tím měl strop ~82. S obsahem přímo v HTML je
 * první vykreslení otázka HTML + inline CSS, žádný JS na kritické cestě.
 *
 * ★ RENDER TADY MUSÍ BÝT IDENTICKÝ S PRVNÍM RENDEREM KLIENTA, jinak hydratace
 *   celý strom zahodí a překreslí (a v konzoli přistane chyba). Drží to dvě
 *   pravidla:
 *   • App detekuje tier AŽ PO MOUNTU (viz `booted` v App.tsx) — server i první
 *     klientský render tedy shodně kreslí bez plátna, preloaderu a úchopu.
 *   • Nic v render cestě nesmí sahat na window/document; všechno browserové
 *     patří do useEffect. (renderToString efekty nespouští.)
 *
 * ★★ `renderToString`, NE `renderToStaticMarkup`: hydratovat se smí jen výstup
 *   renderToString — statická varianta vynechává oddělovací komentáře mezi
 *   textovými uzly a hydratace by na sousedních textech nesedla.
 */
export const PAGES: Record<string, () => string> = {
  'index.html': () =>
    renderToString(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  'projekty.html': () =>
    renderToString(
      <StrictMode>
        <ProjectsPage />
      </StrictMode>,
    ),
}
