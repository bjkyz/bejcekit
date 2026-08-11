/**
 * ═══════════ REJSTŘÍK ENTIT ═══════════
 *
 * ★ TOHLE JE SEO JÁDRO ŽURNÁLU, NE SEZNAM LOGOTYPŮ.
 *
 * Vyhledávače dneška neindexují slova, ale ENTITY: „Anthropic" v textu je jen
 * osm znaků, kdežto entita s `sameAs` na Wikipedii je uzel v grafu, o kterém
 * Google už všechno ví. Když článek řekne strukturovanými daty „tenhle text
 * pojednává o TÉHLE firmě", zařadí se do tématu, místo aby soutěžil o klíčové
 * slovo. Proto se společnosti v článcích neoznačují ručně v textu, ale klíčem
 * do tohohle rejstříku — a z klíče se pak odvodí:
 *   • vizuální označení v textu (`ui/ArticleBody.tsx`)
 *   • blok „Zmíněné společnosti a technologie" s odchozími odkazy
 *   • `mentions` a `about` v JSON-LD (`lib/seo.ts`)
 *
 * ★★ PRAVIDLA, KTERÁ SE NESMÍ PORUŠIT:
 *
 * 1) `sameAs` MUSÍ BÝT PRAVDA. Odkaz na cizí entitu, který neodpovídá, není
 *    „skoro dobře" — je to strukturovaná lež a Google ji umí potrestat
 *    ignorováním VŠECH strukturovaných dat na webu. Proto jsou tu jen adresy,
 *    které jdou ověřit, a u firem, kde si nejsem jistý encyklopedickým heslem,
 *    stojí jen oficiální `url` a `sameAs` chybí. Prázdné `sameAs` je v pořádku,
 *    špatné není.
 *
 * 2) GENERÁTOR SI SEM NESMÍ NIC PŘIDAT. `api/cron/publish-article.ts` dostane
 *    seznam klíčů jako výčet a neznámé klíče se při validaci ZAHODÍ. Model tedy
 *    nemůže vymyslet firmu ani jí přiřadit odkaz — může jen sáhnout na to, co
 *    tu někdo ručně ověřil. To je celá pojistka proti halucinovaným citacím.
 *
 * 3) POŘADÍ JE ABECEDNÍ PODLE KLÍČE, ať se v tom dá při přidávání hledat.
 */

export interface Entity {
  /** Jméno tak, jak se napíše do textu i do strukturovaných dat. */
  name: string
  /**
   * Typ podle schema.org. Rozhoduje, jak se entita zapíše do `mentions`.
   * `Organization` = firma, `SoftwareApplication` = produkt/model/nástroj.
   */
  type: 'Organization' | 'SoftwareApplication'
  /** Oficiální web. Vždycky, u všech. */
  url: string
  /**
   * Encyklopedická totožnost. ★ Jen ověřené adresy, radši prázdné než špatné.
   * U produktů odkazuje na výrobce přes `by`, ne přes vlastní heslo.
   */
  sameAs?: string[]
  /** Klíč výrobce u produktů. Kreslí se v legendě („Claude od Anthropic"). */
  by?: string
  /** Jedna věta do legendy pod článkem. Česky, bez marketingu. */
  note: string
}

