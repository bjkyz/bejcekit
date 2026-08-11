/**
 * ═══════════ SEO ENGINE ═══════════
 *
 * ★ JEDINÉ MÍSTO, KDE VZNIKÁ HLAVIČKA STRÁNKY ŽURNÁLU.
 *
 * Titulek, popisek, kanonická adresa, náhled pro sdílení i strukturovaná data
 * se skládají tady a `scripts/prerender.mjs` je jen dosadí do hotového HTML.
 * Kdyby se to psalo v šablonách, byl by u každého článku jiný a po pár desítkách
 * článků by se poznalo, který den kdo šablonu upravil. Takhle má sto článků
 * stejnou disciplínu jako první.
 *
 * ★★ CO TENHLE SOUBOR DĚLÁ NAVÍC PROTI „DÁME TAM JSON-LD":
 *
 * 1) JEDEN SOUVISLÝ GRAF, NE HROMADA ODPOJENÝCH OSTRŮVKŮ. Uzly se odkazují
 *    přes `@id` (`lib/site.ts`), takže Google ví, že autor článku je tentýž
 *    člověk jako provozovatel služby na úvodní stránce. Když se to napíše
 *    pokaždé znovu, vzniknou tři různí Jiří Bejčkové a autorita se nesečte —
 *    a právě sčítání autority je jediný důvod, proč autora značkovat.
 *
 * 2) ENTITY MÍSTO KLÍČOVÝCH SLOV. `mentions` a `about` odkazují přes `sameAs`
 *    na encyklopedická hesla firem (`content/entities.ts`). Článek se tím
 *    zařadí k TÉMATU, o kterém vyhledávač už všechno ví, místo aby soupeřil
 *    o řetězec znaků.
 *
 * 3) PŘIZNANÝ PŮVOD. `citation` a `isBasedOn` nesou zdroje, ze kterých článek
 *    vychází. Není to jen slušnost: u obsahu psaného modelem je doložitelný
 *    původ to jediné, co ho odlišuje od šumu, kterého jsou vyhledávače plné.
 *
 * ★ POZOR NA `</script>` V DATECH. JSON-LD se vkládá dovnitř <script> elementu,
 *   takže sekvence `</script>` kdekoli v textu (třeba v titulku článku) by
 *   element předčasně ukončila a zbytek by se vysypal na stránku. Řeší to
 *   `jsonLdScript` níž — a je to jediné správné místo, kde to řešit.
 */

import { ENTITIES, entitySameAs, resolveEntities } from '../content/entities'
import type { Article, Topic } from '../content/journal'
import { articlesByTopic, czechDate, TOPICS } from '../content/journal'
import { AUTHOR_NAME, ID, SITE_NAME, SITE_ORIGIN } from './site'
import { topicPath } from './journal-route'

/* ═══════════ ESCAPOVÁNÍ ═══════════ */

/** Do textového obsahu HTML. */
export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Do hodnoty atributu v uvozovkách. */
function attr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}

/**
 * JSON-LD jako hotový <script>. Uzavírací značka a oddělovače řádků se
 * escapují na unicode sekvence — v JSONu jsou legální a v HTML neškodné.
 */
function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
  return `<script type="application/ld+json">${json}</script>`
}

const abs = (path: string): string => `${SITE_ORIGIN}${path}`

/* ═══════════ SPOLEČNÉ UZLY GRAFU ═══════════ */

/**
 * Autor. ★ Definuje se JEDNOU (tady) a všude jinde se na něj jen odkazuje
 * přes `@id`. `worksFor` ho spojuje s ProfessionalService z index.html.
 */
function personNode() {
  return {
    '@type': 'Person',
    '@id': ID.person,
    name: AUTHOR_NAME,
    url: abs('/'),
    jobTitle: 'IT a AI inženýr',
    knowsLanguage: ['cs', 'en'],
    knowsAbout: [
      'umělá inteligence',
      'jazykové modely',
      'automatizace procesů',
      'webový vývoj',
      'SEO',
      'Core Web Vitals',
      'IT infrastruktura',
      'virtualizace',
      'kybernetická bezpečnost',
    ],
    sameAs: ['https://github.com/bjkyz'],
    worksFor: { '@id': ID.identity },
  }
}

function webSiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    url: abs('/'),
    name: SITE_NAME,
    inLanguage: 'cs',
    publisher: { '@id': ID.identity },
  }
}

