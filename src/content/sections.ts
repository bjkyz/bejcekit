/**
 * ★ VŠECHNY ČESKÉ TEXTY WEBU. Jediný soubor, který se sahá při změně obsahu.
 *
 * STĚNA i VYKRESLUJE SECTIONS[i]. Geometrie a obsah jsou oddělené:
 * pokud chceš prohodit pořadí služeb, prohoď prvky v tomto poli.
 * Do lib/faces.ts NESAHEJ, tam je pořadí dané geometrií krychle.
 *
 * plateCode MUSÍ být bez diakritiky (ASCII). Renderuje se uvnitř skla přes
 * canvas texturu s ASCII nápisem; háček by tam nikdo nekontroloval.
 * Veškerá čeština s diakritikou žije v DOM, ne ve WebGL.
 *
 * ★ ŽÁDNÉ DLOUHÉ POMLČKY (—). Používá se krátká pomlčka (–) nebo dvojtečka.
 *   Em dash je nejnápadnější stopa po strojově psaném textu a v češtině se
 *   stejně skoro nepoužívá.
 */

/* Type-only import — po překladu z něj nezbude nic, takže si obsah nepřitáhne
   žádný runtime kód z ui/. */
import type { IconName } from '../ui/Icons'

export type Align = 'center' | 'left' | 'right'

export interface Section {
  id: string
  kicker: string
  /** Kód na stěně krychle. ASCII ONLY. */
  plateCode: string
  plateNum: string
  headline: string
  body: string
  bullets: string[]
  /** Ověřitelný důkaz místo tvrzení. Nejsilnější věc, kterou web má. */
  proof?: string
  /** Co klient reálně dostane. Zelený rámeček. */
  deliverable?: { label: string; text: string }
  /** Kroky procesu (jen sekce 04). */
  steps?: { title: string; text: string }[]
  stack?: string[]
  cta?: { label: string; href: string }
  ghostCta?: { label: string; href: string }
  /** Zelený štítek dostupnosti. Existuje jen na sekci 00. */
  status?: string
  align: Align
  subsystem: string
}

export const EMAIL = 'bejcek.jirka@gmail.com'
export const PHONE = '+420 607 706 102'
/** tel: a wa.me chtějí číslo bez mezer; wa.me navíc bez '+'. */
export const PHONE_TEL = '+420607706102'
export const WHATSAPP = 'https://wa.me/420607706102'

