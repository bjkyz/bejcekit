/**
 * ★ JEDINÝ ZDROJ PRAVDY O TOM, KDE NA OBRAZOVCE ŽIJE 3D.
 *
 * ═══════════ JEDEN REŽIM, NE DVA ═══════════
 *
 * Plátno je VŽDYCKY PODKLAD: kryje celé okno a leží POD textem
 * (--z-canvas < --z-main). Ať je displej jakkoli široký, stroj je pozadí
 * a text se přes něj píše.
 *
 * ★★ DŘÍV TU BYL DRUHÝ REŽIM („jeviště") A ŠEL VEN.
 *   Na telefonu se 3D zvedlo NAD text a zabralo horní pás obrazovky; text
 *   začínal až pod ním. Řešilo to sice čitelnost, ale za cenu, kterou nikdo
 *   nechtěl zaplatit: krychle byla schovaná v pruhu jako náhledový obrázek,
 *   textu zbyla spodní půlka okna a mobil vypadal jako jiný, chudší web.
 *   Kdo přišel z desktopu, poznal to na první pohled.
 *
 *   Čitelnost se místo toho řeší tam, kde vzniká — v obraze pod textem:
 *     • plátno se na úzkém displeji ZTLUMÍ (viz .canvas-layer v layout.css),
 *       takže rozsvícené hrany krychle přestanou soupeřit s písmem
 *     • mezi plátno a text se položí ZÁVOJ (main::before), který drží kontrast
 *       i nad tím nejsvětlejším místem stroje
 *     • krychle se na úzkém displeji sází jako CELOPLOŠNÉ POZADÍ (viz Rig.tsx),
 *       ne jako objekt, který se musí celý vejít
 *   Tři vrstvy stylu místo druhého layoutu. Web je pak na telefonu tentýž web.
 *
 * Zbyla tu proto jediná hodnota: šířka, od které si text a stroj přestanou
 * lézt do cesty a můžou stát vedle sebe.
 */

/**
 * ★ ŠÍŘKA, OD KTERÉ STOJÍ TEXT VEDLE STROJE.
 *
 * Nad ní: sloupec zabírá půlku mřížky, krychle uhne kompozičním panorámatem
 * do té druhé (ORBIT_PAN v scene-state.ts) a nikdo nikomu nepřekáží.
 * Pod ní: sloupec má plnou šířku a krychli není kam uhnout — je z ní pozadí.
 *
 * Čte to Rig.tsx (jestli zapnout panoráma a jak daleko postavit kameru)
 * a layout.css (kde tatáž hodnota stojí jako `max-width: 1024px`).
 * ★ Když se tohle číslo změní, MUSÍ se změnit i tam. Jsou to dvě kopie jedné
 *   hranice — CSS se JS zeptat neumí a media query se z proměnné nesází.
 */
export const SIDE_BY_SIDE = 1024
