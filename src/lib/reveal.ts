/**
 * Zpoždění revealu položek v jednom bloku.
 *
 * ★ PEVNÝ CELKOVÝ ROZPTYL, NE `80ms × i`. Při osmi položkách je z lineárního
 * zpoždění plazení: poslední naskočí půl vteřiny po předposlední a člověk mezitím
 * odroloval. Tady se celých 360 ms rozdělí mezi `n` položek, ať je jich pět nebo
 * dvacet – doba nástupu bloku je tedy konstantní.
 *
 * `i` smí být zlomkové: mezi dvě položky se dá vklínit další prvek (0.35, 2.6)
 * bez přečíslování zbytku.
 */
export const revealDelay = (i: number, n: number): React.CSSProperties =>
  ({ '--reveal-delay': `${(i / Math.max(1, n)) * 360}ms` }) as React.CSSProperties
