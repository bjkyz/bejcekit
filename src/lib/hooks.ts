import { useEffect, useRef, useState } from 'react'
import { bus } from './bus'

/** Uživatelé si volbu přepínají za běhu — posloucháme `change`, ne jen počáteční stav. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Reveal při vstupu do viewportu. threshold 0.15, `unobserve()` po prvním zásahu
 * → spustí se PRÁVĚ JEDNOU a nikdy se nepřehraje znovu při scrollu nahoru.
 */
export function useReveal<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled) {
      el.querySelectorAll('.reveal').forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      { threshold: 0.15 },
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [enabled])
  return ref
}

/**
 * Aktivní sekce. rootMargin '-50% 0px -50% 0px' se spustí PŘESNĚ na půlce
 * viewportu — narozdíl od threshold detekce nikdy nefiruje dvakrát.
 */
export function useActiveSection(): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.section')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number((e.target as HTMLElement).dataset.index ?? 0)
          setActive(i)
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

/**
 * Stojí scroll? Po `ms` bez pohybu vrátí true, na první pohyb zase false.
 * Používá to lišta sekcí, aby na telefonu při čtení ustoupila z textu (hud.css).
 *
 * ★ STAV SE MĚNÍ JEN NA PŘEKLOPENÍ, NE PŘI KAŽDÉM SNÍMKU SCROLLU.
 * Naivní `setIdle(false)` v posluchači by při rolování překreslil celý HUD
 * šedesátkrát za vteřinu. Skutečná hodnota proto žije v refu a setState se
 * zavolá jen tehdy, když se opravdu překlopí — tedy dvakrát za gesto.
 *
 * Posluchač visí na NATIVNÍM scrollu schválně: Lenis běží nad oknem (ne ve
 * vlastním obalu) a v jednoduchém režimu neběží vůbec, takže tohle je jediné
 * místo, které platí ve všech větvích.
 */
export function useScrollIdle(ms = 1200): boolean {
  const [idle, setIdle] = useState(false)
  const idleRef = useRef(false)
  useEffect(() => {
    let timer = 0
    const rest = () => {
      idleRef.current = true
      setIdle(true)
    }
    const onScroll = () => {
      if (idleRef.current) {
        idleRef.current = false
        setIdle(false)
      }
      clearTimeout(timer)
      timer = window.setTimeout(rest, ms)
    }
    timer = window.setTimeout(rest, ms)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [ms])
  return idle
}

/** Přihlášení k dosednutí krychle na stěnu (kvůli scramblu a pulsu). */
export function useFaceLand(fn: (i: number) => void): void {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => bus.on('face:land', (i) => saved.current(i)), [])
}
