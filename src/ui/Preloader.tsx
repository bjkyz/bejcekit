import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import gsap from 'gsap'
import { sceneState } from '../lib/scene-state'
import { lockScroll, remeasure, unlockScroll } from '../lib/scroll'

/**
 * PRAVDOMLUVNÝ PRELOADER. useProgress() vrací SKUTEČNÉ bajty — žádný falešný
 * časovač, žádné počítadlo, co se zasekne na 99 %.
 *
 * Odchod je OPONA (clip-path), ne prolnutí. Hero text naskakuje během POSLEDNÍCH
 * 350 ms opony — překryv se čte jako drahý, sekvence jako pomalý.
 */
export default function Preloader({ onDone, reduced }: { onDone: () => void; reduced: boolean }) {
  const { active, progress } = useProgress()
  const root = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    lockScroll()
  }, [])

  useEffect(() => {
    if (fill.current) gsap.to(fill.current, { scaleX: progress / 100, duration: 0.4, ease: 'power2.out' })
    if (num.current) num.current.textContent = String(Math.round(progress)).padStart(3, '0')
  }, [progress])

  useEffect(() => {
    // Brána: hotovo je až když loader nic nedělá A je na 100 %.
    if (fired.current || active || progress < 100) return
    fired.current = true

    // Sekce se mohly rozrůst po doběhnutí fontů → přeměř snap body.
    remeasure()

    const finish = () => {
      setGone(true)
      unlockScroll()
      onDone()
    }

    if (reduced) {
      sceneState.boost = 0
      finish()
      return
    }

    const tl = gsap.timeline({ onComplete: finish })
    tl.to(root.current, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.1,
      ease: 'expo.inOut',
    })
    // ZÁŽEH — až teď, když je GLB doparsované a mesh existuje.
    tl.add(() => {
      sceneState.boost = 6
    }, '-=0.85')
    // Hero text naskočí ještě POD zvedající se oponou.
    tl.fromTo(
      '#ident .reveal',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: { amount: 0.35 } },
      '-=0.35',
    )
    return () => {
      tl.kill()
    }
  }, [active, progress, reduced, onDone])

  if (gone) return null

  return (
    <div className="preloader" ref={root} role="status" aria-live="polite">
      <div className="preloader__inner">
        <div className="preloader__num" ref={num}>
          000
        </div>
        <div className="preloader__bar">
          <div className="preloader__fill" ref={fill} />
        </div>
        <div className="preloader__label">Spouštím jednotku 06</div>
      </div>
    </div>
  )
}
