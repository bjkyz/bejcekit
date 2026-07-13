import Lenis from 'lenis'
import Snap from 'lenis/snap'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bus } from './bus'
import { FACE_COUNT } from '../content/sections'

gsap.registerPlugin(ScrollTrigger)

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
let rafId: ((t: number) => void) | null = null
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
    lerp: 0.09, //   čte o 1–2 snímky starou pozici → viditelný jitter
    syncTouch: true, // (smoothTouch byl přejmenován)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  })

  snap = buildSnap(lenis)

  lenis.on('scroll', (e: { scroll: number; velocity: number }) => {
    scrollState.progress = progressFromScroll(e.scroll)
    scrollState.velocity = e.velocity
    scrollState.index = Math.round(scrollState.progress)
    scrollState.transit = Math.abs(e.velocity) > 0.06
    emitLanding(scrollState.index)
    ScrollTrigger.update()
  })

  rafId = (t: number) => lenis?.raf(t * 1000)
  gsap.ticker.add(rafId)
  gsap.ticker.lagSmoothing(0)

  const onResize = () => {
    measure()
    if (!snap || !lenis) return
    snap.destroy()
    snap = buildSnap(lenis)
  }
  window.addEventListener('resize', onResize)

  return () => {
    window.removeEventListener('resize', onResize)
    if (rafId) gsap.ticker.remove(rafId)
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
    duration: type === 'mandatory' ? 0.8 : 0.7,
    debounce: 0,
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

/** Preloader drží scroll, dokud se scéna nenačte. */
export function lockScroll(): void {
  lenis?.stop()
  document.body.classList.add('is-loading')
}
export function unlockScroll(): void {
  lenis?.start()
  document.body.classList.remove('is-loading')
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
