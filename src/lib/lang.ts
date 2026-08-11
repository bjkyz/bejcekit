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
