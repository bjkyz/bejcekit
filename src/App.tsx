import { lazy, startTransition, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import Hud from './hud/Hud'
import Section from './ui/Section'
import Preloader from './ui/Preloader'
import SceneBoundary from './ui/SceneBoundary'
import { SECTIONS } from './content/sections'
import { detectTier } from './lib/quality'
import { useReducedMotion } from './lib/hooks'
import { initScroll } from './lib/scroll'
import { sceneState } from './lib/scene-state'

/**
 * ★ SCÉNA SE NAČÍTÁ LÍNĚ — a je to největší páka na výkon celého webu.
 *
 * three.js + R3F + drei + postprocessing je ~330 kB gzip. Kdyby viselo ve
 * statickém importu, prohlížeč by to musel stáhnout a SPARSOVAT dřív, než vykreslí
 * jediné písmeno — text by čekal na 3D knihovnu, kterou k přečtení nepotřebuje.
 *
 * Takhle se hlavní bundle scvrkne na React + obsah: nadpis a služby se vykreslí
 * okamžitě a WebGL doteče až po nich, na pozadí. Aby to fungovalo, NESMÍ nic
 * z lib/, ui/ ani hud/ importovat three jako hodnotu (viz three/palette.ts).
 */
const Scene = lazy(() => import('./three/Scene'))

/**
 * ★ SCÉNA STARTUJE AŽ PO 'load' + PRVNÍM VOLNU HLAVNÍHO VLÁKNA.
 *
 * lazy() samo o sobě nestačí: React spustí import hned při prvním renderu, takže
 * se ~330 kB gz three.js stahovalo a VYHODNOCOVALO souběžně s dokreslováním textu.
 * Na slabém mobilu je ten eval ~sekunda čistého bloku hlavního vlákna a trefoval
 * se přesně do překreslení odstavce po výměně fontů — a Chrome takové překreslení
 * počítá jako NOVÝ LCP kandidát. Změřeno: LCP 6.4 s místo 2.6 s, jen kvůli tomu.
 *
 * Odklad na load+idle znamená: text (produkt) doběhne celý, teprve pak jde
 * na řadu 3D (bonus). Na rychlém stroji je to zdržení ~200 ms, které zakryje
 * preloader; na pomalém je to rozdíl mezi zeleným a červeným Lighthouse.
 */
function useArmed(enabled: boolean): boolean {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!enabled || armed) return
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId = 0
    let timerId = 0
    const arm = () => {
      // timeout 1500: idle nesmí znamenat „až nikdy" — na strojích, které volno
      // nemají, se scéna prostě spustí po vteřině a půl.
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setArmed(true), { timeout: 1500 })
      else timerId = window.setTimeout(() => setArmed(true), 250) // Safari
    }
    if (document.readyState === 'complete') arm()
    else window.addEventListener('load', arm, { once: true })
    return () => {
      window.removeEventListener('load', arm)
      if (idleId) w.cancelIdleCallback?.(idleId)
      if (timerId) clearTimeout(timerId)
    }
  }, [enabled, armed])
  return armed
}

/**
 * STOH VRSTEV — na KAŽDÉ šířce stejný, žádné patro se nikde nepřehazuje:
 *    0  .bg-field     — mřížka + záře, fixed
 *    1  .canvas-layer — WebGL, aria-hidden, pointer-events:none
 *    2  main::before  — ZÁVOJ: drží kontrast textu nad rozsvícenými hranami
 *    2  <main>        — VEŠKERÝ obsah, skutečný sémantický DOM
 *    4  .hud          — navigace, lišta, stav
 *    5  .grain
 *   10  preloader
 *
 * ★ PLÁTNO JE VŽDYCKY PODKLAD. Text se přes stroj píše — na 4K monitoru i na
 *   telefonu. Dřív se na úzkém displeji vyzvedlo NAD text do horního pásu
 *   („jeviště"), aby se čitelnost vyřešila zakrytím; stálo to ale půlku
 *   obrazovky a mobil vypadal jako jiný, chudší web. Čitelnost teď drží
 *   ztlumené plátno + závoj (viz lib/stage.ts a layout.css), takže je to
 *   všude jeden a týž web.
 *
 * Když plátno smažeš, zbude kompletní, čitelný a indexovatelný web se službami —
 * layout na 3D nikde nevisí, ani jedním pixelem odsazení. To je celý smysl téhle
 * architektury: identita webu žije v DOM, ne v pipeline.
 */
