/**
 * ═══════════ SMĚROVÁNÍ ŽURNÁLU ═══════════
 *
 * ★ ŽÁDNÝ ROUTER. Každá stránka žurnálu je při buildu vyrobený SOUBOR
 *   (`dist/clanky.html`, `dist/clanky/<slug>.html`, `dist/clanky/tema/<téma>.html`)
 *   a Vercel ho díky `cleanUrls` naservíruje na čisté URL. Prohlížeč tedy dostane
 *   hotový článek v prvním bajtu odpovědi — bez JS, bez čekání, s vlastním
 *   titulkem a strukturovanými daty. To je pro vyhledávače i pro rychlost
 *   nesrovnatelně lepší než SPA, která by tentýž obsah teprve doskládala.
 *
 * ★★ TENHLE MODUL EXISTUJE KVŮLI HYDRATACI. Prerender ví, kterou stránku kreslí,
 *   protože si ji sám vybral. Prohlížeč to musí ODVODIT Z ADRESY — a musí dojít
 *   PŘESNĚ ke stejnému výsledku, jinak React zahodí celý strom a překreslí ho
 *   (a v konzoli přistane chyba hydratace). Proto je odvození na jednom místě
 *   a je to čistá funkce řetězce: co dostane prerender jako parametr, to si
 *   klient přečte z `location.pathname`.
 */

export type JournalRoute =
  /** Rozcestník /clanky */
  | { kind: 'hub' }
  /** Detail článku /clanky/<slug> */
  | { kind: 'article'; slug: string }
  /** Rozcestník tématu /clanky/tema/<téma> */
  | { kind: 'topic'; slug: string }

/**
 * Odvodí stránku z cesty v adrese.
 *
 * ★ NORMALIZACE JE POVINNÁ ČÁST. Táž stránka se dá potkat pod `/clanky/x`,
 *   `/clanky/x/` i `/clanky/x.html` (poslední hlavně ve `vite preview` a při
 *   otevření souboru napřímo). Kdyby se lišil výsledek, lišil by se i render
 *   a hydratace by spadla zrovna v prostředí, kde se to testuje.
 */
export function parseJournalRoute(pathname: string): JournalRoute {
  const clean = pathname
    .replace(/\.html$/, '')
    .replace(/\/+$/, '')
    .replace(/^\/+/, '/')

  const m = /^\/clanky(?:\/(.*))?$/.exec(clean)
  if (!m || !m[1]) return { kind: 'hub' }

  const rest = m[1]
  const topic = /^tema\/([a-z0-9-]+)$/.exec(rest)
  if (topic) return { kind: 'topic', slug: topic[1] }

  return { kind: 'article', slug: rest }
}

/** Cesta pro odkaz na rozcestník tématu. Jediné místo, kde ta adresa vzniká. */
export function topicPath(slug: string): string {
  return `/clanky/tema/${slug}`
}
