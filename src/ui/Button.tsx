import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, LoaderCircle } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  href?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  icon?: ReactNode
  arrow?: 'right' | 'external' | false
  intent?: 'default' | 'success'
  loading?: boolean
  disabled?: boolean
  target?: string
  rel?: string
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
}

const join = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ')

export default function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  arrow = variant === 'text' ? 'right' : false,
  intent = 'default',
  loading = false,
  disabled = false,
  target,
  rel,
  type = 'button',
  onClick,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const classes = join('btn', `btn--${variant}`, `btn--${size}`, intent === 'success' && 'btn--success', className)
  const trailing = arrow === 'external' ? <ArrowUpRight /> : arrow === 'right' ? <ArrowRight /> : null
  const content = (
    <>
      <span className="btn__icon" aria-hidden="true">{loading ? <LoaderCircle className="btn__spinner" /> : icon}</span>
      <span className="btn__label">{children}</span>
      {trailing && <span className="btn__arrow" aria-hidden="true">{trailing}</span>}
    </>
  )

  if (href) {
    return (
      <a
        className={classes}
        href={isDisabled ? undefined : href}
        target={target}
        rel={rel}
        aria-disabled={isDisabled || undefined}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
    >
      {content}
    </button>
  )
}
