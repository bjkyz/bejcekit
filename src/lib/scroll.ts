import Lenis from 'lenis'
import Snap from 'lenis/snap'
import { bus } from './bus'
import { FACE_COUNT } from '../content/sections'

/* ★ ŽÁDNÝ GSAP, ŽÁDNÝ ScrollTrigger.
   ScrollTrigger tu původně byl, ale nepoháněl ANI JEDNU animaci — všechny
   revealy dělá IntersectionObserver. Zbyl po něm jen `ScrollTrigger.update()`,
   který neměl co aktualizovat: ~15 kB gz mrtvé váhy na kritické cestě.
   A GSAP ticker se dá nahradit jedním rAF, který stejně potřebujeme. */

/**
 * ★ PLAIN MUTOVATELNÝ MODULOVÝ OBJEKT — schválně.
 * Čte ho useFrame 60×/s. Kdyby to byl React state, každý snímek scrollu
 * by překreslil celý strom. Tohle nikdy nespustí render.
 */
export const scrollState = {
  /** 0 → 5, spojitě. Interpoluje se přes REÁLNÉ výšky sekcí. */
  progress: 0,
  velocity: 0,
  /** Nejbližší celá stěna. */
  index: 0,
  transit: false,
}

let lenis: Lenis | null = null
let snap: Snap | null = null
let tops: number[] = []
let allFit = true
let rafId: number | null = null
let lastIndex = 0

/**
 * ★ Snap body i progres se počítají ze SKUTEČNÉHO section.offsetTop,
 * nikdy z i * innerHeight. Česky psaná sekce je zhruba o 15 % delší než
 * anglická; kdyby jedna přerostla 100svh, krychle by se od stránky
 * natrvalo rozešla.
 */
function measure(): void {
  const els = document.querySelectorAll<HTMLElement>('.section')
  tops = Array.from(els, (el) => el.offsetTop)
  // Vejde se KAŽDÁ sekce do jedné obrazovky?
  allFit = Array.from(els).every((el) => el.offsetHeight <= window.innerHeight + 2)
}

/**
 * ★ POVINNÝ SNAP SMÍ BÝT ZAPNUTÝ, JEN KDYŽ SE VŠECHNO VEJDE DO OKNA.
 *
 * Česky psaná sekce je asi o 15 % delší než anglická a na nízkém notebooku
 * (1280×720) přeroste 100svh. Kdyby na ni v tu chvíli sedl `mandatory` snap,
 * scroll by uživatele odtrhl zpět na začátek sekce pokaždé, když by se pokusil
 * dočíst spodek — text, který nikdy nepřečte. Proto se v takovém případě
 * automaticky přepne na `proximity`.
 *
 * Krychli to nevadí: ta jede podle SPOJITÉHO progresu z offsetTop, ne ze snapu.
 * Snap je leštidlo, ne nosná konstrukce — o to se stará zákon dosednutí v Cube.tsx.
 */
function snapType(): 'mandatory' | 'proximity' {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  return coarse || !allFit ? 'proximity' : 'mandatory'
}

function progressFromScroll(y: number): number {
  if (tops.length < 2) return 0
  for (let i = 0; i < tops.length - 1; i++) {
    if (y < tops[i + 1]) {
      const span = tops[i + 1] - tops[i]
      return span > 0 ? i + (y - tops[i]) / span : i
    }
  }
  return FACE_COUNT - 1
}

export function initScroll(reducedMotion: boolean): () => void {
  measure()

  // Při omezeném pohybu Lenis vůbec nespouštíme — nechá se nativní scroll.
  if (reducedMotion) {
    const onScroll = () => {
      scrollState.progress = progressFromScroll(window.scrollY)
      scrollState.velocity = 0
      scrollState.index = Math.round(scrollState.progress)
      emitLanding(scrollState.index)
    }
    const onResize = () => {
      measure()
      onScroll()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }

  lenis = new Lenis({
    autoRaf: false, // ★ jinak běží Lenis a GSAP na dvou rAF smyčkách a ScrollTrigger
    //   čte o 1–2 snímky starou pozici → viditelný jitter
    lerp: 0.075, // nižší = delší doběh, hedvábnější. Pod ~0.06 už to plave.
    wheelMultiplier: 0.85, // kolečko myši jinak „cuká" po velkých skocích
    syncTouch: true, // (smoothTouch byl přejmenován)
    syncTouchLerp: 0.09, // prst má mít okamžitou odezvu, ne gumu
    touchInertiaExponent: 1.6,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  })

  snap = buildSnap(lenis)

  lenis.on('scroll', (e: { scroll: number; velocity: number }) => {
    scrollState.progress = progressFromScroll(e.scroll)
    scrollState.velocity = e.velocity
    scrollState.index = Math.round(scrollState.progress)
    scrollState.transit = Math.abs(e.velocity) > 0.06
    emitLanding(scrollState.index)
  })

  const tick = (t: number) => {
    lenis?.raf(t)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  const onResize = () => {
    measure()
    if (!snap || !lenis) return
    snap.destroy()
    snap = buildSnap(lenis)
  }
  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    if (rafId !== null) cancelAnimationFrame(rafId)
    snap?.destroy()
    lenis?.destroy()
    snap = null
    lenis = null
    rafId = null
  }
}

function buildSnap(l: Lenis): Snap {
  const type = snapType()
  const s = new Snap(l, {
    type,
    distanceThreshold: '30%',
    // Delší a měkčí dojezd. Při 0.8 s a lineárním konci to „luplo" na místo;
    // expo-out dojede rychle a poslední kus jen doplyne.
    duration: type === 'mandatory' ? 1.05 : 0.85,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    debounce: 120, // ať snap nenaskočí uprostřed gesta
  })
  for (const t of tops) s.add(t)
  return s
}

function emitLanding(i: number): void {
  if (i === lastIndex) return
  bus.emit('face:leave', lastIndex)
  lastIndex = i
  bus.emit('face:land', i)
}

/** Kotvy z navigace a lišty. Funguje i bez Lenisu (omezený pohyb). */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.1 })
  else el.scrollIntoView({ behavior: 'auto', block: 'start' })
}

export function remeasure(): void {
  measure()
}
