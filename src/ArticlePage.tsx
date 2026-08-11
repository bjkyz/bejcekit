import { resolveEntities } from './content/entities'
import type { Article } from './content/journal'
import { czechDate, relatedArticles } from './content/journal'
import { SECTIONS } from './content/sections'
import { useReducedMotion, useReveal } from './lib/hooks'
import { topicPath } from './lib/journal-route'
import { AUTHOR_NAME } from './lib/site'
import ArticleBody from './ui/ArticleBody'
import BullSeal from './ui/BullSeal'
import Icon from './ui/Icons'
import { PageFooter, PageNav } from './ui/PageShell'
import { JOURNAL_CTA_ANCHOR, JournalCta } from './JournalPage'

/**
 * ═══════════ DETAIL ČLÁNKU ═══════════
 *
 * ★ TOHLE JE TA STRÁNKA, KVŮLI KTERÉ CELÝ ŽURNÁL EXISTUJE. Rozcestník nikdo
 *   nehledá; do článku se přijde z vyhledávače na konkrétní dotaz. Podle toho
 *   je stavěná: hotová v prvním bajtu odpovědi (prerender), s vlastním titulkem
 *   a strukturovanými daty (lib/seo.ts) a se čtyřmi bloky, které z náhodné
 *   návštěvy dělají něco dalšího.
 *
 * ★★ ČTYŘI BLOKY POD TEXTEM, KAŽDÝ MÁ PRÁVĚ JEDEN ÚKOL:
 *
 *   1) ZMÍNĚNÉ SPOLEČNOSTI — jediné místo, kde z článku vedou odchozí odkazy.
 *      V textu jsou firmy jen vyznačené (ui/ArticleBody.tsx), protože odkaz
 *      uprostřed věty čtenáře odvádí právě ve chvíli, kdy čte. Tady odvádět smí,
 *      protože už dočetl — a pro vyhledávač je to potvrzení, o jakých entitách
 *      ten text je.
 *
 *   2) ZDROJE — odkud to vím. U textu, který sestavil model, je doložitelný
 *      původ to jediné, co ho odlišuje od šumu. Kdyby zdroje chyběly, neměl by
 *      žurnál právo existovat.
 *
 *   3) O AUTOROVI — s pečetí. Google tomu říká E-E-A-T: kdo to píše a proč mu
 *      věřit. Je to zároveň jediný blok, kde se z odborného textu dá přejít
 *      k tomu, že si tu práci jde objednat.
 *
 *   4) SOUVISEJÍCÍ — aby stránka nebyla slepá ulička. Počítá se z dat
 *      (`relatedArticles`), ne zapisuje ručně: ručně psané odkazy stárnou
 *      jedním směrem, protože článek neví, co vyjde po něm.
 */