/** Drobečky. Bez nich ukáže Google ve výsledku holou URL místo cesty webem. */
function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  }
}

/** Entita jako uzel grafu. `sameAs` je to, co z řetězce dělá věc. */
function entityNode(key: string) {
  const e = ENTITIES[key as keyof typeof ENTITIES]
  if (!e) return null
  const sameAs = entitySameAs(e)
  return {
    '@type': e.type,
    name: e.name,
    url: e.url,
    ...(sameAs.length ? { sameAs } : {}),
  }
}

/* ═══════════ HLAVIČKY STRÁNEK ═══════════ */

export interface Head {
  /** <title>. Do ~60 znaků, jinak ho Google usekne. */
  title: string
  /** meta description. 120–160 znaků. */
  description: string
  /** Cesta bez domény, např. /clanky/neco. */
  path: string
  /** og:type */
  ogType: 'website' | 'article'
  /** Hotové <script type="application/ld+json"> bloky. */
  jsonLd: unknown[]
  /** Doplňkové og/article meta značky (dvojice jméno–hodnota s property=). */
  meta?: { property: string; content: string }[]
}

/** Rozcestník /clanky. */
export function headForHub(articles: Article[]): Head {
  return {
    title: `Žurnál · AI a technologie prakticky | ${SITE_NAME}`,
    description:
      'Novinky z umělé inteligence a technologií přeložené do řeči firem: co se změnilo, koho se to týká a co s tím udělat. Se zdroji, bez humbuku.',
    path: '/clanky',
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@graph': [
          webSiteNode(),
          personNode(),
          {
            '@type': 'Blog',
            '@id': ID.blog,
            url: abs('/clanky'),
            name: `Žurnál · ${SITE_NAME}`,
            description:
              'Novinky z umělé inteligence a technologií přeložené do řeči firem. Každý díl má uvedené zdroje a odstavec o tom, co to znamená v praxi.',
            inLanguage: 'cs',
            author: { '@id': ID.person },
            publisher: { '@id': ID.identity },
            isPartOf: { '@id': ID.website },
            blogPost: articles.map((a) => ({
              '@type': 'BlogPosting',
              '@id': `${abs(a.path)}#article`,
              headline: a.title,
              url: abs(a.path),
              datePublished: a.published,
              author: { '@id': ID.person },
            })),
          },
          breadcrumb([
            { name: 'Úvod', path: '/' },
            { name: 'Žurnál', path: '/clanky' },
          ]),
        ],
      },
    ],
  }
}

/** Rozcestník tématu /clanky/tema/<téma>. */
export function headForTopic(topic: Topic): Head {
  const list = articlesByTopic(topic.slug)
  return {
    title: `${topic.title} · Žurnál | ${SITE_NAME}`,
    description: topic.description,
    path: topicPath(topic.slug),
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@graph': [
          webSiteNode(),
          personNode(),
          {
            '@type': 'CollectionPage',
            '@id': `${abs(topicPath(topic.slug))}#page`,
            url: abs(topicPath(topic.slug)),
            name: topic.title,
            description: topic.description,
            inLanguage: 'cs',
            isPartOf: { '@id': ID.blog },
            about: { '@type': 'Thing', name: topic.title },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: list.length,
              itemListElement: list.map((a, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: abs(a.path),
                name: a.title,
              })),
            },
          },
          breadcrumb([
            { name: 'Úvod', path: '/' },
            { name: 'Žurnál', path: '/clanky' },
            { name: topic.label, path: topicPath(topic.slug) },
          ]),
        ],
      },
    ],
  }
}

