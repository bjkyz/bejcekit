/**
 * ═══════════ DENNÍ VYDÁNÍ ŽURNÁLU ═══════════
 *
 * Serverless funkce, kterou jednou denně spustí plánovač Vercelu (`crons`
 * ve vercel.json). Za jeden běh udělá tohle:
 *
 *   1. stáhne oborové RSS kanály a vytáhne z nich čerstvé položky
 *   2. zjistí, o čem už žurnál psal (seznam souborů v repozitáři)
 *   3. nechá Claude sepsat JEDEN článek v pevné struktuře
 *   4. výsledek zkontroluje a znormalizuje
 *   5. commitne ho jako `src/content/articles/<slug>.json` přes GitHub API
 *
 * Push do `master` spustí nasazení na Vercelu, build z JSONu vyrobí statickou
 * stránku (`scripts/prerender.mjs`) a článek je venku. Žádná databáze, žádné
 * API za běhu, žádné místo, kde by web mohl spadnout kvůli obsahu.
 *
 * ★★★ CELÁ TAHLE FUNKCE STOJÍ NA JEDNÉ MYŠLENCE: MODEL NESMÍ VYMYSLET NIC,
 *     CO SE DÁ OVĚŘIT.
 *
 *   • ODKAZY. Model nedostane možnost napsat URL. Dostane očíslovaný seznam
 *     položek z kanálů a vrací ČÍSLA (`sourceIndexes`). Adresu i vydavatele
 *     doplní kód z původních dat. Vymyslet zdroj je tím pádem nemožné, ne
 *     nepravděpodobné.
 *   • FIRMY. Značkují se klíčem do ručně ověřeného rejstříku
 *     (`src/content/entities.ts`), který je ve schématu jako výčet. Firma,
 *     kterou někdo ručně neschválil, se do článku nedostane — a s ní ani
 *     odkaz na ni.
 *   • TÉMATA a SLUŽBY jsou taky výčty, ne volný text.
 *   • DATUM se bere z hodin serveru, ne z textu.
 *
 *   Co zbývá na modelu, je formulace a výběr — tedy přesně to, v čem je dobrý.
 *
 * ★★ CO POTŘEBUJE V NASTAVENÍ VERCELU (Settings → Environment Variables):
 *   ANTHROPIC_API_KEY   klíč k API (https://console.anthropic.com)
 *   GITHUB_TOKEN        fine-grained token s právem Contents: Read and write
 *                       na repozitář bjkyz/bejcekit
 *   GITHUB_REPO         „bjkyz/bejcekit"
 *   GITHUB_BRANCH       „master" (nepovinné, tohle je výchozí)
 *   CRON_SECRET         libovolný náhodný řetězec; Vercel ho sám posílá
 *                       v hlavičce Authorization u naplánovaných běhů
 *   JOURNAL_MODEL       nepovinné, přepíše model (viz MODEL níž)
 *
 * ★★ DÉLKA BĚHU JE 60 s, A JE TO STROP TARIFU HOBBY, NE ODHAD.
 *   Původně tu bylo 300 s (co dovolí Pro). Nasazení tím projde, ale funkce se
 *   pak při KAŽDÉM zavolání složí ještě před vlastním kódem a Vercel vrátí
 *   holé `FUNCTION_INVOCATION_FAILED` — tedy chybu, ze které se příčina nepozná
 *   a která vypadá jako rozbitý kód. Šedesát vteřin platí na obou tarifech.
 *
 *   Výchozí Haiku 4.5 se do nich vejde s rezervou. Kdyby se `JOURNAL_MODEL`
 *   přepnul na silnější model, počítej s minutami: pak je potřeba tarif Pro
 *   A ZÁROVEŇ tohle číslo zvednout. Jedno bez druhého nestačí.
 */
