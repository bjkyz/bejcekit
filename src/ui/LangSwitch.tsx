import { LANGS, LOCALE, ROUTES, type Lang } from '../lib/lang'

/**
 * ═══════════ PŘEPÍNAČ JAZYKA ═══════════
 *
 * ★★★ JE TO DVOJICE ODKAZŮ, NE `<select>` A NE DETEKCE PODLE PROHLÍŽEČE.
 *
 * Tři rozhodnutí, každé proti jedné běžné chybě:
 *
 * 1) ODKAZY, NE JAVASCRIPT. Přepnutí jazyka je navigace mezi dvěma dokumenty,
 *    takže to má dělat prohlížeč. Odkaz funguje bez JS, dá se otevřít v nové
 *    kartě, zkopírovat a hlavně ho VIDÍ VYHLEDÁVAČ — a vzájemné prolinkování
 *    jazykových verzí je pro hreflang cluster stejně důležité jako značky
 *    v hlavičce.
 *
 * 2) ŽÁDNÉ AUTOMATICKÉ PŘESMĚROVÁNÍ podle `navigator.language` ani podle IP.
 *    Je to nejčastější chyba dvojjazyčných webů: Čech v zahraničí dostane
 *    angličtinu, kterou nechce, a Googlebot (který leze z USA) nikdy neuvidí
 *    českou verzi, takže ji nezaindexuje. Jazyk si volí člověk, ne stroj.
 *
 * 3) ODKAZ MÍŘÍ NA PROTĚJŠEK, NE NA DOMOVSKOU STRÁNKU. Kdo je na `/kontakt`
 *    a přepne na angličtinu, chce `/en/contact`, ne `/en`. Ztratit kontext při
 *    přepnutí jazyka je ta nejotravnější věc, kterou tohle tlačítko umí.
 *    ★ Když protějšek NEEXISTUJE (žurnál je jen česky), tlačítko se pro ten
 *      jazyk vůbec nevykreslí — mrtvý odkaz na neexistující stránku je horší
 *      než chybějící volba.
 *
 * ★ `hrefLang` na odkazu není totéž co `<link rel="alternate">` v hlavičce.
 *   Tenhle atribut je nápověda pro prohlížeč a odečítač („tenhle odkaz vede na
 *   jinojazyčný dokument"), kdežto značka v hlavičce je signál pro vyhledávač.
 *   Web má obojí, protože každé řeší něco jiného.
 */
export default function LangSwitch({ current, path }: { current: Lang; path: string }) {
  return (
    <div className="langsw" role="group" aria-label="Jazyk / Language">
      {LANGS.map((lang) => {
        const target = ROUTES[lang][pathKey(path, current)]
        if (!target) return null
        const active = lang === current
        return (
          <a
            key={lang}
            className={`langsw__i${active ? ' is-active' : ''}`}
            href={target}
            hrefLang={LOCALE[lang].html}
            lang={LOCALE[lang].html}
            /* `aria-current` říká odečítači „tady jsi", což u přepínače, kde
               obě položky vypadají skoro stejně, nese celou informaci. */
            aria-current={active ? 'true' : undefined}
          >
            {lang.toUpperCase()}
            <span className="sr-only"> {LOCALE[lang].name}</span>
          </a>
        )
      })}
    </div>
  )
}

/**
 * Ze současné cesty odvodí, o kterou stránku jde, aby se dal najít její
 * protějšek. Fallback na `home` je záměr: neznámá cesta (třeba článek žurnálu)
 * pošle člověka na úvod druhého jazyka místo na 404.
 */
function pathKey(path: string, lang: Lang): keyof (typeof ROUTES)['cs'] {
  const map = ROUTES[lang]
  for (const key of Object.keys(map) as (keyof typeof map)[]) {
    if (map[key] === path) return key
  }
  return 'home'
}
