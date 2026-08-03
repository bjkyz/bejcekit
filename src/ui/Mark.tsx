/**
 * ★ ZNAČKA: SILUETA BÝKA.
 *
 * Proč zrovna býk: Bejček → býček. Značka nemá být obrázek k textu, ale jeho
 * zkratka — a jméno, které jde nakreslit, je to nejlevnější logo na světě.
 * Nahradila textové „bejcek.it" v navigaci: doménu si člověk přečte v adresním
 * řádku, značku si zapamatuje.
 *
 * ═══════════ PROČ PRÁVĚ TAKHLE NAKRESLENÝ ═══════════
 *
 * Zkoušelo se pět siluet a čtyři z nich se četly jako KOZA nebo JELEN. Rozdíl
 * nedělají rohy, ale MORDA: býk má široký tupý čenich (~55 % šířky lebky),
 * kdežto vejčitá hlava zúžená do špičky je koza. Odtud ty proporce:
 *   • temeno ploché a široké (rohy z něj vyrůstají, nevisí po stranách)
 *   • líce se rozšíří a teprve pak se svedou do TUPÉHO čenichu
 *   • rohy silné u kořene, ostré na špičce, tažené ven a nahoru
 *   • uši oddělené zářezem, jinak splynou s rohy v jednu kaňku
 *
 * ★ PLNÁ SILUETA, NE OBRYS. Tahová varianta se při 24 px slila do klubka —
 *   a značka musí fungovat hlavně TAM, kde je nejmenší (favicon, navigace).
 *   Ověřeno vykreslením na 190 / 64 / 30 / 20 / 16 px: čte se ve všech.
 *
 * ★ fill="currentColor" — barvu řídí rodič, takže hover a stavy jsou čisté CSS
 *   a nikde se nedubluje druhá kopie ikony. Stejný princip jako ui/Icons.tsx.
 *
 * ★ Poměr 80:56 je ZAPEČENÝ do výpočtu výšky. Kdyby se sázela zvenčí, stačí
 *   jedno zaokrouhlení a býk se svisle rozplácne — a zrovna u značky je
 *   deformace ta nejnápadnější možná chyba.
 */

const VB_W = 80
const VB_H = 56

/** Levý roh, pravý roh, levé ucho, pravé ucho, lebka. V tomhle pořadí se i kreslí. */
const PATHS = [
  'M31.5 18.5C24 15 13.5 15.5 6 3c3.5 11 8 18 24.5 22Z',
  'M48.5 18.5C56 15 66.5 15.5 74 3c-3.5 11-8 18-24.5 22Z',
  'M29.8 26.5c-5.8-.9-11.2.5-14.8 4.3 4 2.8 10 3 14.6 1.6Z',
  'M50.2 26.5c5.8-.9 11.2.5 14.8 4.3-4 2.8-10 3-14.6 1.6Z',
  'M31 19.5c1.6-3.7 4.7-4.9 9-4.9s7.4 1.2 9 4.9c1.6 3.9 2 8.9 1.4 13.9-.6 5.2-2.2 9.8-4.5 12.8-1.7 2.3-3.7 3.4-5.9 3.4s-4.2-1.1-5.9-3.4c-2.3-3-3.9-7.6-4.5-12.8-.6-5-.2-10 1.4-13.9Z',
]

export default function Mark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={Math.round((size * VB_H) / VB_W)}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
