/**
 * ═══════════ OBSAH STRÁNKY /sluzby ═══════════
 *
 * ★★ PROČ VLASTNÍ STRÁNKA. Úvod má šest stěn krychle a sedmá ji SHODÍ (viz
 *   `SECTIONS` v content/sections.ts a README). Na stěny se vešlo to, co se
 *   prodává nejčastěji: AI, automatizace, software na míru. Zbytek nabídky
 *   je stejně cenný, jen se na něj nedostane každý — a přesně na to je vlastní
 *   URL s vlastním titulkem, popiskem a řádkem v sitemapě.
 *
 * ★ ROZDĚLENÍ PRÁCE MEZI ÚVODEM A TOUHLE STRÁNKOU:
 *   • úvod PRODÁVÁ — tři obrazovky, každá jeden slib a jedno tlačítko
 *   • `/sluzby` VYJMENOVÁVÁ — kompletní katalog, ať si člověk najde svůj případ
 *   Texty se proto nesmí opisovat: kde úvod říká „AI, která skutečně pracuje",
 *   tady stojí, co konkrétně to znamená. Dvě stránky s týmž textem jsou pro
 *   vyhledávač duplicita a jedna z nich vypadne.
 *
 * ★ ŽÁDNÉ DLOUHÉ POMLČKY (—), stejné pravidlo jako v celém obsahu.
 */

export interface ServiceGroup {
  /** Pořadové číslo do mono readoutu. */
  num: string
  /** Verzálkový kód. Drží se jazyka přístroje jako `plateCode` na krychli. */
  code: string
  /** Nadpis skupiny. Tvrzení, ne název kategorie. */
  title: string
  /** Dvě až tři věty, které řeknou, o co jde a komu to pomůže. */
  lead: string
  /** Konkrétní věci, které pod skupinu spadají. `k` je název, `v` co to dělá. */
  items: { k: string; v: string }[]
  /** Pointa na konec skupiny. Jedna věta, tiskne se jinak než tělo. */
  punch?: string
  /** Kotva sekce na úvodní stránce, kde se totéž prodává. */
  anchor?: string
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    num: '01',
    code: 'AI SYSTEMS',
    title: 'AI nad vašimi daty a procesy.',
    lead: 'Pracuje s firemními dokumenty, uvádí zdroje a může rovnou provést další krok.',
    items: [
      { k: 'AI asistenti', v: 'Odpovídají z vašich dokumentů a procesů, ne z náhodných webů.' },
      { k: 'Zpracování dokumentů', v: 'Vytěží data ze smluv, faktur, objednávek a životopisů.' },
      { k: 'Firemní znalosti', v: 'Najdou odpověď v interních datech a přidají citaci zdroje.' },
      { k: 'Agenti a workflow', v: 'Provedou konkrétní úkol napříč vašimi nástroji.' },
      { k: 'AI na míru', v: 'Řešení přizpůsobené vašemu procesu a pravidlům.' },
    ],
    punch: 'AI není cíl. Cílem je práce, kterou už nemusí dělat člověk.',
    anchor: 'ai',
  },
  {
    num: '02',
    code: 'AUTOMATION',
    title: 'Opakovaný proces bez ručního přepisování.',
    lead: 'Automatizace propojí vstup, kontrolu, zápis i upozornění do jednoho workflow.',
    items: [
      { k: 'Vytěžování a přepis dat', v: 'Z e-mailu, PDF nebo formuláře rovnou do systému, bez ručního opisování.' },
      { k: 'Propojení systémů', v: 'API, webhooky a databáze předají data bez kopírování.' },
      { k: 'Kontroly a hlídače', v: 'Ověří data, stav nebo termín a včas upozorní na problém.' },
      { k: 'Reporty', v: 'Pravidelný report se připraví a odešle automaticky.' },
    ],
    punch: 'Míň ruční práce, míň chyb a stopa o tom, co se kdy stalo.',
    anchor: 'automatizace',
  },
  {
    num: '03',
    code: 'INTERNAL TOOLS',
    title: 'Software podle toho, jak skutečně pracujete.',
    lead: 'Vlastní nástroj odstraní obcházení tabulkami, e-maily a ručními kroky.',
    items: [
      { k: 'Interní nástroje', v: 'Zpracují data, vytvoří dokumenty a řídí workflow.' },
      { k: 'Klientské portály', v: 'Spojí dokumenty, komunikaci a služby na jednom místě.' },
      { k: 'Dashboardy', v: 'Ukážou aktuální data v podobě vhodné pro rozhodování.' },
      { k: 'CRM a interní systémy', v: 'Přizpůsobí evidenci vašemu způsobu práce.' },
    ],
    punch: 'Vaše pracovní prostředí. Vaše pravidla. Váš software.',
    anchor: 'software',
  },
  {
    num: '04',
    code: 'SAAS',
    title: 'Od nápadu k SaaS produktu.',
    lead: 'Nejdřív ověříme smysl produktu. Potom postavíme systém, který může růst se zákazníky.',
    items: [
      { k: 'MVP', v: 'Ověříme hlavní hodnotu produktu dřív, než utratíte celý rozpočet.' },
      { k: 'Vývoj produktu', v: 'Skutečný produkt připravený pro zákazníky, ne prototyp v produkci.' },
      { k: 'AI jako součást produktu', v: 'Ne marketingový doplněk, ale funkce, kvůli které si ho zákazník koupí.' },
      { k: 'Předplatné a účty', v: 'Uživatelé, tarify, limity a platební brána.' },
      { k: 'Administrace', v: 'Správa uživatelů, statistiky a řízení celého produktu.' },
    ],
    punch: 'Produkt nekončí prvním nasazením. Stavím ho tak, aby mohl růst.',
    anchor: 'software',
  },
  {
    num: '05',
    code: 'ANONYMIZACE',
    title: 'Citlivá data připravená pro bezpečné zpracování.',
    lead: 'Osobní údaje se najdou a anonymizují dřív, než dokument uvidí další systém nebo AI model.',
    items: [
      { k: 'Detekce údajů', v: 'Jména, adresy, telefonní čísla, e-maily a identifikační údaje v textu i v dokumentech.' },
      { k: 'Anonymizace a pseudonymizace', v: 'Údaje se odstraní nebo nahradí zástupnou hodnotou, podle toho, co s daty potřebujete dál dělat.' },
      { k: 'Zpracování na vaší straně', v: 'Citlivá část zpracování může běžet u vás a ven jde jen to, co už osobní údaje neobsahuje.' },
    ],
    punch: 'Soukromí nemá být překážkou. Míru ochrany navrhnu podle typu dat.',
  },
  {
    num: '06',
    code: 'WEB',
    title: 'Web, který vede návštěvníka k akci.',
    lead: 'Rychlý, srozumitelný a měřitelný web postavený kolem jednoho obchodního cíle.',
    items: [
      { k: 'Firemní weby', v: 'Prezentace značky, služby nebo produktu, která obstojí vedle konkurence.' },
      { k: 'Landing pages', v: 'Stránka navržená s jediným cílem: dovést návštěvníka k akci.' },
      { k: 'Webové aplikace', v: 'Komplexnější produkty propojené s vašimi daty a systémy.' },
      { k: 'E-commerce', v: 'Online prodej s napojením na platby a navazující služby.' },
      { k: 'SEO a výkon', v: 'Technický základ pro rychlost, indexaci a dlouhodobou viditelnost.' },
    ],
    punch: 'Na tomto webu se text vykreslí před 3D scénou. Obsah tak zůstává rychlý a dostupný i bez WebGL.',
    anchor: 'software',
  },
]

