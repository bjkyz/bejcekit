/**
 * ═══════════ PŘÍJEM POPTÁVKY Z FORMULÁŘE ═══════════
 *
 * Serverless funkce, na kterou míří formulář na `/kontakt`. Za jeden běh:
 *   1. přečte tělo (JSON i `application/x-www-form-urlencoded`)
 *   2. zahodí roboty (honeypot + čas vyplnění)
 *   3. ověří tvar dat proti týmž mezím, jaké hlídá prohlížeč
 *   4. pošle e-mail přes Resend
 *   5. odpoví JSONem (fetch) nebo přesměrováním (formulář bez JS)
 *
 * ★★★ ŽÁDNÝ IMPORT MIMO TENHLE ADRESÁŘ, ANI Z `src/`.
 *   Funkce, která sáhne na TypeScript mimo `api/`, se v nasazení složí ještě
 *   PŘED prvním řádkem handleru a platforma vrátí holé `FUNCTION_INVOCATION_FAILED`
 *   — chybu, ze které se příčina nedá poznat. Stálo to jednou celý den ladění
 *   u cronu (viz hlavička `api/cron/publish-article.ts`), takže se meze níž
 *   OPISUJÍ z `src/content/contact.ts` a nic se neimportuje.
 *
 * ★★ A ŽÁDNÉ SDK. Resend má oficiální balíček, ale REST API je jedno `fetch`
 *   na jednu adresu. Balíček navíc znamená další věc, která se v nasazení může
 *   nerozbalit — a přesně tahle třída chyb je tu nejdražší. Nulová závislost.
 *
 * ★★ CO POTŘEBUJE V NASTAVENÍ VERCELU (Settings → Environment Variables):
 *   RESEND_API_KEY    klíč z https://resend.com (Free tarif: 3 000 mailů/měsíc)
 *   CONTACT_TO        adresa, kam poptávky chodí (např. bejcek.jirka@gmail.com)
 *   CONTACT_FROM      odesílatel, MUSÍ být na ověřené doméně v Resendu.
 *                     Dokud doména není ověřená, funguje „onboarding@resend.dev".
 *                     ★ Až se koupí vlastní doména, změní se jen tahle proměnná.
 *
 *   Když `RESEND_API_KEY` chybí, funkce vrátí čitelnou chybu a NEPŘEDSTÍRÁ úspěch.
 *   Poptávka, která se tváří odeslaně a nikam nedojde, je horší než viditelná chyba.
 */

export const maxDuration = 15

/* ── MEZE ─────────────────────────────────────────────────────
   ★ Opsané z `src/content/contact.ts` (viz hlavička, proč se neimportují).
   Musí souhlasit — klient tytéž meze hlásí uživateli dopředu, server je
   vynucuje. Kdyby se rozešly, projde na klientovi něco, co server odmítne. */
const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 160 },
  company: { max: 120 },
  message: { min: 20, max: 4000 },
}
const HONEYPOT_FIELD = 'website'
const INQUIRY_VALUES = ['ai', 'automatizace', 'software', 'web', 'nevim']

/**
 * ═══════════ DVA JAZYKY, JEDEN ENDPOINT ═══════════
 *
 * ★★★ FORMULÁŘ POSÍLÁ SKRYTÉ POLE `lang`. Řeší to dvě věci najednou, a obě jsou
 *   vidět jen ve verzi BEZ JavaScriptu, tedy tam, kde se nikdy netestuje:
 *     • kam se po odeslání přesměruje (`/kontakt` vs `/en/contact`) — bez toho
 *       by anglický návštěvník po odeslání skončil na české stránce
 *     • v jakém jazyce dostane hlášku
 *
 * ★★ KLÍČE (`?chyba=jmeno`) ZŮSTÁVAJÍ ČESKÉ V OBOU JAZYCÍCH. Je to protokol mezi
 *   funkcí a stránkou, ne text pro člověka; přeložený klíč by znamenal dvě sady
 *   větví na dvou místech, která se rozejdou. Stejné rozhodnutí je zapsané
 *   i v `src/ContactPage.tsx` u `urlErrors()`.
 *
 * ★ CESTY JSOU TU OPSANÉ, protože tenhle soubor nesmí nic importovat (viz
 *   hlavička). Kdyby se anglická cesta změnila, mění se `ROUTES` v
 *   `src/lib/lang.ts` A tenhle řádek.
 */
const PAGE = { cs: '/kontakt', en: '/en/contact' }

