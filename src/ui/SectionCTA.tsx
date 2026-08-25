import { scrollToSection } from '../lib/scroll'
import Icon, { type IconName } from './Icons'
import Button from './Button'

/** Homepage CTA using the same stationary Button primitive as every subpage. */
export default function SectionCTA({
  href,
  label,
  variant = 'line',
  icon,
}: {
  href: string
  label: string
  variant?: 'line' | 'solid' | 'ghost' | 'green'
  icon?: IconName
}) {
  const isAnchor = href.startsWith('#')
  const isExternal = href.startsWith('http')
  const buttonVariant = variant === 'solid' ? 'primary' : variant === 'line' ? 'secondary' : 'ghost'

  return (
    <span className="cta-hit">
      <Button
        href={href}
        variant={buttonVariant}
        intent={variant === 'green' ? 'success' : 'default'}
        arrow={icon ? false : isExternal ? 'external' : 'right'}
        icon={icon ? <Icon name={icon} /> : undefined}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
        onClick={
          isAnchor
            ? (event) => {
                event.preventDefault()
                scrollToSection(href.slice(1))
              }
            : undefined
        }
      >
        {label}
      </Button>
    </span>
  )
}
