import { useEffect, useRef, useState } from 'react'
import { t } from '../lib/lang'
import type { Group } from 'three'

/* ★ ŽÁDNÝ hodnotový import z 'three'. GrabPlate visí na hero sekci, tedy
   v hlavním bundlu — jediné `import { Euler } from 'three'` by sem přitáhlo
   celou three.js na kritickou cestu prvního vykreslení a zabilo by to celé
   líné načítání scény. Nepotřebujeme ho: Object3D.rotation UŽ JE Euler,
   a three si z něj kvaternion dopočítá sám. */

/** Meze náklonu. Nejsou to zdi, ale asymptoty — viz `soften`. */
const MAX_Y = (11 * Math.PI) / 180
const MAX_X = (7 * Math.PI) / 180

/** Kolik radiánů na pixel tažení. */
const SENS = 0.0045

/**
 * ★★ MĚKKÝ DORAZ MÍSTO TVRDÉHO. `clamp` je nespojitý v derivaci: do meze se
 * krychle otáčí za prstem a od meze stojí, takže to v ruce působí, jako by
 * se rozbil vstup. `tanh` se k mezi jen BLÍŽÍ — čím dál je prst, tím menší
 * přírůstek. Stejný princip jako přetažení seznamu na telefonu: hranice je
 * cítit, ale nikde není náraz.
 */
const soften = (v: number, max: number): number => max * Math.tanh(v / max)

/** Tuhost a tlumení pružiny při puštění. Lehce poddotlumené: jeden dokmit. */
const K = 120
const DAMP = 13

/** Dokud se nedosáhne téhle meze v obou osách, pružina běží. */
const REST = 0.0004

const SEEN_KEY = 'bjk:grab-seen'

/**
 * ═══════════ ÚCHOP KRYCHLE ═══════════
 *
 * Jediná interaktivní 3D plocha na webu, a jen na sekci 00. Tažení přičítá
 * ADITIVNÍ náklon NAD cíl ze scrollu, takže se se zákonem dosednutí nikdy
 * nepere (choreografie kamery o téhle rotaci vůbec neví).
 *
 * ★★ CO SE TU ZMĚNILO PROTI PRVNÍ VERZI A PROČ:
 *
 * 1) MĚKKÝ DORAZ. `clamp` dělal ze meze zeď — viz `soften` výš.
 *
 * 2) PUŠTĚNÍ JE PRUŽINA S RYCHLOSTÍ, NE PŘEHRÁVANÁ KŘIVKA. Dřív se po puštění
 *    spustila pevná 900ms animace zpět. Ať se pustilo v klidu nebo švihem,
 *    návrat vypadal stejně — a to je přesně ten detail, po kterém interakce
 *    působí jako video místo jako věc. Teď se do pružiny předá RYCHLOST prstu,
 *    takže švihnutí krychli přehodí přes nulu a nechá ji dokmitnout.
 *
 * 3) FUNGUJE I NA DOTYKU. Dřív byl úchop na telefonu úplně vypnutý, aby
 *    nekradl scroll. Jenže na telefonu je krychle to první, na co člověk sáhne.
 *    Řeší to `touch-action: pan-y` v CSS: SVISLÉ tahy si nechá prohlížeč
 *    (stránka roluje nativně), VODOROVNÉ dostaneme my. Nikde se nevolá
 *    `preventDefault`, takže se scroll nemá jak zaseknout.
 *
 * 4) NÁPOVĚDA UKAZUJE, NEŘÍKÁ. Po chvíli nečinnosti krychle sama jednou lehce
 *    kývne. Slovní pokyn si člověk musí přečíst a uvěřit mu; pohyb pochopí
 *    okamžitě. Text zůstává jako doplněk pro toho, kdo se dívá jinam.
 */