export default function App() {
  const reduced = useReducedMotion()

  /* ★ TIER SE DETEKUJE AŽ PO MOUNTU — kvůli prerenderu, ne kvůli výkonu.
     Stránka se od buildu hydratuje z hotového HTML (scripts/prerender.mjs)
     a hydratace vyžaduje, aby první klientský render byl IDENTICKÝ se
     serverovým. Jenže detectTier() sahá na window, canvas a localStorage,
     takže na serveru neexistuje — server kreslí bez scény ('off'). Kdyby
     klient detekoval hned v prvním renderu, přibyl by mu preloader a úchop,
     hydratace by nesedla a React by celý strom zahodil a stavěl znovu.
     Detekce po mountu drží oba renery stejné; scéna stejně startuje až po
     load+idle (useArmed), takže se reálně nic neodkládá. */
  /* ★ TIER JE STAV DETEKOVANÝ AŽ PO MOUNTU, výchozí 'off' — kvůli prerenderu.
     Stránka se od buildu hydratuje z hotového HTML (scripts/prerender.mjs)
     a hydratace vyžaduje, aby první klientský render byl IDENTICKÝ se
     serverovým. Jenže detectTier() sahá na window, canvas a localStorage,
     takže na serveru neexistuje — server kreslí bez scény ('off'). Kdyby
     klient detekoval hned v prvním renderu, přibyl by mu preloader a úchop,
     hydratace by nesedla a React by celý strom zahodil a stavěl znovu.

     Časování je rozřezané schválně do TŘÍ kroků (idle → probe → transition):
     detekce vytváří WebGL kontext, což je na slabém stroji ~stovky ms čistého
     bloku, a přerender všech sekcí + přepnutí scrollu je druhý takový. V jednom
     flushi to byl ~390ms balvan přesně mezi FCP a interaktivitou (změřeno
     v Lighthouse long-tasks). Idle callback to uhne z cesty dokreslování,
     probe běží jako vlastní úloha a startTransition nechá React renderovat
     po řezech s yieldy. Uživatel nic nepozná — scéna stejně startuje až po
     load+idle (useArmed). */
  const [tier, setTier] = useState<ReturnType<typeof detectTier>>('off')
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const kick = () => {
      const detected = detectTier()
      startTransition(() => setTier(detected))
    }
    let idleId = 0
    let timerId = 0
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(kick, { timeout: 800 })
    else timerId = window.setTimeout(kick, 150)
    return () => {
      if (idleId) w.cancelIdleCallback?.(idleId)
      if (timerId) clearTimeout(timerId)
    }
  }, [])
  const dragRef = useRef<Group>(null)

  /* Scéna je bonus, ne podmínka. Když spadne — NEBO ji governor vzdá, protože
     stroj nestíhá ani nejnižší patro — jen o ní přestaneme mluvit: zmizí plátno
     i lišta průběhu a zbude čitelný web. Viz SceneBoundary a Governor ve Scene. */
  const [sceneFailed, setSceneFailed] = useState(false)
  const onSceneError = useCallback(() => setSceneFailed(true), [])
  const showScene = !reduced && tier !== 'off' && !sceneFailed
  /* Import 3D čeká, až má prohlížeč hotovo. Viz useArmed. */
  const armed = useArmed(showScene)

  /* Bez WebGL jede i scroll NATIVNĚ (žádný Lenis): na stroji, který neutáhne
     3D, je hijacknuté kolečko jen další vrstva JS mezi prstem a stránkou. */
  useEffect(() => initScroll(reduced || tier === 'off'), [reduced, tier])

  /* HUD čte tier ze sceneState (Scene ho za běhu snižuje). Tady se jen založí
     výchozí hodnota — důležité hlavně pro 'off', kdy se Scene nikdy nemountne.

     ★ MUSÍ TO VISET I NA `showScene`, NE JEN NA `tier`.
     'off' do sceneState jinak nikdo nikdy nezapíše: Scene si tier mapuje na
     Level (`tier === 'off' ? 'low' : tier`), takže 'off' neumí, a `tier` sám je
     useMemo z detectTier() a po pádu scény se nezmění. Když se tedy scéna vzdá
     za běhu — governor sundá poslední patro, spadne WebGL kontext, nenačte se
     chunk — panel dál hlásil poslední naměřené „60 fps · tier high" vedle
     prázdného místa po plátně. Tenhle panel má tisknout jen hodnoty, které
     aplikace opravdu drží. */
  useEffect(() => {
    sceneState.tier = showScene ? tier : 'off'
    if (!showScene) sceneState.fps = 0
  }, [tier, showScene])

  /* ★ TŘÍDA `staged` A JEJÍ SYNCHRONIZACE JSOU PRYČ. Layout se o existenci ani
     o velikost 3D nezajímá (viz lib/stage.ts): plátno je podklad, sekce si na
     něj nic nerezervují, a nemá se tedy co rozejít, když scéna za běhu zmizí.
     Ubyla tím celá jedna třída chyb — dřív se musela hlídat změna okna
     I pád scény, jinak zůstala na <html> viset rezerva na 3D, které tam není. */

  return (
    <>
      <a className="skip-link" href="#obsah">
        Přeskočit na obsah
      </a>

      <div className="bg-field" aria-hidden="true" />

      {showScene && armed && (
        <SceneBoundary onError={onSceneError}>
          <Suspense fallback={null}>
            <Scene tier={tier} dragRef={dragRef} onFail={onSceneError} />
          </Suspense>
        </SceneBoundary>
      )}

      <main id="obsah">
        {/* ★ SEKCE POD HEROEM MAJÍ VLASTNÍ <Suspense> — KVŮLI HYDRATACI, NE
            KVŮLI LAZY LOADINGU. Hydratace celé stránky v jednom kuse je jeden
            ~375ms blok hlavního vlákna přesně mezi FCP a interaktivitou (změřeno
            v Lighthouse long-tasks; TBT 540 ms). Suspense hranice dělá z každé
            sekce samostatnou hydratační jednotku: React hero hydratuje hned
            a zbytek po kouskách s yieldy mezi úlohami. Server přitom fallback
            nikdy nekreslí — renderToString obsah vyrenderuje synchronně a při
            hydrataci zůstává serverové HTML na místě, dokud na sekci nedojde. */}
        {SECTIONS.map((s, i) => {
          const section = (
            <Section key={s.id} s={s} index={i} reduced={reduced} hasScene={showScene} dragRef={dragRef} />
          )
          return i === 0 ? section : <Suspense key={s.id} fallback={null}>{section}</Suspense>
        })}
      </main>

      {/* Vlastní hydratační jednotka ze stejného důvodu jako sekce výš. */}
      <Suspense fallback={null}>
        <Hud />
      </Suspense>
      <div className="grain" aria-hidden="true" />

      {showScene && <Preloader reduced={reduced} />}
    </>
  )
}