/**
 * ★★★ ŽÁDNÉ IMPORTY MIMO TENHLE ADRESÁŘ. A NENÍ TO ESTETIKA.
 *
 * Funkce původně sahala na `src/content/entities.ts` a `src/content/topics.ts`,
 * tedy na TypeScript mimo `api/`. Nasazení tím projde, ale funkce se pak při
 * každém zavolání složí JEŠTĚ PŘED PRVNÍM ŘÁDKEM handleru a platforma vrátí
 * holé `FUNCTION_INVOCATION_FAILED` — chybu bez jediného slova o příčině, kterou
 * nejde odladit odjinud než z logů. Serverless funkce má být soběstačná.
 *
 * ★★ DUPLICITA SE TÍM ALE NEZAVÁDÍ. Seznamy níž jsou opsané ze zdroje pravdy
 *    (`src/content/entities.ts`, `src/content/topics.ts`) a `scripts/prerender.mjs`
 *    je při KAŽDÉM buildu porovnává. Když se rozejdou, build spadne a řekne,
 *    co přibylo nebo zmizelo. Opsaný seznam, který hlídá stroj, je bezpečnější
 *    než import, který se rozpadne až v provozu.
 *
 * ★ KDYŽ PŘIDÁŠ FIRMU NEBO TÉMA: přidej ho do `src/content/*` a pak sem.
 *   V jakém pořadí, na tom nezáleží; build tě upozorní, dokud to nebude sedět.
 */

/* prerender:topics */
const TOPIC_ENUM = ['ai', 'automatizace', 'weby-a-seo', 'infrastruktura', 'bezpecnost', 'vyvoj']
/* prerender:entities */
const ENTITY_ENUM = [
  'amazon', 'amd', 'anthropic', 'apple', 'aws', 'claude', 'cloudflare', 'databricks',
  'deepmind', 'docker', 'gemini', 'github', 'google', 'huggingface', 'ibm', 'intel',
  'kubernetes', 'linux', 'meta', 'microsoft', 'mistral', 'n8n', 'nvidia', 'openai',
  'oracle', 'postgresql', 'proxmox', 'vercel',
]

export const maxDuration = 60

/**
 * ★ MODEL. Haiku 4.5 je nejrychlejší a nejlevnější člen rodiny a na tenhle
 *   úkol stačí: rozhoduje se z hotového seznamu položek, píše do pevné
 *   struktury a fakta si nesmí vymýšlet (viz hlavička souboru). Tam, kde by
 *   silnější model pomohl, tedy ve formulaci, je rozdíl malý — a rozdíl v ceně
 *   a v době běhu velký. Denní vydání tak vyjde na haléře a vejde se
 *   i do šedesátivteřinového stropu tarifu Hobby.
 *
 * ★★ ZMĚNA MODELU NENÍ JEN ZMĚNA ŘETĚZCE. Rodiny se liší v tom, co API vůbec
 *   přijme (viz `modelOptions` níž): Haiku 4.5 nezná parametr `effort` a vrátí
 *   na něj 400, kdežto Opus 5 nezná `budget_tokens`. Proto se parametry skládají
 *   podle modelu a ne natvrdo — jinak by přepnutí `JOURNAL_MODEL` tiše rozbilo
 *   vydávání a poznalo by se to až z prázdného žurnálu.
 */
const MODEL = process.env.JOURNAL_MODEL ?? 'claude-haiku-4-5'

/**
 * Parametry uvažování podle rodiny modelu.
 *
 * • Haiku 4.5 a Sonnet 4.5: `effort` neexistuje (400), přemýšlení se zapíná
 *   pevným rozpočtem tokenů. Rozpočet MUSÍ být menší než `max_tokens`.
 * • Opus 5 / Sonnet 5 / Opus 4.7+: `budget_tokens` je zrušený (400), uvažování
 *   je adaptivní a hloubku řídí `effort`.
 */
function modelOptions(model: string): Record<string, unknown> {
  const legacy = /haiku-4-5|sonnet-4-5|opus-4-5/.test(model)
  return legacy
    ? { thinking: { type: 'enabled', budget_tokens: 4000 } }
    : { thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } }
}

/* ═══════════ ZDROJE ═══════════ */

/**
 * ★ SEZNAM KANÁLŮ JE JEDINÉ MÍSTO, KDE SE ROZHODUJE, O ČEM ŽURNÁL PÍŠE.
 *
 * Nedostupný nebo přejmenovaný kanál se TIŠE PŘESKOČÍ (`Promise.allSettled`
 * a časový strop níž). Je to schválně: jeden mrtvý feed nesmí zastavit vydání,
 * a zároveň se nemá do článku dostat nic z kanálu, který se nenačetl.
 *
 * Když se seznam mění, měň ho tady. Publisher je jméno pro čtenáře
 * („The Verge"), ne doména.
 */