export const SECTIONS: Section[] = [
  {
    id: 'ident',
    kicker: '[ 00 / IDENT ]',
    plateCode: 'IDENT',
    plateNum: '00',
    headline: 'Weby, které vydělávají. IT, které nespadne.',
    body:
      'Jsem Jiří Bejček, IT a AI inženýr. Stavím weby, které Google najde a zákazníci neopustí. Nasazuji AI a jazykové modely tam, kde reálně šetří hodiny. A spravuji servery, co běží i ve tři ráno. Jeden člověk místo agentury: mluvíte přímo s tím, kdo tu práci dělá.',
    bullets: [
      'Pevná cena a termín. Písemně, ještě než začnu.',
      'Odezva do 24 hodin, i o víkendu.',
      'Česko, remote i na místě.',
    ],
    status: 'Volná kapacita: zbývá 1 místo',
    cta: { label: 'Nezávazně poptat', href: '#kontakt' },
    ghostCta: { label: 'Prohlédnout služby', href: '#web' },
    align: 'center',
    subsystem: 'IDENTIFIKACE',
  },
  {
    id: 'web',
    kicker: '[ 01 / WEB ]',
    plateCode: 'WEB',
    plateNum: '01',
    headline: 'SEO, které vás dostane nahoru.',
    body:
      'SEO nedělám jako přílepek po dokončení webu. Je součástí stavby od prvního řádku. Proto weby, které postavím, vyhledávače najdou a lidé je neopustí. Čtyři důvody, proč to funguje:',
    bullets: [
      'Rychlost je rankovací faktor. Core Web Vitals v zeleném, ne v oranžové.',
      'Technická čistota. Sémantické HTML, strukturovaná data, sitemap, čisté URL.',
      'Google i Seznam. Český trh není jen Google, většina šablon to ignoruje.',
      'Měření od prvního dne. Search Console, pozice, konverze. Vidíte, jestli to funguje.',
    ],
    /** Nejsilnější argument webu: ověřitelný důkaz místo tvrzení. */
    proof: 'Důkaz: web, který právě čtete, má Lighthouse 97 / 100 / 100 / 100. Změřte si to sami.',
    deliverable: {
      label: 'Co dostanete',
      text: 'Nasazený běžící web, Core Web Vitals v zeleném, napojenou Search Console a měsíční report pozic.',
    },
    stack: ['SEO', 'Core Web Vitals', 'Search Console', 'React', 'TypeScript', 'Node.js'],
    cta: { label: 'Chci web, který vydělává', href: '#kontakt' },
    align: 'left',
    subsystem: 'WEB & SEO',
  },
  {
    id: 'infra',
    kicker: '[ 02 / INFRA ]',
    plateCode: 'INFRA',
    plateNum: '02',
    headline: 'Infrastruktura, o které nemusíte přemýšlet.',
    body:
      'Převezmu vaše IT do správy, zdokumentuju ho a vyházím z něj tiché miny. Zálohy, u kterých jsme opravdu vyzkoušeli obnovení, ne jen odškrtli zelenou fajfku. A hlavně: člověk, který zvedne telefon.',
    bullets: [
      'Správa serverů a virtualizace. Proxmox, Linux, Windows Server, Docker.',
      'Monitoring a alerting 24/7. O výpadku vím dřív než váš zákazník.',
      'Zálohy a plán obnovy, který každé čtvrtletí skutečně otestujeme.',
      'Sítě, VPN, firewall, Microsoft 365 a koncové stanice.',
    ],
    deliverable: {
      label: 'Co dostanete',
      text: 'Pasport infrastruktury, všechny přístupy ve svých rukou a reakci do 4 hodin v pracovní době.',
    },
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
      'Jako AI inženýr nasazuji jazykové modely tam, kde ušetří hodiny. Ne tam, kde se dobře vyjímají na poradě. Nejdřív spočítáme, kolik hodin měsíčně to ušetří a co bude stát provoz. Teprve pak to stavím. Když čísla nevyjdou, řeknu vám to.',
    bullets: [
      'AI asistenti nad vašimi dokumenty a daty (RAG). Odpovídají z vašich podkladů, ne z internetu.',
      'Platformy pro SEO. Tvorba a optimalizace obsahu ve velkém, řízená daty.',
      'Automatizace procesů a integrace systémů. n8n, API, webhooky, napojení na CRM.',
      'Zpracování faktur, e-mailů a formulářů bez ručního přepisování.',
    ],
    deliverable: {
      label: 'Co dostanete',
      text: 'Propočet návratnosti ještě před stavbou, běžící workflow a měsíční report ušetřených hodin.',
    },
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
      'Víte, co dostanete, kdy to dostanete a kolik to stojí, dřív než napíšu první řádek kódu. Pracuji v krátkých, viditelných iteracích: každý týden vidíte postup, ne slib, že postup bude.',
    bullets: [],
    steps: [
      {
        title: 'Analýza',
        text: 'Půlhodina hovoru zdarma. Vytáhnu z vás, co skutečně potřebujete. A hlavně co nepotřebujete.',
      },
      {
        title: 'Návrh',
        text: 'Rozsah, harmonogram a pevná cena. Písemně, před začátkem. Žádné „to se uvidí“.',
      },
      {
        title: 'Dodávka',
        text: 'Krátké iterace a průběžné nasazování. Vidíte funkční verzi, ne slidy o funkční verzi.',
      },
      {
        title: 'Provoz',
        text: 'Nasazení, monitoring, zálohy, další rozvoj. Po vystavení faktury nemizím.',
      },
    ],
    cta: { label: 'Domluvit úvodní hovor zdarma', href: '#kontakt' },
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
      'Popište problém vlastními slovy, technickou část si přeložím sám. Žádný formulářový labyrint, žádný obchodník mezi námi. Píšete přímo člověku, který tu práci bude dělat. A když na váš problém nejsem ten správný, řeknu vám to a doporučím někoho, kdo je.',
    bullets: [],
    align: 'center',
    subsystem: 'KONTAKT',
  },
]

/**
 * Kontaktní řádky sekce 05.
 *
 * Ikona je nosič významu, ne ozdoba: obálka / sluchátko / octocat se přečtou
 * dřív než slovo vedle nich. Popisek přesto zůstává — ikona sama o sobě je
 * pro odečítač obrazovky prázdné místo (viz aria-hidden v ui/Icons.tsx).
 *
 * LinkedIn je zatím venku. Až profil bude stát za odkaz, přidá se sem jeden
 * řádek a ikona do ui/Icons.tsx. Nikde jinde se o kontaktech nerozhoduje.
 */
export const CONTACT_ROWS: { label: string; value: string; href: string; icon: IconName }[] = [
  { label: 'E-mail', value: EMAIL, href: `mailto:${EMAIL}`, icon: 'mail' },
  { label: 'Telefon', value: PHONE, href: `tel:${PHONE_TEL}`, icon: 'phone' },
  { label: 'GitHub', value: '/bjkyz', href: 'https://github.com/bjkyz', icon: 'github' },
]

export const FACE_COUNT = SECTIONS.length
