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
    title: 'AI napojená na vaše podnikání.',
    lead: 'AI nemusí být chatbot na webu. Může pracovat s dokumenty, rozumět firemním datům, vyhledávat informace a spouštět další procesy. Stavím ji tak, aby odpovídala z vašich podkladů a u každé odpovědi ukázala, odkud to má.',
    items: [
      { k: 'AI asistenti', v: 'Interní asistenti, kteří znají vaše dokumenty, procesy a informace.' },
      { k: 'Zpracování dokumentů', v: 'Automatické vytěžování smluv, faktur, objednávek a životopisů.' },
      { k: 'AI nad firemními daty', v: 'Vyhledávání v interních znalostech přirozeným jazykem, s citací zdroje.' },
      { k: 'Agenti a workflow', v: 'AI, která nejen odpoví, ale provede konkrétní úkol. Nástroje MCP, orchestrace.' },
      { k: 'AI na míru', v: 'Řešení postavené přesně podle vašeho procesu, ne podle šablony nástroje.' },
    ],
    punch: 'AI není cíl. Cílem je práce, kterou už nemusí dělat člověk.',
    anchor: 'ai',
  },
  {
    num: '02',
    code: 'AUTOMATION',
    title: 'Automatizujte to, co se opakuje.',
    lead: 'Kopírování dat, e-maily, tabulky, reporty, kontroly, přepisování informací mezi systémy. Když člověk opakuje stejný postup znovu a znovu, je velká šance, že se dá předat stroji.',
    items: [
      { k: 'Vytěžování a přepis dat', v: 'Z e-mailu, PDF nebo formuláře rovnou do systému, bez ručního opisování.' },
      { k: 'Propojení systémů', v: 'API, webhooky a databáze. Nástroje, které spolu dnes nemluví, začnou.' },
      { k: 'Kontroly a hlídače', v: 'Pravidelné ověřování dat, stavů a termínů. Upozornění dřív, než to praskne.' },
      { k: 'Reporty', v: 'Podklad, který se dnes skládá ručně, chodí sám a ve stejný čas.' },
    ],
    punch: 'Míň ruční práce, míň chyb a stopa o tom, co se kdy stalo.',
    anchor: 'automatizace',
  },
  {
    num: '03',
    code: 'INTERNAL TOOLS',
    title: 'Software přesně podle toho, jak pracujete.',
    lead: 'Každá firma má vlastní procesy a někdy se jim žádný univerzální software nedokáže přizpůsobit. Pak je levnější postavit nástroj podle procesu než ohýbat proces podle nástroje.',
    items: [
      { k: 'Interní nástroje', v: 'Zpracování firemních dat, generování dokumentů, řízení workflow.' },
      { k: 'Klientské portály', v: 'Dokumenty, komunikace, služby a informace na jednom místě.' },
      { k: 'Dashboardy', v: 'Data převedená do rozhraní, ve kterém se dá rozhodovat.' },
      { k: 'CRM a interní systémy', v: 'Evidence přizpůsobená konkrétnímu fungování firmy, ne naopak.' },
    ],
    punch: 'Vaše pracovní prostředí. Vaše pravidla. Váš software.',
    anchor: 'software',
  },
  {
    num: '04',
    code: 'SAAS',
    title: 'Máte nápad na produkt? Postavme ho.',
    lead: 'SaaS není jen webová aplikace. Je to produkt, který může používat jeden zákazník nebo tisíce. Pomáhám ho vytvořit od prvního konceptu po produkční verzi, na kterou se dá napojit fakturace.',
    items: [
      { k: 'MVP', v: 'Rychle ověříme, jestli má nápad smysl, dřív než se do něj utopí rozpočet.' },
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
    title: 'Citlivá data nemusí stát mezi vámi a AI.',
    lead: 'Potřebujete pracovat s dokumenty, které obsahují osobní nebo citlivé informace? Data můžou projít automatickou detekcí a anonymizací ještě předtím, než je uvidí další systém nebo model.',
    items: [
      { k: 'Detekce údajů', v: 'Jména, adresy, telefonní čísla, e-maily a identifikační údaje v textu i v dokumentech.' },
      { k: 'Anonymizace a pseudonymizace', v: 'Údaje se odstraní nebo nahradí zástupnou hodnotou, podle toho, co s daty potřebujete dál dělat.' },
      { k: 'Zpracování na vaší straně', v: 'Citlivá část zpracování může běžet u vás a ven jde jen to, co už osobní údaje neobsahuje.' },
    ],
    punch: 'Soukromí by nemělo být překážkou inovace. Konkrétní způsob i míru ochrany navrhuji podle typu dat a požadavků projektu.',
  },
  {
    num: '06',
    code: 'WEB',
    title: 'Web, který není jen vizitka.',
    lead: 'Moderní web musí být rychlý, důvěryhodný a připravený na další rozvoj. Rychlost přitom není položka na konci nabídky, ale rozhodnutí v architektuře: co se stahuje dřív než text.',
    items: [
      { k: 'Firemní weby', v: 'Prezentace značky, služby nebo produktu, která obstojí vedle konkurence.' },
      { k: 'Landing pages', v: 'Stránka navržená s jediným cílem: dovést návštěvníka k akci.' },
      { k: 'Webové aplikace', v: 'Komplexnější produkty propojené s vašimi daty a systémy.' },
      { k: 'E-commerce', v: 'Online prodej s napojením na platby a navazující služby.' },
      { k: 'SEO a výkon', v: 'Technický základ pro rychlost, indexaci a dlouhodobou viditelnost.' },
    ],
    punch: 'Web, na kterém právě jste, má na desktopu Lighthouse 100 ze 100 ve všech čtyřech kategoriích. Neberte to ode mě, změřte si to.',
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
