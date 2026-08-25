import { useEffect, useRef } from 'react'
import { INQUIRY_ANCHOR } from './content/projects'
import { projects } from './content/i18n'
import { CONTACT_HREF, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { localPath, t } from './lib/lang'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import { tilt } from './lib/tilt'
import Icon from './ui/Icons'
import ProjectCard from './ui/ProjectCard'
import { PageFooter, PageNav } from './ui/PageShell'
import Button from './ui/Button'

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
        {t({ cs: 'Přeskočit na projekty', en: 'Skip to projects' })}
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
      <PageNav active={localPath('/projekty')} ctaHref={localPath(CONTACT_HREF)} />

      <main className="page" ref={main}>
        {/* ── HLAVIČKA STRÁNKY ─────────────────────────────────────
            ★ Od 2026-08-05 jsou klientské reference pod plombou (NDA), takže
            hlavička nesmí slibovat „klikněte si na živý web" – místo toho
            prodává diskrétnost jako službu a říká, jak se detail odemyká.
            Důvody a pravidla anonymizace: content/projects.ts. */}
        <header className="page__head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            {t({ cs: '[ PROJEKTY ]', en: '[ WORK ]' })}
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            {t({ cs: 'Produkční projekty. Klienti zůstávají v soukromí.', en: 'Production projects. Client names stay private.' })}
          </h1>
          {/* Třetí věta („celé reference ukazuji na schůzce") stála na stránce
              třikrát: tady, v poznámce pod tím a v CTA dole. Zůstává jen v CTA,
              kde je z ní akce místo popisu. */}
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            {t({
              cs: 'U každé reference vidíte problém, řešení a technologii. Jména a ostré snímky chrání smlouva o mlčenlivosti.',
              en: 'Each case shows the problem, solution, and technology. NDAs protect the names and full screenshots.',
            })}
          </p>
          <p className="page__note reveal" style={revealDelay(1.8, 5)}>
            <span className="page__note-k">{t({ cs: 'Proč zámky', en: 'Why the locks' })}</span>
            {/* ★ POSLEDNÍ VĚTA MUSELA PRYČ Z JINÉHO DŮVODU NEŽ KVŮLI DÉLCE:
                nabízela zakázky na IT infrastrukturu, a ta z nabídky odešla při
                přepozicování na AI · Software · Automatizace. Slib služby, kterou
                web nikde jinde nezmiňuje, je horší než žádný text. */}
            {t({
              cs: 'Celé reference včetně jmen a výsledků ukazuji při osobním hovoru.',
              en: 'I show the complete references, including names and results, on a private call.',
            })}
          </p>
        </header>

        {/* ── MŘÍŽKA KARET ─────────────────────────────────────── */}
        {/* ★ `.reveal` je na BUŇCE, ne na kartě: na jednom prvku by přebilo
            naklápění (viz ProjectCard.tsx a projects.css). */}
        <ul className="pgrid" id="projekty" ref={grid}>
          {projects().map((p, i) => (
            <li
              className={`pgrid__cell reveal${i === 0 ? ' pgrid__cell--wide' : ''}`}
              style={revealDelay(i, 4)}
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
            {t({ cs: 'Chcete vidět celé reference?', en: 'Want to see the complete references?' })}
          </h2>
          <p className="body reveal" style={revealDelay(0.8, 3)}>
            {t({
              cs: 'Při krátkém hovoru ukážu projekty naživo, včetně jmen a výsledků. Stačí napsat, co plánujete.',
              en: 'On a short call, I will show the projects live, including names and results. Just tell me what you are planning.',
            })}
          </p>
          <div className="page__cta-row reveal" style={revealDelay(1.6, 3)}>
            <Button href={localPath(CONTACT_HREF)} variant="primary" arrow="right" icon={<Icon name="mail" size={15} />}>
              {t({ cs: 'Probrat projekt', en: 'Discuss a project' })}
            </Button>
            <Button href={WHATSAPP} variant="secondary" intent="success" arrow="external" icon={<Icon name="whatsapp" size={15} />} target="_blank" rel="noreferrer">
              WhatsApp
            </Button>
            <Button href={`tel:${PHONE_TEL}`} variant="ghost" icon={<Icon name="phone" size={15} />}>
              {PHONE}
            </Button>
          </div>
          {/* Tichý řádek pod tlačítky: tři důvody, proč se kliknutí nebát.
              Mono readout přes sdílenou `.label`, ne další tlačítka –
              je to poznámka, ne nabídka. */}
          <p className="page__cta-trust label reveal" style={revealDelay(2.2, 3)}>
            {t({ cs: 'Nezávazně · Odpověď do 24 hodin · Diskrétně', en: 'No obligation · Reply within 24 hours · Discreet' })}
          </p>
        </section>

        <PageFooter active={localPath('/projekty')} />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
