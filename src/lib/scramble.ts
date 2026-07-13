/**
 * Dekódovací efekt na kickeru. JEDINÉ užití scramblu na celém webu.
 *
 * Zásobník znaků je ZÁMĚRNĚ jen ASCII — diakritika v šumu vypadá jako mojibake.
 * Volající MUSÍ dát animovanému spanu aria-hidden a skutečný český řetězec
 * do aria-label, jinak čtečka předčítá nesmysly.
 */
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/[]·—'

export function scramble(el: HTMLElement, text: string, duration = 600): () => void {
  const chars = [...text]
  const start = performance.now()
  let raf = 0

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    // Odemyká se zleva doprava; každý znak má svůj práh.
    const settled = t * chars.length
    el.textContent = chars
      .map((c, i) => {
        if (c === ' ') return ' '
        if (i < settled) return c
        return POOL[(Math.random() * POOL.length) | 0]
      })
      .join('')
    if (t < 1) raf = requestAnimationFrame(tick)
    else el.textContent = text
  }

  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}