const FEEDS: { url: string; publisher: string }[] = [
  { url: 'https://techcrunch.com/feed/', publisher: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', publisher: 'The Verge' },
  { url: 'https://arstechnica.com/feed/', publisher: 'Ars Technica' },
  { url: 'https://www.wired.com/feed/rss', publisher: 'Wired' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', publisher: 'BBC Technology' },
  { url: 'https://www.root.cz/rss/clanky/', publisher: 'Root.cz' },
  { url: 'https://www.lupa.cz/rss/clanky/', publisher: 'Lupa.cz' },
  { url: 'https://news.ycombinator.com/rss', publisher: 'Hacker News' },
]

/** Jak staré položky ještě berem. Tři dny pokryjí i výpadek jednoho běhu. */
const MAX_AGE_DAYS = 3
const PER_FEED = 8
const MAX_ITEMS = 40
const FEED_TIMEOUT_MS = 8000

interface FeedItem {
  title: string
  publisher: string
  url: string
  published?: string
  summary: string
}

const stripTags = (s: string): string =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const tag = (xml: string, name: string): string | undefined => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(xml)
  return m ? stripTags(m[1]) : undefined
}

/**
 * Minimalistický čtečka RSS i Atomu.
 *
 * ★ ZÁMĚRNĚ BEZ KNIHOVNY. Potřebujeme čtyři pole ze dvou dobře známých formátů;
 *   plnohodnotný XML parser by přinesl závislost, kterou by nikdo neaktualizoval,
 *   a útočná plocha téhle funkce je cizí XML. Čím míň kódu ho sahá, tím líp.
 */
function parseFeed(xml: string, publisher: string): FeedItem[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? []
  const out: FeedItem[] = []
  for (const b of blocks.slice(0, PER_FEED)) {
    const title = tag(b, 'title')
    /* Atom má odkaz v atributu, RSS v elementu. */
    const href = /<link[^>]*href="([^"]+)"/i.exec(b)?.[1]
    const url = href ?? tag(b, 'link')
    if (!title || !url || !/^https?:\/\//.test(url)) continue
    const raw = tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated')
    const d = raw ? new Date(raw) : undefined
    const published = d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined
    out.push({
      title,
      publisher,
      url,
      published,
      summary: (tag(b, 'description') ?? tag(b, 'summary') ?? tag(b, 'content') ?? '').slice(0, 320),
    })
  }
  return out
}

async function collectItems(): Promise<FeedItem[]> {
  const today = Date.now()
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const res = await fetch(f.url, {
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
        headers: { 'User-Agent': 'bejcek.it journal bot (+https://bejcekit.vercel.app/clanky)' },
      })
      if (!res.ok) throw new Error(`${f.url}: ${res.status}`)
      return parseFeed(await res.text(), f.publisher)
    }),
  )

  const items: FeedItem[] = []
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const it of r.value) {
      if (it.published) {
        const age = (today - new Date(it.published).getTime()) / 86_400_000
        if (age > MAX_AGE_DAYS) continue
      }
      items.push(it)
    }
  }
  /* Prokládat kanály, ne je řadit za sebe: jinak by prvních dvacet položek
     bylo z jednoho zdroje a článek by z něj čerpal celý. */
  const byPublisher = new Map<string, FeedItem[]>()
  for (const it of items) byPublisher.set(it.publisher, [...(byPublisher.get(it.publisher) ?? []), it])
  const mixed: FeedItem[] = []
  for (let i = 0; mixed.length < MAX_ITEMS; i++) {
    let added = false
    for (const list of byPublisher.values()) {
      if (list[i]) {
        mixed.push(list[i])
        added = true
      }
    }
    if (!added) break
  }
  return mixed.slice(0, MAX_ITEMS)
}

/* ═══════════ CO UŽ VYŠLO ═══════════ */

const GH = 'https://api.github.com'

function ghHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'bejcek.it journal bot',
  }
}