export default function GrabPlate({ dragRef }: { dragRef: React.RefObject<Group | null> }) {
  const plate = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState(false)
  /* ★ Popisek je STAV s výchozí desktopovou variantou, ne výpočet z matchMedia
     při renderu. Server ani neví, čím na web někdo sáhne — a jiný text
     v serverovém a prvním klientském renderu by shodil hydrataci. */
  const [label, setLabel] = useState(t({ cs: 'táhni a otoč', en: 'drag to turn' }))
  const off = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = plate.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(any-pointer: coarse)').matches
    if (coarse) setLabel(t({ cs: 'přejeď do stran', en: 'swipe sideways' }))

    let seen = false
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      /* Soukromý režim: nápověda se ukáže znovu. Nic vážného. */
    }

    /* ── STAV POHYBU ────────────────────────────────────────── */
    let dragging = false
    let axis: 'none' | 'x' | 'scroll' = 'none'
    let sx = 0
    let sy = 0
    let lastX = 0
    let lastT = 0
    /** Rychlost prstu v radiánech za sekundu, vyhlazená. */
    const vel = { x: 0, y: 0 }
    let raf = 0
    let animating = false

    const apply = () => {
      const g = dragRef.current
      if (g) g.rotation.set(off.current.y, off.current.x, 0)
    }

    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      animating = false
    }

    /**
     * Pružina k nule s počáteční rychlostí. Integruje se semi-implicitním
     * Eulerem — na tuhle tuhost a při dt ≤ 1/30 s je stabilní a je to pět řádků
     * místo knihovny.
     *
     * ★ dt SE KLAMPUJE. Po návratu karty z pozadí přijde první snímek s dt
     *   klidně několik vteřin; bez stropu by integrace v jednom kroku vystřelila
     *   krychli mimo obraz.
     */
    const spring = () => {
      animating = true
      let prev = performance.now()
      const step = (now: number) => {
        const dt = Math.min(1 / 30, (now - prev) / 1000)
        prev = now
        for (const k of ['x', 'y'] as const) {
          const a = -K * off.current[k] - DAMP * vel[k]
          vel[k] += a * dt
          off.current[k] += vel[k] * dt
        }
        apply()
        if (Math.abs(off.current.x) + Math.abs(off.current.y) + Math.abs(vel.x) + Math.abs(vel.y) > REST) {
          raf = requestAnimationFrame(step)
        } else {
          off.current.x = off.current.y = 0
          vel.x = vel.y = 0
          apply()
          stop()
        }
      }
      raf = requestAnimationFrame(step)
    }

    /* ── NÁPOVĚDA ───────────────────────────────────────────── */
    let hintTimer = 0
    const markUsed = () => {
      seen = true
      setHint(false)
      clearTimeout(hintTimer)
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* viz výš */
      }
    }

    if (!seen) {
      hintTimer = window.setTimeout(() => {
        if (seen) return
        setHint(true)
        /* Ukázka místo pokynu: jedno kývnutí tam a zpět. Když je zakázaný
           pohyb, zůstane jen text — a to je správně, protože o pohyb tu
           uživatel výslovně nestojí. */
        if (!reduced && !animating) {
          vel.x = 0.85
          spring()
        }
      }, 2600)
    }

    /* ── TAŽENÍ ─────────────────────────────────────────────── */
    const onDown = (ev: PointerEvent) => {
      /* Jen hlavní tlačítko. Pravý klik nebo prostřední myš nemá otáčet. */
      if (ev.button !== 0) return
      dragging = true
      axis = ev.pointerType === 'touch' ? 'none' : 'x'
      markUsed()
      sx = lastX = ev.clientX
      sy = ev.clientY
      lastT = performance.now()
      vel.x = vel.y = 0
      stop()
      el.setPointerCapture(ev.pointerId)
    }

    const onMove = (ev: PointerEvent) => {
      if (!dragging) return
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy

      /* ★ ZÁMEK OSY NA DOTYKU. Do 8 px se nerozhoduje nic; pak se podle
         převažujícího směru buď otáčí, nebo se gesto pustí stránce. Bez toho
         by každé šoupnutí prstem po krychli lehce trhlo obsahem. */
      if (axis === 'none') {
        if (Math.abs(dx) + Math.abs(dy) < 8) return
        axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'scroll'
        if (axis === 'scroll') {
          dragging = false
          el.releasePointerCapture(ev.pointerId)
          spring()
          return
        }
      }

      const now = performance.now()
      const dt = Math.max(8, now - lastT) / 1000
      /* Vyhlazení rychlosti: jeden odlehlý snímek jinak dá po puštění švih,
         který uživatel neudělal. */
      vel.x = vel.x * 0.6 + ((ev.clientX - lastX) * SENS) / dt / 2.5
      lastX = ev.clientX
      lastT = now

      off.current.x = soften(dx * SENS, MAX_Y)
      /* Na dotyku se svislá osa neotáčí vůbec — ta patří scrollu. */
      off.current.y = ev.pointerType === 'touch' ? 0 : soften(dy * SENS, MAX_X)
      apply()
    }

    const onUp = (ev: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId)
      spring()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    /* Scroll znamená, že se člověk vydal jinam: nápověda přestává být užitečná
       a začíná být otravná. `once` — víc než jednou to řešit netřeba. */
    window.addEventListener('scroll', markUsed, { once: true, passive: true })

    // Refy si zkopíruj do lokálních proměnných — do doby, než cleanup poběží,
    // už můžou ukazovat jinam (a StrictMode ten cleanup spustí hned na první mount).
    const offset = off.current
    const group = dragRef.current
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      window.removeEventListener('scroll', markUsed)
      clearTimeout(hintTimer)
      stop()
      offset.x = offset.y = 0
      group?.rotation.set(0, 0, 0) // narovnat krychli zpět
    }
  }, [dragRef])

  return (
    <>
      <div className="grab-plate" ref={plate} aria-hidden="true" />
      {/* Nápověda je SOUROZENEC plochy, ne její dítě — uvnitř by se tiskla přes text. */}
      <span className={`grab-hint${hint ? ' is-on' : ''}`} aria-hidden="true">
        <span className="grab-hint__dot" />
        {label}
      </span>
    </>
  )
}
