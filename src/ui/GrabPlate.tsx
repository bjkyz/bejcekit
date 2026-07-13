import { useEffect, useRef, useState } from 'react'
import { elasticOut } from '../lib/spring'
import type { Group } from 'three'

/* ★ ŽÁDNÝ hodnotový import z 'three'. GrabPlate visí na hero sekci, tedy
   v hlavním bundlu — jediné `import { Euler } from 'three'` by sem přitáhlo
   celou three.js na kritickou cestu prvního vykreslení a zabilo by to celé
   líné načítání scény. Nepotřebujeme ho: Object3D.rotation UŽ JE Euler,
   a three si z něj kvaternion dopočítá sám. */
const MAX_Y = (10 * Math.PI) / 180
const MAX_X = (6 * Math.PI) / 180
const clamp = (lo: number, hi: number, v: number) => Math.max(lo, Math.min(hi, v))

/**
 * Jediná interaktivní 3D plocha na webu — a jen na sekci 00.
 *
 * Tažení přičítá ADITIVNÍ offset kvaternion NAD cíl ze scrollu, takže se
 * se zákonem dosednutí nikdy nepere. Puštění = pružina zpět.
 * Na dotyku je mrtvé (tam scroll patří prstu).
 */
export default function GrabPlate({ dragRef }: { dragRef: React.RefObject<Group | null> }) {
  const plate = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState(false)
  const used = useRef(false)
  const off = useRef({ x: 0, y: 0 })

  // Nápověda „TÁHNI" se ukáže po 2 s nečinnosti a po prvním použití se už nevrátí.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!used.current) setHint(true)
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = plate.current
    if (!el) return
    if (window.matchMedia('(hover: none)').matches) return

    let dragging = false
    let sx = 0
    let sy = 0
    let raf = 0

    const apply = () => {
      const g = dragRef.current
      if (!g) return
      g.rotation.set(off.current.y, off.current.x, 0)
    }

    const onDown = (ev: PointerEvent) => {
      dragging = true
      used.current = true
      setHint(false)
      sx = ev.clientX
      sy = ev.clientY
      el.setPointerCapture(ev.pointerId)
      if (raf) cancelAnimationFrame(raf)
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragging) return
      off.current.x = clamp(-MAX_Y, MAX_Y, (ev.clientX - sx) * 0.004)
      off.current.y = clamp(-MAX_X, MAX_X, (ev.clientY - sy) * 0.004)
      apply()
    }

    const onUp = (ev: PointerEvent) => {
      if (!dragging) return
      dragging = false
      el.releasePointerCapture(ev.pointerId)
      // Odskok zpět s dokmitem — bez GSAPu, jeden rAF.
      const fx = off.current.x
      const fy = off.current.y
      const t0 = performance.now()
      const spring = (now: number) => {
        const t = Math.min(1, (now - t0) / 900)
        const k = 1 - elasticOut(t)
        off.current.x = fx * k
        off.current.y = fy * k
        apply()
        if (t < 1) raf = requestAnimationFrame(spring)
        else raf = 0
      }
      raf = requestAnimationFrame(spring)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    // Refy si zkopíruj do lokálních proměnných — do doby, než cleanup poběží,
    // už můžou ukazovat jinam (a StrictMode ten cleanup spustí hned na první mount).
    const offset = off.current
    const group = dragRef.current
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      if (raf) cancelAnimationFrame(raf)
      offset.x = offset.y = 0
      group?.rotation.set(0, 0, 0) // narovnat krychli zpět
    }
  }, [dragRef])

  return (
    <>
      <div className="grab-plate" ref={plate} aria-hidden="true" />
      {/* Nápověda je SOUROZENEC plochy, ne její dítě — uvnitř by se tiskla přes text. */}
      <span className={`grab-hint${hint ? ' is-on' : ''}`} aria-hidden="true">
        [ táhni a otoč ]
      </span>
    </>
  )
}
