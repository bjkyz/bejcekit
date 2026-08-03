import { useEffect, useState } from 'react'
import { SECTIONS } from '../content/sections'
import { useActiveSection, useScrollIdle } from '../lib/hooks'
import { scrollToSection } from '../lib/scroll'
import { sceneState } from '../lib/scene-state'
import Mark from '../ui/Mark'
import Status from './Status'

export default function Hud() {
  const active = useActiveSection()

  return (
    <div className="hud">
      <Nav active={active} />
      <Frame />
      <Rail active={active} />
      <Status />
    </div>
  )
}

function Nav({ active }: { active: number }) {
  const links = SECTIONS.slice(1, 5)
  return (
    <nav className="nav" aria-label="Hlavní navigace">
      {/* ★ ZNAČKA JE OBRÁZEK, NE SLOVO — a proto potřebuje jméno pro odečítač
          obrazovky. <svg aria-hidden> sám o sobě je prázdné místo, takže by
          z odkazu na domovskou sekci zbyl nepojmenovaný odkaz (a Lighthouse
          by to hlásil). Text je vizuálně schovaný, ne odstraněný. */}
      <a className="nav__mark" href="#ident" onClick={anchor('ident')}>
        <Mark size={30} />
        <span className="sr-only">bejcek.it, úvod</span>
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

/** Čtyři rohové značky. Během přeletu kamery mezi stěnami jim povyrostou ramena. */
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
  /* Na telefonu pilulka plave přes text; při čtení ustoupí. Viz hud.css a useScrollIdle.
     Na desktopu je třída bez efektu (pravidlo je uvnitř max-width: 1024px). */
  const idle = useScrollIdle()
  return (
    <nav className={`rail${idle ? ' is-idle' : ''}`} aria-label="Sekce">
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
