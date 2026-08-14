import { useEffect, useRef, useState } from 'react'
import { CONTACT_ENDPOINT, CONTACT_PATH, HONEYPOT_FIELD, LIMITS } from './content/contact'
import { contactChannelsPage, contactFaq, inquiryKinds, whatHappens } from './content/i18n'
import { EMAIL, WHATSAPP } from './content/sections'
import { getLang, isEn, localPath, t } from './lib/lang'
import { useReducedMotion, useReveal } from './lib/hooks'
import { revealDelay } from './lib/reveal'
import Icon from './ui/Icons'
import { PageFooter, PageNav } from './ui/PageShell'

/**
 * ═══════════ STRÁNKA /kontakt ═══════════
 *
 * ★★ PROČ VZNIKLA: všechna CTA na webu dosud vedla buď na kotvu `#kontakt`
 *   (tedy na scroll přes pět obrazovek WebGL), nebo rovnou na `mailto:`.
 *   Obojí je vysoký práh — `mailto:` navíc otevře cizí aplikaci a prázdné okno
 *   s otázkou „co mám napsat". Tři pole ten práh sundají na minimum.
 *
 * ★★★ FORMULÁŘ MUSÍ FUNGOVAT I BEZ JAVASCRIPTU. Má `action` i `method`, takže
 *   ho prohlížeč umí odeslat sám a `api/contact.ts` na `Accept: text/html`
 *   odpoví přesměrováním místo JSONu. JavaScript pak jen VYLEPŠUJE: odešle
 *   to na pozadí, ukáže chybu u konkrétního pole a nechá stránku být.
 *   Na webu, kde se hydratuje až po `load` a `requestIdleCallback`, je to
 *   navíc jediný způsob, jak zaručit, že formulář funguje od první vteřiny.
 *
 * ★ HYDRATACE: server ani první klientský render NESMÍ sáhnout na `location`.
 *   Stav „odesláno" z URL (návrat z verze bez JS) se proto čte až v efektu —
 *   táž past jako `sceneState` ve stavovém panelu (React #418).
 */

type Status = 'idle' | 'sending' | 'ok' | 'error'

/**
 * Chybové hlášky z URL (verze bez JS) na text. Klíče posílá `api/contact.ts`.
 *
 * ★★ KLÍČE ZŮSTÁVAJÍ ČESKÉ I V ANGLICKÉ VERZI (`?chyba=jmeno`). Je to protokol
 *   mezi funkcí a stránkou, ne text pro člověka — a `api/contact.ts` se schválně
 *   na nic neimportuje (viz jeho hlavička), takže každý přejmenovaný klíč je
 *   dvojí změna na dvou místech, která se dřív nebo později rozejde. Překládá
 *   se HLÁŠKA, ne klíč.
 */
function urlErrors(): Record<string, string> {
  return isEn()
    ? {
        jmeno: 'Please enter your name.',
        email: "That address doesn't look valid.",
        zprava: `Please write at least ${LIMITS.message.min} characters so I know what this is about.`,
        limit: 'Too many messages came from one address. Try again in a bit, or reach me directly.',
        konfigurace: "The form isn't set up right now. Please email me or message me on WhatsApp.",
        odeslani: "The message couldn't be sent. Please try again, or message me on WhatsApp.",
        obecna: 'Something went wrong. Please try again, or reach me directly.',
      }
    : {
        jmeno: 'Napište prosím své jméno.',
        email: 'Tahle adresa nevypadá platně.',
        zprava: `Napište prosím aspoň ${LIMITS.message.min} znaků, ať vím, o co jde.`,
        limit: 'Zpráv z jedné adresy přišlo moc. Zkuste to za chvíli, nebo napište přímo.',
        konfigurace: 'Formulář teď není nastavený. Napište mi prosím přímo na e-mail nebo WhatsApp.',
        odeslani: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na WhatsApp.',
        obecna: 'Něco se pokazilo. Zkuste to prosím znovu, nebo napište přímo.',
      }
}

