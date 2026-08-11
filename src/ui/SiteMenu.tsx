import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CONTACT_HREF, MAILTO, NAV_PAGES, PHONE, PHONE_TEL, WHATSAPP } from '../content/sections'
import Icon from './Icons'
import Mark from './Mark'

/**
 * ═══════════ MOBILNÍ MENU (burger) ═══════════
 *
 * ★ PROČ EXISTUJE: pod 800 px se `.nav__links` skrývá a jediná navigace na
 *   telefonu byly tečky pravé lišty (sekce úvodu) — na PODSTRÁNKY se z úvodu
 *   nedalo dostat jinak než ghost tlačítkem hero a patičkou. Menu nese totéž
 *   co plná lišta: stránky, hlavní CTA a přímé kanály.
 *
 * ★★ ŽÁDNÝ IMPORT lib/scroll.ts. Ten s sebou táhne Lenis a podstránky ho
 *   schválně nevozí (viz kontakt.tsx: „nebere si ani three.js, ani lenis").
 *   Zámek scrollu dělá CSS třída na <html> (base.css) — overflow: hidden na
 *   kořeni v moderních prohlížečích drží pozici scrollu a blokuje kolečko
 *   i dotyk. Úvod si scroll k sekci injektuje přes `onHomeNav`.
 *
 * ★ HYDRATACE: zavřeno je výchozí stav a portál se vůbec nerenderuje, takže
 *   server i první klientský render kreslí jen tlačítko — identicky.
 */
export default function SiteMenu({
  /** `href` aktuální stránky ('/' na úvodu) — položka se označí a neklikne. */
  active,
  /** Úvod: co udělat po kliku na aktuální položku (scroll nahoru přes Lenis). */
  onHomeNav,
  /** Úvod: navíc k CSS zámku zastavit Lenis (lockScroll ze scroll.ts) — jinak
      by kolečko nad otevřeným menu střádalo virtuální scroll do prázdna
      a po zavření by stránka cukla. Podstránky Lenis nemají, prop nedávají. */
  onLock,
}: {
  active: string
  onHomeNav?: () => void
  onLock?: (on: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  /* Zámek scrollu, fokus dovnitř, Escape a fokusová smyčka. Úklid v cleanup
     pokrývá i odchod ze stránky s otevřeným menu. */
  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('menu-locked')
    onLock?.(true)
    const panel = panelRef.current
    /* Kopie do proměnné: cleanup má vracet fokus TOMU tlačítku, které menu
       otevřelo, i kdyby se ref mezitím přepojil. */
    const burger = burgerRef.current
    const raf = requestAnimationFrame(() => {
      panel?.querySelector<HTMLElement>('a[href]')?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      /* Menu je modální (role="dialog"), takže Tab nesmí utéct pod něj.
         Smyčka stačí jednoduchá: první ↔ poslední fokusovatelný prvek. */
      if (e.key !== 'Tab' || !panel) return
      const items = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('menu-locked')
      onLock?.(false)
      burger?.focus()
    }
    /* onLock je stabilní modulová funkce (lockScroll) — do závislostí nepatří,
       měnit se nemá a přidání by jen rozbíjelo zámek při každém renderu. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* Otočení na šířku / roztažení okna nad 800 px: menu ztrácí smysl, zavřít. */
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(min-width: 801px)')
    const onChange = () => {
      if (mq.matches) setOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [open])

  /* Klik na aktuální stránku: žádný reload, jen zavřít a vyjet nahoru.
     ★ Scroll až v rAF — cleanup efektu (odemčení scrollu) běží při commitu,
       a zápis scrollTop pod overflow: hidden by se zahodil. */
  const onItem = (href: string) => (e: React.MouseEvent) => {
    if (href !== active) return
    e.preventDefault()
    setOpen(false)
    requestAnimationFrame(() => {
      if (onHomeNav) onHomeNav()
      else window.scrollTo({ top: 0 })
    })
  }

  const items: { label: string; href: string }[] = [
    { label: 'Úvod', href: '/' },
    ...NAV_PAGES.map((p) => ({ label: p.title, href: p.href })),
    { label: 'Kontakt', href: CONTACT_HREF },
  ]

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="nav__burger"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div className="menu" id="site-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="menu__bar">
              <a className="menu__brand" href="/" onClick={onItem('/')}>
                <Mark size={30} />
                <span>
                  bejcek<b>.it</b>
                </span>
              </a>
              <button
                type="button"
                className="nav__burger is-open"
                onClick={() => setOpen(false)}
                aria-label="Zavřít menu"
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
            </div>

            <nav className="menu__pages" aria-label="Stránky">
              {items.map((it, i) => (
                <a
                  key={it.href}
                  className={`menu__link${it.href === active ? ' is-active' : ''}`}
                  href={it.href}
                  aria-current={it.href === active ? 'page' : undefined}
                  onClick={onItem(it.href)}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="menu__num" aria-hidden="true">
                    {String(i).padStart(2, '0')}
                  </span>
                  {it.label}
                  <span className="menu__go" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
            </nav>

            <div className="menu__foot">
              {/* Táž hlavní akce jako v liště — menu ji nesmí schovat. Na /kontakt
                  vede sama na sebe, což `onItem` promění v zavření menu. */}
              <a className="btn btn--solid menu__cta" href={CONTACT_HREF} onClick={onItem(CONTACT_HREF)}>
                Napište mi
                <span aria-hidden="true">→</span>
              </a>
              <div className="menu__channels">
                <a href={WHATSAPP} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" size={15} />
                  WhatsApp
                </a>
                <a href={`tel:${PHONE_TEL}`}>
                  <Icon name="phone" size={15} />
                  {PHONE}
                </a>
                <a href={MAILTO}>
                  <Icon name="mail" size={15} />
                  E-mail
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
