import { useEffect, useRef } from 'react'
import { scramble } from '../lib/scramble'
import { useFaceLand } from '../lib/hooks'

/**
 * Mono popisek s dekódováním při dosednutí stěny.
 * JEDINÉ užití scramblu na celém webu — dvakrát by to byl trik, ne podpis.
 *
 * ★ PŘÍSTUPNOST: `aria-label` na holém <span> je ZAKÁZANÝ atribut (span nemá roli,
 *   na kterou by se dal pověsit) — Lighthouse to hlásí jako chybu. Správně:
 *   skutečný text je ve vizuálně skryté kopii pro čtečku, animovaná kopie je
 *   aria-hidden. Čtečka tak nikdy nepřečte náhodný šum ze scramblu.
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
    <span className="label kicker">
      <span className="sr-only">{text}</span>
      <span ref={el} aria-hidden="true">
        {text}
      </span>
    </span>
  )
}
