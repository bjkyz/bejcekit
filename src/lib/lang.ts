/**
 * ═══════════ JAZYK WEBU ═══════════
 *
 * Web je od 2026-08-11 dvojjazyčný: česky na kořeni, anglicky pod `/en/`.
 *
 * ★★★ JAZYK JE MODULOVÝ STAV, NE REACT CONTEXT — A JE TO ZÁMĚR.
 *
 * Nabízí se context nebo prop protažený stromem. Obojí by znamenalo sáhnout do
 * všech ~15 komponent a do každé z nich přidat parametr, který nikdy nebude mít
 * víc než dvě hodnoty a v rámci JEDNOHO DOKUMENTU se nikdy nezmění.
 *
 * Tenhle web je totiž MPA: každá stránka je vlastní dokument s vlastním
 * `<html lang>`. Jazyk se tedy nemění za běhu — mění se navigací, tedy načtením
 * jiného souboru. Modulová proměnná je pro takovou vlastnost přesný nástroj.
 *
 * ★ KDE SE NASTAVUJE (a jinde nikde):
 *   • v prohlížeči: vstupní bod (`main.tsx`, `kontakt.tsx`, …) ji nastaví
 *     z `document.documentElement.lang` PŘED `hydrateRoot`
 *   • v prerenderu: `entry-prerender.tsx` ji nastaví před každým `renderToString`
 *
 * ★★ PROČ TO NEROZBÍJÍ HYDRATACI: klient čte jazyk z `<html lang>`, který do
 *   dokumentu zapsal tentýž build, co ho vyrenderoval. Server a klient tedy
 *   nemají jak se rozejít. (Kdyby se jazyk odvozoval z `navigator.language`,
 *   rozešly by se okamžitě — to je klasická past a proto se to tu nedělá.)
 *
 * ★★ A PROČ JE `renderToString` BEZPEČNÝ: je SYNCHRONNÍ. Prerender vyrenderuje
 *   českou stránku celou, pak přepne jazyk a vyrenderuje anglickou. Nikdy neběží
 *   dva renderu najednou, takže se globální stav nemá jak proplést.
 */

export type Lang = 'cs' | 'en'

export const LANGS: readonly Lang[] = ['cs', 'en'] as const

/** Výchozí jazyk. Kořen webu je český. */
export const DEFAULT_LANG: Lang = 'cs'

let current: Lang = DEFAULT_LANG

export function setLang(lang: Lang): void {
  current = lang
}

export function getLang(): Lang {
  return current
}

/**
 * Nastaví jazyk podle `<html lang>` aktuálního dokumentu. Volá se ve VSTUPNÍM
 * BODĚ, ještě před `hydrateRoot`.
 *
 * ★★ ČTE SE DOKUMENT, NE `navigator.language`. Atribut do HTML zapsal tentýž
 *   build, který stránku vyrenderoval, takže se serverový a klientský render
 *   nemají jak rozejít. Odvození z prohlížeče by je rozešlo okamžitě: Čech
 *   s anglickým systémem by dostal jiný první render, než co je v HTML,
 *   a React by celý strom zahodil a postavil znovu.
 */
export function adoptDocumentLang(): void {
  setLang(document.documentElement.lang === 'en' ? 'en' : DEFAULT_LANG)
}

/** `true` na anglické verzi. Zkratka pro nejčastější větvení. */
export function isEn(): boolean {
  return current === 'en'
}

/**
 * Vybere hodnotu podle aktuálního jazyka.
 *
 * Používá se všude, kde je obsah dvojjazyčný:
 *   `t({ cs: 'Napište mi', en: 'Get in touch' })`
 *
 * ★ Není to překladový slovník s klíči. Klíčované slovníky (`t('nav.contact')`)
 *   znamenají, že se text hledá jinde než tam, kde se používá — a u webu, kde
 *   je textů pár stovek a mění je jeden člověk, je to jen práce navíc a jeden
 *   nový způsob, jak nechat někde nepřeložený klíč.
 */
export function t<T>(dict: Record<Lang, T>): T {
  return dict[current]
}

/**
 * ═══════════ CESTY ═══════════
 *
 * ★★ ANGLICKÉ CESTY NEJSOU PŘEDPONA + ČESKÝ SLUG. `/en/sluzby` by byla
 *   nejhorší varianta: pro anglického návštěvníka nesrozumitelná a pro
 *   vyhledávač signál, že jde o českou stránku.
 *
 * ★★★ ŽURNÁL ANGLICKOU VERZI NEMÁ, A JE TO ROZHODNUTÍ, NE OPOMENUTÍ.
 *   Články píše každý den cron přes jazykový model (api/cron/publish-article.ts).
 *   Anglická větev by znamenala druhé volání modelu každý den, druhou sitemapu,
 *   druhý RSS kanál a hlavně riziko, že se překlad rozejde s originálem.
 *   `journal: null` je proto legální hodnota a všude, kde se na cestu sahá,
 *   se s ní musí počítat — právě proto je to `null`, a ne prázdný řetězec:
 *   TypeScript pak vynutí ošetření.
 */
