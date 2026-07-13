import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Euler, Group, Quaternion } from 'three'

const MAX_Y = (10 * Math.PI) / 180
const MAX_X = (6 * Math.PI) / 180
const e = new Euler()
const IDENTITY = new Quaternion()

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

    const apply = () => {
      const g = dragRef.current
      if (!g) return
      e.set(off.current.y, off.current.x, 0)
      g.quaternion.setFromEuler(e)
    }

    const onDown = (ev: PointerEvent) => {
      dragging = true
      used.current = true
      setHint(false)
      sx = ev.clientX
      sy = ev.clientY
      el.setPointerCapture(ev.pointerId)
      gsap.killTweensOf(off.current)
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragging) return
      off.current.x = gsap.utils.clamp(-MAX_Y, MAX_Y, (ev.clientX - sx) * 0.004)
      off.current.y = gsap.utils.clamp(-MAX_X, MAX_X, (ev.clientY - sy) * 0.004)
      apply()
    }

    const onUp = (ev: PointerEvent) => {
      if (!dragging) return
      dragging = false
      el.releasePointerCapture(ev.pointerId)
      gsap.to(off.current, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: 'elastic.out(1, 0.3)',
        onUpdate: apply,
      })
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
      gsap.killTweensOf(offset)
      group?.quaternion.copy(IDENTITY) // narovnat krychli zpět
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
