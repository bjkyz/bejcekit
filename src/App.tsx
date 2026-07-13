import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import Hud from './hud/Hud'
import Section from './ui/Section'
import Preloader from './ui/Preloader'
import { SECTIONS } from './content/sections'
import { detectTier } from './lib/quality'
import { useReducedMotion } from './lib/hooks'
import { initScroll } from './lib/scroll'

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
 * ČTYŘVRSTVÝ STOH:
 *    0  .bg-field     — mřížka + záře, fixed
 *    1  .canvas-layer — WebGL, aria-hidden, pointer-events:none
 *    2  <main>        — VEŠKERÝ obsah, skutečný sémantický DOM
 *    3  .hud          — navigace, lišta, stav
 *   10  preloader
 *
 * Když plátno smažeš, zbude kompletní, čitelný a indexovatelný web se službami.
 * To je celý smysl téhle architektury: identita webu žije v DOM, ne v pipeline.
 */
export default function App() {
  const reduced = useReducedMotion()
  const tier = useMemo(() => (reduced ? 'off' : detectTier()), [reduced])
  const dragRef = useRef<Group>(null)

  useEffect(() => initScroll(reduced), [reduced])

  return (
    <>
      <a className="skip-link" href="#obsah">
        Přeskočit na obsah
      </a>

      <div className="bg-field" aria-hidden="true" />

      {tier !== 'off' && (
        <Suspense fallback={null}>
          <Scene tier={tier} dragRef={dragRef} />
        </Suspense>
      )}

      <main id="obsah">
        {SECTIONS.map((s, i) => (
          <Section key={s.id} s={s} index={i} reduced={reduced} dragRef={dragRef} />
        ))}
      </main>

      <Hud tier={tier} />
      <div className="grain" aria-hidden="true" />

      {tier !== 'off' && <Preloader reduced={reduced} />}
    </>
  )
}
