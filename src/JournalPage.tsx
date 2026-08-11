import type { Article, Topic } from './content/journal'
import { articlesByTopic, ARTICLES, LIVE_TOPICS } from './content/journal'
import { CONTACT_HREF, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { useReducedMotion, useReveal } from './lib/hooks'
import { topicPath } from './lib/journal-route'
import { revealDelay } from './lib/reveal'
import ArticleCard from './ui/ArticleCard'
import BullSeal from './ui/BullSeal'
import Icon from './ui/Icons'
import { PageFooter, PageNav } from './ui/PageShell'

/**
 * ═══════════ ROZCESTNÍK ŽURNÁLU ═══════════
 *
 * Jedna komponenta pro dvě stránky: `/clanky` (všechno) a `/clanky/tema/<téma>`
 * (výřez). Je to schválně jeden soubor — rozdíl mezi nimi je nadpis, popisek
 * a filtr seznamu, takže dvě komponenty by byly dvě kopie téhož s rizikem, že
 * se jedna časem opraví a druhá ne.
 *
 * ★ ŽÁDNÝ WEBGL, ŽÁDNÝ LENIS — stejně jako na `/projekty` a ze stejných důvodů:
 *   krychle by na stránce, kde se čte, soupeřila s textem, a Lenis je leštidlo
 *   pro scénu; bez scény je to jen vrstva JS mezi kolečkem a stránkou. Tady je
 *   navíc nativní scroll přímo podmínka: v článku se hledá očima a prstem.
 *
 * ★★ PEČEŤ S BÝKEM JE TU JEDNOU A VELKÁ. Žurnál je nejmladší část webu a nemá
 *   vlastní obraz — reference mají snímky, úvod má krychli, články mají jen
 *   písmo. Značka v pohybu je to, co tuhle stránku drží ve stejném světě jako
 *   zbytek webu, aniž by musela nést jediný kilobajt three.js.
 */

export const JOURNAL_CTA_ANCHOR = 'napiste-mi'

export default function JournalPage({ topic }: { topic?: Topic }) {
  const reduced = useReducedMotion()
  const main = useReveal<HTMLElement>(!reduced)

  const list: Article[] = topic ? articlesByTopic(topic.slug) : ARTICLES
  const title = topic ? topic.title : 'Co se v technologiích právě mění. A co s tím.'
  const lead = topic
    ? topic.description
    : /* Druhá věta popisovala rozvržení, které čtenář uvidí o 200 px níž
         („Co to znamená v praxi", „Odkud to vychází"). Věta o tiskové zprávě
         a panice je jediná v odstavci, která má hlas — ta zůstává. */
      'Novinky z umělé inteligence a technologií přeložené do řeči firem. Většina toho, co se o AI píše, je buď tisková zpráva, nebo panika. Tohle je pokus o třetí možnost.'

  return (
    <>
      <a className="skip-link" href="#clanky">
        Přeskočit na články
      </a>

      <div className="bg-field" aria-hidden="true" />

      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active="/clanky" ctaHref={`#${JOURNAL_CTA_ANCHOR}`} />

      <main className="page page--journal" ref={main}>
        {/* ── HLAVIČKA ────────────────────────────────────────────
            Dvousloupcová: text vlevo, pečeť vpravo. Pod 900 px se pečeť
            přesune pod text a zmenší — nezmizí, protože je to jediný obraz,
            který tahle část webu má. */}
        <header className="jhead">
          <div className="jhead__text">
            {/* Drobečky vedou zpátky a odpovídají strukturovaným datům
                (lib/seo.ts). Musí sedět obojí — rozpor mezi viditelnou cestou
                a tou ve značkování je přesně to, co Google trestá. */}
            {topic ? (
              <nav className="crumbs label" aria-label="Drobečková navigace">
                <a href="/clanky">Žurnál</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{topic.label}</span>
              </nav>
            ) : (
              <p className="kicker label reveal" style={revealDelay(0, 5)}>
                [ ŽURNÁL ]
              </p>
            )}

            <h1 className="display reveal" style={revealDelay(0.6, 5)}>
              {title}
            </h1>
            <p className="body reveal" style={revealDelay(1.2, 5)}>
              {lead}
            </p>

            {/* ★ ROZCESTNÍK TÉMAT SE UKÁŽE, AŽ MÁ NA CO ODKAZOVAT. `LIVE_TOPICS`
                jsou jen témata se třemi a víc články (content/journal.ts) —
                odkaz na skoro prázdnou stránku je pro návštěvníka zklamání
                a pro vyhledávač slabý obsah. */}
            {LIVE_TOPICS.length > 0 && (
              <nav className="jtopics reveal" style={revealDelay(1.8, 5)} aria-label="Témata">
                <a className={`jtopic label${topic ? '' : ' is-active'}`} href="/clanky">
                  Vše
                </a>
                {LIVE_TOPICS.map((t) => (
                  <a
                    className={`jtopic label${topic?.slug === t.slug ? ' is-active' : ''}`}
                    href={topicPath(t.slug)}
                    key={t.slug}
                    aria-current={topic?.slug === t.slug ? 'page' : undefined}
                  >
                    {t.label}
                  </a>
                ))}
              </nav>
            )}

            <p className="jhead__rss label reveal" style={revealDelay(2.2, 5)}>
              <a href="/rss.xml">
                <Icon name="external" size={13} />
                Odebírat kanál (RSS)
              </a>
            </p>
          </div>

          <div className="jhead__seal reveal" style={revealDelay(1.4, 5)}>
            <BullSeal variant="hero" />
          </div>
        </header>

        {/* ── SEZNAM ─────────────────────────────────────────────── */}
        <section id="clanky" aria-label="Články">
          {list.length === 0 ? (
            /* Prázdný stav není chyba, je to první den provozu. Musí říct,
               co se stane dál, ne se omluvit. */
            <p className="jempty body">
              Tady zatím nic není. Nový díl vychází každý den ráno – nebo si můžete{' '}
              <a href={`#${JOURNAL_CTA_ANCHOR}`}>napsat rovnou</a>.
            </p>
          ) : (
            <ul className="jgrid">
              {list.map((a, i) => (
                <li className="jgrid__cell reveal" style={revealDelay(i, Math.max(list.length, 4))} key={a.slug}>
                  <ArticleCard a={a} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <JournalCta />
        <PageFooter active="/clanky" />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}

/**
 * Výzva k akci pod seznamem i pod článkem.
 *
 * ★ NAVAZUJE NA TO, CO ČLOVĚK PRÁVĚ ČETL. Obecné „napište mi" pod odborným
 *   textem je nabídka bez souvislosti; tady je to nabídka spočítat, jestli se
 *   ta věc, o které si právě četl, vyplatí zrovna jemu.
 */
export function JournalCta() {
  return (
    <section className="page__cta" id={JOURNAL_CTA_ANCHOR} aria-labelledby="journal-cta-h">
      <h2 className="headline" id="journal-cta-h">
        Zajímá vás, co z toho platí pro vás?
      </h2>
      <p className="body">
        Napište mi, co řešíte, vlastními slovy. Do 24 hodin víte, jestli se do toho vůbec vyplatí jít, co to bude
        stát a kdy to bude hotové. Když se to nevrátí, řeknu to rovnou.
      </p>
      <div className="page__cta-row">
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
      <p className="page__cta-trust label">Nezávazně · Odpověď do 24 hodin · Bez obchodníka</p>
    </section>
  )
}
