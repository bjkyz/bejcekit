import { damp } from './spring'

/**
 * ═══════════ 3D NAKLÁPĚNÍ KARET PROJEKTŮ ═══════════
 *
 * Karta se pod kurzorem naklání v prostoru, vrstvy uvnitř se vůči sobě míjejí
 * a po skle přejíždí odlesk. Celé to jsou čtyři CSS proměnné, které tenhle
 * soubor počítá; veškeré vykreslení řeší styl (viz styles/projects.css).
 *
 *     --rx  náklon kolem vodorovné osy (stupně, + = horní hrana couvá)
 *     --ry  náklon kolem svislé osy    (stupně, + = pravá hrana couvá)
 *     --mx  vodorovná poloha odlesku   (procenta šířky karty)
 *     --my  svislá poloha odlesku      (procenta výšky karty)
 *     --lift 0 v klidu, 1 pod kurzorem (řídí hloubku vrstev a sílu záře)
 *
 * ★ JEDEN POSLUCHAČ NA MŘÍŽKU, NE NA KAŽDOU KARTU.
 *   Čtyři karty × (pointerenter, pointermove, pointerleave) je dvanáct
 *   posluchačů a čtyři nezávislé rAF smyčky, které si navzájem nevědí o tom,
 *   že běží. Tady je jeden `pointermove` na mřížce, `closest('.pcard')` si najde
 *   kartu pod kurzorem a jedna smyčka obsluhuje všechny.
 *
 * ★★ V rAF SMYČCE SE NIKDY NEČTE LAYOUT ANI NEALOKUJE.
 *   `getBoundingClientRect()` uvnitř smyčky, která zároveň zapisuje styly, si
 *   vynutí přepočet layoutu KAŽDÝ SNÍMEK (klasické layout thrashing). Rozměry
 *   karty se proto měří jen při vstupu kurzoru a zahazují se při scrollu
 *   a změně okna – tedy přesně tehdy, kdy se doopravdy změní.
 *
 * ★★★ ŽÁDNÝ POHYB, KTERÝ SI UŽIVATEL ZAKÁZAL, A ŽÁDNÝ NA DOTYKU.
 *   Na dotykovém displeji hover neexistuje: `pointermove` tam přijde až
 *   s klepnutím, takže by se karta naklonila přesně ve chvíli, kdy na ni člověk
 *   sahá, a zůstala tak. To není efekt, to je porucha. Obojí se řeší tím, že se
 *   motor vůbec nespustí – karta pak stojí rovně a je plně funkční, protože
 *   VŠECHNY proměnné mají výchozí hodnotu v CSS.
 */

/** Maximální náklon ve stupních.
 *
 *  ★ 5°, ne 15°. Patnáct stupňů je výchozí hodnota každé „tilt card" knihovny
 *  a je to zdaleka nejnápadnější stopa po komponentě staažené z internetu:
 *  karta se láme, text na ní se perspektivně rozjede a přestane se dát číst.
 *  Při pěti stupních se hloubka pozná (hrana se rozsvítí, vrstvy se rozejdou),
 *  ale text zůstane rovný. Efekt má sloužit obsahu, ne soupeřit s ním. */
const MAX_TILT = 5

/** Doba doběhu při sledování kurzoru. Nízká = karta jde s rukou skoro 1:1. */
const SMOOTH_IN = 0.09
/** Návrat do klidu je ZÁMĚRNĚ pomalejší než náběh: rychlý návrat vypadá jako
    odskočení, pomalý jako dojezd hmoty. Stejný trik jako u magnetu. */
const SMOOTH_OUT = 0.3

/** Pod touhle vzdáleností od cíle se pokládá za dorazené a smyčka se zastaví. */
const EPS = 0.0015

interface Card {
  el: HTMLElement
  /** Cíl. */
  trx: number
  try_: number
  tmx: number
  tmy: number
  tl: number
  /** Aktuální tlumená hodnota. */
  rx: number
  ry: number
  mx: number
  my: number
  lift: number
}

