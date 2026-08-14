import { useEffect, useState } from 'react'
import { CONTACT_HREF, NAV_SECTION_COUNT } from '../content/sections'
import { navPages, sections } from '../content/i18n'
import { localPath, t } from '../lib/lang'
import { useActiveSection, useScrollIdle } from '../lib/hooks'
import { lockScroll, scrollToSection } from '../lib/scroll'
import { sceneState } from '../lib/scene-state'
import LangSwitch from '../ui/LangSwitch'
import Mark from '../ui/Mark'
import SiteMenu from '../ui/SiteMenu'
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
  /* Kolik sekcí se vejde vedle podstránek, rozhoduje NAV_SECTION_COUNT
     v content/sections.ts — je tam i důvod, proč ustoupil zrovna SOFTWARE.
     Na všech šest stěn se dá skočit pravou lištou i scrollem. */
  const links = sections().slice(1, 1 + NAV_SECTION_COUNT)
  return (
    <nav className="nav" aria-label={t({ cs: 'Hlavní navigace', en: 'Main navigation' })}>
      {/* ★ ZNAČKA JE OBRÁZEK, NE SLOVO — a proto potřebuje jméno pro odečítač
          obrazovky. <svg aria-hidden> sám o sobě je prázdné místo, takže by
          z odkazu na domovskou sekci zbyl nepojmenovaný odkaz (a Lighthouse
          by to hlásil). Text je vizuálně schovaný, ne odstraněný. */}
      <a className="nav__mark" href="#ident" onClick={anchor('ident')}>
        <Mark size={30} />
        <span className="sr-only">{t({ cs: 'bejcek.it, úvod', en: 'bejcek.it, home' })}</span>
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
        {/* ★ SKUTEČNÉ ODKAZY NA JINÉ STRÁNKY, TAKŽE ŽÁDNÝ preventDefault.
            Ostatní položky jsou kotvy a musí projít přes Lenis (jinak by skočily
            natvrdo); tyhle jsou navigace pryč z dokumentu a patří prohlížeči.
            Seznam je v content/sections.ts (NAV_PAGES) — týž, jaký vykresluje
            navigace podstránek, aby se ty dvě lišty nemohly rozejít. */}
        {navPages().map((p) => (
          <a className="nav__link" href={p.href} key={p.href} hrefLang={p.foreign ? 'cs' : undefined}>
            {p.label}
            {p.foreign && <span className="sr-only"> (in Czech)</span>}
          </a>
        ))}
      </div>
      {/* ★★ NA FORMULÁŘ, NE NA KOTVU #kontakt. Sekce 05 je od zavedení /kontakt
          rozcestník — a CTA v liště je jediné, které je vidět pořád. Posílat
          z něj člověka na scroll přes pět obrazovek WebGL místo na tři pole
          formuláře byl zbytečný práh navíc. */}
      <div className="nav__end">
        {/* ★ PŘEPÍNAČ JAZYKA STOJÍ PŘED CTA, NE ZA NÍM. Volba jazyka je
            předpoklad čtení, ne akce na konci cesty — a hlavní tlačítko musí
            zůstat poslední věcí v liště, tedy tou, na které oko skončí. */}
        <LangSwitch page="home" />
        <a className="nav__cta" href={localPath(CONTACT_HREF)}>
          {t({ cs: 'Napište mi', en: 'Get in touch' })}
        </a>
        {/* Burger: na telefonu jediná cesta z úvodu na podstránky (odkazy
            v liště jsou pod 800 px skryté). Scroll nahoru jde přes Lenis. */}
        <SiteMenu active={localPath('/')} onHomeNav={() => scrollToSection('ident')} onLock={lockScroll} />
      </div>
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
    <nav className={`rail${idle ? ' is-idle' : ''}`} aria-label={t({ cs: 'Sekce', en: 'Sections' })}>
      {sections().map((s, i) => (
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
