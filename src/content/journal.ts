/**
 * ═══════════ ŽURNÁL: DATOVÁ VRSTVA ═══════════
 *
 * Články nejsou v tomhle souboru — každý je vlastní JSON v `articles/`, protože
 * je tam ZAPISUJE ROBOT (`api/cron/publish-article.ts` je commitne přes GitHub
 * API a Vercel na push nasadí nový build). Jeden článek = jeden soubor je
 * jediný tvar, u kterého se dva souběžné zápisy nemůžou přebít a u kterého jde
 * článek stáhnout z webu smazáním jednoho souboru.
 *
 * ★ ČLÁNKY SE NAČÍTAJÍ PŘI BUILDU, NE ZA BĚHU. `import.meta.glob` s `eager`
 *   je statická analýza: Vite ty JSONy vloží do bundlu, prerender z nich udělá
 *   hotové HTML a v prohlížeči nikdy neproběhne jediný požadavek na obsah.
 *   Žurnál tedy nemá databázi, nemá API a nemá co spadnout — je to statický web,
 *   který se jednou denně přestaví.
 *
 * ★★ VŠECHNO ODVOZENÉ SE POČÍTÁ TADY, NE V KOMPONENTĚ. Doba čtení, sousední
 *   články, URL, seskupení podle témat. Důvod je hydratace: stránka se
 *   prerenderuje v Nodu a v prohlížeči se hydratuje, takže server a klient musí
 *   dojít ke stejnému výsledku. Cokoli, co by se počítalo z `Date.now()` nebo
 *   z náhody, by hydrataci rozbilo — proto je tenhle modul čistá funkce dat.
 */


/* ═══════════ TÉMATA ═══════════ */

/**
 * ★ ČÍSELNÍK TÉMAT BYDLÍ V `content/topics.ts` a tady se jen re-exportuje.
 *   Musel se odstěhovat, protože ho čte i serverless funkce cronu — a ta si
 *   s tímhle souborem nesmí přitáhnout `import.meta.glob` níž, kterému rozumí
 *   jen Vite. Pro zbytek webu se nic nemění: `TOPICS` i `TOPIC_MIN_ARTICLES`
 *   se dál importují odsud.
 */
export type { Topic } from './topics'
export { TOPIC_MIN_ARTICLES, TOPIC_SLUGS, TOPICS } from './topics'

import type { Topic } from './topics'
import { TOPIC_MIN_ARTICLES, TOPICS } from './topics'

/* ═══════════ ČLÁNEK ═══════════ */

/** Stavební blok textu. ★ Nikdy HTML — do DOM se skládá v ui/ArticleBody.tsx. */
export type Block =
  | { t: 'p'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'quote'; text: string; cite?: string }
  /** Zvýrazněná deska „co si z toho odnést". `k` je popisek, `text` obsah. */
  | { t: 'note'; k: string; text: string }

/** Zdroj, ze kterého článek vychází. ★ Povinně s odkazem — jinak to není zdroj. */
export interface Source {
  title: string
  /** Vydavatel, ne doména: „Reuters", ne „reuters.com". */
  publisher: string
  url: string
  /** ISO datum vydání zdroje, pokud ho kanál uvedl. */
  published?: string
}

/**
 * Tvar, který zapisuje robot do `articles/*.json`.
 * ★ Cokoli navíc se při načtení ignoruje; cokoli chybějícího shodí build
 *   (viz `assertArticle`) — tichý článek bez nadpisu je horší než spadlý build.
 */
export interface RawArticle {
  slug: string
  title: string
  /** Perex: první odstavec a zároveň meta description. 120–170 znaků. */
  perex: string
  /** ISO datum vydání (YYYY-MM-DD). */
  published: string
  /** ISO datum poslední úpravy. */
  updated?: string
  topics: string[]
  entities: string[]
  sources: Source[]
  blocks: Block[]
  /** ★ Věta „co to znamená pro vaši firmu". Tohle je důvod, proč žurnál existuje. */
  takeaway: string
  faq?: { q: string; a: string }[]
  /** Kotva služby na úvodu, ke které článek vede. */
  service?: 'ai' | 'automatizace' | 'software' | 'proces'
  /** Transparentnost: čím a kdy byl text sepsán. Renderuje se pod článkem. */
  generated?: { model: string; at: string }
}

/** Článek s dopočítanými poli. Tohle vidí komponenty. */
export interface Article extends RawArticle {
  /** Absolutní cesta na webu, bez domény. */
  path: string
  /** Odhad doby čtení v minutách, min. 1. */
  readingMinutes: number
  /** Počet slov — čte ho `wordCount` ve strukturovaných datech. */
  words: number
  /** Témata dohledaná v číselníku (neznámá se zahodí). */
  resolvedTopics: Topic[]
}

/* ═══════════ NAČTENÍ ═══════════ */

/* ★ `eager: true` je nutné: líný glob by vracel promisy a prerender by musel
   být asynchronní kvůli obsahu, který je stejně celý známý při buildu. */
const modules = import.meta.glob<{ default: RawArticle }>('./articles/*.json', { eager: true })