export function tilt(grid: HTMLElement): () => void {
  /* Na dotyku ani při zakázaném pohybu se motor nespouští – viz hlavička. */
  if (window.matchMedia('(hover: none)').matches) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const cards: Card[] = Array.from(grid.querySelectorAll<HTMLElement>('.pcard')).map((el) => ({
    el,
    trx: 0,
    try_: 0,
    tmx: 50,
    tmy: 50,
    tl: 0,
    rx: 0,
    ry: 0,
    mx: 50,
    my: 50,
    lift: 0,
  }))
  if (cards.length === 0) return () => {}

  /** Rozměry aktivní karty. Měří se při vstupu kurzoru, ne ve smyčce. */
  let rect: DOMRect | null = null
  let active: Card | null = null
  let raf = 0
  let last = 0

  const draw = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 15) : 1 / 60
    last = now

    let moving = false
    for (const c of cards) {
      /* Náběh a návrat mají jinou konstantu, takže se karta „nalepí" na kurzor
         rychle, ale pouští se pomalu. */
      const s = c === active ? SMOOTH_IN : SMOOTH_OUT
      c.rx = damp(c.rx, c.trx, s, dt)
      c.ry = damp(c.ry, c.try_, s, dt)
      c.mx = damp(c.mx, c.tmx, s, dt)
      c.my = damp(c.my, c.tmy, s, dt)
      c.lift = damp(c.lift, c.tl, s, dt)

      const done =
        Math.abs(c.rx - c.trx) < EPS &&
        Math.abs(c.ry - c.try_) < EPS &&
        Math.abs(c.lift - c.tl) < EPS &&
        Math.abs(c.mx - c.tmx) < 0.05 &&
        Math.abs(c.my - c.tmy) < 0.05

      if (done && c.lift < EPS) {
        /* ★ V KLIDU SE STYL ÚPLNĚ SUNDÁ, nezapíše se „--lift: 0".
           Trvalý transform drží kartu na vlastní compositor vrstvě a vypne jí
           subpixelové vyhlazování písma – text pak na Windows viditelně zšedne.
           Tentýž důvod, proč se v lib/scroll.ts v ohnisku maže `opacity`. */
        if (c.el.style.getPropertyValue('--lift') !== '') {
          c.el.style.cssText = ''
        }
        continue
      }

      moving = true
      const st = c.el.style
      st.setProperty('--rx', `${c.rx.toFixed(3)}deg`)
      st.setProperty('--ry', `${c.ry.toFixed(3)}deg`)
      st.setProperty('--mx', `${c.mx.toFixed(2)}%`)
      st.setProperty('--my', `${c.my.toFixed(2)}%`)
      st.setProperty('--lift', c.lift.toFixed(4))
    }

    if (moving) raf = requestAnimationFrame(draw)
    else {
      raf = 0
      last = 0
    }
  }

  const start = () => {
    if (!raf) raf = requestAnimationFrame(draw)
  }

  /** Kurzor opustil karty – všechno se vrací do klidu. */
  const release = () => {
    if (!active) return
    active.trx = 0
    active.try_ = 0
    active.tmx = 50
    active.tmy = 50
    active.tl = 0
    active = null
    rect = null
    start()
  }

  const onMove = (e: PointerEvent) => {
    /* ★ Jen skutečná myš. Pero i prst hlásí `pointermove` taky, ale u nich
       je „pod kurzorem" totéž co „právě se dotýkám" – naklápět kartu, na kterou
       někdo sahá, je matoucí. */
    if (e.pointerType !== 'mouse') return

    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.pcard')
    if (!el) {
      release()
      return
    }

    const card = cards.find((c) => c.el === el)
    if (!card) {
      release()
      return
    }

    if (card !== active) {
      /* Předchozí kartu poslat domů, novou změřit. Měření je tady schválně:
         je to jediné místo, kde se layout čte, a děje se jednou za vstup. */
      if (active) {
        active.trx = 0
        active.try_ = 0
        active.tmx = 50
        active.tmy = 50
        active.tl = 0
      }
      active = card
      rect = el.getBoundingClientRect()
    }
    if (!rect) rect = el.getBoundingClientRect()

    /* Poloha kurzoru v kartě, normalizovaná na -0.5 … +0.5 od středu. */
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const nx = Math.max(-0.5, Math.min(0.5, px - 0.5))
    const ny = Math.max(-0.5, Math.min(0.5, py - 0.5))

    /* Znaménka: kurzor VPRAVO → pravá hrana couvá dozadu → kladné --ry.
       Kurzor DOLE → spodní hrana couvá → záporné --rx. Karta se tedy naklání
       SMĚREM KE kurzoru, jako by ji člověk k sobě přitáhl za nejbližší roh.
       Opačná volba (naklánět od kurzoru) vypadá, jako by se karta bránila. */
    card.trx = -ny * 2 * MAX_TILT
    card.try_ = nx * 2 * MAX_TILT
    card.tmx = px * 100
    card.tmy = py * 100
    card.tl = 1
    start()
  }

  /** Karta se při scrollu posune, takže naměřený rám přestane platit. */
  const invalidate = () => {
    rect = null
  }

  grid.addEventListener('pointermove', onMove)
  grid.addEventListener('pointerleave', release)
  window.addEventListener('scroll', invalidate, { passive: true })
  window.addEventListener('resize', invalidate)

  return () => {
    grid.removeEventListener('pointermove', onMove)
    grid.removeEventListener('pointerleave', release)
    window.removeEventListener('scroll', invalidate)
    window.removeEventListener('resize', invalidate)
    if (raf) cancelAnimationFrame(raf)
    for (const c of cards) c.el.style.cssText = ''
  }
}