/** Detail článku. Nejhustší uzel na celém webu — a taky ten nejcennější. */
export function headForArticle(a: Article): Head {
  const url = abs(a.path)
  const ents = resolveEntities(a.entities)
  const primary = a.resolvedTopics[0]

  /* `about` je O ČEM to je (pár hlavních entit), `mentions` je KDO SE TAM
     OBJEVIL (všichni). Rozdíl není kosmetický: `about` je silný signál a
     rozmělnit ho dvaceti položkami znamená nemít žádný. */
  const aboutNodes = ents.slice(0, 3).map((e) => entityNode(e.key)).filter(Boolean)
  const mentionNodes = ents.map((e) => entityNode(e.key)).filter(Boolean)

  const article = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: a.title,
    description: a.perex,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: a.published,
    dateModified: a.updated ?? a.published,
    inLanguage: 'cs',
    author: { '@id': ID.person },
    publisher: { '@id': ID.identity },
    isPartOf: { '@id': ID.blog },
    image: [abs('/og.png')],
    wordCount: a.words,
    timeRequired: `PT${a.readingMinutes}M`,
    ...(primary ? { articleSection: primary.label } : {}),
    keywords: [...a.resolvedTopics.map((t) => t.label), ...ents.map((e) => e.entity.name)].join(', '),
    ...(aboutNodes.length ? { about: aboutNodes } : {}),
    ...(mentionNodes.length ? { mentions: mentionNodes } : {}),
    /* ★ PŘIZNANÝ PŮVOD. `citation` je „odkud to vím", `isBasedOn` je „z čeho
       to vychází". Obojí schválně — první čtou vyhledávače, druhé je čitelný
       strojový signál o odvozeném díle. */
    ...(a.sources.length
      ? {
          citation: a.sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.title,
            url: s.url,
            ...(s.published ? { datePublished: s.published } : {}),
            publisher: { '@type': 'Organization', name: s.publisher },
          })),
          isBasedOn: a.sources.map((s) => s.url),
        }
      : {}),
  }

  const graph: unknown[] = [
    webSiteNode(),
    personNode(),
    article,
    breadcrumb([
      { name: 'Úvod', path: '/' },
      { name: 'Žurnál', path: '/clanky' },
      ...(primary ? [{ name: primary.label, path: topicPath(primary.slug) }] : []),
      { name: a.title, path: a.path },
    ]),
  ]

  /* Časté dotazy jako vlastní uzel. Musí být `mainEntity` na FAQPage, ne
     přilepené k článku — jinak to Google jako FAQ nepřečte. */
  if (a.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      isPartOf: { '@id': `${url}#article` },
      mainEntity: a.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  return {
    title: `${a.title} | ${SITE_NAME}`,
    description: a.perex,
    path: a.path,
    ogType: 'article',
    jsonLd: [{ '@context': 'https://schema.org', '@graph': graph }],
    meta: [
      { property: 'article:published_time', content: a.published },
      { property: 'article:modified_time', content: a.updated ?? a.published },
      { property: 'article:author', content: AUTHOR_NAME },
      ...a.resolvedTopics.map((t) => ({ property: 'article:tag', content: t.label })),
    ],
  }
}

/* ═══════════ VYKRESLENÍ HLAVIČKY ═══════════ */

/**
 * Složí obsah bloku mezi `<!-- head:begin -->` a `<!-- head:end -->`.
 *
 * ★ ADRESA JE VŽDYCKY ABSOLUTNÍ A VŽDYCKY KANONICKÁ. Relativní `og:url` nebo
 *   canonical mířící na jinou variantu adresy je nejdražší chyba, kterou v SEO
 *   jde udělat: říká vyhledávači „pravá verze je jinde".
 */
