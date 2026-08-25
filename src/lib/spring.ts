/**
 * Náhrada GSAPu pro pružinu úchopu a časovou osu preloaderu. Původní knihovna
 * stála ~30 kB gz na kritické cestě kvůli několika drobným animacím.
 * Tady je totéž na pár řádcích a nula bajtů závislostí.
 */

/** Kritické tlumení, framerate-nezávislé. Stejná matematika jako maath/easing. */
export function damp(current: number, target: number, smoothTime: number, dt: number): number {
  const omega = 2 / smoothTime
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  return target + (current - target) * exp
}

/** Pružina s dokmitem (nahrazuje gsap `elastic.out(1, 0.3)`). t: 0→1 */
export function elasticOut(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
export const easeInOutExpo = (t: number) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2

/**
 * Přehraje animaci od 0 do 1 po zadanou dobu. Vrací funkci pro zrušení.
 * (rAF + performance.now — nic víc na to není potřeba.)
 */
export function tween(durationMs: number, ease: (t: number) => number, onUpdate: (v: number) => void, onDone?: () => void) {
  const start = performance.now()
  let raf = 0
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs)
    onUpdate(ease(t))
    if (t < 1) raf = requestAnimationFrame(step)
    else onDone?.()
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}
