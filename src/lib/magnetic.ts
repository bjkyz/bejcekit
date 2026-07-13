import { damp, elasticOut } from './spring'

/**
 * Magnetické tlačítko. Síla 0.28, MAXIMÁLNÍ POSUN 14 px — nad ~16 px se tlačítko
 * začne HŮŘ trefovat, protože utíká kurzoru. Návrat pružinou.
 *
 * Bez GSAPu: jedna rAF smyčka, která běží jen když je kurzor na tlačítku.
 */
const MAX = 14
const STRENGTH = 0.28
const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v))

export function magnetic(wrap: HTMLElement): () => void {
  // Na dotyku magnet nedává smysl (a hover tam neexistuje).
  if (window.matchMedia('(hover: none)').matches) return () => {}

  const target = (wrap.firstElementChild as HTMLElement) ?? wrap
  let tx = 0
  let ty = 0
  let cx = 0
  let cy = 0
  let raf = 0
  let last = 0
  let releasing = false

  const draw = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 15) : 1 / 60
    last = now
    cx = damp(cx, tx, 0.14, dt)
    cy = damp(cy, ty, 0.14, dt)
    target.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
    // Doběhne a smyčku sám zastaví — žádný rAF na pozadí navždy.
    if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) raf = requestAnimationFrame(draw)
    else {
      raf = 0
      last = 0
      if (releasing) target.style.transform = ''
    }
  }

  const start = () => {
    if (!raf) raf = requestAnimationFrame(draw)
  }

  const onMove = (e: PointerEvent) => {
    releasing = false
    const r = wrap.getBoundingClientRect()
    tx = clamp((e.clientX - (r.left + r.width / 2)) * STRENGTH)
    ty = clamp((e.clientY - (r.top + r.height / 2)) * STRENGTH)
    start()
  }

  const onLeave = () => {
    releasing = true
    // Odskok s dokmitem — ne jen tlumený návrat, to působí mrtvě.
    const fromX = cx
    const fromY = cy
    const t0 = performance.now()
    if (raf) cancelAnimationFrame(raf)
    const spring = (now: number) => {
      const t = Math.min(1, (now - t0) / 900)
      const k = 1 - elasticOut(t)
      cx = fromX * k
      cy = fromY * k
      target.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      if (t < 1) raf = requestAnimationFrame(spring)
      else {
        target.style.transform = ''
        raf = 0
        cx = cy = tx = ty = 0
      }
    }
    raf = requestAnimationFrame(spring)
  }

  wrap.addEventListener('pointermove', onMove)
  wrap.addEventListener('pointerleave', onLeave)
  return () => {
    wrap.removeEventListener('pointermove', onMove)
    wrap.removeEventListener('pointerleave', onLeave)
    if (raf) cancelAnimationFrame(raf)
    target.style.transform = ''
  }
}