const REPO = () => process.env.GITHUB_REPO ?? 'bjkyz/bejcekit'
const BRANCH = () => process.env.GITHUB_BRANCH ?? 'master'
const DIR = 'src/content/articles'

/** Slugy už vydaných článků. Slouží k tomu, aby se témata neopakovala. */
async function existingSlugs(): Promise<string[]> {
  const res = await fetch(`${GH}/repos/${REPO()}/contents/${DIR}?ref=${BRANCH()}`, { headers: ghHeaders() })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub výpis článků: ${res.status} ${await res.text()}`)
  const list = (await res.json()) as { name: string; type: string }[]
  return list.filter((f) => f.type === 'file' && f.name.endsWith('.json')).map((f) => f.name.replace(/\.json$/, ''))
}

/* ═══════════ SCHÉMA VÝSTUPU ═══════════ */

/**
 * ★ STRUKTUROVANÝ VÝSTUP, NE „VRAŤ MI JSON". Schéma se vynucuje na straně API
 *   (`output_config.format`), takže odpověď buď odpovídá, nebo požadavek selže —
 *   a nikdy nedojde na parsování textu, ve kterém model omylem nechal větu.
 *
 * ★★ `sourceIndexes` MÍSTO URL. Tohle je ta nejdůležitější věc v celém souboru:
 *   model volí ČÍSLA do seznamu, který dostal, a odkazy k nim dopisuje kód.
 *   Halucinovaný zdroj tím pádem nemůže vzniknout.
 */
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'title', 'perex', 'topics', 'entities', 'sourceIndexes', 'blocks', 'takeaway', 'faq', 'service'],
  properties: {
    slug: { type: 'string', description: 'URL část bez diakritiky, malá písmena a pomlčky, 3–7 slov.' },
    title: { type: 'string', description: 'Titulek do 70 znaků. Konkrétní tvrzení, ne otázka.' },
    perex: { type: 'string', description: 'Shrnutí na 120–170 znaků. Slouží i jako popisek do vyhledávače.' },
    topics: { type: 'array', items: { type: 'string', enum: TOPIC_ENUM } },
    entities: { type: 'array', items: { type: 'string', enum: ENTITY_ENUM } },
    sourceIndexes: {
      type: 'array',
      items: { type: 'integer' },
      description: 'Čísla položek ze seznamu zdrojů, ze kterých článek vychází. Dvě až pět.',
    },
    service: { type: 'string', enum: ['ai', 'automatizace', 'software', 'proces'] },
    takeaway: { type: 'string', description: 'Co to znamená v praxi pro českou firmu. Dvě až tři věty.' },
    blocks: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['t', 'text'],
            properties: { t: { const: 'p' }, text: { type: 'string' } },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['t', 'text'],
            properties: { t: { const: 'h2' }, text: { type: 'string' } },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['t', 'items'],
            properties: { t: { const: 'ul' }, items: { type: 'array', items: { type: 'string' } } },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['t', 'k', 'text'],
            properties: { t: { const: 'note' }, k: { type: 'string' }, text: { type: 'string' } },
          },
        ],
      },
    },
    faq: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['q', 'a'],
        properties: { q: { type: 'string' }, a: { type: 'string' } },
      },
    },
  },
} as const

/* ═══════════ ZADÁNÍ ═══════════ */

const SYSTEM = `Jsi redaktor odborného žurnálu na webu českého IT a AI inženýra Jiřího Bejčka (bejcek.it).
Píšeš pro majitele a manažery malých a středních českých firem, kteří nemají vlastní IT oddělení.

CÍL KAŽDÉHO ČLÁNKU
Vzít jednu čerstvou novinku z technologií a odpovědět na otázku, kterou si čtenář opravdu klade:
co se změnilo, koho se to týká a co s tím má dělat. Ne převyprávět tiskovou zprávu.

HLAS
- Věcný, konkrétní, bez nadšení a bez paniky. Píšeš jako inženýr, který to i provozuje.
- Krátké věty. Žádná superlativa, žádné "revoluční", "průlomový", "game changer".
- Nepoužívej dlouhou pomlčku (—). Používej krátkou pomlčku (–) nebo dvojtečku.
- Neoslovuj čtenáře v množném čísle jako dav. Piš "vaše firma", ne "my všichni".
- Nikdy nesliboj konkrétní ceny, termíny ani výsledky jménem Jiřího Bejčka.

STAVBA
- 600 až 900 slov v blocích.
- Začni odstavcem, který řekne podstatu. Žádný rozjezd typu "V dnešní době".
- Dva až čtyři nadpisy (h2), mezi nimi odstavce, jeden seznam a nejvýš jedna deska (note).
- Konec patří do pole takeaway, ne do posledního odstavce.
- 2 až 3 časté dotazy, které si čtenář opravdu položí. Odpovědi 2 až 4 věty.

ZNAČKOVÁNÍ FIREM
Firmy a technologie v textu piš jako [[klíč]] nebo [[klíč|tvar slova]], kde klíč je z povoleného
seznamu. Druhý tvar použij vždy, když čeština slovo skloňuje: [[google|Googlu]], [[anthropic|Anthropicu]].
Značkuj jen první dva až tři výskyty, ne každý. Do pole entities dej všechny klíče, které jsi použil.

ZDROJE
Dostaneš očíslovaný seznam čerstvých položek. Vyber 2 až 5 čísel, ze kterých článek vychází,
a napiš je do sourceIndexes. Nikdy nepiš URL ani nevymýšlej zdroje.
Nepiš nic, co v těch položkách není a co bys nemohl doložit. Když si nejsi jistý faktem,
napiš ho opatrněji, nebo ho vynech.`

function buildPrompt(items: FeedItem[], published: string[]): string {
  const list = items
    .map((it, i) => `[${i}] ${it.title}\n    zdroj: ${it.publisher}${it.published ? `, ${it.published}` : ''}\n    ${it.summary}`)
    .join('\n\n')

  return `Dnešní datum: ${new Date().toISOString().slice(0, 10)}

ČERSTVÉ POLOŽKY Z OBOROVÝCH KANÁLŮ:

${list}

UŽ VYDANÉ ČLÁNKY (nesmíš zopakovat téma ani se s nimi překrývat):
${published.length ? published.map((s) => `- ${s}`).join('\n') : '- zatím žádné'}

ÚKOL:
Vyber JEDNU věc z položek výše, která je pro české firmy nejužitečnější, a napiš o ní článek.
Když je ve výběru víc souvisejících položek, spoj je do jednoho tématu a uveď je všechny jako zdroje.
Vyhni se čistě spotřebitelským novinkám (telefony, hry, streamovací služby), pokud z nich neplyne
něco pro firemní IT.`
}

/* ═══════════ KONTROLA A NORMALIZACE ═══════════ */

interface Draft {
  slug: string
  title: string
  perex: string
  topics: string[]
  entities: string[]
  sourceIndexes: number[]
  service: string
  takeaway: string
  blocks: { t: string; text?: string; items?: string[]; k?: string }[]
  faq: { q: string; a: string }[]
}

/** Dům má pravidlo: žádné dlouhé pomlčky. Levnější opravit než odmítnout. */
const houseStyle = (s: string): string => s.replace(/\s*—\s*/g, ' – ').replace(/\s+/g, ' ').trim()

const ENT_RE = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g

/**
 * ★ POSLEDNÍ MÍSTO PŘED REPOZITÁŘEM. Co projde tudy, to za pár minut visí na
 *   webu bez toho, aby to kdokoli viděl. Proto se tu neopravuje jen styl, ale
 *   kontroluje i to, co schéma zaručit neumí: délky, počty a hlavně soulad
 *   mezi textem a daty.
 */
function validate(d: Draft, items: FeedItem[], existing: string[]) {
  const fail = (m: string) => {
    throw new Error(`Kontrola článku: ${m}`)
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) fail(`vadný slug „${d.slug}"`)
  if (existing.includes(d.slug)) fail(`slug „${d.slug}" už existuje`)
  if (d.title.length > 78) fail(`titulek má ${d.title.length} znaků, strop je 78`)
  if (d.perex.length < 100 || d.perex.length > 200) fail(`perex má ${d.perex.length} znaků, čekáno 100–200`)
  if (!d.takeaway || d.takeaway.length < 60) fail('chybí použitelný závěr (takeaway)')
  if (!d.topics.length) fail('článek nemá téma')
  if (d.blocks.length < 5) fail(`jen ${d.blocks.length} bloků textu`)

  /* Zdroje: indexy musí ukazovat do seznamu, který model dostal. */
  const idx = [...new Set(d.sourceIndexes)].filter((i) => Number.isInteger(i) && i >= 0 && i < items.length)
  if (idx.length < 2) fail('méně než dva doložitelné zdroje')
  const sources = idx.slice(0, 5).map((i) => ({
    title: items[i].title,
    publisher: items[i].publisher,
    url: items[i].url,
    ...(items[i].published ? { published: items[i].published } : {}),
  }))

  /* ★★ ENTITY SE BEROU Z TEXTU, NE ZE SEZNAMU. Model může seznam a značky
     v textu rozladit; jediné, co má smysl zapsat do dat, je to, co v textu
     doopravdy je — jinak by se v bloku „Zmíněné společnosti" objevila firma,
     o které článek nemluví, a ve strukturovaných datech by to byla lež. */
  const inText = new Set<string>()
  const scan = (s: string) => {
    ENT_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = ENT_RE.exec(s))) if (ENTITY_ENUM.includes(m[1])) inText.add(m[1])
  }
  scan(d.title)
  scan(d.takeaway)
  for (const b of d.blocks) {
    if (b.text) scan(b.text)
    for (const it of b.items ?? []) scan(it)
  }

  const words = d.blocks
    .flatMap((b) => [b.text ?? '', ...(b.items ?? [])])
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  if (words < 300) fail(`jen ${words} slov`)

  return { sources, entities: [...inText] }
}

