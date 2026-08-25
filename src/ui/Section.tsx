import { useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import {
  CONTACT_HREF,
  EMAIL,
  FACE_COUNT,
  GITHUB,
  MAILTO,
  type Section as S,
} from '../content/sections'
import { contactChannelsHome, whatHappens } from '../content/i18n'
import { localPath, t } from '../lib/lang'
import { useReveal } from '../lib/hooks'
import { revealDelay as delay } from '../lib/reveal'
import Kicker from './Kicker'
import SectionCTA from './SectionCTA'
import GrabPlate from './GrabPlate'
import Icon from './Icons'
import Mark from './Mark'
import ServiceDemo from './ServiceDemo'

const LAST = FACE_COUNT - 1

/* Zpoždění revealu žije v lib/reveal.ts — sdílí ho i karty projektů, aby obě
   stránky nastupovaly stejným rytmem. */

export default function Section({
  s,
  index,
  reduced,
  hasScene,
  dragRef,
}: {
  s: S
  index: number
  reduced: boolean
  /** Běží 3D? Bez scény nesmí existovat úchop ani nápověda „táhni a otoč" —
      vybízely by k tažení za krychli, která na obrazovce není. */
  hasScene: boolean
  dragRef: React.RefObject<Group | null>
}) {
  const ref = useReveal<HTMLElement>(!reduced && index !== 0)
  const isHero = index === 0
  const isContact = index === LAST

  /**
   * ═══════════ POŘADÍ AKCÍ V ZÁVĚRU KRYCHLE ═══════════
   *
   * ★★★ NA SEKCI 05 STOJÍ HLAVNÍ TLAČÍTKO NAD KANÁLY, VŠUDE JINDE POD OBSAHEM.
   *
   * Dřív bylo pořadí „text → dlaždice s e-mailem → hlavní CTA"
   * a byly v něm DVA primární prvky za sebou: vyplněná dlaždice (jediná plná
   * plocha na webu) a hned pod ní jediné velké tlačítko. Návštěvník, který
   * dorolloval na konec, tak dostal na výběr mezi dvěma nejsilnějšími signály
   * a musel rozhodovat o formě, ne o tom, že napíše.
   *
   * Teď je hierarchie jednoznačná: JEDNA hlavní cesta (formulář, kde je práh
   * nejnižší a kde se dá zpráva napsat rovnou), pak co se stane potom, a teprve
   * pak kanály pro toho, kdo formuláře zásadně nevyplňuje. Nadpis kanálů to
   * říká nahlas („nebo rovnou"), takže z alternativy není konkurence.
   */
  const ctaRow = (s.cta || s.ghostCta) && (
    <div className="cta-row reveal" style={delay(isContact ? 3 : 5.4, 6)}>
      {s.cta && <SectionCTA href={s.cta.href} label={s.cta.label} variant="solid" />}
      {s.ghostCta && (
        <SectionCTA href={s.ghostCta.href} label={s.ghostCta.label} variant="ghost" />
      )}
    </div>
  )

  return (
    <section
      id={s.id}
      ref={ref}
      data-index={index}
      className={`section section--${s.align}${isHero ? " section--hero" : ""}`}
      aria-labelledby={`${s.id}-h`}
    >
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

          {(s.id === 'ai' || s.id === 'automatizace' || s.id === 'software') && (
            <div className="reveal" style={delay(2.5, 6)}>
              <ServiceDemo type={s.id} />
            </div>
          )}

          {/* Zelený štítek dostupnosti. Nejsilnější konverzní prvek hero sekce:
              první, co návštěvník potřebuje vědět, je „bere ten člověk vůbec práci?" */}
          {s.status && (
            <p className="status-pill reveal" style={delay(2.6, 6)}>
              <span className="status-pill__dot" aria-hidden="true" />
              {s.status}
            </p>
          )}

          {/* ★ ZELENÝ ŠTÍTEK KAPACITY SE V ZÁVĚRU OPAKUJE, A JE TO ZÁMĚR.
              Na úvodu odpovídá na otázku „bere ten člověk vůbec práci?", tady
              na tutéž otázku ve chvíli ROZHODOVÁNÍ — a mezi tím leží pět
              obrazovek scrollu. Informace, kterou si nikdo nepamatuje pět
              obrazovek, není opakování, ale její jediné užitečné uvedení. */}
          {isContact && (
            <p className="status-pill reveal" style={delay(2.6, 6)}>
              <span className="status-pill__dot" aria-hidden="true" />
              {t({ cs: 'Přijímám nové projekty', en: 'Taking on new projects' })}
            </p>
          )}

          {isContact && ctaRow}

          {s.steps ? (
            <ProcessSteps steps={s.steps} />
          ) : isContact ? (
            <ContactBlock />
          ) : (
            s.bullets.length > 0 && (
              <ul className={`bullets${isHero ? ' bullets--plain' : ''}${['ai', 'automatizace', 'software'].includes(s.id) ? ' bullets--capabilities' : ''}`}>
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

          {s.proof && (
            <p className="proof reveal" style={delay(4.3, 6)}>
              <span className="proof__mark" aria-hidden="true">●</span>
              <span><strong>LIVE SYSTEM</strong>{s.proof}</span>
            </p>
          )}

          {s.deliverable && (
            <p className="deliverable reveal" style={delay(4.6, 6)}>
              <span className="deliverable__k">{s.deliverable.label}</span>
              {s.deliverable.text}
            </p>
          )}

          {s.stack && (
            <ul className="stack reveal" style={delay(5, 6)}>
              {/* `chip`, ne `t`: `t` je překladová funkce z lib/lang.ts. */}
              {s.stack.map((chip) => (
                <li key={chip} className="stack__chip">
                  {chip}
                </li>
              ))}
            </ul>
          )}

          {!isContact && ctaRow}

          {isContact && <Footer />}
        </div>
      </div>

      {/* ★ VOLNÝ PÁS PRO STROJ. Nemá obsah a je to jeho jediný úkol: roztáhne se
          o všechno, co zbude z výšky okna, a v tom pásu je vidět krychle — ta do
          něj sjede kamerou (HERO_DROP, lib/scene-state.ts). Dřív tam stály tři
          odrážky a stroj se schovával za závojem přímo pod textem.

          ★★ ÚCHOP BYDLÍ TADY, NE NA SEKCI. Plocha na tažení je `position: absolute`
          a dřív se sázela podle celé sekce, tedy na její střed — jenže tam už
          krychle není. Uvnitř pásu se sází podle NĚJ, takže sedí přesně tam, kam
          stroj sjel, a nemusí se nikde opisovat žádný posun v procentech.
          Nápověda je pak prostě poslední řádek pásu (flex-end), takže nemá jak
          spadnout do pásu specifikací pod ním. Na dotyku se obojí skrývá
          (sections.css) a pás jen dýchá. */}
      {isHero && (
        <div className="hero-stage" aria-hidden="true">
          {!reduced && hasScene && <GrabPlate dragRef={dragRef} />}
        </div>
      )}

      {isHero && s.specs && (
        <ul className="hero-spec">
          {s.specs.map((sp, i) => (
            <li key={sp.k} className="hero-spec__i reveal" style={delay(5.8 + i * 0.3, 6)}>
              <span className="hero-spec__k">{sp.k}</span>
              <span className="hero-spec__v">{sp.v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Sekce 04: čtyřřádková inženýrská tabulka. Dělá to líp DOM než 3D ciferník. */
function ProcessSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="steps">
      {steps.map((st, i) => (
        <li key={i} className="step reveal" style={delay(3 + i * 0.4, 6)}>
          <span className="step__i">{String(i + 1).padStart(2, '0')}</span>
          <span className="step__t">
            <b>{st.title}.</b> {st.text}
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * ═══════════ SEKCE 05: KANÁLY MÍSTO ÚČTENKY ═══════════
 *
 * Hierarchie je záměr, ne mřížka:
 *   1. E-MAIL přes celou šířku — nejnižší práh, nezávazné, asynchronní.
 *      Je to zároveň jediný VYPLNĚNÝ prvek na celém webu, protože je to
 *      jediná akce, kvůli které tahle stránka existuje.
 *   2. WhatsApp a telefon vedle sebe — rychlé, ale osobní. Půlová váha.
 *   3. GitHub až v patičce — důkaz, ne výzva k akci.
 *
 * ★ KOPÍROVÁNÍ JE VLASTNÍ TLAČÍTKO, NE PŘEPSANÝ KLIK NA ODKAZ.
 *   Dřív klik na e-mail místo otevření pošty TIŠE KOPÍROVAL do schránky.
 *   Na telefonu je to přesně obráceně, než člověk čeká: klepne na adresu,
 *   protože chce psát, a nestane se nic viditelného. Odkaz teď dělá to, co
 *   slibuje (mailto:), a kopírka stojí vedle jako samostatný, popsaný cíl.
 */
function ContactBlock() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Bez HTTPS nebo bez oprávnění schránka není. Vybrat adresu pak musí
         uživatel sám, takže se aspoň nesmí tvářit, že se něco povedlo. */
      setCopied(false)
    }
  }

  return (
    <div className="contact">
      {/* ═══════════ CO SE STANE POTOM ═══════════
          ★★ NEJČASTĚJŠÍ DŮVOD, PROČ SE ČLOVĚK NEOZVE, NENÍ NEDŮVĚRA, ALE
            NEJISTOTA: netuší, co kliknutím spustí. Dosud to stálo výhradně
            na `/kontakt`, tedy AŽ ZA rozhodnutím kliknout — což je o jeden
            krok pozdě. Tři řádky pod tlačítkem tu námitku sundají dřív.
          ★ Je to JEDEN PÁS, ne tři dlaždice: `k` je slib, `v` jeho podmínka,
            takže se to dá přejet očima. Tři plné věty pod sebou by z konce
            scrollu udělaly další odstavec ke čtení a sekce 05 má být rozhodnutí,
            ne text. Data sdílí s `/kontakt` (WHAT_HAPPENS), aby se sliby na
            dvou místech webu nemohly rozejít. */}
      <ol className="contact-next reveal" style={delay(3.4, 6)}>
        {whatHappens().map((w, i) => (
          <li className="contact-next__i" key={w.k}>
            <span className="contact-next__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="contact-next__k">{w.k}</span>
            <span className="contact-next__v">{w.v}</span>
          </li>
        ))}
      </ol>

      {/* ★ NADPIS DĚLÁ Z ALTERNATIVY ALTERNATIVU. Bez něj stojí vyplněná
          dlaždice s e-mailem vedle hlavního tlačítka jako druhá stejně silná
          nabídka; se slovem „nebo" je z ní ústupová cesta pro toho, kdo
          formuláře zásadně nevyplňuje. Jedno slovo, celá hierarchie. */}
      <p className="contact-or label reveal" style={delay(3.8, 6)}>
        <span>{t({ cs: 'Nebo rovnou', en: 'Or reach me directly' })}</span>
      </p>

      <a className="contact-primary reveal" style={delay(4, 6)} href={MAILTO}>
        <span className="contact-primary__k">
          <Icon name="mail" size={15} />
          {t({ cs: 'E-mail', en: 'Email' })}
        </span>
        <span className="contact-primary__v">{EMAIL}</span>
        <span className="contact-primary__n">
          {t({ cs: 'Odpovím do 24 hodin, i o víkendu.', en: 'I reply within 24 hours, weekends included.' })}
        </span>
        <span className="contact-primary__go" aria-hidden="true">
          →
        </span>
      </a>

      {/* aria-live: bez něj je „Zkopírováno" čistě vizuální zpětná vazba a pro
          odečítač obrazovky se po stisku nestane vůbec nic. */}
      <button type="button" className={`copy-btn reveal${copied ? ' is-copied' : ''}`} style={delay(4.3, 6)} onClick={copy}>
        <Icon name={copied ? 'check' : 'copy'} size={14} />
        <span aria-live="polite">
          {copied
            ? t({ cs: 'Zkopírováno', en: 'Copied' })
            : t({ cs: 'Kopírovat adresu', en: 'Copy address' })}
        </span>
      </button>

      <ul className="channels">
        {contactChannelsHome().map((c, i) => (
          <li key={c.label} className="reveal" style={delay(4.6 + i * 0.3, 6)}>
            <a
              className={`channel${c.tone ? ` channel--${c.tone}` : ''}`}
              href={c.href}
              /* Ikona i šipka jsou aria-hidden, takže by z odkazu zbylo jen číslo.
                 Jméno se skládá ručně a nezávisí na tom, co je zrovna vidět. */
              aria-label={`${c.label}: ${c.value}. ${c.note}`}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              <span className="channel__k">
                <Icon name={c.icon} size={15} />
                {c.label}
              </span>
              <span className="channel__v">{c.value}</span>
              <span className="channel__n">{c.note}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Tichý řádek pod vším: tři důvody, proč se ozvat nebojí. Táž trojice
          stojí pod formulářem na `/kontakt` — je to jeden slib řečený na obou
          koncích téže cesty. */}
      <p className="contact-trust label reveal" style={delay(5.2, 6)}>
        {t({
          cs: 'Nezávazně · Odpověď do 24 hodin · Diskrétně',
          en: 'No obligation · Reply within 24 hours · Confidential',
        })}
      </p>
    </div>
  )
}

function Footer() {
  return (
    /* ★ `footer--stage` je hák pro podlahový scrim (sections.css). Patička na
       úvodu je JEDINÁ, která stojí přímo pod krychlí — a v sekci 05 je kamera
       nejblíž, takže jí spodní rozsvícená hrana skla vede přesně přes řádek
       s odkazy. Patičky podstránek ten scrim nemají a ani ho nepotřebují. */
    <footer className="footer footer--stage reveal" style={delay(5, 6)}>
      {/* ★ ZNAČKA SE VRACÍ AŽ TADY. V navigaci je býk sám (viz ui/Mark.tsx), takže
          jméno webu musí mít někde v dokumentu i psanou podobu — pro člověka, který
          si ho chce opsat, i pro to, aby se lockup „býk + bejcek.it" vůbec někde
          ukázal celý. Patička je na to správné místo: nekřičí a je vždycky nakonec. */}
      <p className="footer__mark">
        <Mark size={24} />
        <span>
          bejcek<b>.it</b>
        </span>
      </p>

      {/* GitHub NENÍ kontaktní kanál, je to důkaz — proto stojí tady a ne mezi
          výzvami k akci nahoře. Kdo si chce ověřit, že ten člověk opravdu píše kód,
          ho najde; komu jde o poptávku, tomu nepřekáží. */}
      {/* Tři položky. Čtvrtá by řádek na 1920 zlomila za třetí a na konci
          prvního řádku by zůstala viset osiřelá oddělovací tečka — proto tu
          nejsou žádné další odkazy a proto se sem projekty vešly jen výměnou
          za nic. Je to druhá cesta na /projekty pro toho, kdo dorolloval až sem. */}
      <p className="footer__links">
        {/* ★ Kontakt první: od zavedení formuláře je to cíl všech výzev k akci
            a patička je poslední místo, kde se na něj dá jít. */}
        <a href={localPath(CONTACT_HREF)}>{t({ cs: 'Kontakt', en: 'Contact' })}</a>
        <span aria-hidden="true">·</span>
        <a href={localPath('/projekty')}>{t({ cs: 'Projekty', en: 'Work' })}</a>
        <span aria-hidden="true">·</span>
        <a href={GITHUB} target="_blank" rel="noreferrer">
          <Icon name="github" size={14} />
          github.com/bjkyz
        </a>
        <span aria-hidden="true">·</span>
        <span>© {new Date().getFullYear()} Jiří Bejček</span>
      </p>

      {/* ★ CC BY 4.0 ATRIBUCE. Není to zdvořilost, ale podmínka licence, a musí
          obsahovat VŠECHNY ČTYŘI věci: název díla, autora, licenci s odkazem
          a informaci, že dílo bylo UPRAVENO. Model jsme upravili (přebarvené
          materiály, překomprimovaná geometrie), takže bez posledního bodu by
          atribuce byla neúplná a licence porušená. Neodstraňovat, nezkracovat. */}
      <p className="footer__legal">
        {t({ cs: 'Postaveno v Reactu a three.js. 3D model ', en: 'Built with React and three.js. 3D model ' })}
        <a href="https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf" target="_blank" rel="noreferrer">
          {t({ cs: '„Primary Ion Drive“', en: '“Primary Ion Drive”' })}
        </a>
        {t({ cs: ' od Mikea Murdocka, licence ', en: ' by Mike Murdock, licensed under ' })}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        {t({
          cs: '. Model byl upraven (barvy materiálů, komprese geometrie).',
          en: '. The model has been modified (material colors, geometry compression).',
        })}
      </p>
    </footer>
  )
}
