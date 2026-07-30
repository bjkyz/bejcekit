import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import Hud from './hud/Hud'
import Section from './ui/Section'
import Preloader from './ui/Preloader'
import SceneBoundary from './ui/SceneBoundary'
import { SECTIONS } from './content/sections'
import { detectTier } from './lib/quality'
import { useReducedMotion } from './lib/hooks'
import { initScroll } from './lib/scroll'
import { fitsStage, markStage, STAGE_MQ } from './lib/stage'
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
 * STOH VRSTEV:
 *    0  .bg-field     — mřížka + záře, fixed
 *    1  .canvas-layer — WebGL, aria-hidden, pointer-events:none        ← ŠIROKO
 *    2  <main>        — VEŠKERÝ obsah, skutečný sémantický DOM
 *    3  .canvas-layer — totéž plátno, ale jako JEVIŠTĚ nad textem      ← ÚZKO
 *       .stage-edge   — hrana, do které se text pod jevištěm rozplyne
 *    4  .hud          — navigace, lišta, stav
 *    5  .grain
 *   10  preloader
 *
 * ★ PLÁTNO MĚNÍ PATRO. Na širokém displeji je PODKLAD (text se píše přes stroj),
 *   na úzkém JEVIŠTĚ (text mizí za strojem). Rozhoduje o tom lib/stage.ts a je to
 *   ta jediná změna, kvůli které mobil přestal vypadat rozbitě: sekce je na telefonu
 *   vyšší než okno, takže text NUTNĚ podjede pod 3D — a jde jen o to, jestli se
 *   při tom bude míhat přes rozsvícené hrany krychle, nebo za nimi čistě zmizí.
 *
 * Když plátno smažeš, zbude kompletní, čitelný a indexovatelný web se službami
 * (--stage-h spadne na nulu a odsazení sekcí se samo vynulují). To je celý smysl
 * téhle architektury: identita webu žije v DOM, ne v pipeline.
 */
export default function App() {
  const reduced = useReducedMotion()
  const tier = useMemo(() => (reduced ? 'off' : detectTier()), [reduced])
  const dragRef = useRef<Group>(null)

  /* Scéna je bonus, ne podmínka. Když spadne — NEBO ji governor vzdá, protože
     stroj nestíhá ani nejnižší patro — jen o ní přestaneme mluvit: zmizí plátno
     i lišta průběhu a zbude čitelný web. Viz SceneBoundary a Governor ve Scene. */
  const [sceneFailed, setSceneFailed] = useState(false)
  const onSceneError = useCallback(() => setSceneFailed(true), [])
  const showScene = tier !== 'off' && !sceneFailed
  /* Jeviště se rezervuje podle showScene (synchronně, kvůli CLS) — ale samotný
     import 3D čeká, až má prohlížeč hotovo. Viz useArmed. */
  const armed = useArmed(showScene)

  /* Bez WebGL jede i scroll NATIVNĚ (žádný Lenis): na stroji, který neutáhne
     3D, je hijacknuté kolečko jen další vrstva JS mezi prstem a stránkou. */
  useEffect(() => initScroll(reduced || tier === 'off'), [reduced, tier])

  /* HUD čte tier ze sceneState (Scene ho za běhu snižuje). Tady se jen založí
     výchozí hodnota — důležité hlavně pro 'off', kdy se Scene nikdy nemountne. */
  useEffect(() => {
    sceneState.tier = tier
  }, [tier])

  /**
   * ★ JEVIŠTĚ MUSÍ ZŮSTAT PRAVDIVÉ PO CELOU DOBU BĚHU.
   *
   * main.tsx ho sází jednou, ještě před prvním renderem (kvůli CLS). Jenže obě věci,
   * na kterých stojí, se za běhu MĚNÍ:
   *   • velikost okna  — otočení telefonu, změna okna na tabletu
   *   • existence scény — WebGL kontext padne dvakrát a scéna se vzdá (SceneBoundary),
   *                       nebo si uživatel v systému zapne omezený pohyb
   *
   * Kdyby po zmizelé scéně zůstala třída viset, sekce by si dál rezervovaly 42 %
   * obrazovky pro 3D, které tam není: nahoře by zela prázdná díra. Web má bez krychle
   * vypadat kompletně, ne rozbitě — to je celá teze téhle architektury.
   *
   * sceneState.staged je totéž číslo pro useFrame smyčky (Rig si podle něj sází
   * kompozici). Nikdy React state — čte se to 60×/s.
   */
  useEffect(() => {
    const sync = () => {
      const on = showScene && fitsStage()
      markStage(on)
      sceneState.staged = on
    }
    sync()
    const mq = window.matchMedia(STAGE_MQ)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [showScene])

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
          {/* Podklad a spodní hranu jeviště kreslí čisté CSS (html.staged::before/::after,
              viz layout.css) — musí existovat i v okně mezi prvním renderem a mountem
              scény, takže nesmí viset na tomhle stromě. */}
        </SceneBoundary>
      )}

      <main id="obsah">
        {SECTIONS.map((s, i) => (
          <Section key={s.id} s={s} index={i} reduced={reduced} hasScene={showScene} dragRef={dragRef} />
        ))}
      </main>

      <Hud />
      <div className="grain" aria-hidden="true" />

      {showScene && <Preloader reduced={reduced} />}
    </>
  )
}
