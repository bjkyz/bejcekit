import { useEffect, useRef, useState } from 'react'
import {
  CONTACT_CHANNELS_PAGE,
  CONTACT_ENDPOINT,
  CONTACT_FAQ,
  CONTACT_PATH,
  HONEYPOT_FIELD,
  INQUIRY_KINDS,
  LIMITS,
  WHAT_HAPPENS,
} from './content/contact'
import { EMAIL, WHATSAPP } from './content/sections'
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

/** Chybové hlášky z URL (verze bez JS) na text. Klíče posílá `api/contact.ts`. */
const URL_ERRORS: Record<string, string> = {
  jmeno: 'Napište prosím své jméno.',
  email: 'Tahle adresa nevypadá platně.',
  zprava: `Napište prosím aspoň ${LIMITS.message.min} znaků, ať vím, o co jde.`,
  limit: 'Zpráv z jedné adresy přišlo moc. Zkuste to za chvíli, nebo napište přímo.',
  konfigurace: 'Formulář teď není nastavený. Napište mi prosím přímo na e-mail nebo WhatsApp.',
  odeslani: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na WhatsApp.',
  obecna: 'Něco se pokazilo. Zkuste to prosím znovu, nebo napište přímo.',
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
    if (q.get('odeslano') === '1') {
      setStatus('ok')
    } else if (q.get('chyba')) {
      setStatus('error')
      setError(URL_ERRORS[q.get('chyba') ?? 'obecna'] ?? URL_ERRORS.obecna)
    }
    /* Parametr se z adresy uklidí, aby obnovení stránky neukázalo hlášku znovu
       a aby se odkaz nedal poslat s cizím stavem. */
    if (q.has('odeslano') || q.has('chyba')) {
      window.history.replaceState({}, '', CONTACT_PATH)
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
      setError(data.error || URL_ERRORS.obecna)
      setField(data.field ?? '')
    } catch {
      setStatus('error')
      setError('Nepodařilo se spojit se serverem. Zkuste to prosím znovu, nebo napište na WhatsApp.')
    }
  }

  return (
    <>
      <a className="skip-link" href="#formular">
        Přeskočit na formulář
      </a>

      <div className="bg-field" aria-hidden="true" />
      <div className="frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <PageNav active={CONTACT_PATH} ctaHref="#formular" />

      <main className="page page--contact" ref={main}>
        <header className="page__head ctc-head">
          <p className="kicker label reveal" style={revealDelay(0, 5)}>
            [ KONTAKT ]
          </p>
          <h1 className="display reveal" style={revealDelay(0.6, 5)}>
            Řekněte mi, co potřebujete vyřešit.
          </h1>
          <p className="body reveal" style={revealDelay(1.2, 5)}>
            Nemusíte znát technologii ani mít zadání. Popište problém vlastními slovy. Do 24 hodin víte, co to bude
            stát a kdy to bude hotové.
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
              Napište mi
            </h2>

            {status === 'ok' ? (
              /* `tabIndex={-1}` kvůli přesunu ohniska, `role="status"` kvůli ohlášení. */
              <div className="ctc-ok" ref={okRef} tabIndex={-1} role="status">
                <p className="ctc-ok__k">
                  <Icon name="check" size={16} />
                  Odesláno
                </p>
                <p className="ctc-ok__t">
                  Díky. Ozvu se do 24 hodin, i o víkendu. Když to spěchá, napište mi rovnou na{' '}
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
                  <label htmlFor="ctc-website">Nevyplňujte, prosím</label>
                  <input id="ctc-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <input type="hidden" name="startedAt" defaultValue="" />

                <div className="ctc-row">
                  <div className="ctc-field">
                    <label className="ctc-label label" htmlFor="ctc-name">
                      Jméno
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
                      placeholder="Jan Novák"
                    />
                  </div>
                  <div className="ctc-field">
                    <label className="ctc-label label" htmlFor="ctc-email">
                      E-mail
                    </label>
                    <input
                      className={`ctc-input${field === 'email' ? ' is-bad' : ''}`}
                      id="ctc-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={LIMITS.email.max}
                      placeholder="jan@firma.cz"
                    />
                  </div>
                </div>

                <div className="ctc-field">
                  <label className="ctc-label label" htmlFor="ctc-company">
                    Firma <span className="ctc-opt">nepovinné</span>
                  </label>
                  <input
                    className="ctc-input"
                    id="ctc-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    maxLength={LIMITS.company.max}
                    placeholder="Firma s.r.o."
                  />
                </div>

                {/* ★ VÝBĚR TÉMATU JE POMŮCKA PRO PISATELE, NE SEGMENTACE.
                    Prázdné textové pole je nejtěžší část každého formuláře;
                    když si člověk nejdřív klikne na téma, má o čem psát.
                    Radiobuttony, ne <select>: pět možností se vejde na obrazovku
                    a jeden klik je míň práce než otevřít a vybrat. */}
                <fieldset className="ctc-kinds">
                  <legend className="ctc-label label">
                    S čím potřebujete pomoct? <span className="ctc-opt">nepovinné</span>
                  </legend>
                  <div className="ctc-kinds__row">
                    {INQUIRY_KINDS.map((k) => (
                      <label className="ctc-chip" key={k.value}>
                        <input type="radio" name="kind" value={k.value} />
                        <span>{k.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="ctc-field">
                  <label className="ctc-label label" htmlFor="ctc-message">
                    Co potřebujete vyřešit?
                  </label>
                  <textarea
                    className={`ctc-input ctc-textarea${field === 'message' ? ' is-bad' : ''}`}
                    id="ctc-message"
                    name="message"
                    required
                    rows={6}
                    minLength={LIMITS.message.min}
                    maxLength={LIMITS.message.max}
                    placeholder="Například: každý den ručně přepisujeme objednávky z e-mailů do systému. Zabere to dvě hodiny denně a děláme v tom chyby."
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
                    {status === 'sending' ? 'Odesílám…' : 'Odeslat poptávku'}
                  </button>
                  <p className="ctc-trust label">Nezávazně · Odpověď do 24 hodin · Diskrétně</p>
                </div>
              </form>
            )}
          </section>

          {/* ── KANÁLY A CO BUDE DÁL ────────────────────────────── */}
          <aside className="ctc-side">
            <section className="ctc-block reveal" style={revealDelay(2.4, 5)} aria-labelledby="kanaly-h">
              <h2 className="ctc-block__h label" id="kanaly-h">
                Nebo rovnou
              </h2>
              <ul className="channels">
                {CONTACT_CHANNELS_PAGE.map((c) => (
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
                Co bude dál
              </h2>
              <ol className="ctc-steps">
                {WHAT_HAPPENS.map((s, i) => (
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
            Než napíšete
          </h2>
          <dl className="ctc-faq__list">
            {CONTACT_FAQ.map((f) => (
              <div className="ctc-faq__item" key={f.q}>
                <dt>{f.q}</dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="ctc-faq__more label">
            Nenašli jste odpověď? Napište na{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </section>

        <PageFooter active={CONTACT_PATH} />
      </main>

      <div className="grain" aria-hidden="true" />
    </>
  )
}