export function renderHead(head: Head): string {
  const url = abs(head.path)
  const lines = [
    `<title>${esc(head.title)}</title>`,
    `<meta name="description" content="${attr(head.description)}" />`,
    `<link rel="canonical" href="${attr(url)}" />`,
    `<meta name="author" content="${attr(AUTHOR_NAME)}" />`,
    `<meta name="theme-color" content="#08090a" />`,
    `<link rel="alternate" type="application/rss+xml" title="Žurnál · ${esc(SITE_NAME)}" href="${attr(abs('/rss.xml'))}" />`,
    `<meta property="og:type" content="${head.ogType}" />`,
    `<meta property="og:locale" content="cs_CZ" />`,
    `<meta property="og:url" content="${attr(url)}" />`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:title" content="${attr(head.title)}" />`,
    `<meta property="og:description" content="${attr(head.description)}" />`,
    `<meta property="og:image" content="${attr(abs('/og.png'))}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(`${SITE_NAME} · IT a AI inženýr`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(head.meta ?? []).map((m) => `<meta property="${attr(m.property)}" content="${attr(m.content)}" />`),
    ...head.jsonLd.map(jsonLdScript),
  ]
  return lines.join('\n    ')
}

/* ═══════════ SITEMAP A RSS ═══════════ */

/** XML-bezpečný text (sitemap i RSS jsou XML, ne HTML). */
function xml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Celá sitemapa. ★ GENERUJE SE, NEUDRŽUJE SE RUČNĚ — od chvíle, kdy články
 * přibývají bez zásahu člověka, je ruční seznam URL zaručeně zastaralý seznam.
 *
 * `lastmod` je u článků skutečné datum úpravy. Vymyšlené „dnes" u všech stránek
 * je nejčastější způsob, jak si vyhledávač přestane sitemapy všímat.
 */
export function renderSitemap(articles: Article[], liveTopics: Topic[]): string {
  const newest = articles[0]?.updated ?? articles[0]?.published
  const urls: { loc: string; priority: string; lastmod?: string }[] = [
    { loc: abs('/'), priority: '1.0' },
    { loc: abs('/sluzby'), priority: '0.9' },
    { loc: abs('/projekty'), priority: '0.8' },
    { loc: abs('/clanky'), priority: '0.9', lastmod: newest },
    ...liveTopics.map((t) => ({
      loc: abs(topicPath(t.slug)),
      priority: '0.6',
      lastmod: articlesByTopic(t.slug)[0]?.updated ?? articlesByTopic(t.slug)[0]?.published,
    })),
    ...articles.map((a) => ({
      loc: abs(a.path),
      priority: '0.7',
      lastmod: a.updated ?? a.published,
    })),
  ]
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  ★ TENHLE SOUBOR SE GENERUJE PŘI BUILDU (src/lib/seo.ts → scripts/prerender.mjs).
  Needituj ho ručně, přepíše se. Jen skutečné URL – kotvy (#web, #kontakt) sem
  nepatří, Google fragment z adresy zahodí a záznam vyhodnotí jako duplikát.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

/** RFC 822 datum pro RSS. Kanály na formátu trvají, ISO neberou. */
const RSS_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RSS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function rssDate(iso: string): string {
  const d = new Date(`${iso}T08:00:00Z`)
  return `${RSS_DAYS[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${RSS_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 08:00:00 +0000`
}

/**
 * RSS kanál. Není to nostalgie: čtou ho agregátory, čte ho spousta nástrojů pro
 * sledování oborových zdrojů a hlavně ho čtou roboti, kterým tím říkáme
 * „tady přibývá obsah pravidelně". Levné na výrobu, drahé na chybějící.
 */
export function renderRss(articles: Article[]): string {
  const items = articles
    .slice(0, 30)
    .map(
      (a) => `    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(abs(a.path))}</link>
      <guid isPermaLink="true">${xml(abs(a.path))}</guid>
      <pubDate>${rssDate(a.published)}</pubDate>
      <description>${xml(a.perex)}</description>
${a.resolvedTopics.map((t) => `      <category>${xml(t.label)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Žurnál · ${xml(SITE_NAME)}</title>
    <link>${xml(abs('/clanky'))}</link>
    <atom:link href="${xml(abs('/rss.xml'))}" rel="self" type="application/rss+xml" />
    <description>Novinky z umělé inteligence a technologií přeložené do řeči firem. Píše ${xml(AUTHOR_NAME)}.</description>
    <language>cs</language>
${items}
  </channel>
</rss>
`
}

/**
 * Sekce žurnálu do `llms.txt`. Ten soubor je rozcestník pro jazykové modely —
 * a od chvíle, kdy web sám o modelech píše, je trochu absurdní, aby o tom
 * nevěděly. Dosazuje se za token `__JOURNAL__`.
 */
export function renderLlmsSection(articles: Article[], liveTopics: Topic[]): string {
  const lines: string[] = []
  lines.push('## Žurnál')
  lines.push('')
  lines.push(
    'Novinky z AI a technologií přeložené do řeči firem. Každý díl uvádí zdroje, ze kterých vychází, a odstavec „co to znamená v praxi". Přehled: ' +
      `[${abs('/clanky')}](${abs('/clanky')}), kanál: ${abs('/rss.xml')}`,
  )
  lines.push('')
  if (liveTopics.length) {
    lines.push('Témata:')
    for (const t of liveTopics) lines.push(`- [${t.title}](${abs(topicPath(t.slug))}): ${t.description}`)
    lines.push('')
  }
  lines.push('Poslední články:')
  for (const a of articles.slice(0, 20)) {
    lines.push(`- [${a.title}](${abs(a.path)}) (${czechDate(a.published)}): ${a.perex}`)
  }
  return lines.join('\n')
}

/** Témata, na která se smí odkazovat (práh počtu článků). Re-export pro prerender. */
export { TOPICS }
