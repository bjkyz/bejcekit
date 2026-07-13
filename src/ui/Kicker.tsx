import { useEffect, useRef } from 'react'
import { scramble } from '../lib/scramble'
import { useFaceLand } from '../lib/hooks'

/**
 * Mono popisek s dekódováním při dosednutí stěny.
 * JEDINÉ užití scramblu na celém webu — dvakrát už by to byl trik, ne podpis.
 *
 * Animovaný span je aria-hidden a skutečný text visí na aria-label,
 * jinak by čtečka předčítala náhodný šum.
 */
export default function Kicker({ text, index, animate }: { text: string; index: number; animate: boolean }) {
  const el = useRef<HTMLSpanElement>(null)
  const stop = useRef<(() => void) | null>(null)

  useFaceLand((i) => {
    if (i !== index || !el.current || !animate) return
    stop.current?.()
    stop.current = scramble(el.current, text, 600)
  })

  useEffect(() => () => stop.current?.(), [])

  return (
    <span className="label kicker" aria-label={text}>
      <span ref={el} aria-hidden="true">
        {text}
      </span>
    </span>
  )
}