export default function ContactPage() {
  const reduced = useReducedMotion()
  const main = useReveal<HTMLElement>(!reduced)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [field, setField] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const okRef = useRef<HTMLDivElement>(null)

  /**
   * ★ ZNAČKA ČASU PRO ANTISPAM. Vyplní se až v efektu, tedy v prohlížeči —
   *   kdyby stála v renderu, měl by ji prerender zapečenou v HTML a u statické
   *   stránky servírované z CDN by byla stará klidně týden. Robot by ji navíc
   *   viděl ve zdroji. Bez JS zůstane prázdná a server tu kontrolu přeskočí.
   */
  useEffect(() => {
    const el = formRef.current?.elements.namedItem('startedAt') as HTMLInputElement | null
    if (el) el.value = String(Date.now())
  }, [])

  /* Návrat z odeslání bez JS: `?odeslano=1` nebo `?chyba=...`. Až v efektu. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const messages = urlErrors()
    if (q.get('odeslano') === '1') {
      setStatus('ok')
    } else if (q.get('chyba')) {
      setStatus('error')
      setError(messages[q.get('chyba') ?? 'obecna'] ?? messages.obecna)
    }
    /* Parametr se z adresy uklidí, aby obnovení stránky neukázalo hlášku znovu
       a aby se odkaz nedal poslat s cizím stavem. */
    if (q.has('odeslano') || q.has('chyba')) {
      window.history.replaceState({}, '', localPath(CONTACT_PATH))
    }
  }, [])

  /* Po úspěchu přesuneme ohnisko na potvrzení — jinak uživatel klávesnice
     ani odečítač obrazovky nemají jak zjistit, že se něco stalo. */
  useEffect(() => {
    if (status === 'ok') okRef.current?.focus()
  }, [status])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    /* ★ preventDefault až TADY, ne v atributu: kdyby JS spadl dřív, formulář
       se pořád odešle nativně. */
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    setField('')

    const body = Object.fromEntries(new FormData(e.currentTarget) as unknown as Iterable<[string, string]>)
    try {
      const resp = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await resp.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string }
      if (resp.ok && data.ok) {
        setStatus('ok')
        formRef.current?.reset()
        return
      }
      setStatus('error')
      setError(data.error || urlErrors().obecna)
      setField(data.field ?? '')
    } catch {
      setStatus('error')
      setError(
        t({
          cs: 'Nepodařilo se spojit se serverem. Zkuste to prosím znovu, nebo napište na WhatsApp.',
          en: "Couldn't reach the server. Please try again, or message me on WhatsApp.",
        }),
      )
    }
  }

  return (
    <>
      <a className="skip-link" href="#formular">
        {t({ cs: 'Přeskočit na formulář', en: 'Skip to the form' })}
      </a>

      <div className="bg-field" aria-hidden="true" />
      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active={localPath(CONTACT_PATH)} ctaHref="#formular" />

      <main className="page page--contact" ref={main}>
        <header className="page__head ctc-head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            {t({ cs: '[ KONTAKT ]', en: '[ CONTACT ]' })}
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            {t({ cs: 'Řekněte mi, co potřebujete vyřešit.', en: 'Tell me what you need solved.' })}
          </h1>
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            {t({
              cs: 'Nemusíte znát technologii ani mít zadání. Popište problém vlastními slovy. Do 24 hodin víte, co to bude stát a kdy to bude hotové.',
              en: "You don't need to know the technology or have a spec. Describe the problem in your own words. Within 24 hours you'll know what it costs and when it will be done.",
            })}
          </p>
        </header>

        <div className="ctc">
          {/* ── FORMULÁŘ ──────────────────────────────────────────
              ★ `noValidate` NENÍ vypnutá validace. Prohlížeč by jinak ukázal
                vlastní bublinu v systémovém vzhledu a s vlastním textem, což
                na tomhle webu vypadá jako cizí těleso. Pravidla (`required`,
                `minLength`) zůstávají — čte je odečítač obrazovky i server. */}
          <section className="ctc-form reveal" id="formular" style={revealDelay(1.8, 5)} aria-labelledby="form-h">
            <h2 className="ctc-form__h headline" id="form-h">
              {t({ cs: 'Napište mi', en: 'Send me a message' })}
            </h2>

            {status === 'ok' ? (
              /* `tabIndex={-1}` kvůli přesunu ohniska, `role="status"` kvůli ohlášení. */
              <div className="ctc-ok" ref={okRef} tabIndex={-1} role="status">
                <p className="ctc-ok__k">
                  <Icon name="check" size={16} />
                  {t({ cs: 'Odesláno', en: 'Sent' })}
                </p>
                <p className="ctc-ok__t">
                  {t({
                    cs: 'Díky. Ozvu se do 24 hodin, i o víkendu. Když to spěchá, napište mi rovnou na ',
                    en: "Thanks. I'll get back to you within 24 hours, weekends included. If it's urgent, message me on ",
                  })}
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form
                ref={formRef}
                className="ctc-form__body"
                method="post"
                action={CONTACT_ENDPOINT}
                onSubmit={submit}
                noValidate
              >
                {/* ★★ HONEYPOT. Skrytý CSS třídou, ne `type="hidden"` — skryté
                    pole robot pozná podle typu a nevyplní ho. `tabIndex={-1}`
                    a `autoComplete="off"`, aby na něj nešlo tabovat a aby ho
                    prohlížeč nepředvyplnil skutečnému člověku.
                    `aria-hidden` proto, aby o něm nevěděl ani odečítač. */}
                <div className="ctc-trap" aria-hidden="true">
                  <label htmlFor="ctc-website">{t({ cs: 'Nevyplňujte, prosím', en: 'Please leave this empty' })}</label>
                  <input id="ctc-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <input type="hidden" name="startedAt" defaultValue="" />
                {/* ★★ JAZYK JDE S FORMULÁŘEM. Bez JS odpovídá `api/contact.ts`
                    PŘESMĚROVÁNÍM — a bez tohohle pole by anglického návštěvníka
                    poslalo na českou `/kontakt?odeslano=1`. Podle téhož pole
                    funkce volí i jazyk chybových hlášek. */}
                <input type="hidden" name="lang" value={getLang()} readOnly />

                <div className="ctc-row">
                  <div className="ctc-field">
                    <label className="ctc-label label" htmlFor="ctc-name">
                      {t({ cs: 'Jméno', en: 'Name' })}
                    </label>
                    <input
                      className={`ctc-input${field === 'name' ? ' is-bad' : ''}`}
                      id="ctc-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      minLength={LIMITS.name.min}
                      maxLength={LIMITS.name.max}
                      placeholder={t({ cs: 'Jan Novák', en: 'Jane Doe' })}
                    />
                  </div>
                  <div className="ctc-field">
                    <label className="ctc-label label" htmlFor="ctc-email">
                      {t({ cs: 'E-mail', en: 'Email' })}
                    </label>
                    <input
                      className={`ctc-input${field === 'email' ? ' is-bad' : ''}`}
                      id="ctc-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={LIMITS.email.max}
                      placeholder={t({ cs: 'jan@firma.cz', en: 'jane@company.com' })}
                    />
                  </div>
                </div>

                <div className="ctc-field">
                  <label className="ctc-label label" htmlFor="ctc-company">
                    {t({ cs: 'Firma', en: 'Company' })}{' '}
                    <span className="ctc-opt">{t({ cs: 'nepovinné', en: 'optional' })}</span>
                  </label>
                  <input
                    className="ctc-input"
                    id="ctc-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    maxLength={LIMITS.company.max}
                    placeholder={t({ cs: 'Firma s.r.o.', en: 'Acme Inc.' })}
                  />
                </div>

                {/* ★ VÝBĚR TÉMATU JE POMŮCKA PRO PISATELE, NE SEGMENTACE.
                    Prázdné textové pole je nejtěžší část každého formuláře;
                    když si člověk nejdřív klikne na téma, má o čem psát.
                    Radiobuttony, ne <select>: pět možností se vejde na obrazovku
                    a jeden klik je míň práce než otevřít a vybrat. */}
                <fieldset className="ctc-kinds">
                  <legend className="ctc-label label">
                    {t({ cs: 'S čím potřebujete pomoct?', en: 'What do you need help with?' })}{' '}
                    <span className="ctc-opt">{t({ cs: 'nepovinné', en: 'optional' })}</span>
                  </legend>
                  <div className="ctc-kinds__row">
                    {inquiryKinds().map((k) => (
                      <label className="ctc-chip" key={k.value}>
                        <input type="radio" name="kind" value={k.value} />
                        <span>{k.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="ctc-field">
                  <label className="ctc-label label" htmlFor="ctc-message">
                    {t({ cs: 'Co potřebujete vyřešit?', en: 'What do you need solved?' })}
                  </label>
                  <textarea
                    className={`ctc-input ctc-textarea${field === 'message' ? ' is-bad' : ''}`}
                    id="ctc-message"
                    name="message"
                    required
                    rows={6}
                    minLength={LIMITS.message.min}
                    maxLength={LIMITS.message.max}
                    placeholder={t({
                      cs: 'Například: každý den ručně přepisujeme objednávky z e-mailů do systému. Zabere to dvě hodiny denně a děláme v tom chyby.',
                      en: 'For example: every day we retype orders from emails into our system by hand. It takes two hours a day and we keep making mistakes.',
                    })}
                  />
                </div>

                {status === 'error' && (
                  /* `role="alert"` ohlásí chybu okamžitě, i když se ohnisko nehnulo. */
                  <p className="ctc-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="ctc-actions">
                  <button className="btn btn--solid" type="submit" disabled={status === 'sending'}>
                    <Icon name="mail" size={15} />
                    {status === 'sending'
                      ? t({ cs: 'Odesílám…', en: 'Sending…' })
                      : t({ cs: 'Odeslat poptávku', en: 'Send inquiry' })}
                  </button>
                  <p className="ctc-trust label">
                    {t({
                      cs: 'Nezávazně · Odpověď do 24 hodin · Diskrétně',
                      en: 'No obligation · Reply within 24 hours · Confidential',
                    })}
                  </p>
                </div>
              </form>
            )}
          </section>

          {/* ── KANÁLY A CO BUDE DÁL ────────────────────────────── */}
          <aside className="ctc-side">
            <section className="ctc-block reveal" style={revealDelay(2.4, 5)} aria-labelledby="kanaly-h">
              <h2 className="ctc-block__h label" id="kanaly-h">
                {t({ cs: 'Nebo rovnou', en: 'Or reach me directly' })}
              </h2>
              <ul className="channels">
                {contactChannelsPage().map((c) => (
                  <li key={c.label}>
                    <a
                      className={`channel${c.tone ? ` channel--${c.tone}` : ''}`}
                      href={c.href}
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
            </section>

            {/* ★ NEJČASTĚJŠÍ DŮVOD, PROČ SE ČLOVĚK FORMULÁŘI VYHNE, NENÍ NEDŮVĚRA,
                ALE NEJISTOTA: netuší, co odesláním spustí. Kdo ví, že první krok
                je nezávazná odpověď a ne obchodník na telefonu, odešle spíš. */}
            <section className="ctc-block reveal" style={revealDelay(3, 5)} aria-labelledby="dal-h">
              <h2 className="ctc-block__h label" id="dal-h">
                {t({ cs: 'Co bude dál', en: 'What happens next' })}
              </h2>
              <ol className="ctc-steps">
                {whatHappens().map((s, i) => (
                  <li className="ctc-step" key={s.k}>
                    <span className="ctc-step__i" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="ctc-step__k">{s.k}</span>
                    <span className="ctc-step__v">{s.v}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        {/* ── ČASTÉ DOTAZY ────────────────────────────────────────
            Kromě toho, že sundávají námitky těsně před odesláním, jsou to
            jediná strukturovaná data typu FAQPage mimo články — a kontakt
            je ta stránka, která má vydělávat. Značkování je v kontakt.html. */}
        <section className="ctc-faq reveal" aria-labelledby="faq-h">
          <h2 className="headline" id="faq-h">
            {t({ cs: 'Než napíšete', en: 'Before you write' })}
          </h2>
          <dl className="ctc-faq__list">
            {contactFaq().map((f) => (
              <div className="ctc-faq__item" key={f.q}>
                <dt>{f.q}</dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="ctc-faq__more label">
            {t({ cs: 'Nenašli jste odpověď? Napište na ', en: "Didn't find your answer? Email " })}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </section>

        <PageFooter active={localPath(CONTACT_PATH)} />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
