import { SERVICE_GROUPS, TECH_STACK } from './content/services'
import { CONTACT_HREF, PHONE, PHONE_TEL, WHATSAPP } from './content/sections'
import { latestArticles } from './content/journal'
import { czechDate } from './content/journal'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import Certificate from './ui/Certificate'
import Icon from './ui/Icons'
import { PageFooter, PageNav } from './ui/PageShell'

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

  return (
    <>
      <a className="skip-link" href="#katalog">
        Přeskočit na služby
      </a>

      <div className="bg-field" aria-hidden="true" />

      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active="/sluzby" ctaHref={CONTACT_HREF} />

      <main className="page page--services" ref={main}>
        <header className="page__head svc-head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            [ SLUŽBY ]
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            Neprodávám technologie. Řeším problémy.
          </h1>
          {/* První věta byla doslova hero úvodu („Nemusíte vědět, jestli
              potřebujete agenta, API nebo databázi") — úvod PRODÁVÁ, tahle
              stránka VYJMENOVÁVÁ, takže si silnější formulaci nechává úvod. */}
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            Řekněte mi, co dnes zabírá vašemu týmu čas, co nefunguje nebo co chcete vytvořit. Řešení najdu
            a postavím.
          </p>
          {/* ★ `.svc-head__claim` odstraněn. Byly to tři nominální fráze bez
              konkrétního obsahu („Méně manuální práce. Méně zbytečných nástrojů.
              Víc času na to podstatné.") a navíc kopie punchu skupiny AUTOMATION
              o kus níž na téže stránce. Prázdné místo po nich je zisk, ne díra. */}
        </header>

        {/* ── KATALOG ────────────────────────────────────────────── */}
        <div id="katalog">
          {SERVICE_GROUPS.map((g, i) => (
            <section className="svc reveal" style={revealDelay(i, SERVICE_GROUPS.length)} key={g.num} id={g.code.toLowerCase().replace(/\s+/g, '-')}>
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
                    <a className="svc__anchor label" href={`/#${g.anchor}`}>
                      Ukázat na úvodu
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
            Moderní stack. Praktické výsledky.
          </h2>
          <p className="svc__lead">
            Technologii vybírám podle problému, ne podle trendu. Když se úloha dá vyřešit jedním scriptem, nebude
            z toho platforma. Technologie je prostředek, výsledek je produkt.
          </p>
          <dl className="techgrid">
            {TECH_STACK.map((t) => (
              <div className="techgrid__cell" key={t.group}>
                <dt className="label">{t.group}</dt>
                <dd>
                  <ul className="stack">
                    {t.items.map((x) => (
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
            <p className="kicker label">[ KDO TO STAVÍ ]</p>
            <h2 className="headline" id="about-h">
              Jsem Jiří Bejček.
            </h2>
            {/* ★ JEDEN ODSTAVEC, NE DVA. Původní znění mělo 57 slov a obojí, co
                z nich vypadlo, tam bylo dvakrát: výčet za dvojtečkou („webové
                aplikace, interní nástroje, SaaS…") je katalog, kterým návštěvník
                právě prorolloval o šest skupin výš, a druhý odstavec říkal touž
                věc dvěma způsoby („nechci proto, že lze" / „chci, co má důvod").
                Hierarchii tohohle bloku stejně nese `svc-about__method` pod ním —
                pět sloves, která řeknou o práci víc než dva odstavce prózy. */}
            <p className="body">
              Baví mě hledat místa, kde může software udělat práci místo člověka. Nechci stavět software proto, že to
              jde, ale proto, že má důvod existovat.
            </p>
            <p className="svc-about__method label">Pochopit · Navrhnout · Postavit · Zjednodušit · Automatizovat</p>
          </div>

          <Certificate />
        </section>

        {/* ── ŽURNÁL ────────────────────────────────────────────── */}
        {latest.length > 0 && (
          <section className="svc-journal reveal" aria-labelledby="journal-h">
            <h2 className="art__block-h label" id="journal-h">
              Jak o tom přemýšlím
            </h2>
            <ul className="svc-journal__list">
              {latest.map((a) => (
                <li key={a.slug}>
                  <a href={a.path}>{a.title}</a>
                  <span className="svc-journal__date label">
                    <time dateTime={a.published}>{czechDate(a.published)}</time>
                  </span>
                </li>
              ))}
            </ul>
            <p className="svc-journal__more label">
              <a href="/clanky">Celý žurnál</a>
            </p>
          </section>
        )}

        {/* ── VÝZVA K AKCI ──────────────────────────────────────── */}
        <section className="page__cta" id="poptavka" aria-labelledby="cta-h">
          <h2 className="headline" id="cta-h">
            Co bychom mohli vytvořit?
          </h2>
          {/* ★ TŘI ŘEČNICKÉ OTÁZKY BYLY KATALOG POTŘETÍ. A poslední dvě věty byly
              doslovná kopie nadpisu i odstavce sekce KONTAKT na úvodu — tedy dva
              indexované dokumenty se stejným odstavcem. */}
          <p className="body">Napište, co potřebujete vyřešit. Technologii vyberu já.</p>
          <div className="page__cta-row">
            <a className="btn btn--solid" href={CONTACT_HREF}>
              <Icon name="mail" size={15} />
              Pojďme začít
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
          <p className="page__cta-trust label">Nezávazně · Odpověď do 24 hodin · Pevná cena písemně</p>
        </section>

        <PageFooter active="/sluzby" />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