function words(a: RawArticle): number {
  const parts: string[] = [a.perex, a.takeaway]
  for (const b of a.blocks) {
    if (b.t === 'ul') parts.push(...b.items)
    else if (b.t === 'note') parts.push(b.text)
    else parts.push(b.text)
  }
  for (const f of a.faq ?? []) parts.push(f.q, f.a)
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

/**
 * ★ CHYBĚJÍCÍ POLE SHODÍ BUILD. Robot píše do repozitáře bez dozoru, takže
 * jediné místo, kde se dá vadný článek ještě zachytit, je build — pak už je
 * venku. Radši červené CI než stránka s prázdným nadpisem.
 */
function assertArticle(a: RawArticle, file: string): void {
  const miss = (['slug', 'title', 'perex', 'published', 'takeaway'] as const).filter((k) => !a[k])
  if (miss.length) throw new Error(`Žurnál: ${file} nemá ${miss.join(', ')}`)
  if (!Array.isArray(a.blocks) || a.blocks.length === 0) throw new Error(`Žurnál: ${file} nemá žádný text`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.published)) throw new Error(`Žurnál: ${file} má vadné datum „${a.published}"`)
  if (!/^[a-z0-9-]+$/.test(a.slug)) throw new Error(`Žurnál: ${file} má vadný slug „${a.slug}"`)
}

function enrich(raw: RawArticle): Article {
  const w = words(raw)
  return {
    ...raw,
    path: `/clanky/${raw.slug}`,
    words: w,
    /* 180 slov za minutu: česká odborná próza se čte pomaleji než anglická
       beletrie, na které stojí obvyklých 250. Radši nadhodnotit čas než slíbit
       dvě minuty a nechat člověka číst pět. */
    readingMinutes: Math.max(1, Math.round(w / 180)),
    resolvedTopics: raw.topics.map((s) => TOPICS.find((t) => t.slug === s)).filter((t): t is Topic => Boolean(t)),
  }
}

/**
 * Všechny články, od nejnovějšího.
 * ★ Druhotné řazení podle slugu je proti nedeterminismu: dva články z téhož dne
 *   by jinak mohly na serveru a v prohlížeči vyjít v jiném pořadí a hydratace
 *   by spadla.
 */
export const ARTICLES: Article[] = Object.entries(modules)
  .map(([file, mod]) => {
    assertArticle(mod.default, file)
    return enrich(mod.default)
  })
  .sort((a, b) => (a.published === b.published ? a.slug.localeCompare(b.slug) : b.published < a.published ? -1 : 1))

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}

export function articlesByTopic(slug: string): Article[] {
  return ARTICLES.filter((a) => a.topics.includes(slug))
}

/** Témata, která přerostla práh — jediná, na která se smí odkazovat. */
export const LIVE_TOPICS: Topic[] = TOPICS.filter((t) => articlesByTopic(t.slug).length >= TOPIC_MIN_ARTICLES)

export function isLiveTopic(slug: string): boolean {
  return LIVE_TOPICS.some((t) => t.slug === slug)
}

/**
 * ★ SOUVISEJÍCÍ ČLÁNKY SE POČÍTAJÍ, NETABULKUJÍ.
 *
 * Robot by je vyplnit nemohl: v okamžiku, kdy píše, ještě neví, co vyjde příště,
 * takže by odkazy stárly jedním směrem. Skóre je hloupé schválně — shoda témat
 * váží nejvíc (to je téma), shoda entit doplňuje (to je konkrétní firma) a při
 * rovnosti vyhrává novější. Nula shod je pořád lepší než prázdno, takže se
 * seznam nakonec doplní nejnovějšími: článek bez odchozích odkazů je pro
 * procházení webu slepá ulička.
 */
export function relatedArticles(a: Article, limit = 3): Article[] {
  const scored = ARTICLES.filter((x) => x.slug !== a.slug).map((x) => ({
    a: x,
    score:
      x.topics.filter((t) => a.topics.includes(t)).length * 3 +
      x.entities.filter((e) => a.entities.includes(e)).length,
  }))
  scored.sort((p, q) => (q.score === p.score ? (p.a.published < q.a.published ? 1 : -1) : q.score - p.score))
  return scored.slice(0, limit).map((s) => s.a)
}

/** Nejnovější články pro patičku a rozcestníky. */
export function latestArticles(limit: number): Article[] {
  return ARTICLES.slice(0, limit)
}

/** „11. srpna 2026" — česky, bez závislosti na locale prohlížeče. */
const MONTHS = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
]

/**
 * ★ VLASTNÍ FORMÁTOVÁNÍ, NE `toLocaleDateString`. Node při prerenderu a
 * prohlížeč se v českém datu liší mezerami i tvarem, a rozdíl v jediném znaku
 * mezi serverovým a klientským renderem zahodí celou hydrataci. Ruční složení
 * dá stejný řetězec všude.
 */
export function czechDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}. ${MONTHS[m - 1]} ${y}`
}

/**
 * ★ ANGLICKÝ TVAR TÉHOŽ DATA, a ze stejného důvodu ručně. Články jsou psané
 *   česky, ale odkazují se na ně i anglické stránky (`/en/services`) a datum
 *   „14. srpna 2026" je v anglické větě cizí těleso. Skládá se to stejně jako
 *   výš — `toLocaleDateString` se mezi Nodem a prohlížečem liší a rozdíl
 *   v jediném znaku zahodí hydrataci.
 */
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function englishDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS_EN[m - 1]} ${d}, ${y}`
}

/** Kotva žurnálu v navigaci a patičce. Na jednom místě, ať se nerozejde. */
export const JOURNAL_PATH = '/clanky'
export const JOURNAL_LABEL = 'ŽURNÁL'