/* ═══════════ ZÁPIS DO REPOZITÁŘE ═══════════ */

async function commit(slug: string, json: string, title: string): Promise<string> {
  const res = await fetch(`${GH}/repos/${REPO()}/contents/${DIR}/${slug}.json`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Žurnál: ${title}`,
      content: Buffer.from(json, 'utf8').toString('base64'),
      branch: BRANCH(),
    }),
  })
  if (!res.ok) throw new Error(`GitHub zápis: ${res.status} ${await res.text()}`)
  const body = (await res.json()) as { commit?: { sha?: string } }
  return body.commit?.sha ?? 'neznámý'
}

/* ═══════════ VSTUPNÍ BOD ═══════════ */

/**
 * ★★ HANDLER ZVLÁDNE OBĚ KONVENCE, A NENÍ TO OPATRNICTVÍ.
 *
 * Serverless platformy volají funkci buď webovým způsobem (`Request` dovnitř,
 * `Response` ven), nebo nodovským (`req`, `res`). Který z nich přijde, se pozná
 * až za běhu — a když se to netrefí, vypadá to takhle: `req.headers.get` není
 * funkce, vyletí TypeError ještě před vlastní logikou a odpovědí je holé
 * `FUNCTION_INVOCATION_FAILED` bez jediného slova o příčině. Ladit to na dálku
 * znamená hádat, protože se k logům nemusí nikdo dostat.
 *
 * Rozpoznání stojí dva řádky a odstraňuje celou tu třídu chyb natrvalo.
 */
type NodeRes = { status: (n: number) => NodeRes; json: (b: unknown) => unknown }

export default async function handler(req: unknown, res?: NodeRes): Promise<Response | unknown> {
  const headers = (req as { headers?: unknown } | null)?.headers
  const auth =
    headers && typeof (headers as Headers).get === 'function'
      ? (headers as Headers).get('authorization')
      : ((headers as Record<string, string> | undefined)?.authorization ?? null)

  const json = (status: number, body: unknown) => {
    if (res && typeof res.status === 'function') return res.status(status).json(body)
    return new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  /* ★ AUTORIZACE JE POVINNÁ. Bez ní je tohle veřejný endpoint, který za cizí
     peníze volá jazykový model a commituje do repozitáře. Vercel posílá
     `Authorization: Bearer $CRON_SECRET` sám; ruční spuštění musí hlavičku
     přidat taky. Když proměnná chybí, funkce se odmítne spustit — otevřený
     endpoint je horší než nefunkční. */
  const secret = process.env.CRON_SECRET
  if (!secret) return json(500, { error: 'CRON_SECRET není nastavený' })
  if (auth !== `Bearer ${secret}`) return json(401, { error: 'Neautorizováno' })
  if (!process.env.ANTHROPIC_API_KEY) return json(500, { error: 'ANTHROPIC_API_KEY není nastavený' })
  if (!process.env.GITHUB_TOKEN) return json(500, { error: 'GITHUB_TOKEN není nastavený' })

  try {
    const [items, existing] = await Promise.all([collectItems(), existingSlugs()])
    if (items.length < 5) return json(503, { error: `z kanálů přišlo jen ${items.length} položek, vydání se přeskakuje` })

    /* ★★ SDK SE NAČÍTÁ AŽ TADY, NE NA VRCHOLU MODULU. Dva důvody, oba praktické:
       • Kdyby se balíček v nasazení nerozbalil, selže import ještě před prvním
         řádkem handleru — a serverless platforma na to odpoví holým
         `FUNCTION_INVOCATION_FAILED` bez jediného slova o příčině. Uvnitř `try`
         se z téhle situace stane čitelná hláška v odpovědi.
       • Odmítnutí neautorizovaného požadavku pak nestojí načtení celého SDK. */
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    /* ★ STREAMOVANÝ POŽADAVEK. Při `max_tokens` v desítkách tisíc hrozí
       u nestreamovaného volání timeout HTTP spojení dřív, než model dopíše.
       `finalMessage()` vrátí hotovou zprávu, takže se s událostmi nemusíme
       zabývat — jde jen o to držet spojení živé. */
    const opts = modelOptions(MODEL)
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildPrompt(items, existing) }],
      ...opts,
      /* `output_config` může přijít z `modelOptions` (kvůli `effort`), takže se
         formát doplňuje až tady, aby se ta větev nemohla přepsat. */
      output_config: {
        ...((opts.output_config as Record<string, unknown>) ?? {}),
        format: { type: 'json_schema', schema: SCHEMA },
      },
      /* Typy SDK ještě nemají `output_config.format` pohromadě s adaptivním
         uvažováním; tvar odpovídá dokumentaci API. */
    } as unknown as Parameters<typeof client.messages.stream>[0])

    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') {
      return json(422, { error: 'model odmítl zadání', details: message.stop_details })
    }
    const text = message.content.find((b) => b.type === 'text')
    if (!text || text.type !== 'text') return json(502, { error: 'model nevrátil text' })

    const draft = JSON.parse(text.text) as Draft
    const { sources, entities } = validate(draft, items, existing)

    /* Sestavení finálního souboru. ★ Datum, model i čas doplňuje kód —
       na hodiny a na vlastní jméno se modelu ptát nemá smysl. */
    const article = {
      slug: draft.slug,
      title: houseStyle(draft.title),
      perex: houseStyle(draft.perex),
      published: new Date().toISOString().slice(0, 10),
      topics: draft.topics,
      entities,
      sources,
      service: draft.service,
      blocks: draft.blocks.map((b) =>
        b.t === 'ul'
          ? { t: 'ul', items: (b.items ?? []).map(houseStyle) }
          : b.t === 'note'
            ? { t: 'note', k: houseStyle(b.k ?? 'Poznámka'), text: houseStyle(b.text ?? '') }
            : { t: b.t, text: houseStyle(b.text ?? '') },
      ),
      takeaway: houseStyle(draft.takeaway),
      faq: draft.faq.map((f) => ({ q: houseStyle(f.q), a: houseStyle(f.a) })),
      generated: { model: MODEL, at: new Date().toISOString() },
    }

    const sha = await commit(draft.slug, `${JSON.stringify(article, null, 2)}\n`, article.title)

    return json(200, {
      ok: true,
      slug: article.slug,
      title: article.title,
      sources: sources.length,
      entities,
      commit: sha,
      usage: message.usage,
    })
  } catch (err) {
    /* ★ CHYBA SE HLÁSÍ JAKO CHYBA. Vracet 200 s „nic se nestalo" by znamenalo,
       že se v přehledu plánovače tváří rozbité vydání jako úspěšné a nikdo si
       týden nevšimne, že žurnál stojí. */
    console.error('publish-article:', err)
    return json(500, { error: err instanceof Error ? err.message : String(err) })
  }
}