const MESSAGES = {
  cs: {
    metoda: 'Použij POST.',
    telo: 'Nepodařilo se přečíst data formuláře.',
    jmeno: 'Napište prosím své jméno.',
    email: 'Tahle adresa nevypadá platně.',
    zpravaShort: `Napište prosím aspoň ${LIMITS.message.min} znaků, ať vím, o co jde.`,
    zpravaLong: 'Zpráva je moc dlouhá.',
    limit: 'Zpráv z jedné adresy přišlo moc. Zkuste to za chvíli, nebo napište přímo na e-mail.',
    konfigurace: 'Formulář teď není nastavený. Napište mi prosím přímo na e-mail nebo WhatsApp.',
    odeslani: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na WhatsApp.',
  },
  en: {
    metoda: 'Use POST.',
    telo: "Couldn't read the form data.",
    jmeno: 'Please enter your name.',
    email: "That address doesn't look valid.",
    zpravaShort: `Please write at least ${LIMITS.message.min} characters so I know what this is about.`,
    zpravaLong: 'That message is too long.',
    limit: 'Too many messages came from one address. Try again in a bit, or email me directly.',
    konfigurace: "The form isn't set up right now. Please email me or message me on WhatsApp.",
    odeslani: "The message couldn't be sent. Please try again, or message me on WhatsApp.",
  },
}

/**
 * ★ NEJKRATŠÍ ROZUMNÁ DOBA VYPLNĚNÍ. Člověk, který má napsat aspoň dvacet
 *   znaků zprávy, to pod tři vteřiny nestihne; skript ano. Je to druhá vrstva
 *   za honeypotem a stojí jedno skryté pole s časovou značkou.
 *   ★★ NESMÍ BÝT PŘÍSNÁ: někdo píše zprávu v poznámkovém bloku a pak ji vloží.
 *      Tři vteřiny odchytí roboty a slušného člověka nikdy.
 */
const MIN_FILL_MS = 3000

/**
 * ★★ RATE LIMIT JE „NEJLEPŠÍ SNAHA", NE ZÁRUKA — a je důležité to vědět.
 *
 * Paměť serverless instance nepřežije studený start a instancí běží víc
 * najednou, takže tenhle limit chytí opakované odeslání z jedné instance
 * (což je drtivá většina skutečného spamu i omylem dvakrát kliknutého tlačítka),
 * ale ne rozprostřený útok.
 *
 * Pro tenhle web to stačí: hlavní obranu dělá honeypot a časový práh, a cena
 * za proklouznutou zprávu je jeden e-mail navíc. Kdyby to přestalo stačit,
 * správné řešení je Upstash Redis (sdílený stav mezi instancemi) — ne zpřísnění
 * tohohle počítadla, protože to by jen víc trestalo lidi za studený start.
 */
const HITS = new Map<string, number[]>()
const RATE = { windowMs: 60 * 60 * 1000, max: 5 }

function tooMany(ip: string): boolean {
  const now = Date.now()
  const fresh = (HITS.get(ip) ?? []).filter((t) => now - t < RATE.windowMs)
  fresh.push(now)
  HITS.set(ip, fresh)
  /* Mapa by jinak rostla donekonečna. Instance stejně žije krátce, ale
     nekonečně rostoucí struktura v dlouhoběžícím procesu je vždycky chyba. */
  if (HITS.size > 500) for (const [k, v] of HITS) if (v.every((t) => now - t > RATE.windowMs)) HITS.delete(k)
  return fresh.length > RATE.max
}

type NodeRes = {
  status: (n: number) => NodeRes
  json: (b: unknown) => unknown
  setHeader: (k: string, v: string) => void
  end: (b?: string) => unknown
}

/** Bezpečný text do HTML e-mailu. Zpráva je cizí vstup a jde do našeho mailu. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * ★ TVAR ADRESY SE KONTROLUJE VOLNĚ, NE DOKONALE. Úplná validace e-mailu podle
 *   RFC je notoricky nemožná a přísný vzorec odmítá platné adresy (tečky, plus,
 *   nové TLD). Jediné, co má smysl ověřit, je „vypadá to jako adresa" — jestli
 *   existuje, se stejně pozná až odpovědí.
 */
function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s) && s.length <= LIMITS.email.max
}

