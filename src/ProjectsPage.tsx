import { useEffect, useRef } from 'react'
import { INQUIRY_ANCHOR, PROJECTS } from './content/projects'
import { CONTACT_HREF, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import { tilt } from './lib/tilt'
import Icon from './ui/Icons'
import ProjectCard from './ui/ProjectCard'
import { PageFooter, PageNav } from './ui/PageShell'

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

      {/* Navigace i patička jsou od přidání žurnálu společné pro všechny
          podstránky — viz ui/PageShell.tsx (a NAV_PAGES v content/sections.ts). */}
      <PageNav active="/projekty" ctaHref={CONTACT_HREF} />

      <main className="page" ref={main}>
        {/* ── HLAVIČKA STRÁNKY ─────────────────────────────────────
            ★ Od 2026-08-05 jsou klientské reference pod plombou (NDA), takže
            hlavička nesmí slibovat „klikněte si na živý web" – místo toho
            prodává diskrétnost jako službu a říká, jak se detail odemyká.
            Důvody a pravidla anonymizace: content/projects.ts. */}
        <header className="page__head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            [ PROJEKTY ]
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            Weby běží naživo. Jména kryje mlčenlivost.
          </h1>
          {/* Třetí věta („celé reference ukazuji na schůzce") stála na stránce
              třikrát: tady, v poznámce pod tím a v CTA dole. Zůstává jen v CTA,
              kde je z ní akce místo popisu. */}
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            Klientské práce tu visí jen v obrysech: rozmazaný snímek, obor a technická fakta. Víc smlouva
            o mlčenlivosti nedovolí.
          </p>
          <p className="page__note reveal" style={revealDelay(1.8, 5)}>
            <span className="page__note-k">Proč zámky</span>
            {/* ★ POSLEDNÍ VĚTA MUSELA PRYČ Z JINÉHO DŮVODU NEŽ KVŮLI DÉLCE:
                nabízela zakázky na IT infrastrukturu, a ta z nabídky odešla při
                přepozicování na AI · Software · Automatizace. Slib služby, kterou
                web nikde jinde nezmiňuje, je horší než žádný text. */}
            Diskrétnost není překážka, je součást služby. Stejná smlouva, která dnes kryje tyhle klienty, bude
            jednou krýt i vás: váš web, vaše čísla, vaše data.
          </p>
        </header>

        {/* ── MŘÍŽKA KARET ─────────────────────────────────────── */}
        {/* ★ `.reveal` je na BUŇCE, ne na kartě: na jednom prvku by přebilo
            naklápění (viz ProjectCard.tsx a projects.css). */}
        <ul className="pgrid" id="projekty" ref={grid}>
          {PROJECTS.map((p, i) => (
            <li
              className={`pgrid__cell reveal${i === 0 ? ' pgrid__cell--wide' : ''}`}
              style={revealDelay(i, PROJECTS.length)}
              key={p.id}
            >
              <ProjectCard p={p} i={i} />
            </li>
          ))}
        </ul>

        {/* ── VÝZVA K AKCI ─────────────────────────────────────────
            Cíl všech zamčených karet: kliknutí na plombu přistane tady.
            Nadpis proto musí navázat na to, co člověk právě viděl (zámky),
            a slíbit odemčení – ne obecné „napište mi". */}
        <section className="page__cta" id={INQUIRY_ANCHOR} aria-labelledby="page-cta-h">
          <h2 className="headline reveal" id="page-cta-h" style={revealDelay(0, 3)}>
            Reference vám ukážu celé. Mezi čtyřma očima.
          </h2>
          <p className="body reveal" style={revealDelay(0.8, 3)}>
            Napište mi, co stavíte, vlastními slovy. Do 24 hodin víte, jestli na to jsem ten pravý,
            co to bude stát a kdy to bude hotové. A portfolio vám odemknu: weby naživo, jména
            i výsledky.
          </p>
          <div className="page__cta-row reveal" style={revealDelay(1.6, 3)}>
            <a className="btn btn--solid" href={CONTACT_HREF}>
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
          {/* Tichý řádek pod tlačítky: tři důvody, proč se kliknutí nebát.
              Mono readout přes sdílenou `.label`, ne další tlačítka –
              je to poznámka, ne nabídka. */}
          <p className="page__cta-trust label reveal" style={revealDelay(2.2, 3)}>
            Nezávazně · Odpověď do 24 hodin · Diskrétně
          </p>
        </section>

        <PageFooter active="/projekty" />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