/**
 * ★ TECHNOLOGIE AŽ NA KONCI, A TO JE ZÁMĚR. Zákazník nekupuje Next.js, kupuje
 *   výsledek. Stack je tu pro toho, kdo se ptá „umí to, co potřebujeme", ne pro
 *   toho, kdo se rozhoduje. Proto stojí pod nabídkou, ne nad ní.
 */
export const TECH_STACK: { group: string; items: string[] }[] = [
  { group: 'AI', items: ['Anthropic API', 'OpenAI API', 'LLM', 'AI agenti', 'RAG', 'MCP'] },
  { group: 'Vývoj', items: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Python'] },
  { group: 'Data', items: ['PostgreSQL', 'Prisma', 'Supabase', 'Vektorové DB'] },
  { group: 'Automatizace', items: ['n8n', 'API', 'Webhooky', 'Cron'] },
  { group: 'Provoz', items: ['Vercel', 'Docker', 'Cloud', 'Git'] },
]

/**
 * ═══════════ CERTIFIKÁT ═══════════
 *
 * ★★ DOKLAD, NE ODZNAK. Certifikát na webu obvykle nikoho nezajímá, protože
 *   visí jako obrázek bez kontextu. Tenhle má cenu ze tří důvodů a všechny
 *   tři musí být na stránce vidět:
 *     • JE OVĚŘITELNÝ. Vede na skutečný soubor s QR kódem vydavatele.
 *     • ŘÍKÁ, CO UMÍM PRÁVĚ TEĎ. Ne „práce s počítačem", ale orchestrace
 *       agentů, MCP nástroje a stavba aplikací s AI. To je přesně to, co
 *       tenhle web nabízí o dvě obrazovky výš.
 *     • JE ČERSTVÝ. U AI je datum vydání součástí obsahu.
 *
 * ★ SOUBOR MÁ URL-BEZPEČNÉ JMÉNO. Originál se jmenoval
 *   „Jiri Bejcek – Certifikát – Agentic Engineering.pdf" a mezery s pomlčkami
 *   by se v adrese zakódovaly do nečitelné šňůry, kterou nejde nikam poslat.
 */
export const CERTIFICATE = {
  title: 'Agentic Engineering',
  issuer: 'r_d by Laba',
  /** ISO datum vydání. */
  date: '2026-05-29',
  /** Co kurz obsahoval. Doslova podle certifikátu, nic navíc. */
  topics: [
    'Architektura a principy AI agentů',
    'Práce s Codex, Claude a Copilot',
    'Tvorba a integrace MCP nástrojů',
    'Programové ovládání AI agentů',
    'Vývoj full-stack aplikací s AI',
    'Orchestrace agentů přes SDK',
  ],
  facts: [
    { k: 'Rozsah', v: '20 vyučovacích hodin, 10 lekcí' },
    { k: 'Vydáno', v: '29. května 2026' },
    { k: 'Ověření', v: 'QR kód přímo v dokumentu' },
  ],
  pdf: '/certifikat-agentic-engineering.pdf',
  image: '/media/certifikat.jpg',
  /** ★ Rozměry MUSÍ sedět se souborem, jinak poskočí layout (CLS). */
  imageW: 1200,
  imageH: 674,
} as const
