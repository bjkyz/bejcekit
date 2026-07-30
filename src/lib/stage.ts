/**
 * ★ JEDINÝ ZDROJ PRAVDY O TOM, KDE NA OBRAZOVCE ŽIJE 3D.
 *
 * ═══════════ DVA REŽIMY, NE JEDEN ROZBITÝ ═══════════
 *
 * ŠIROKO: plátno je PODKLAD. Kryje celé okno, leží POD textem (--z-canvas < --z-main)
 *   a text se přes stroj píše. Sloupec je úzký (5 z 12), takže krychli po straně
 *   zbývá půlka okna a nic si nelezou do cesty.
 *
 * ÚZKO: plátno je JEVIŠTĚ. Zabírá horní pás obrazovky a leží NAD textem
 *   (--z-stage > --z-main). Text mu tím pádem nemůže vlézt do záběru: sekce je na
 *   telefonu vyšší než okno, takže při rolování MUSÍ pod jeviště podjet — a tady
 *   prostě zmizí za jeho neprůhledným pozadím, místo aby se přes rozsvícené hrany
 *   krychle míhala jako duch. To je celý ten trik.
 *
 *   Proč vůbec pás a ne celá plocha: na 390px displeji stojí text přes CELOU šířku
 *   (grid-column: 1 / -1), takže krychli není kam uhnout. Před tímhle krychle textem
 *   doslova PROŘÍZLA — zářící hrany šly napříč nadpisem a četlo se to jako rozbité
 *   vykreslování, ne jako režie.
 *
 * ═══════════ KDO CO VLASTNÍ ═══════════
 *
 * ★ VÝŠKU JEVIŠTĚ VLASTNÍ CSS (--stage-h: 42svh), NE TENHLE SOUBOR. Schválně:
 *
 *   1. ŽÁDNÝ CLS. Scéna se načítá LÍNĚ, takže její useEffect přijde až dávno po
 *      prvním vykreslení. Kdyby výšku pásu psal až on, sekce by se poprvé vysázely
 *      BEZ rezervovaného místa a při mountu scény by o 350 px poskočily. To je
 *      učebnicový layout shift — a zrovna tenhle web se Core Web Vitals ohání
 *      v sekci 01 jako důkazem. Třída `staged` se proto sází SYNCHRONNĚ v main.tsx
 *      ještě před prvním renderem a výška je ve statickém stylesheetu. Nula posunů.
 *
 *   2. svh, NE clientHeight. Na iOS se při rolování vysouvá a zasouvá URL lišta
 *      a clientHeight se s ní mění. Pás počítaný z něj by při každém takovém pohybu
 *      změnil výšku, a s ním i odsazení VŠECH sekcí — stránka by se pod prstem
 *      cukala. `svh` je z definice ta MALÁ (lišta vysunutá) výška a nehne se.
 *
 * Tenhle soubor tedy vlastní JEDINOU věc: rozhodnutí ANO/NE. To je ta hodnota,
 * kterou CSS samo spočítat neumí (potřebuje k ní vědět, jestli vůbec běží WebGL).
 */

/**
 * ★ BREAKPOINT ŽIJE TADY A NIKDE JINDE.
 *
 * CSS ho nepotřebuje: pravidla visí na třídě `staged`, ne na média dotazu. Díky
 * tomu se nemůže rozejít — neexistuje druhá kopie, se kterou by se rozcházel.
 *
 * Podmínka na výšku (560 px) vyhazuje TELEFON NA ŠÍŘKU. 42 % z 390 px je 164 px;
 * do takového pásu se krychle nevejde a textu pod ním nezbyde kde být. Tam se
 * plátno vrací na podklad a layout.css sype text do úzkého sloupce vlevo.
 * Krychle ustoupí, slovo dostane přednost.
 */
export const STAGE_MQ = '(max-width: 1024px) and (min-height: 560px)'

/** ★ Musí souhlasit s breakpointem šířky výš. Čte to Rig (panoráma) a layout.css. */
export const SIDE_BY_SIDE = 1024

/** Má scéna běžet v režimu jeviště? Jen o velikosti okna — o WebGL rozhoduje volající. */
export function fitsStage(): boolean {
  return window.matchMedia(STAGE_MQ).matches
}

/**
 * Přepne třídu na <html>. Odtud si ji berou VŠECHNA pravidla, která se o jeviště
 * opírají: jeho výška, patro plátna, odsazení sekcí, rohové značky, vypnuté závoje.
 *
 * ★ MUSÍ SE UMĚT I VYPNOUT. Jeviště existuje jen tehdy, když existuje scéna — a ta
 * umí zmizet za běhu: WebGL kontext se dvakrát ztratí (viz MAX_RESTORES ve Scene.tsx),
 * uživatel si zapne omezený pohyb, scéna spadne do SceneBoundary. Kdyby po ní zbyla
 * třída `staged`, sekce by si dál rezervovaly odsazení na 3D, které tam už není:
 * nahoře by zela díra přes 42 % obrazovky a web by vypadal rozbitě přesně ve chvíli,
 * kdy měl naopak elegantně ustoupit.
 */
export function markStage(on: boolean): void {
  document.documentElement.classList.toggle('staged', on)
}
