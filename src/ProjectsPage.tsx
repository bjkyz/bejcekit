import { useEffect, useRef } from 'react'
import { PROJECTS } from './content/projects'
import { EMAIL, GITHUB, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import { tilt } from './lib/tilt'
import Icon from './ui/Icons'
import Mark from './ui/Mark'
import ProjectCard from './ui/ProjectCard'

/**
 * ═══════════ STRÁNKA /projekty ═══════════
 *
 * ★ SAMOSTATNÁ STRÁNKA, NE SEDMÁ SEKCE. Rozhodnutí, které ušetřilo celou třídu chyb.
 *
 *   Původní zadání znělo „sekce projektů". Jenže `SECTIONS` je na hlavní stránce
 *   svázané 1:1 s geometrií krychle: šest položek, šest stěn. Sedmá položka
 *   nezpůsobí degradaci, ale PÁD – `FACE_TRANSFORMS[6]` je `undefined`, cedule
 *   na stěně na to sáhne při renderu, `SceneBoundary` to chytí a 3D zmizí z webu
 *   úplně. A i kdyby ne, kamera by na posledních dvou sekcích zamrzla, protože
 *   `Choreo` klampuje polohu na dráze na pět.
 *
 *   Vlastní stránka tenhle problém nemá, protože ho vůbec nezakládá. Navíc dostane
 *   to, co kotva `#projekty` mít nikdy nemůže: vlastní URL, vlastní titulek
 *   a popisek pro vyhledávače, vlastní náhled při sdílení a vlastní řádek
 *   v sitemapě. Reference jsou obchodní argument – mají se dát poslat odkazem.
 *
 * ★★ TADY NEBĚŽÍ ANI WEBGL, ANI LENIS. Obojí je vynechané SCHVÁLNĚ.
 *
 *   • Krychle by na téhle stránce soupeřila s kartami. Karty jsou tu ten
 *     trojrozměrný objekt, o který jde; druhá 3D vrstva za nimi by z toho udělala
 *     hlučné pozadí. Identitu webu drží mřížka pozadí, zrno, rohové značky
 *     a typografie – tedy věci, které nestojí ani kilobajt navíc.
 *   • Lenis je choreografické leštidlo pro scénu. Bez scény je to jen vrstva JS
 *     mezi kolečkem a stránkou, a to na stránce, kde se čte a scrolluje k obrázkům.
 *     Nativní scroll je tu lepší produkt, ne ústupek.
 *
 *   Důsledek pro rozpočet: tahle stránka si z hlavního webu nebere ani three.js
 *   (~330 kB gz), ani lenis. Stáhne React, tenhle strom a čtyři snímky.
 */
export default function ProjectsPage() {
  const reduced = useReducedMotion()
  const main = useReveal<HTMLElement>(!reduced)
  const grid = useRef<HTMLUListElement>(null)

  /* Naklápění se instaluje jednou na celou mřížku. Samo se vypne na dotyku
     i při zakázaném pohybu – viz lib/tilt.ts. */
  useEffect(() => {
    if (!grid.current || reduced) return
    return tilt(grid.current)
  }, [reduced])

  return (
    <>
      <a className="skip-link" href="#projekty">
        Přeskočit na projekty
      </a>

      <div className="bg-field" aria-hidden="true" />

      {/* Rohové značky. Na hlavní stránce jim během přeletu kamery narůstají
          ramena; tady žádná kamera není, takže stojí a jsou to čistě kraje
          přístroje. Stejná třída, stejný vzhled, nulová logika. */}
      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* ★ `nav--page` NENÍ KOSMETIKA. Navigace je fixní deska bez pozadí a na
          úvodu jí to projde, protože tam sekce snapují a pod lištou nikdy nic
          nestojí. Tady se scrolluje volně, takže jí obsah PROJÍŽDÍ POD RUKAMA
          a přes značku by se míhaly snímky karet. Modifikátor přidává závoj —
          a musí být, protože stylesheet je pro obě stránky společný, takže by
          holé `.nav::before` zasáhlo i úvod. */}
      <nav className="nav nav--page" aria-label="Hlavní navigace">
        <a className="nav__mark" href="/">
          <Mark size={30} />
          <span className="sr-only">bejcek.it, úvod</span>
        </a>
        <div className="nav__links">
          <a className="nav__link" href="/#web">
            WEB
          </a>
          <a className="nav__link" href="/#infra">
            INFRA
          </a>
          <a className="nav__link" href="/#ai">
            AI
          </a>
          <a className="nav__link is-active" href="/projekty" aria-current="page">
            PROJEKTY
          </a>
        </div>
        <a className="nav__cta" href="/#kontakt">
          Napište mi
        </a>
      </nav>

      <main className="page" ref={main}>
        {/* ── HLAVIČKA STRÁNKY ─────────────────────────────────── */}
        <header className="page__head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            [ PROJEKTY ]
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            Weby, které běží. Ne obrázky v prezentaci.
          </h1>
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            Každý projekt níž je živý web, na který se dá kliknout. Technické údaje u něj nejsou marketing:
            jsou odečtené přímo z toho běžícího webu, takže si je můžete za dvě minuty ověřit sami.
          </p>
          <p className="page__note reveal" style={revealDelay(1.8, 5)}>
            <span className="page__note-k">Poznámka</span>
            Zakázky na IT infrastrukturu tu nenajdete. U serverů, sítí a interních systémů zveřejnění
            skoro nikdy nedovolí smlouva, a co nesmím ukázat, o tom radši mlčím. Reference vám na vyžádání
            dám i tak.
          </p>
        </header>

        {/* ── MŘÍŽKA KARET ─────────────────────────────────────── */}
        {/* ★ `.reveal` je na BUŇCE, ne na kartě: na jednom prvku by přebilo
            naklápění (viz ProjectCard.tsx a projects.css). */}
        <ul className="pgrid" id="projekty" ref={grid}>
          {PROJECTS.map((p, i) => (
            <li className="pgrid__cell reveal" style={revealDelay(i, PROJECTS.length)} key={p.id}>
              <ProjectCard p={p} i={i} />
            </li>
          ))}
        </ul>

        {/* ── VÝZVA K AKCI ─────────────────────────────────────── */}
        <section className="page__cta" aria-labelledby="page-cta-h">
          <h2 className="headline reveal" id="page-cta-h" style={revealDelay(0, 3)}>
            Chcete web, který takhle vypadá i funguje?
          </h2>
          <p className="body reveal" style={revealDelay(0.8, 3)}>
            Napište mi, co potřebujete, vlastními slovy. Do 24 hodin víte, jestli na to jsem ten pravý,
            co to bude stát a kdy to bude hotové.
          </p>
          <div className="page__cta-row reveal" style={revealDelay(1.6, 3)}>
            <a className="btn btn--solid" href={`mailto:${EMAIL}`}>
              <Icon name="mail" size={15} />
              Napsat e-mail
            </a>
            <a className="btn btn--green" href={WHATSAPP} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={15} />
              WhatsApp
            </a>
            <a className="btn btn--ghost" href={`tel:${PHONE_TEL}`}>
              <Icon name="phone" size={15} />
              {PHONE}
            </a>
          </div>
        </section>

        {/* ── PATIČKA ──────────────────────────────────────────────
            Kratší než na hlavní stránce, a schválně: atribuce CC BY se váže
            k 3D modelu, a ten na téhle stránce neběží. Licenční doložka patří
            tam, kde se dílo doopravdy užívá, ne na každou stránku webu. */}
        <footer className="footer">
          <p className="footer__mark">
            <Mark size={24} />
            <span>
              bejcek<b>.it</b>
            </span>
          </p>
          <p className="footer__links">
            <a href="/">Úvod</a>
            <span aria-hidden="true">·</span>
            <a href={GITHUB} target="_blank" rel="noreferrer">
              <Icon name="github" size={14} />
              github.com/bjkyz
            </a>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} Jiří Bejček</span>
          </p>
        </footer>
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
