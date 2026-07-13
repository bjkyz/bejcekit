/**
 * ★ VŠECHNY ČESKÉ TEXTY WEBU. Jediný soubor, který se sahá při změně obsahu.
 *
 * STĚNA i VYKRESLUJE SECTIONS[i]. Geometrie a obsah jsou oddělené:
 * pokud chceš prohodit pořadí služeb, prohoď prvky v tomto poli.
 * Do lib/faces.ts NESAHEJ — tam je pořadí dané geometrií krychle.
 *
 * plateCode MUSÍ být bez diakritiky (ASCII). Renderuje se uvnitř skla přes
 * troika SDF font s ASCII subsetem; háček by se změnil na prázdný čtvereček.
 * Veškerá čeština s diakritikou žije v DOM, ne ve WebGL.
 */

export type Align = 'center' | 'left' | 'right'

export interface Section {
  id: string
  /** Malý mono popisek nad nadpisem. */
  kicker: string
  /** Kód na stěně krychle — ASCII ONLY. */
  plateCode: string
  plateNum: string
  headline: string
  body: string
  bullets: string[]
  /** Konkrétní výstup, co klient dostane. Zvýrazněný rámeček. */
  deliverable?: string
  /** Technologie — chipy pod textem. */
  stack?: string[]
  cta?: { label: string; href: string }
  ghostCta?: { label: string; href: string }
  align: Align
  /** Popisek v HUD status panelu. */
  subsystem: string
}

export const EMAIL = 'jiri.bejcek@tipit.cz'