export default async function handler(req: unknown, res?: NodeRes): Promise<Response | unknown> {
  /* ★ DVĚ VOLACÍ KONVENCE. Platforma volá funkci buď webově (`Request` dovnitř,
     `Response` ven), nebo nodovsky (`req, res`). Když se sáhne na `res.status`
     v prostředí, které ho nemá, vyletí TypeError před vlastní logikou a odpovědí
     je holé `FUNCTION_INVOCATION_FAILED`. Rozpoznání stojí pár řádků. */
  const r = req as {
    method?: string
    headers?: unknown
    body?: unknown
    text?: () => Promise<string>
    json?: () => Promise<unknown>
  }

  const header = (name: string): string => {
    const h = r?.headers
    if (h && typeof (h as Headers).get === 'function') return (h as Headers).get(name) ?? ''
    return ((h as Record<string, string> | undefined)?.[name] ?? '') as string
  }

  const json = (status: number, body: unknown) => {
    if (res && typeof res.status === 'function') return res.status(status).json(body)
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  /**
   * ★★★ PROGRESIVNÍ VYLEPŠENÍ. Formulář má `action` i `method`, takže bez
   *   JavaScriptu odešle prohlížeč obyčejný POST a čeká DOKUMENT, ne JSON.
   *   Kdybychom mu vrátili JSON, uvidí ho jako holý text na bílé stránce —
   *   tedy „rozbitý web" přesně ve chvíli, kdy nám někdo poslal poptávku.
   *   Rozliší se to podle `Accept`: prohlížeč posílá `text/html`, `fetch` ne.
   */
  const wantsHtml = header('accept').includes('text/html')
  /* ★ Jazyk se dozvíme až z těla, ale `done()` se používá i PŘED jeho čtením
     (kontrola metody). Proměnná se proto zakládá česky a přepíše se, jakmile
     jsou data přečtená — dřív než kterákoli hláška pro člověka vznikne. */
  let lang: 'cs' | 'en' = 'cs'
  const M = () => MESSAGES[lang]
  const redirect = (status: number, to: string) => {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Location', to)
      return res.status(status).end()
    }
    return new Response(null, { status, headers: { Location: to } })
  }
  /* 303, ne 302: po POSTu musí prohlížeč přejít na GET, jinak nabídne
     při obnovení stránky odeslat formulář znovu. */
  const done = (ok: boolean, code = '') =>
    wantsHtml
      ? redirect(303, ok ? `${PAGE[lang]}?odeslano=1` : `${PAGE[lang]}?chyba=${code || 'obecna'}`)
      : null

  if ((r?.method ?? 'GET') !== 'POST') {
    return done(false, 'metoda') ?? json(405, { error: M().metoda })
  }

  /* ── TĚLO ──────────────────────────────────────────────────
     Přijímáme obě kódování: `fetch` posílá JSON, nativní formulář posílá
     `application/x-www-form-urlencoded`. Bez druhé větve by verze bez JS
     došla až sem a spadla na prázdných datech. */
  /**
   * ★★★ POŘADÍ VĚTVÍ JE TU KRITICKÉ A NENÍ INTUITIVNÍ.
   *
   * První verze zkoušela `if (r.body && typeof r.body === 'object')` napřed —
   * a formulář tím NIKDY nic nepřijal. U webového `Request` totiž `.body` NENÍ
   * rozparsované tělo, ale **ReadableStream**, což je pravdivý objekt. Podmínka
   * tedy prošla, `data` se nastavilo na stream a všechna pole vyšla prázdná:
   * každý pokus skončil hláškou „Napište prosím své jméno", i když jméno vyplněné
   * bylo. (Odhaleno testem nad zabundlovanou funkcí, ne v prohlížeči — v prohlížeči
   * by to vypadalo jako rozbitá validace, ne jako špatně přečtené tělo.)
   *
   * Správné pořadí je proto podle SCHOPNOSTI, ne podle přítomnosti dat:
   *   1. `text()` existuje → je to webový `Request`, tělo se musí přečíst
   *   2. `body` je objekt → nodovská konvence, platforma ho už rozparsovala
   *   3. `body` je řetězec → nodovská konvence bez parseru
   */
  let data: Record<string, string> = {}
  try {
    const type = header('content-type')
    const parse = (raw: string): Record<string, string> =>
      type.includes('application/json')
        ? (JSON.parse(raw || '{}') as Record<string, string>)
        : (Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>)

    if (typeof r.text === 'function') {
      data = parse(await r.text())
    } else if (typeof r.body === 'string') {
      data = parse(r.body)
    } else if (r.body && typeof r.body === 'object') {
      data = r.body as Record<string, string>
    }
  } catch {
    return done(false, 'telo') ?? json(400, { error: MESSAGES.cs.telo })
  }

  const str = (k: string) => (typeof data[k] === 'string' ? data[k].trim() : '')

  /* Od téhle chvíle mluví funkce jazykem odesílatele. */
  if (str('lang') === 'en') lang = 'en'

  /* ── ROBOTI ────────────────────────────────────────────────
     ★ ODPOVÍDÁME 200 A „ODESLÁNO". Vrátit robotovi chybu znamená říct mu,
     že past existuje, a autor skriptu ji příště obejde. Tichý úspěch ho nechá
     v přesvědčení, že to prošlo, a další pokus nepřijde. */
  if (str(HONEYPOT_FIELD)) {
    return done(true) ?? json(200, { ok: true })
  }
  const startedAt = Number(str('startedAt'))
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS) {
    return done(true) ?? json(200, { ok: true })
  }

  /* ── OVĚŘENÍ ───────────────────────────────────────────────
     Chyby se vracejí POJMENOVANĚ (`field`), aby je formulář uměl ukázat
     u toho pole, kterého se týkají, místo obecné hlášky nahoře. */
  const name = str('name')
  const email = str('email')
  const company = str('company').slice(0, LIMITS.company.max)
  const message = str('message')
  const kind = INQUIRY_VALUES.includes(str('kind')) ? str('kind') : ''

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    return done(false, 'jmeno') ?? json(422, { error: M().jmeno, field: 'name' })
  }
  if (!looksLikeEmail(email)) {
    return done(false, 'email') ?? json(422, { error: M().email, field: 'email' })
  }
  if (message.length < LIMITS.message.min) {
    return (
      done(false, 'zprava') ??
      json(422, { error: M().zpravaShort, field: 'message' })
    )
  }
  if (message.length > LIMITS.message.max) {
    return done(false, 'zprava') ?? json(422, { error: M().zpravaLong, field: 'message' })
  }

  /* IP z hlaviček proxy. `x-forwarded-for` může nést řetěz adres; první je klient. */
  const ip = (header('x-forwarded-for').split(',')[0] || header('x-real-ip') || 'neznama').trim()
  if (tooMany(ip)) {
    return (
      done(false, 'limit') ??
      json(429, { error: M().limit })
    )
  }

  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO
  const from = process.env.CONTACT_FROM
  if (!key || !to || !from) {
    /* ★ NEPŘEDSTÍRAT ÚSPĚCH. Formulář, který zprávu spolkne a nikam nepošle,
       je horší než formulář, který viditelně nefunguje: člověk čeká odpověď,
       která nikdy nepřijde, a my o poptávce nevíme. */
    console.error('contact: chybí RESEND_API_KEY / CONTACT_TO / CONTACT_FROM')
    return (
      done(false, 'konfigurace') ??
      json(500, { error: M().konfigurace })
    )
  }

  const kindLabel =
    { ai: 'AI do firmy', automatizace: 'Automatizace procesu', software: 'Software na míru', web: 'Web nebo aplikace', nevim: 'Zatím nevím' }[
      kind
    ] ?? '—'

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        /* ★ `reply_to` na adresu pisatele: odpověď se pak píše prostým
           „Odpovědět", ne kopírováním adresy z těla zprávy. */
        reply_to: email,
        subject: `Poptávka z bejcek.it: ${name}${company ? ` (${company})` : ''}`,
        text: [
          `Jméno:  ${name}`,
          `E-mail: ${email}`,
          company ? `Firma:  ${company}` : null,
          `Téma:   ${kindLabel}`,
          '',
          message,
        ]
          .filter(Boolean)
          .join('\n'),
        html: `<div style="font:15px/1.6 system-ui,sans-serif">
<p><b>${esc(name)}</b>${company ? ` · ${esc(company)}` : ''}<br>
<a href="mailto:${esc(email)}">${esc(email)}</a><br>
Téma: ${esc(kindLabel)}</p>
<hr style="border:0;border-top:1px solid #ddd">
<p style="white-space:pre-wrap">${esc(message)}</p>
</div>`,
      }),
    })

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '')
      console.error('contact: Resend odmítl', resp.status, detail)
      return (
        done(false, 'odeslani') ??
        json(502, { error: M().odeslani })
      )
    }
  } catch (err) {
    console.error('contact:', err)
    return (
      done(false, 'odeslani') ??
      json(502, { error: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na WhatsApp.' })
    )
  }

  return done(true) ?? json(200, { ok: true })
}