export const ROUTES: Record<Lang, { home: string; services: string; work: string; contact: string; journal: string | null }> =
  {
    cs: {
      home: '/',
      services: '/sluzby',
      work: '/projekty',
      contact: '/kontakt',
      journal: '/clanky',
    },
    en: {
      home: '/en',
      services: '/en/services',
      work: '/en/work',
      contact: '/en/contact',
      journal: null,
    },
  }

/** Cesta v AKTUÁLNÍM jazyce. */
export function route(key: keyof (typeof ROUTES)['cs']): string | null {
  return ROUTES[current][key]
}

/**
 * ★★★ PŘEKLADAČ ODKAZŮ, KTERÝ DRŽÍ CELOU ANGLICKOU VERZI POHROMADĚ.
 *
 * Obsah (`content/*.ts`) píše cesty česky — `/kontakt`, `/sluzby`. Kdyby si
 * každá komponenta cíl vybírala sama podle jazyka, byla by to podmínka na
 * dvaceti místech a první, co by se stalo, je odkaz z anglické stránky na
 * českou. Tady se to řeší jednou: dovnitř jde česká cesta, ven cesta
 * v aktuálním jazyce.
 *
 * ★ NEZNÁMÁ CESTA PROJDE BEZE ZMĚNY. Kotvy (`/#ai`), soubory (`/og.png`)
 *   i externí odkazy tedy fungují dál a nemusí se nikde vyjmenovávat.
 *
 * ★★ ŽURNÁL JE VÝJIMKA A JE TO ZÁMĚR: anglickou verzi nemá (viz ROUTES), takže
 *   `/clanky` se vrací nepřeložený. Anglický návštěvník tak dostane český
 *   žurnál — a texty, které na něj odkazují, to říkají nahlas
 *   („Read the journal (Czech)"). Rozbitý odkaz je horší než přiznaný jazyk.
 */
const CS_PATH_KEYS: Record<string, keyof (typeof ROUTES)['cs']> = {
  '/': 'home',
  '/sluzby': 'services',
  '/projekty': 'work',
  '/kontakt': 'contact',
  '/clanky': 'journal',
}

export function localPath(csPath: string): string {
  /* Kotva na jiné stránce (`/#ai`, `/kontakt#formular`) se rozdělí a přeloží
     se jen ta část před mřížkou — jinak by mapa musela znát každou kotvu. */
  const hash = csPath.indexOf('#')
  const base = hash === -1 ? csPath : csPath.slice(0, hash)
  const rest = hash === -1 ? '' : csPath.slice(hash)
  const key = CS_PATH_KEYS[base]
  if (!key) return csPath
  return (ROUTES[current][key] ?? base) + rest
}

/**
 * Protějšek dané cesty v druhém jazyce, nebo `null`, když neexistuje.
 * Čte to přepínač jazyka v navigaci i generátor `hreflang`.
 */
export function counterpart(path: string, from: Lang): string | null {
  const to: Lang = from === 'cs' ? 'en' : 'cs'
  const src = ROUTES[from]
  const dst = ROUTES[to]
  for (const key of Object.keys(src) as (keyof typeof src)[]) {
    if (src[key] === path) return dst[key]
  }
  return null
}

/** Jazyková značka do `<html lang>` a `og:locale`. */
export const LOCALE: Record<Lang, { html: string; og: string; name: string }> = {
  cs: { html: 'cs', og: 'cs_CZ', name: 'Čeština' },
  en: { html: 'en', og: 'en_US', name: 'English' },
}

/**
 * Ze současné cesty odvodí, o kterou stránku jde. Používají to stránky, které
 * svou identitu drží jako `href` (navigace podstránek), ne jako klíč.
 *
 * ★ HLEDÁ SE V OBOU JAZYCÍCH. `/sluzby` i `/en/services` musí dát `services`,
 *   protože tatáž komponenta běží na obou verzích a dostane vždycky cestu té své.
 * ★ Fallback na `home` je záměr: neznámá cesta (třeba článek žurnálu) pošle
 *   člověka na úvod druhého jazyka místo na 404.
 */
export function pageKeyOf(path: string): keyof (typeof ROUTES)['cs'] {
  for (const lang of LANGS) {
    const map = ROUTES[lang]
    for (const key of Object.keys(map) as (keyof typeof map)[]) {
      if (map[key] === path) return key
    }
  }
  return 'home'
}
