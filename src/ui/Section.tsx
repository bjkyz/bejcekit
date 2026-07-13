import { useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { CONTACT_ROWS, EMAIL, SECTIONS, type Section as S } from '../content/sections'
import { useReveal } from '../lib/hooks'
import Kicker from './Kicker'
import MagneticCTA from './MagneticCTA'
import GrabPlate from './GrabPlate'

const LAST = SECTIONS.length - 1

/** Zpoždění revealu — pevný CELKOVÝ rozptyl, ne 80ms × N (to je při 8 položkách plazení). */
const delay = (i: number, n: number) => ({ '--reveal-delay': `${(i / Math.max(1, n)) * 360}ms` }) as React.CSSProperties

export default function Section({
  s,
  index,
  reduced,
  dragRef,
}: {
  s: S
  index: number
  reduced: boolean
  dragRef: React.RefObject<Group | null>
}) {
  const ref = useReveal<HTMLElement>(!reduced)
  const isHero = index === 0
  const isContact = index === LAST
  const isProces = s.id === 'proces'

  return (
    <section
      id={s.id}
      ref={ref}
      data-index={index}
      className={`section section--${s.align}`}
      aria-labelledby={`${s.id}-h`}
    >
      {isHero && !reduced && <GrabPlate dragRef={dragRef} />}

      <div className="section__grid">
        <div className="section__col">
          <div className="reveal line-mask" style={delay(0, 6)}>
            <Kicker text={s.kicker} index={index} animate={!reduced} />
          </div>

          <div className="line-mask">
            {isHero ? (
              <h1 id={`${s.id}-h`} className="display reveal" style={delay(1, 6)}>
                {s.headline}
              </h1>
            ) : (
              <h2 id={`${s.id}-h`} className="headline reveal" style={delay(1, 6)}>
                {s.headline}
              </h2>
            )}
          </div>

          <p className="body reveal" style={delay(2, 6)}>
            {s.body}
          </p>

          {isProces ? (
            <ProcessSteps bullets={s.bullets} />
          ) : isContact ? (
            <ContactBlock />
          ) : (
            s.bullets.length > 0 && (
              <ul className={`bullets${isHero ? ' bullets--plain' : ''}`}>
                {s.bullets.map((b, i) => (
                  <li key={i} className="bullet reveal" style={delay(3 + i * 0.35, 6)}>
                    <span className="bullet__i" aria-hidden="true">
                      {isHero ? '·' : String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )
          )}

          {s.deliverable && (
            <p className="deliverable reveal" style={delay(4.6, 6)}>
              {s.deliverable}
            </p>
          )}

          {s.stack && (
            <ul className="stack reveal" style={delay(5, 6)}>
              {s.stack.map((t) => (
                <li key={t} className="stack__chip">
                  {t}
                </li>
              ))}
            </ul>
          )}

          {(s.cta || s.ghostCta) && (
            <div className="cta-row reveal" style={delay(5.4, 6)}>
              {s.cta && <MagneticCTA href={s.cta.href} label={s.cta.label} enabled={!reduced} />}
              {s.ghostCta && (
                <MagneticCTA href={s.ghostCta.href} label={s.ghostCta.label} variant="ghost" enabled={!reduced} />
              )}
            </div>
          )}

          {isContact && <Footer />}
        </div>
      </div>
    </section>
  )
}

/** Sekce 04 — čtyřřádková inženýrská tabulka. Dělá to líp DOM než 3D ciferník. */
function ProcessSteps({ bullets }: { bullets: string[] }) {
  return (
    <ol className="steps">
      {bullets.map((b, i) => {
        const [head, ...rest] = b.split(' — ')
        return (
          <li key={i} className="step reveal" style={delay(3 + i * 0.4, 6)}>
            <span className="step__i">{String(i + 1).padStart(2, '0')}</span>
            <span className="step__t">
              <b>{head}</b>
              {rest.length > 0 && <> — {rest.join(' — ')}</>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function ContactBlock() {
  const [copied, setCopied] = useState(false)
  const wrap = useRef<HTMLSpanElement>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = async (e: React.MouseEvent) => {
    // Ctrl/Cmd+klik ať pořád otevře poštovního klienta.
    if (e.metaKey || e.ctrlKey) return
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1400)
    } catch {
      window.location.href = `mailto:${EMAIL}` // clipboard bez HTTPS/permission
    }
  }

  return (
    <>
      <span className="magnetic" ref={wrap}>
        <a
          href={`mailto:${EMAIL}`}
          className={`email-link${copied ? ' is-copied' : ''}`}
          onClick={copy}
          aria-label={`Zkopírovat e-mail ${EMAIL}`}
        >
          {copied ? 'ZKOPÍROVÁNO ✓' : EMAIL}
        </a>
      </span>

      <ul className="contact-rows reveal" style={delay(3, 6)}>
        {CONTACT_ROWS.map((r) => (
          <li key={r.label}>
            <a className="contact-row" href={r.href} target={r.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              <span className="contact-row__k">{r.label}</span>
              <span className="contact-row__dots" aria-hidden="true" />
              <span className="contact-row__v">{r.value}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="cta-row reveal" style={delay(4, 6)}>
        <MagneticCTA href={`mailto:${EMAIL}`} label="Napsat e-mail" variant="solid" />
      </div>
    </>
  )
}

function Footer() {
  return (
    <footer className="footer reveal" style={delay(5, 6)}>
      <p>© {new Date().getFullYear()} Jiří Bejček — bejcek.it · Postaveno v Reactu a three.js.</p>
      {/* CC-BY atribuce je SMLUVNÍ POVINNOST, ne zdvořilost. Neodstraňovat. */}
      <p>
        3D model „Primary Ion Drive" —{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          Mike Murdock, CC BY 4.0
        </a>
      </p>
    </footer>
  )
}
