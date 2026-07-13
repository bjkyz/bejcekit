import { useEffect, useState } from 'react'
import { SECTIONS } from '../content/sections'
import { useActiveSection } from '../lib/hooks'
import { scrollToSection } from '../lib/scroll'
import { sceneState } from '../lib/scene-state'
import Status from './Status'

export default function Hud({ tier }: { tier: string }) {
  const active = useActiveSection()

  return (
    <div className="hud">
      <Nav active={active} />
      <Frame />
      <Rail active={active} />
      <Status tier={tier} />
    </div>
  )
}

function Nav({ active }: { active: number }) {
  const links = SECTIONS.slice(1, 5)
  return (
    <nav className="nav" aria-label="Hlavní navigace">
      <a className="nav__mark" href="#ident" onClick={anchor('ident')}>
        bejcek<b>.it</b>
      </a>
      <div className="nav__links">
        {links.map((s, i) => (
          <a
            key={s.id}
            className={`nav__link${active === i + 1 ? ' is-active' : ''}`}
            href={`#${s.id}`}
            onClick={anchor(s.id)}
          >
            {s.plateCode}
          </a>
        ))}
      </div>
      <a className="nav__cta" href="#kontakt" onClick={anchor('kontakt')}>
        Napište mi
      </a>
    </nav>
  )
}

/** Čtyři rohové značky. Během otáčení krychle jim povyrostou ramena. */
function Frame() {
  const [transit, setTransit] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setTransit(sceneState.transit), 100)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={`frame${transit ? ' is-transit' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

/** Pravá lišta — SKUTEČNÉ kotvy, ne dekorace. Na mobilu se překlopí do teček dole. */
function Rail({ active }: { active: number }) {
  return (
    <nav className="rail" aria-label="Sekce">
      {SECTIONS.map((s, i) => (
        <a
          key={s.id}
          className={`rail__tick${active === i ? ' is-active' : ''}`}
          href={`#${s.id}`}
          onClick={anchor(s.id)}
          aria-current={active === i ? 'true' : undefined}
        >
          <span className="rail__num">{s.plateNum}</span>
          <span className="rail__bar" />
          <span className="sr-only">{s.subsystem}</span>
        </a>
      ))}
    </nav>
  )
}

function anchor(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToSection(id)
  }
}
