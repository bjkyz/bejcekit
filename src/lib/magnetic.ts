import gsap from 'gsap'

/**
 * Magnetické tlačítko. Síla 0.28, MAXIMÁLNÍ POSUN 14 px — nad ~16 px se
 * tlačítko začne HŮŘ trefovat, protože utíká kurzoru. Návrat pružinou.
 *
 * Použito přesně 3× na webu (hero CTA, CTA sekce, velký e-mail).
 */
const MAX = 14
const STRENGTH = 0.28

const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v))

export function magnetic(wrap: HTMLElement): () => void {
  // Na dotykových zařízeních nemá magnet smysl (a hover neexistuje).
  if (window.matchMedia('(hover: none)').matches) return () => {}

  const target = (wrap.firstElementChild as HTMLElement) ?? wrap

  const onMove = (e: PointerEvent) => {
    const r = wrap.getBoundingClientRect()
    const mx = e.clientX - (r.left + r.width / 2)
    const my = e.clientY - (r.top + r.height / 2)
    gsap.to(target, {
      x: clamp(mx * STRENGTH),
      y: clamp(my * STRENGTH),
      duration: 0.6,
      ease: 'power3.out',
    })
  }

  const onLeave = () => {
    gsap.to(target, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.3)' })
  }

  wrap.addEventListener('pointermove', onMove)
  wrap.addEventListener('pointerleave', onLeave)
  return () => {
    wrap.removeEventListener('pointermove', onMove)
    wrap.removeEventListener('pointerleave', onLeave)
    gsap.killTweensOf(target)
  }
}
