/**
 * ═══════════ ČÍSELNÍK TÉMAT ═══════════
 *
 * ★ VLASTNÍ SOUBOR, A JE TO NUTNOST, NE ÚKLID. Číselník potřebuje i serverless
 *   funkce `api/cron/publish-article.ts` (dává ho modelu jako výčet povolených
 *   hodnot). Kdyby stál v `content/journal.ts`, přitáhla by si funkce s ním
 *   i `import.meta.glob` — a to je značka, které rozumí jen Vite. Na Vercelu
 *   se funkce balí esbuildem, glob by zůstal doslova a linka by spadla za běhu.
 *   Tenhle soubor proto NESMÍ importovat nic z Vite světa.
 *
 * ★★ TÉMATA JSOU MALÁ MNOŽINA, A JE TO ZÁMĚR.
 *
 * Volné štítky vypadají jako svoboda, ale v SEO jsou to desítky skoro prázdných
 * stránek soupeřících o totéž (Google tomu říká „thin content" a řeší to tím,
 * že nezaindexuje ani jednu). Pevný číselník znamená, že každé téma má vlastní
 * rozcestník, vlastní popis a časem dost článků na to, aby na něco stačilo.
 *
 * Témata se schválně KRYJÍ SE SLUŽBAMI na úvodní stránce — díky tomu vede
 * z každého rozcestníku poctivý odkaz na to, co si u mě člověk může objednat,
 * a nazpátek. To je celé to „provázání", o které jde.
 */

export interface Topic {
  slug: string
  /** Krátký štítek do karty a do drobečků. */
  label: string
  /** H1 rozcestníku. */
  title: string
  /** Popisek do meta description rozcestníku. Do 160 znaků. */
  description: string
  /** Kotva služby na úvodní stránce, ke které téma patří. */
  service?: 'ai' | 'automatizace' | 'software' | 'proces'
}

export const TOPICS: Topic[] = [
  {
    slug: 'ai',
    label: 'AI',
    title: 'Umělá inteligence prakticky',
    description:
      'Co se v AI opravdu změnilo a co z toho použijete ve firmě. Jazykové modely, asistenti nad vlastními daty, návratnost spočítaná dopředu.',
    service: 'ai',
  },
  {
    slug: 'automatizace',
    label: 'Automatizace',
    title: 'Automatizace firemních procesů',
    description:
      'Jak sundat hodiny ruční práce z lidí. Vytěžování dokumentů, propojování systémů, workflow, která běží i když se nikdo nedívá.',
    service: 'automatizace',
  },
  {
    slug: 'weby-a-seo',
    label: 'Weby a SEO',
    title: 'Weby, rychlost a viditelnost ve vyhledávání',
    description:
      'Core Web Vitals, strukturovaná data, technické SEO. Proč rychlost není kosmetika a jak se pozná web, který vydělává.',
    service: 'software',
  },
  {
    slug: 'infrastruktura',
    label: 'Infrastruktura',
    title: 'Servery, sítě a provoz bez výpadků',
    description:
      'Virtualizace, zálohy, které někdo opravdu zkusil obnovit, monitoring a bezpečnost. IT, které vás nevzbudí ve tři ráno.',
  },
  {
    slug: 'bezpecnost',
    label: 'Bezpečnost',
    title: 'Kybernetická bezpečnost pro firmy',
    description:
      'Zranitelnosti, úniky dat, regulace a co s tím udělat dřív, než to udělá někdo jiný. Bez strašení, s konkrétními kroky.',
  },
  {
    slug: 'vyvoj',
    label: 'Vývoj',
    title: 'Vývoj software a nástroje',
    description:
      'Jazyky, frameworky, nasazování a to, co se v nich právě mění. Pohled inženýra, který ten kód i provozuje.',
    service: 'software',
  },
]

export const TOPIC_SLUGS = TOPICS.map((t) => t.slug)

/**
 * ★★ ROZCESTNÍK TÉMATU VZNIKNE AŽ OD TŘETÍHO ČLÁNKU.
 *
 * Stránka se dvěma odkazy není rozcestník, je to slabý obsah — a Google ho
 * buď nezaindexuje, nebo si o webu udělá horší obrázek jako o celku. Práh je
 * proto tvrdý a platí i v odkazech: dokud téma nemá tři články, nikde na webu
 * na něj nevede odkaz a nestojí ani v sitemapě. Sám se to spraví, jakmile robot
 * dopíše třetí kus. ★ Musí ho číst PRERENDER I KLIENT stejně, jinak by se
 * hydratace rozešla na jednom nadbytečném odkazu.
 */
export const TOPIC_MIN_ARTICLES = 3
