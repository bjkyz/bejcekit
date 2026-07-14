import { useEffect, useRef } from 'react'
import { magnetic } from '../lib/magnetic'
import { scrollToSection } from '../lib/scroll'
import Icon, { type IconName } from './Icons'

/**
 * Magnetické CTA. Vnější obal je jen zvětšená zásahová plocha (20px),
 * aby magnet chytal dřív, než kurzor dojede na vizuální hranu.
 *
 * Varianty nesou VÝZNAM, ne náladu:
 *   solid = hlavní akce (existuje jen na kontaktu)
 *   green = stav/dostupnost (WhatsApp)
 *   ghost = vedlejší akce
 */
export default function MagneticCTA({
  href,
  label,
  variant = 'line',
  icon,
  enabled = true,
}: {
  href: string
  label: string
  variant?: 'line' | 'solid' | 'ghost' | 'green'
  icon?: IconName
  enabled?: boolean
}) {
  const wrap = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!wrap.current || !enabled) return
    return magnetic(wrap.current)
  }, [enabled])

  const isAnchor = href.startsWith('#')
  const isExternal = href.startsWith('http')

  const cls = `btn${variant === 'line' ? '' : ` btn--${variant}`}`

  return (
    <span className="magnetic" ref={wrap}>
      <a
        className={cls}
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
        onClick={
          isAnchor
            ? (e) => {
                e.preventDefault()
                scrollToSection(href.slice(1))
              }
            : undefined
        }
      >
        {icon && <Icon name={icon} />}
        {label}
        {!icon && <span aria-hidden="true">→</span>}
      </a>
    </span>
  )
}
