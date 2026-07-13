import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import Scene from './three/Scene'
import Hud from './hud/Hud'
import Section from './ui/Section'
import Preloader from './ui/Preloader'
import { SECTIONS } from './content/sections'
import { detectTier } from './lib/quality'
import { useReducedMotion } from './lib/hooks'
import { initScroll } from './lib/scroll'

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
  const [ready, setReady] = useState(false)

  useEffect(() => initScroll(reduced), [reduced])

  return (
    <>
      <a className="skip-link" href="#obsah">
        Přeskočit na obsah
      </a>

      <div className="bg-field" aria-hidden="true" />

      {tier !== 'off' && <Scene tier={tier} dragRef={dragRef} />}

      <main id="obsah">
        {SECTIONS.map((s, i) => (
          <Section key={s.id} s={s} index={i} reduced={reduced} dragRef={dragRef} />
        ))}
      </main>

      <Hud tier={tier} />
      <div className="grain" aria-hidden="true" />

      {tier !== 'off' && !ready && <Preloader reduced={reduced} onDone={() => setReady(true)} />}
    </>
  )
}
