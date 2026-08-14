import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import { adoptDocumentLang } from './lib/lang'

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

/* ★ TŘÍDA `js` ŘÍDÍ SKRÝVÁNÍ `.reveal` PRVKŮ (layout.css). Obsah je od
   prerenderu v HTML, takže bez JS musí zůstat celý VIDITELNÝ — schovávat smí
   až kód, který ho umí zase odhalit. Nejde to inline skriptem v <head>:
   CSP má script-src 'self'. Tady je to nejdřívější povolené místo. */
document.documentElement.classList.add('js')

/* ★ JAZYK SE NASTAVÍ PŘED HYDRATACÍ, ne během ní. Čte se z `<html lang>`, který
   do dokumentu zapsal build — viz lib/lang.ts. */
adoptDocumentLang()

/* StrictMode ZŮSTÁVÁ. R3F v9 ho konečně dědí z react-dom, takže odhalí latentní
   double-mount chyby, které byly dřív tiše skryté. Neřeš je vypnutím StrictMode —
   napiš úklidové funkce. (useFrame je bezpečný, R3F ho při unmountu odhlásí.) */
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

/* ★ HYDRATACE, NE RENDER OD NULY. Produkce má v #root prerenderovaný obsah
   (scripts/prerender.mjs); hydrateRoot ho převezme bez zahození a překreslení.
   Dev server žádný prerender nemá, tam se renderuje postaru — proto ta větev.

   ★★ HYDRATACE V SAMOSTATNÉ ÚLOZE (setTimeout 0). Synchronně by se přilepila
   k vyhodnocení celého ESM grafu (rolldown-runtime + react + hud + index se
   evaluují v jedné úloze, jakmile doběhne entry) a vznikl by jeden ~400ms blok
   hlavního vlákna. Obsah je už vykreslený z HTML, takže odklad o jednu otočku
   fronty nikoho nic nestojí — jen rozetne eval a hydrataci na dvě kratší úlohy. */
const root = document.getElementById('root')!
if (root.firstElementChild) setTimeout(() => hydrateRoot(root, app), 0)
else createRoot(root).render(app)