export const SECTIONS: Section[] = [
  {
    id: 'ident',
    kicker: '[ 00 / IDENT ]',
    plateCode: 'IDENT',
    plateNum: '00',
    headline: 'Technologie, které drží.',
    body:
      'Jsem Jiří Bejček — nezávislý IT inženýr. Stavím weby a aplikace, spravuji infrastrukturu a nasazuji AI tam, kde reálně šetří hodiny. Jeden člověk místo agentury: přímá komunikace, pevná cena a systémy, které běží i ve tři ráno.',
    bullets: [
      'STAV · PŘIJÍMÁM NOVÉ PROJEKTY',
      'ODEZVA · DO 24 HODIN',
      'REŽIM · DODÁVKA NA KLÍČ NEBO DLOUHODOBÁ SPRÁVA',
      'PŮSOBIŠTĚ · ČESKO — REMOTE I NA MÍSTĚ',
    ],
    cta: { label: 'Napište mi', href: '#kontakt' },
    ghostCta: { label: 'Prohlédnout služby', href: '#web' },
    align: 'center',
    subsystem: 'IDENTIFIKACE',
  },
  {
    id: 'web',
    kicker: '[ 01 / WEB ]',
    plateCode: 'WEB',
    plateNum: '01',
    headline: 'Weby a aplikace, které vydrží provoz.',
    body:
      'Od firemní prezentace po interní systém, který denně používá celý tým. Frontend v Reactu a TypeScriptu, backend v Node.js nebo Pythonu, data v PostgreSQL. Bez šablon, bez pluginového bahna a bez technického dluhu, který za rok zaplatíte dvakrát.',
    bullets: [
      'Firemní weby a prezentace. Rychlé načtení, čistá indexace, obsah editovatelný bez programátora.',
      'Webové aplikace a interní nástroje. Role a oprávnění, reporty, napojení na systémy, které už používáte.',
      'E-shopy a zákaznické portály propojené s ERP, skladem nebo účetnictvím.',
      'Převzetí projektu po jiném dodavateli. Audit, stabilizace, dokumentace — bez soudů a bez drama.',
    ],
    deliverable:
      'VÝSTUP — Dostanete repozitář, dokumentaci, CI/CD a nasazený běžící systém. Ne prezentaci o něm.',
    stack: ['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
    cta: { label: 'Chci web nebo aplikaci', href: '#kontakt' },
    align: 'left',
    subsystem: 'WEB & APLIKACE',
  },
  {
    id: 'infra',
    kicker: '[ 02 / INFRA ]',
    plateCode: 'INFRA',
    plateNum: '02',
    headline: 'Infrastruktura, o které nemusíte přemýšlet.',
    body:
      'Převezmu vaše IT do správy, zdokumentuju ho a vyházím z něj tiché miny. Zálohy, u kterých jsme opravdu vyzkoušeli obnovení — ne jen odškrtli zelenou fajfku. A hlavně: člověk, který zvedne telefon.',
    bullets: [
      'Správa serverů a virtualizace. Proxmox, Linux, Windows Server, Docker.',
      'Monitoring a alerting 24/7. O výpadku vím dřív než váš zákazník.',
      'Zálohy a plán obnovy, který každé čtvrtletí skutečně otestujeme.',
      'Sítě, VPN, firewall, Microsoft 365 a koncové stanice.',
    ],
    deliverable:
      'VÝSTUP — Dostanete pasport infrastruktury, všechny přístupy ve svých rukou a reakci do 4 hodin v pracovní době.',
    stack: ['Proxmox', 'Linux', 'Docker', 'Microsoft 365', 'WireGuard', 'Zabbix'],
    cta: { label: 'Chci předat IT do správy', href: '#kontakt' },
    align: 'right',
    subsystem: 'INFRASTRUKTURA',
  },
  {
    id: 'ai',
    kicker: '[ 03 / AI ]',
    plateCode: 'AI',
    plateNum: '03',
    headline: 'Práci, která se opakuje, ať dělá stroj.',
    body:
      'Automatizace a AI nasazená tam, kde ušetří hodiny — ne tam, kde se dobře vyjímá na poradě. Nejdřív spočítáme, kolik hodin měsíčně to ušetří a co bude stát provoz. Teprve pak to stavím. Když čísla nevyjdou, řeknu vám to.',
    bullets: [
      'Automatizace procesů a integrace systémů. n8n, API, webhooky.',
      'AI asistent nad vašimi dokumenty a daty (RAG). Odpovídá z vašich podkladů, ne z internetu.',
      'Zpracování faktur, e-mailů a formulářů bez ručního přepisování.',
      'Napojení na CRM. Třídění poptávek, příprava nabídek, hlídání termínů.',
    ],
    deliverable:
      'VÝSTUP — Dostanete propočet návratnosti ještě před stavbou, běžící workflow a měsíční report ušetřených hodin.',
    stack: ['n8n', 'OpenAI API', 'Anthropic API', 'Python', 'Webhooks', 'Vektorová DB'],
    cta: { label: 'Chci zautomatizovat proces', href: '#kontakt' },
    align: 'left',
    subsystem: 'AI & AUTOMATIZACE',
  },
  {
    id: 'proces',
    kicker: '[ 04 / PROCES ]',
    plateCode: 'PROCES',
    plateNum: '04',
    headline: 'Čtyři kroky. Žádná mlha.',
    body:
      'Víte, co dostanete, kdy to dostanete a kolik to stojí — dřív, než napíšu první řádek kódu. Pracuji v krátkých, viditelných iteracích: každý týden vidíte postup, ne slib, že postup bude.',
    bullets: [
      'ANALÝZA — Půlhodina hovoru zdarma. Vytáhnu z vás, co skutečně potřebujete. A hlavně co nepotřebujete.',
      'NÁVRH — Rozsah, harmonogram a pevná cena. Písemně, před začátkem. Žádné „to se uvidí“.',
      'DODÁVKA — Krátké iterace a průběžné nasazování. Vidíte funkční verzi, ne slidy o funkční verzi.',
      'PROVOZ — Nasazení, monitoring, zálohy, další rozvoj. Po vystavení faktury nemizím.',
    ],
    cta: { label: 'Domluvit úvodní hovor', href: '#kontakt' },
    align: 'right',
    subsystem: 'PRACOVNÍ POSTUP',
  },
  {
    id: 'kontakt',
    kicker: '[ 05 / KONTAKT ]',
    plateCode: 'KONTAKT',
    plateNum: '05',
    headline: 'Napište mi. Odpovím do 24 hodin.',
    body:
      'Popište problém vlastními slovy — technickou část si přeložím sám. Žádný formulářový labyrint, žádný obchodník mezi námi. Píšete přímo člověku, který tu práci bude dělat. A když na váš problém nejsem ten správný, řeknu vám to a doporučím někoho, kdo je.',
    bullets: [],
    align: 'center',
    subsystem: 'KONTAKT',
  },
]

/** Kontaktní řádky sekce 05 — label/value, ať jde e-mail vykreslit jako odkaz. */
export const CONTACT_ROWS: { label: string; value: string; href?: string }[] = [
  { label: 'E-mail', value: EMAIL, href: `mailto:${EMAIL}` },
  { label: 'LinkedIn', value: '/in/jiribejcek', href: 'https://www.linkedin.com/in/jiribejcek' },
  { label: 'GitHub', value: '/bjkyz', href: 'https://github.com/bjkyz' },
]

export const FACE_COUNT = SECTIONS.length
