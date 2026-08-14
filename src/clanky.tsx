import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import JournalRoot from './JournalRoot.tsx'
import { parseJournalRoute } from './lib/journal-route.ts'
import { adoptDocumentLang } from './lib/lang'

import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'
import './styles/hud.css'
import './styles/projects.css'
import './styles/journal.css'

/**
 * ★ TŘETÍ VSTUPNÍ BOD. Web je vícestránkový (MPA), ne SPA — a žurnál to
 *   nemění: rozcestník, každý článek i každé téma jsou samostatné soubory
 *   vyrobené při buildu (`scripts/prerender.mjs`). Tenhle skript je tedy
 *   jen HYDRATACE hotového dokumentu, ne router.
 *
 * ★★ CESTA SE ČTE Z ADRESY, PROTOŽE JI JINAK NEJDE ZJISTIT. Prerender vyrobí
 *   `dist/clanky/<slug>.html` z jedné šablony, takže všechny články sdílejí
 *   tentýž skript a tentýž bundle — a ten musí poznat, který článek zrovna
 *   drží v ruce. Odvození je v `lib/journal-route.ts` a je to táž funkce, jaké
 *   se ptá prerender; jinak by se serverový a klientský render rozešly.
 *
 * `projects.css` se importuje schválně: žurnál stojí na týchž třídách stránky
 * (`.page`, `.page__cta`, `.crumbs`), které vznikly pro reference. `journal.css`
 * je poslední — přepisovat po něm už nemá co.
 */
/* Třída `js` + hydratace: stejná mechanika a stejné důvody jako v main.tsx. */
document.documentElement.classList.add('js')

/* ★ JAZYK SE NASTAVÍ PŘED HYDRATACÍ, ne během ní. Čte se z `<html lang>`, který
   do dokumentu zapsal build — viz lib/lang.ts. */
adoptDocumentLang()

const app = (
  <StrictMode>
    <JournalRoot route={parseJournalRoute(window.location.pathname)} />
  </StrictMode>
)

const root = document.getElementById('root')!
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
