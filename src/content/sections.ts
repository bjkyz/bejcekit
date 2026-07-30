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
      'Jsem Jiří Bejček, IT a AI inženýr. Stavím weby, které Google najde a zákazník neopustí. Nasazuji AI tam, kde ušetří hodiny, a nikde jinde. A spravuji servery tak, aby vás výpadek nestál tržby. Jeden člověk místo agentury: mluvíte přímo s tím, kdo tu práci dělá a kdo za ni ručí.',
    bullets: [
      'Pevná cena a termín. Písemně, ještě než začnu.',
      'Odpovím do 24 hodin, i o víkendu.',
      'Česko, remote i na místě. Přístupy a kód zůstávají vaše.',
    ],
    status: 'Volná kapacita: zbývá 1 místo',
    cta: { label: 'Chci nezávaznou nabídku', href: '#kontakt' },
    ghostCta: { label: 'Prohlédnout služby', href: '#web' },
    align: 'center',
    subsystem: 'IDENTIFIKACE',
  },
  {
    id: 'web',
    kicker: '[ 01 / WEB ]',
    plateCode: 'WEB',
    plateNum: '01',
    headline: 'Nahoře ve vyhledávání. Bez placení za klik.',
    body:
      'Zákazník, který vás najde ve vyhledávání, nestojí nic. Zákazník z reklamy stojí pokaždé znovu. Proto SEO nedělám jako přílepek na konci, ale od prvního řádku kódu. Čtyři důvody, proč to funguje:',
    bullets: [
      'Rychlost je rankovací faktor i konverzní páka. Core Web Vitals v zeleném, ne v oranžové.',
      'Sémantické HTML, strukturovaná data, sitemap, čisté URL. Google nemusí hádat, o čem web je.',
      'Google i Seznam. Seznam pořád drží kus českého trhu a většina šablon ho ignoruje.',
      'Search Console, pozice a konverze od prvního dne. Vidíte, jestli se investice vrací.',
    ],
    /** Nejsilnější argument webu: ověřitelný důkaz místo tvrzení. */
    proof: 'Důkaz: web, který právě čtete, má Lighthouse 97 / 100 / 100 / 100. Neberte to ode mě, změřte si to.',
    deliverable: {
      label: 'Co dostanete',
      text: 'Nasazený běžící web, Core Web Vitals v zeleném, napojenou Search Console a měsíční report pozic a poptávek.',
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
    headline: 'Servery, které vás nevzbudí ve tři ráno.',
    body:
      'Převezmu vaše IT, zdokumentuju ho a vyházím z něj tiché miny. Zálohu, kterou nikdo nikdy nezkusil obnovit, za zálohu nepovažuji. O problému vím dřív, než vám zavolá zákazník. A hlavně: když se něco stane, zvedne telefon člověk, ne hlasová schránka.',
    bullets: [
      'Monitoring a alerting 24/7. Alert padá mně na telefon, i v noci a o víkendu.',
      'Obnovení ze zálohy testujeme každé čtvrtletí nanečisto. Ne jednou za rok na papíře.',
      'Proxmox, Linux, Windows Server, Docker. Servery a virtualizace bez pokusů na živém provozu.',
      'Sítě, VPN, firewall, Microsoft 365 a koncové stanice. Jedno číslo na celé IT.',
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
    headline: 'Většina AI projektů se nevyplatí.',
    body:
      'Ty zbylé ušetří hodiny každý týden. Rozdíl mezi nimi se pozná propočtem, ne prezentací. Nejdřív spočítám, kolik hodin měsíčně to sundá z lidí a co bude stát provoz. Teprve pak stavím. Když se to nevrátí, zakázku nevezmu.',
    bullets: [
      'AI asistent odpovídá z vašich dokumentů a dat, ne z internetu (RAG). Žádné vymýšlení.',
      'Faktury, e-maily a formuláře bez ručního přepisování. Data padají rovnou do systému.',
      'Obsah pro SEO ve velkém, řízený daty. Články a popisky, které by ručně stály stovky hodin.',
      'n8n, API, webhooky, CRM. Propojím systémy, které spolu dnes nemluví.',
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
    headline: 'Čtyři kroky. Žádné překvapení na faktuře.',
    body:
      'Rozsah, termín a cena jsou na papíře dřív, než napíšu první řádek kódu. Pak pracuji v krátkých iteracích: každý týden vidíte postup, ne slib, že postup bude. Když se rozsah změní, znáte cenu dřív, než se do změny pustím.',
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
        text: 'Nasazuji průběžně. Vidíte běžící verzi, ne slidy o běžící verzi.',
      },
      {
        title: 'Provoz',
        text: 'Monitoring, zálohy, další rozvoj. Po vystavení faktury nemizím.',
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
    headline: 'Napište mi. Do 24 hodin víte, na čem jste.',
    body:
      'Popište problém vlastními slovy, technickou část si přeložím sám. Žádný formulářový labyrint, žádný obchodník mezi námi: píšete rovnou tomu, kdo tu práci bude dělat. A když na váš problém nejsem ten pravý, řeknu vám to a pošlu vás za někým, kdo je.',
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
