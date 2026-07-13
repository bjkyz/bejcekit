import { useEffect, useRef } from 'react'
import { magnetic } from '../lib/magnetic'
import { scrollToSection } from '../lib/scroll'

/**
 * Magnetické CTA. Přesně tři užití na webu — hero, CTA sekce, velký e-mail.
 * Vnější obal je jen zvětšená zásahová plocha (20px), aby magnet chytal dřív,
 * než kurzor dojede na vizuální hranu.
 */
export default function MagneticCTA({
  href,
  label,
  variant = 'line',
  enabled = true,
}: {
  href: string
  label: string
  variant?: 'line' | 'solid' | 'ghost'
  enabled?: boolean
}) {
  const wrap = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!wrap.current || !enabled) return
    return magnetic(wrap.current)
  }, [enabled])

  const isAnchor = href.startsWith('#')

  const cls = `btn${variant === 'solid' ? ' btn--solid' : variant === 'ghost' ? ' btn--ghost' : ''}`

  return (
    <span className="magnetic" ref={wrap}>
      <a
        className={cls}
        href={href}
        onClick={
          isAnchor
            ? (e) => {
                e.preventDefault()
                scrollToSection(href.slice(1))
              }
            : undefined
        }
      >
        {label}
        <span aria-hidden="true">→</span>
      </a>
    </span>
  )
}
