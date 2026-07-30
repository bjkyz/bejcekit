export type Tier = 'off' | 'low' | 'mid' | 'high'

/**
 * Synchronní odhad výkonu — běží ještě před mountem, nulová cena, nula requestů.
 *
 * Vědomě NEPOUŽÍVÁME @pmndrs/detect-gpu: tahá si benchmark JSON z CDN, a self-hostovat
 * kvůli tomu stovky souborů se nevyplatí. Runtime governor ve scéně (Scene.tsx)
 * stejně zachytí i teplotní throttling a všechno, co tahle heuristika mine.
 *
 * ★ TŘI VRSTVY OBRANY, každá chytá jinou třídu strojů:
 *
 *   1. failIfMajorPerformanceCaveat — Chrome na starém PC s blocklistovanou grafikou
 *      TIŠE spadne na SwiftShader: WebGL2 „funguje", ale kreslí ho CPU při ~5 fps.
 *      Obyčejný probe projde a web pak umírá. S tímhle flagem vrátí kontext null
 *      a my víme, že 3D nemá cenu vůbec zapínat. (Safari flag ignoruje — neškodí,
 *      softwarový fallback stejně nemá.)
 *
 *   2. RENDERER STRING — počet jader CPU o grafice neříká NIC. Starý i7 (8 vláken)
 *      s Intel HD 4000 dřív prošel jako 'high' a dostal refrakční sklo se dvěma
 *      průchody — přesně ten stroj, na kterém „to nebylo dobré". Integrovaná
 *      Intel se pozná ze jména a dostane patro, které utáhne.
 *
 *   3. PAMĚŤ NA VÝSLEDEK — když governor za běhu zjistí, že stroj nestíhá,
 *      zapamatuje si strop (localStorage, 7 dní). Příští návštěva začne rovnou
 *      na kvalitě, která šla — žádné 3 vteřiny trhání, než se to samo sesune.
 */

const ORDER: Tier[] = ['off', 'low', 'mid', 'high']

const CAP_KEY = 'bjk:tier-cap'
const OFF_KEY = 'bjk:no-3d'
/** Po týdnu se strop zahodí — uživatel mohl vyměnit stroj nebo ovladače. */
const CAP_TTL = 7 * 24 * 3600 * 1000

function storedCap(): Tier | null {
  try {
    // Session klíč = governor to za běhu úplně vzdal. Platí jen pro tuhle návštěvu:
    // mohl to být jednorázový stav (battery saver, přehřátí), napořád to nezamykáme.
    if (sessionStorage.getItem(OFF_KEY)) return 'off'
    const raw = localStorage.getItem(CAP_KEY)
    if (!raw) return null
    const { v, t } = JSON.parse(raw) as { v?: Tier; t?: number }
    if (typeof t !== 'number' || Date.now() - t > CAP_TTL) return null
    return v === 'low' || v === 'mid' ? v : null
  } catch {
    return null
  }
}

/** Governor si sem ukládá, kam až musel sestoupit. 'off' jen na session. */
export function persistTierCap(v: Tier): void {
  try {
    if (v === 'off') sessionStorage.setItem(OFF_KEY, '1')
    else localStorage.setItem(CAP_KEY, JSON.stringify({ v, t: Date.now() }))
  } catch {
    /* private mode — jen se to nezapamatuje */
  }
}

/**
 * Hardwarová část se CACHUJE: volá ji main.tsx (kvůli jevišti) i App a každé
 * volání by jinak vytvářelo nový WebGL kontext. Reduced-motion je záměrně MIMO
 * cache — uživatel si ho přepíná za běhu a odpověď se musí umět změnit.
 */
let probed: Tier | null = null

function probe(): Tier {
  // Zapnutý Save-Data / 2G: uživatel řekl „šetři data" — a scéna je 850 kB dekorace.
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection
  if (conn?.saveData === true) return 'off'
  if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return 'off'

  let renderer = ''
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return 'off'
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    renderer = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'off'
  }

  // Pojistka pro prohlížeče, které caveat flag neznají, ale jméno prozradí.
  if (/swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer)) return 'off'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4

  // ⚠ deviceMemory je JEN CHROMIUM a v Safari/Firefoxu je undefined.
  // Naivní `deviceMemory <= 4` je pro undefined false → každý iPhone by
  // tiše prošel jako high-end. Proto explicitní guard.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const lowMem = mem !== undefined && mem <= 4

  if (!coarse) {
    /* Desktopové integrované Intel GPU, podle generace. \b před „HD" schválně:
       do „UHD Graphics" se netrefí (U–H je uvnitř slova), takže se obě řady
       rozliší i v ANGLE stringu typu „ANGLE (Intel, Intel(R) UHD Graphics 630…)". */
    if (/\bHD Graphics\b/i.test(renderer)) return 'low' // ~2012–2017, sklo by je položilo
    if (/\bUHD Graphics\b|\bIris\b/i.test(renderer)) return 'mid'
  }

  if (coarse) return lowMem || cores <= 4 ? 'low' : 'mid'
  if (cores <= 4 || lowMem) return 'mid'
  return 'high'
}

export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'mid'

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'off'

  if (probed === null) probed = probe()

  const cap = storedCap()
  if (cap !== null) return ORDER[Math.min(ORDER.indexOf(probed), ORDER.indexOf(cap))]
  return probed
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