export const ENTITIES = {
  amazon: {
    name: 'Amazon',
    type: 'Organization',
    url: 'https://www.amazon.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Amazon_(company)', 'https://cs.wikipedia.org/wiki/Amazon.com'],
    note: 'Americký obchodní a cloudový gigant, mateřská firma AWS.',
  },
  amd: {
    name: 'AMD',
    type: 'Organization',
    url: 'https://www.amd.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Advanced_Micro_Devices'],
    note: 'Výrobce procesorů a grafických čipů, konkurent Intelu a Nvidie.',
  },
  anthropic: {
    name: 'Anthropic',
    type: 'Organization',
    url: 'https://www.anthropic.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Anthropic'],
    note: 'Americká výzkumná firma, tvůrce jazykových modelů Claude.',
  },
  apple: {
    name: 'Apple',
    type: 'Organization',
    url: 'https://www.apple.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Apple_Inc.', 'https://cs.wikipedia.org/wiki/Apple'],
    note: 'Výrobce počítačů, telefonů a vlastních čipů řady M.',
  },
  aws: {
    name: 'Amazon Web Services',
    type: 'Organization',
    url: 'https://aws.amazon.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Amazon_Web_Services'],
    note: 'Největší poskytovatel cloudové infrastruktury na světě.',
  },
  claude: {
    name: 'Claude',
    type: 'SoftwareApplication',
    url: 'https://claude.ai/',
    by: 'anthropic',
    note: 'Rodina jazykových modelů od Anthropic.',
  },
  cloudflare: {
    name: 'Cloudflare',
    type: 'Organization',
    url: 'https://www.cloudflare.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Cloudflare'],
    note: 'Síť CDN, ochrana proti útokům a edge výpočty.',
  },
  databricks: {
    name: 'Databricks',
    type: 'Organization',
    url: 'https://www.databricks.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Databricks'],
    note: 'Platforma pro datové inženýrství a strojové učení.',
  },
  deepmind: {
    name: 'Google DeepMind',
    type: 'Organization',
    url: 'https://deepmind.google/',
    sameAs: ['https://en.wikipedia.org/wiki/Google_DeepMind'],
    note: 'Výzkumná divize Googlu, tvůrce modelů Gemini.',
  },
  docker: {
    name: 'Docker',
    type: 'SoftwareApplication',
    url: 'https://www.docker.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Docker_(software)'],
    note: 'Kontejnerizace aplikací. Standard pro nasazování služeb.',
  },
  gemini: {
    name: 'Gemini',
    type: 'SoftwareApplication',
    url: 'https://gemini.google.com/',
    by: 'google',
    note: 'Rodina jazykových modelů od Googlu.',
  },
  github: {
    name: 'GitHub',
    type: 'Organization',
    url: 'https://github.com/',
    sameAs: ['https://en.wikipedia.org/wiki/GitHub'],
    note: 'Největší hostitel zdrojového kódu, součást Microsoftu.',
  },
  google: {
    name: 'Google',
    type: 'Organization',
    url: 'https://www.google.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Google', 'https://cs.wikipedia.org/wiki/Google'],
    note: 'Vyhledávač, cloud a mateřská firma DeepMind.',
  },
  huggingface: {
    name: 'Hugging Face',
    type: 'Organization',
    url: 'https://huggingface.co/',
    sameAs: ['https://en.wikipedia.org/wiki/Hugging_Face'],
    note: 'Rozcestník otevřených modelů a datových sad.',
  },
  ibm: {
    name: 'IBM',
    type: 'Organization',
    url: 'https://www.ibm.com/',
    sameAs: ['https://en.wikipedia.org/wiki/IBM', 'https://cs.wikipedia.org/wiki/IBM'],
    note: 'Podniková IT infrastruktura, služby a výzkum.',
  },
  intel: {
    name: 'Intel',
    type: 'Organization',
    url: 'https://www.intel.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Intel', 'https://cs.wikipedia.org/wiki/Intel'],
    note: 'Výrobce procesorů pro servery i koncové stanice.',
  },
  kubernetes: {
    name: 'Kubernetes',
    type: 'SoftwareApplication',
    url: 'https://kubernetes.io/',
    sameAs: ['https://en.wikipedia.org/wiki/Kubernetes'],
    note: 'Orchestrace kontejnerů. Standard pro provoz ve velkém.',
  },
  linux: {
    name: 'Linux',
    type: 'SoftwareApplication',
    url: 'https://www.kernel.org/',
    sameAs: ['https://en.wikipedia.org/wiki/Linux', 'https://cs.wikipedia.org/wiki/Linux'],
    note: 'Operační systém, na kterém běží drtivá většina serverů.',
  },
  meta: {
    name: 'Meta',
    type: 'Organization',
    url: 'https://about.meta.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Meta_Platforms'],
    note: 'Mateřská firma Facebooku, vydavatel otevřených modelů Llama.',
  },
  microsoft: {
    name: 'Microsoft',
    type: 'Organization',
    url: 'https://www.microsoft.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Microsoft', 'https://cs.wikipedia.org/wiki/Microsoft'],
    note: 'Windows, Microsoft 365, Azure a GitHub.',
  },
  mistral: {
    name: 'Mistral AI',
    type: 'Organization',
    url: 'https://mistral.ai/',
    sameAs: ['https://en.wikipedia.org/wiki/Mistral_AI'],
    note: 'Francouzská firma stavějící otevřené i uzavřené jazykové modely.',
  },
  n8n: {
    name: 'n8n',
    type: 'SoftwareApplication',
    url: 'https://n8n.io/',
    note: 'Nástroj na automatizaci procesů, který jde provozovat na vlastním serveru.',
  },
  nvidia: {
    name: 'Nvidia',
    type: 'Organization',
    url: 'https://www.nvidia.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Nvidia', 'https://cs.wikipedia.org/wiki/Nvidia'],
    note: 'Výrobce grafických čipů, na kterých se trénuje a provozuje AI.',
  },
  openai: {
    name: 'OpenAI',
    type: 'Organization',
    url: 'https://openai.com/',
    sameAs: ['https://en.wikipedia.org/wiki/OpenAI', 'https://cs.wikipedia.org/wiki/OpenAI'],
    note: 'Americká firma stojící za ChatGPT a modely řady GPT.',
  },
  oracle: {
    name: 'Oracle',
    type: 'Organization',
    url: 'https://www.oracle.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Oracle_Corporation'],
    note: 'Databáze a podnikový cloud.',
  },
  postgresql: {
    name: 'PostgreSQL',
    type: 'SoftwareApplication',
    url: 'https://www.postgresql.org/',
    sameAs: ['https://en.wikipedia.org/wiki/PostgreSQL'],
    note: 'Otevřená relační databáze. Výchozí volba pro většinu aplikací.',
  },
  proxmox: {
    name: 'Proxmox',
    type: 'SoftwareApplication',
    url: 'https://www.proxmox.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Proxmox_Virtual_Environment'],
    note: 'Virtualizační platforma pro vlastní servery.',
  },
  vercel: {
    name: 'Vercel',
    type: 'Organization',
    url: 'https://vercel.com/',
    sameAs: ['https://en.wikipedia.org/wiki/Vercel'],
    note: 'Hosting a edge síť pro moderní weby. Běží na něm i tenhle web.',
  },
} as const satisfies Record<string, Entity>

export type EntityKey = keyof typeof ENTITIES

/** Seznam klíčů — čte ho výčet ve schématu generátoru i validace. */
export const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[]

/** Zahodí neznámé klíče a duplicity. ★ Jediná cesta, jak se entity dostanou z JSONu do renderu. */
export function resolveEntities(keys: readonly string[] | undefined): { key: EntityKey; entity: Entity }[] {
  if (!keys) return []
  const seen = new Set<string>()
  const out: { key: EntityKey; entity: Entity }[] = []
  for (const k of keys) {
    if (seen.has(k)) continue
    seen.add(k)
    const entity = (ENTITIES as Record<string, Entity>)[k]
    if (entity) out.push({ key: k as EntityKey, entity })
  }
  return out
}

/** Odkazy pro `sameAs` v JSON-LD. U produktu se přidá i výrobce. */
export function entitySameAs(entity: Entity): string[] {
  const out = [...(entity.sameAs ?? [])]
  if (entity.by) {
    const maker = (ENTITIES as Record<string, Entity>)[entity.by]
    if (maker?.url) out.push(maker.url)
  }
  return out
}
