import ArticlePage from './ArticlePage'
import JournalPage from './JournalPage'
import { articleBySlug, isLiveTopic, TOPICS } from './content/journal'
import type { JournalRoute } from './lib/journal-route'

/**
 * ═══════════ PŘEPÍNAČ STRÁNEK ŽURNÁLU ═══════════
 *
 * ★ TENHLE SOUBOR JE POJISTKA HYDRATACE. Prerender i prohlížeč renderují
 *   PRÁVĚ TENHLE strom se stejným `route` (prerender ho zná, protože si
 *   stránku sám vybral; klient ho odvodí z adresy — viz lib/journal-route.ts).
 *   Kdyby se výběr komponenty dělal na dvou místech, stačila by jedna odchylka
 *   a React by při hydrataci zahodil celý dokument a překreslil ho — na stránce
 *   s textem to znamená bliknutí a ztrátu pozice ve scrollu.
 *
 * ★★ NEZNÁMÁ CESTA SPADNE NA ROZCESTNÍK, NEROZBIJE SE. V produkci se to stát
 *   nemůže (každá stránka je vyrobený soubor a na cokoli jiného vrátí Vercel
 *   404), ale ve `vite preview` a v dev serveru se na `clanky.html` dá dostat
 *   ručně napsanou adresou. Prázdná bílá stránka by v tu chvíli vypadala jako
 *   chyba buildu a stála by půl hodiny hledání.
 */
export default function JournalRoot({ route }: { route: JournalRoute }) {
  if (route.kind === 'article') {
    const a = articleBySlug(route.slug)
    return a ? <ArticlePage a={a} /> : <JournalPage />
  }

  if (route.kind === 'topic') {
    /* ★ Práh se kontroluje i tady, ne jen v odkazech. Rozcestník tématu se
       dvěma články by se dal otevřít napsáním adresy a byl by to přesně ten
       slabý obsah, kvůli kterému práh vznikl. */
    const t = TOPICS.find((x) => x.slug === route.slug)
    return t && isLiveTopic(t.slug) ? <JournalPage topic={t} /> : <JournalPage />
  }

  return <JournalPage />
}
