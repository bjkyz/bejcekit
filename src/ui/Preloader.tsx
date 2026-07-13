import { useEffect, useRef, useState } from 'react'
import { sceneState } from '../lib/scene-state'
import { subscribeLoading } from '../lib/loading'
import { easeInOutExpo, tween } from '../lib/spring'
import { remeasure } from '../lib/scroll'

/**
 * ★ PRELOADER NEBLOKUJE OBSAH — a to je zásadní rozdíl oproti první verzi.
 *
 * Původně to byla plná clona přes celou obrazovku, která čekala na 3D model.
 * Důsledky, které se ukázaly až v měření:
 *   • LCP měřil PRELOADER, ne nadpis → Lighthouse trestal (1.4 s)
 *   • návštěvník civěl na počítadlo místo na nabídku služeb
 *   • scroll byl zamčený, dokud nedoteklo 839 kB modelu
 *
 * Teď je to jen tenká LIŠTA PRŮBĚHU nahoře. Text i služby jsou čitelné a
 * scrollovatelné OKAMŽITĚ; krychle se zapálí, až doteče — jako bonus, ne jako
 * mýtné. Konverzně i výkonově je to jednoznačně lepší, a drama zůstalo:
 * zážeh jádra pořád proběhne.
 */
export default function Preloader({ reduced }: { reduced: boolean }) {
  const [{ progress, active }, setState] = useState({ progress: 0, active: true })
  const [gone, setGone] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const fired = useRef(false)

  useEffect(() => subscribeLoading((p, a) => setState({ progress: p, active: a })), [])

  // Pojistka: kdyby se scéna nikdy nenačetla, lišta po 12 s prostě zmizí.
  // Obsah je použitelný i bez 3D, takže se nemá co pokazit.
  useEffect(() => {
    const t = setTimeout(() => setState({ progress: 100, active: false }), 12000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (bar.current) bar.current.style.transform = `scaleX(${progress / 100})`
  }, [progress])

  useEffect(() => {
    if (fired.current || active || progress < 100) return
    fired.current = true

    // Sekce se mohly po doběhnutí fontů přeskládat → přeměř snap body.
    remeasure()

    if (reduced) {
      setGone(true)
      return
    }
    // ZÁŽEH — až teď, když je GLB doparsované a mesh existuje.
    sceneState.boost = 6
    return tween(600, easeInOutExpo, () => {}, () => setGone(true))
  }, [active, progress, reduced])

  if (gone || reduced) return null

  return (
    <div className="loadbar" role="status" aria-live="polite">
      <div className="loadbar__fill" ref={bar} />
      <span className="sr-only">Načítám 3D scénu: {Math.round(progress)} %</span>
    </div>
  )
}
