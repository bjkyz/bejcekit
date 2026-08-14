import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import ProjectsPage from './ProjectsPage.tsx'
import ServicesPage from './ServicesPage.tsx'
import ContactPage from './ContactPage.tsx'
import JournalRoot from './JournalRoot.tsx'
import { setLang, type Lang } from './lib/lang.ts'
import type { JournalRoute } from './lib/journal-route.ts'

/**
 * ═══════════ JAZYK PŘI PRERENDERU ═══════════
 *
 * ★★ `renderToString` JE SYNCHRONNÍ, A PRÁVĚ PROTO JE MODULOVÝ STAV BEZPEČNÝ.
 *   Nastaví se jazyk, vyrenderuje se celá stránka, teprve pak se nastaví další.
 *   Nikdy neběží dva rendery najednou, takže se globální stav nemá jak proplést.
 *
 * ★ JAZYK SE NASTAVUJE U KAŽDÉ STRÁNKY, I U ČESKÉ. Kdyby se spoléhalo na
 *   výchozí hodnotu, stačilo by jedno přeházené pořadí v `PAGES` a české
 *   stránky by se vyrenderovaly anglicky — chyba, která projde buildem
 *   i testem a pozná se až v produkci.
 */
function page(lang: Lang, node: React.ReactElement): string {
  setLang(lang)
  return renderToString(<StrictMode>{node}</StrictMode>)
}

/**
 * ═══════════ VSTUP PRO BUILD-TIME PRERENDER ═══════════
 *
 * Spouští ho scripts/prerender.mjs po `vite build`: vyrenderuje stránky do
 * řetězce a vloží je do <div id="root"> v hotovém dist/*.html. Klient pak
 * v main.tsx/projekty.tsx/clanky.tsx hotové DOM jen HYDRATUJE.
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
  'index.html': () => page('cs', <App />),
  'projekty.html': () => page('cs', <ProjectsPage />),
  'sluzby.html': () => page('cs', <ServicesPage />),
  /* ★ Kontakt se prerenderuje jako každá jiná stránka. Formulář je čistý HTML
     s `action` a `method`, takže vyrenderovaná verze funguje i bez hydratace —
     viz komentář v ContactPage.tsx. */
  'kontakt.html': () => page('cs', <ContactPage />),

  /* ★ Anglické stránky jsou TYTÉŽ komponenty, jen s jiným jazykem. Žádná
     kopie stromu, žádná druhá sada souborů — viz `input` ve vite.config.ts. */
  'en/index.html': () => page('en', <App />),
  'en/work.html': () => page('en', <ProjectsPage />),
  'en/services.html': () => page('en', <ServicesPage />),
  'en/contact.html': () => page('en', <ContactPage />),
}

/**
 * ★ ŽURNÁL NEMÁ PEVNÝ SEZNAM STRÁNEK, PROTOŽE HO NEZNÁ NIKDO PŘEDEM.
 *
 * Články zakládá plánovač (`api/cron/publish-article.ts`) a jejich počet se
 * mění mezi dvěma buildy. `PAGES` výš je proto slovník napevno, kdežto tady
 * je funkce: prerender si projde `ARTICLES` a pro každý článek zavolá tohle
 * s jeho cestou. Cesta je JEDINÝ vstup — přesně ten, který si v prohlížeči
 * odvodí `clanky.tsx` z `location.pathname`, takže se serverový a klientský
 * render nemají jak rozejít.
 */
export function renderJournal(route: JournalRoute): string {
  /* Žurnál je jen česky (viz ROUTES v lib/lang.ts) — jazyk se přesto nastavuje
     explicitně, protože tahle funkce běží AŽ PO anglických stránkách výš. */
  return page('cs', <JournalRoot route={route} />)
}
