export type Tier = 'off' | 'low' | 'mid' | 'high'

/**
 * Synchronní odhad výkonu — běží ještě před mountem, nulová cena, nula requestů.
 *
 * Vědomě NEPOUŽÍVÁME @pmndrs/detect-gpu: tahá si benchmark JSON z CDN, a self-hostovat
 * kvůli tomu stovky souborů se nevyplatí. Runtime <PerformanceMonitor> ve scéně
 * stejně zachytí i teplotní throttling a všechno, co tahle heuristika mine.
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'mid'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off'

  // WebGL2 probe — bez něj nemá smysl nic z toho stavět.
  try {
    const c = document.createElement('canvas')
    if (!c.getContext('webgl2')) return 'off'
  } catch {
    return 'off'
  }

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4

  // ⚠ deviceMemory je JEN CHROMIUM a v Safari/Firefoxu je undefined.
  // Naivní `deviceMemory <= 4` je pro undefined false → každý iPhone by
  // tiše prošel jako high-end. Proto explicitní guard.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowMem = mem !== undefined && mem <= 4

  if (coarse) return lowMem || cores <= 4 ? 'low' : 'mid'
  if (cores <= 4 || lowMem) return 'mid'
  return 'high'
}

/** Strop DPR. Telefon s DPR 3 kreslí 9× víc pixelů než DPR 1. */
export function dprFor(tier: Tier): [number, number] {
  switch (tier) {
    case 'high':
      return [1, 2]
    case 'mid':
      return [1, 1.5]
    default:
      return [1, 1.25]
  }
}