export default function ArticlePage({ a }: { a: Article }) {
  const reduced = useReducedMotion()
  const main = useReveal<HTMLElement>(!reduced)

  const ents = resolveEntities(a.entities)
  const related = relatedArticles(a)
  const primary = a.resolvedTopics[0]
  /* Odkaz na službu, které se článek týká. Kotva na úvodní stránce, ne nová
     stránka — sekce už tu nabídku umí říct líp, než by ji zopakoval článek. */
  const service = a.service ? SECTIONS.find((s) => s.id === a.service) : undefined

  return (
    <>
      <a className="skip-link" href="#text">
        Přeskočit na článek
      </a>

      <div className="bg-field" aria-hidden="true" />

      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active="/clanky" ctaHref={`#${JOURNAL_CTA_ANCHOR}`} />

      <main className="page page--article" ref={main}>
        <article className="art">
          <header className="art__head">
            {/* Viditelné drobečky MUSÍ sedět s BreadcrumbList v JSON-LD. */}
            <nav className="crumbs label" aria-label="Drobečková navigace">
              <a href="/clanky">Žurnál</a>
              {primary && (
                <>
                  <span aria-hidden="true">/</span>
                  <a href={topicPath(primary.slug)}>{primary.label}</a>
                </>
              )}
            </nav>

            <h1 className="display art__title">{a.title}</h1>

            {/* Perex je zároveň meta description. Jedna věta, dvě práce —
                a hlavně žádná možnost, aby se ta dvě znění rozešla. */}
            <p className="art__perex">{a.perex}</p>

            <p className="art__meta label">
              <time dateTime={a.published}>{czechDate(a.published)}</time>
              <span aria-hidden="true">·</span>
              <span>{a.readingMinutes} min čtení</span>
              <span aria-hidden="true">·</span>
              <span>{AUTHOR_NAME}</span>
            </p>
          </header>

          <div className="art__body" id="text">
            <ArticleBody blocks={a.blocks} />

            {/* ★ ZÁVĚR JE POVINNÉ POLE, NE OZDOBA. Bez něj je článek převyprávěná
                tisková zpráva. Tohle je ta věta, kvůli které to čte člověk, který
                v oboru nepracuje. */}
            <aside className="art__takeaway">
              <p className="art__takeaway-k label">Co to znamená v praxi</p>
              <p>{a.takeaway}</p>
              {service && (
                <p className="art__takeaway-link">
                  <a href={`/#${service.id}`}>
                    {service.headline}
                    <Icon name="back" size={13} />
                  </a>
                </p>
              )}
            </aside>

            {a.faq && a.faq.length > 0 && (
              <section className="art__faq" aria-labelledby="faq-h">
                <h2 className="art__h2" id="faq-h">
                  Časté dotazy
                </h2>
                <dl>
                  {a.faq.map((f, i) => (
                    <div className="art__faq-item" key={i}>
                      <dt>{f.q}</dt>
                      <dd>{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          {/* ── 1. ZMÍNĚNÉ SPOLEČNOSTI ─────────────────────────── */}
          {ents.length > 0 && (
            <section className="art__block" aria-labelledby="ent-h">
              <h2 className="art__block-h label" id="ent-h">
                Zmíněné společnosti a technologie
              </h2>
              <ul className="entlist">
                {ents.map((e) => (
                  <li className="entlist__item" key={e.key}>
                    <a
                      className="entlist__name"
                      href={e.entity.url}
                      target="_blank"
                      rel="noreferrer"
                      /* `nofollow` schválně NENÍ: odkaz na oficiální web firmy,
                         o které článek pojednává, je poctivá citace, ne reklama.
                         Značkovat citace jako nedůvěryhodné je signál naruby. */
                    >
                      {e.entity.name}
                      <Icon name="external" size={12} />
                    </a>
                    <span className="entlist__note">{e.entity.note}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── 2. ZDROJE ──────────────────────────────────────── */}
          {a.sources.length > 0 && (
            <section className="art__block" aria-labelledby="src-h">
              <h2 className="art__block-h label" id="src-h">
                Odkud to vychází
              </h2>
              <ol className="srclist">
                {a.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                    <span className="srclist__pub">
                      {s.publisher}
                      {s.published ? ` · ${czechDate(s.published)}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
              {a.generated && (
                /* ★ PŘIZNANÉ AUTORSTVÍ. Text sestavuje model ze zdrojů výš
                   a redakčně za něj ručí člověk pod ním. Zamlčet to by byla
                   jediná věc, která by tenhle žurnál doopravdy zabila — a je to
                   navíc přesně ten druh přiznání, který dnes hraje ve prospěch
                   důvěryhodnosti, ne proti ní. */
                <p className="srclist__note">
                  Přehled sestavil ze zdrojů výše jazykový model ({a.generated.model}), vychází pod redakční
                  odpovědností Jiřího Bejčka. Našli jste chybu? <a href={`#${JOURNAL_CTA_ANCHOR}`}>Napište mi</a>,
                  opravím to.
                </p>
              )}
            </section>
          )}

          {/* ── 3. O AUTOROVI ──────────────────────────────────── */}
          <section className="byline" aria-labelledby="author-h">
            <BullSeal variant="byline" />
            <div className="byline__text">
              <h2 className="byline__name" id="author-h">
                {AUTHOR_NAME}
              </h2>
              <p className="byline__role label">IT a AI inženýr · Česko</p>
              <p className="byline__bio">
                Stavím weby, které Google najde, nasazuji AI tam, kde ušetří hodiny týdně, a držím v chodu servery,
                aby výpadek nestál tržby. Jeden inženýr místo agentury: pevná cena písemně, odpověď do 24 hodin.
              </p>
              <p className="byline__links label">
                <a href="/">O mně a službách</a>
                <span aria-hidden="true">·</span>
                <a href="/projekty">Reference</a>
                <span aria-hidden="true">·</span>
                <a href={`#${JOURNAL_CTA_ANCHOR}`}>Napsat mi</a>
              </p>
            </div>
          </section>
        </article>

        {/* ── 4. SOUVISEJÍCÍ ───────────────────────────────────── */}
        {related.length > 0 && (
          <section className="art__related" aria-labelledby="rel-h">
            <h2 className="art__block-h label" id="rel-h">
              Číst dál
            </h2>
            <ul className="jgrid">
              {related.map((r) => (
                <li className="jgrid__cell" key={r.slug}>
                  <RelatedCard a={r} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <JournalCta />
        <PageFooter active="/clanky" />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}

/** Zmenšená karta pod článkem. Bez štítků — tady jde o titulek, ne o třídění. */
function RelatedCard({ a }: { a: Article }) {
  return (
    <article className="acard acard--slim">
      <p className="acard__meta label">
        <time dateTime={a.published}>{czechDate(a.published)}</time>
        <span aria-hidden="true">·</span>
        <span>{a.readingMinutes} min</span>
      </p>
      <h3 className="acard__title">
        <a className="acard__link" href={a.path}>
          {a.title}
        </a>
      </h3>
      <p className="acard__perex">{a.perex}</p>
    </article>
  )
}
