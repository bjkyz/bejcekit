import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../lib/hooks'

/**
 * ═══════════ ZNAČKOVÁ PEČEŤ ═══════════
 *
 * Býk v pohybu. Je to táž značka jako silueta v navigaci (`ui/Mark.tsx`), jen
 * jako 3D render — a proto smí být na webu jen tam, kde má co dělat: jako tvář
 * žurnálu a jako podpis pod článkem. Kdyby běžel na každé stránce, přestal by
 * být pečetí a stal se tapetou.
 *
 * ★★ VIDEO NA WEBU, KTERÝ MÁ LIGHTHOUSE 100, MUSÍ SPLNIT ČTYŘI PODMÍNKY.
 *   Každá z nich odpovídá jedné konkrétní věci, která by se jinak pokazila:
 *
 *   1) `preload="none"` + poster. Bez toho začne prohlížeč stahovat video
 *      SOUBĚŽNĚ s textem a na mobilu tím odsune LCP. Takhle se do sítě nedostane
 *      ani bajt videa, dokud se pečeť neobjeví v okně; do té doby drží místo
 *      poster (35 kB), takže není ani prázdný obdélník, ani poskočení layoutu.
 *
 *   2) `width`/`height` NA ELEMENTU. Poměr stran musí prohlížeč znát z HTML,
 *      jinak si layout dopočítá až po dotečení metadat a stránka poskočí (CLS).
 *      Čísla MUSÍ sedět se souborem: 720 × 964.
 *
 *   3) Přehrává se, jen když je vidět. `IntersectionObserver` video pustí při
 *      vstupu do okna a PAUSNE při odchodu — smyčka běžící pod ohybem je čistá
 *      spotřeba baterie a v profilu vypadá jako zaseknutý renderer.
 *
 *   4) Ustoupí, když má. `prefers-reduced-motion` a `Save-Data` znamenají, že
 *      se video nepustí vůbec a zůstane poster. Není to ústupek: obojí je
 *      výslovné přání uživatele nebo prohlížeče a 447 kB smyčky je přesně ten
 *      druh věci, o které mluví.
 *
 * ★ ZVUK VE ZDROJI NENÍ. Nejde o `muted` v HTML (to jde vypnout), ale o to, že
 *   se zvuková stopa při překódování zahodila. Automatické přehrávání se zvukem
 *   prohlížeče blokují, takže by ta stopa jen zabírala místo a byla by to mina
 *   pro toho, kdo někdy `muted` omylem smaže.
 */

/** 720 × 964 — MUSÍ sedět s `public/media/bull.mp4`. */
const W = 720
const H = 964

export default function BullSeal({
  variant,
  className = '',
}: {
  /** `hero` = velká pečeť na rozcestníku, `byline` = podpis autora pod článkem. */
  variant: 'hero' | 'byline'
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const v = ref.current
    if (!v) return

    /* Save-Data je hlavička, kterou uživatel zapíná vědomě („šetři mi data").
       Ignorovat ji kvůli ozdobě je hrubost, ne odvaha. */
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (reduced || conn?.saveData) return

    /* ★ `muted` se nastavuje i vlastností, nejen atributem. Atribut React
       vykreslí, ale u videa, které se hydratuje z hotového HTML, je vlastnost
       to, na co se dívá politika automatického přehrávání. Bez tohohle řádku
       se `play()` na části prohlížečů tiše odmítne. */
    v.muted = true

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {})
        else v.pause()
      },
      /* 0.25: pečeť je vysoká, takže „je vidět" má znamenat čtvrtinu plochy,
         ne jediný pixel na hraně okna. */
      { threshold: 0.25 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduced])

  return (
    <div className={`seal seal--${variant} ${className}`.trim()}>
      <video
        ref={ref}
        className="seal__video"
        poster="/media/bull-poster.jpg"
        width={W}
        height={H}
        preload="none"
        muted
        loop
        playsInline
        /* Pečeť u podpisu stojí vedle jména autora, takže by ji odečítač
           obrazovky hlásil podruhé. Velká pečeť na rozcestníku popis má. */
        {...(variant === 'byline'
          ? { 'aria-hidden': true as const }
          : { 'aria-label': 'Značka bejcek.it: kovový býk se svítícími modrými hranami, pomalá smyčka.' })}
      >
        <source src="/media/bull.mp4" type="video/mp4" />
      </video>
      <span className="seal__ring" aria-hidden="true" />
    </div>
  )
}
