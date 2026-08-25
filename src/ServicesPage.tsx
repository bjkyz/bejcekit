import { serviceGroups, techStack } from './content/i18n'
import { CONTACT_HREF, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { latestArticles } from './content/journal'
import { czechDate, englishDate } from './content/journal'
import { isEn, localPath, t } from './lib/lang'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import Certificate from './ui/Certificate'
import Icon from './ui/Icons'
import { PageFooter, PageNav } from './ui/PageShell'
import Button from './ui/Button'

/**
 * ═══════════ STRÁNKA /sluzby ═══════════
 *
 * ★ CO SE NEVEŠLO NA KRYCHLI. Úvod má šest stěn a sedmá ho shodí (README),
 *   takže na něm stojí jen tři nejčastěji prodávané věci. Tady je celý katalog:
 *   AI systémy, automatizace, interní nástroje, SaaS, anonymizace dat a web,
 *   pod nimi technologie a doložená kvalifikace.
 *
 * ★★ STAVBA STRÁNKY JE OBCHODNÍ, NE ABECEDNÍ:
 *     1. NÁMITKA NAPŘED. „Nemusíte vědět, co potřebujete" stojí hned pod H1,
 *        protože je to ta věc, která návštěvníka nejčastěji zastaví dřív, než
 *        se vůbec doptá.
 *     2. KATALOG. Šest skupin, každá se svým seznamem. Ať si člověk najde svůj
 *        případ vlastníma očima; univerzální „řešení na míru" nenajde nikdo.
 *     3. TECHNOLOGIE. Až za nabídkou, protože zákazník kupuje výsledek.
 *     4. DŮKAZ. Kdo to staví a čím to doloží (certifikát). Tohle je poslední
 *        věc před výzvou k akci schválně: E-E-A-T i konverze chtějí totéž,
 *        totiž vědět, komu se píše.
 *
 * ★ ŽÁDNÝ WEBGL A ŽÁDNÝ LENIS, stejně jako na /projekty a /clanky.
 */
export default function ServicesPage() {
  const reduced = useReducedMotion()
  const main = useReveal<HTMLElement>(!reduced)
  /* Tři nejnovější články: dělá to z katalogu živou stránku a je to poctivý
     odkaz z nejsilnější obchodní stránky na nejčerstvější obsah. */
  const latest = latestArticles(3)
  const GROUPS = serviceGroups()
  const date = isEn() ? englishDate : czechDate

  return (
    <>
      <a className="skip-link" href="#katalog">
        {t({ cs: 'Přeskočit na služby', en: 'Skip to services' })}
      </a>

      <div className="bg-field" aria-hidden="true" />

      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active={localPath('/sluzby')} ctaHref={localPath(CONTACT_HREF)} />

      <main className="page page--services" ref={main}>
        <header className="page__head svc-head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            {t({ cs: '[ SLUŽBY ]', en: '[ SERVICES ]' })}
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            {t({ cs: 'Řešení pro práci, která vás dnes zdržuje.', en: 'Solutions for the work slowing you down today.' })}
          </h1>
          {/* První věta byla doslova hero úvodu („Nemusíte vědět, jestli
              potřebujete agenta, API nebo databázi") — úvod PRODÁVÁ, tahle
              stránka VYJMENOVÁVÁ, takže si silnější formulaci nechává úvod. */}
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            {t({
              cs: 'AI, automatizace, software nebo web. Vy určíte cíl. Já vyberu technologii a dodám funkční řešení.',
              en: 'AI, automation, software, or a website. You define the goal. I choose the technology and deliver a working solution.',
            })}
          </p>
          {/* ★ `.svc-head__claim` odstraněn. Byly to tři nominální fráze bez
              konkrétního obsahu („Méně manuální práce. Méně zbytečných nástrojů.
              Víc času na to podstatné.") a navíc kopie punchu skupiny AUTOMATION
              o kus níž na téže stránce. Prázdné místo po nich je zisk, ne díra. */}
        </header>

        {/* ── KATALOG ────────────────────────────────────────────── */}
        <div id="katalog">
          {GROUPS.map((g, i) => (
            <section className="svc reveal" style={revealDelay(i, GROUPS.length)} key={g.num} id={g.code.toLowerCase().replace(/\s+/g, '-')}>
              <div className="svc__head">
                <p className="svc__code label">
                  <span className="svc__num">{g.num}</span>
                  {g.code}
                </p>
                <h2 className="headline svc__title">{g.title}</h2>
                <p className="svc__lead">{g.lead}</p>
              </div>

              <ul className="svc__items">
                {g.items.map((it) => (
                  <li className="svc__item" key={it.k}>
                    <span className="svc__item-k">{it.k}</span>
                    <span className="svc__item-v">{it.v}</span>
                  </li>
                ))}
              </ul>

              {g.punch && (
                <p className="svc__punch">
                  {g.punch}
                  {/* Odkaz na stěnu krychle, kde se totéž prodává. Provazuje
                      katalog s úvodem oběma směry, což je to, co z webu dělá
                      souvislý graf místo tří ostrovů. */}
                  {g.anchor && (
                    <a className="svc__anchor label" href={`${localPath('/')}#${g.anchor}`}>
                      {t({ cs: 'Ukázat na úvodu', en: 'See it on the home page' })}
                      <Icon name="back" size={12} />
                    </a>
                  )}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* ── TECHNOLOGIE ────────────────────────────────────────── */}
        <section className="svc-tech reveal" aria-labelledby="tech-h">
          <h2 className="headline" id="tech-h">
            {t({ cs: 'Technologie podle úkolu.', en: 'Technology chosen for the job.' })}
          </h2>
          <p className="svc__lead">
            {t({
              cs: 'Použiji nejjednodušší řešení, které splní cíl a půjde bezpečně provozovat. Někdy je to skript, jindy celá aplikace.',
              en: 'I use the simplest solution that meets the goal and can run safely. Sometimes that is a script, sometimes a full application.',
            })}
          </p>
          <dl className="techgrid">
            {/* ★ `grp`, ne `t` — `t` je překladová funkce (lib/lang.ts) a parametr
                s tímtéž jménem by ji uvnitř bloku zastínil. */}
            {techStack().map((grp) => (
              <div className="techgrid__cell" key={grp.group}>
                <dt className="label">{grp.group}</dt>
                <dd>
                  <ul className="stack">
                    {grp.items.map((x) => (
                      <li className="stack__chip" key={x}>
                        {x}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── KDO TO STAVÍ + CERTIFIKÁT ──────────────────────────── */}
        <section className="svc-about reveal" aria-labelledby="about-h">
          <div className="svc-about__text">
            <p className="kicker label">{t({ cs: '[ KDO TO STAVÍ ]', en: '[ WHO BUILDS IT ]' })}</p>
            <h2 className="headline" id="about-h">
              {t({ cs: 'Jsem Jiří Bejček.', en: "I'm Jiří Bejček." })}
            </h2>
            {/* ★ JEDEN ODSTAVEC, NE DVA. Původní znění mělo 57 slov a obojí, co
                z nich vypadlo, tam bylo dvakrát: výčet za dvojtečkou („webové
                aplikace, interní nástroje, SaaS…") je katalog, kterým návštěvník
                právě prorolloval o šest skupin výš, a druhý odstavec říkal touž
                věc dvěma způsoby („nechci proto, že lze" / „chci, co má důvod").
                Hierarchii tohohle bloku stejně nese `svc-about__method` pod ním —
                pět sloves, která řeknou o práci víc než dva odstavce prózy. */}
            <p className="body">
              {t({
                cs: 'Hledám místa, kde software ušetří čas, sníží chybovost nebo umožní nový produkt. Stavím jen to, co má jasný přínos.',
                en: 'I look for places where software saves time, reduces errors, or enables a new product. I only build what has a clear benefit.',
              })}
            </p>
            <p className="svc-about__method label">
              {t({
                cs: 'Pochopit · Navrhnout · Postavit · Zjednodušit · Automatizovat',
                en: 'Understand · Design · Build · Simplify · Automate',
              })}
            </p>
          </div>

          <Certificate />
        </section>

        {/* ── ŽURNÁL ────────────────────────────────────────────── */}
        {latest.length > 0 && (
          <section className="svc-journal reveal" aria-labelledby="journal-h">
            <h2 className="art__block-h label" id="journal-h">
              {t({ cs: 'Jak o tom přemýšlím', en: 'How I think about it' })}
            </h2>
            <ul className="svc-journal__list">
              {latest.map((a) => (
                <li key={a.slug}>
                  {/* ★ `hrefLang` — žurnál vychází jen česky (viz ROUTES v lib/lang.ts).
                      Nadpis bloku to říká i vidoucím, tenhle atribut odečítači
                      a vyhledávači. */}
                  <a href={a.path} hrefLang="cs">
                    {a.title}
                  </a>
                  <span className="svc-journal__date label">
                    <time dateTime={a.published}>{date(a.published)}</time>
                  </span>
                </li>
              ))}
            </ul>
            <p className="svc-journal__more label">
              <a href="/clanky" hrefLang="cs">
                {t({ cs: 'Celý žurnál', en: 'The full journal (Czech)' })}
              </a>
            </p>
          </section>
        )}

        {/* ── VÝZVA K AKCI ──────────────────────────────────────── */}
        <section className="page__cta" id="poptavka" aria-labelledby="cta-h">
          <h2 className="headline" id="cta-h">
            {t({ cs: 'Máte konkrétní problém?', en: 'Do you have a specific problem?' })}
          </h2>
          {/* ★ TŘI ŘEČNICKÉ OTÁZKY BYLY KATALOG POTŘETÍ. A poslední dvě věty byly
              doslovná kopie nadpisu i odstavce sekce KONTAKT na úvodu — tedy dva
              indexované dokumenty se stejným odstavcem. */}
          <p className="body">
            {t({
              cs: 'Popište ho několika větami. Do 24 hodin navrhnu další krok.',
              en: "Describe it in a few sentences. I'll suggest the next step within 24 hours.",
            })}
          </p>
          <div className="page__cta-row">
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
          <p className="page__cta-trust label">
            {t({
              cs: 'Nezávazně · Odpověď do 24 hodin · Pevná cena písemně',
              en: 'No obligation · Reply within 24 hours · Fixed price in writing',
            })}
          </p>
        </section>

        <PageFooter active={localPath('/sluzby')} />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
