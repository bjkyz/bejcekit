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
    /**
     * ★ HERO SE ČTE NA TELEFONU, NE NA 27" MONITORU. Odstavec měl šest vět
     *   a na 360px displeji z něj bylo DEVĚT ŘÁDKŮ — první, co návštěvník uvidí,
     *   byla zeď textu, a tlačítka se odsunula pod spodní hranu obrazovky.
     *   Fakta se neztratila, jen se přesunula do odrážek: ty se dají SKENOVAT,
     *   kdežto odstavec se musí přečíst celý, nebo vůbec.
     */
    body:
      'Jsem Jiří Bejček, IT a AI inženýr. Stavím weby, které Google najde a zákazník neopustí. Nasazuji AI jen tam, kde ušetří hodiny. A držím servery v chodu, aby vás výpadek nestál tržby.',
    bullets: [
      'Jeden inženýr místo agentury. Mluvíte přímo s tím, kdo tu práci dělá a kdo za ni ručí.',
      'Pevná cena a termín. Písemně, ještě než začnu.',
      'Odpovím do 24 hodin, i o víkendu. Celé Česko, remote i u vás.',
    ],
    status: 'Volná kapacita: zbývá 1 místo',
    cta: { label: 'Chci nezávaznou nabídku', href: '#kontakt' },
    /**
     * ★ DRUHÉ TLAČÍTKO VEDE NA PROJEKTY, NE NA SLUŽBY.
     *   „Prohlédnout služby" nabízelo přesně to, co udělá scroll dolů i pravá
     *   lišta, tedy třetí cestu k témuž. Odkaz na reference je oproti tomu jediný
     *   způsob, jak se z úvodu dostat na /projekty — a na telefonu ten úplně
     *   jediný, protože odkazy v horní navigaci jsou pod 800 px schované.
     *   Hotová práce je navíc silnější argument než seznam slibů pod ní.
     */
    ghostCta: { label: 'Prohlédnout projekty', href: '/projekty' },
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
    /**
     * Nejsilnější argument webu: ověřitelný důkaz místo tvrzení.
     *
     * ★ ČÍSLO MUSÍ SEDĚT S REALITOU, JINAK JE TO NEJDRAŽŠÍ VĚTA NA STRÁNCE.
     *   Stálo tu „97 / 100 / 100 / 100" a bylo to zastaralé oběma směry: desktop
     *   mezitím jede na plný počet, mobil na 80. Návštěvník, kterého tahle věta
     *   vyzve „změřte si to", si to změří — a když mu vyjde něco jiného, ztratí
     *   důvěru ve VŠECHNO ostatní na webu, protože zrovna tohle šlo ověřit.
     *   Proto se říká i to, na čem se měřilo. Naměřeno lokálně, 3 běhy:
     *   desktop 100/100/100/100, mobil perf 80–82 (LCP 3.8 s, TBT 240–290 ms, CLS 0).
     *   ★ Po každé změně, která sáhne na výkon, tohle číslo přeměřit.
     */
    proof:
      'Důkaz: web, který právě čtete, má na desktopu Lighthouse 100 / 100 / 100 / 100. Neberte to ode mě, změřte si to.',
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
    /* Kratší než „Domluvit úvodní hovor zdarma": ta se na 390px displeji lámala
       uvnitř tlačítka do dvou řádků a šipka zůstala viset vedle prázdna. */
    cta: { label: 'Domluvit hovor zdarma', href: '#kontakt' },
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
      'Popište problém vlastními slovy, technickou část si přeložím sám. Žádný formulář o dvanácti polích a žádné čekání na obchodníka. A když na váš problém nejsem ten pravý, řeknu vám to rovnou a pošlu vás za někým, kdo je.',
    bullets: [],
    align: 'center',
    subsystem: 'KONTAKT',
  },
]

/**
 * ═══════════ KANÁLY SEKCE 05 ═══════════
 *
 * ★ DŘÍV TO BYLA ÚČTENKA, TEĎ JSOU TO AKCE. Kontakt měl tři řádky
 *   „POPISEK ···················· hodnota" a pod nimi tři tlačítka, která
 *   nabízela PŘESNĚ TÉŽ tři věci. Dva problémy najednou:
 *     • duplicita — e-mail stál na stránce třikrát (velký nadpis, řádek, tlačítko)
 *     • tečkovaný vodič na 390px displeji roztáhl popisek a hodnotu na opačné
 *       okraje a mezi nimi zela díra; četlo se to jako výpis z účtu, ne jako
 *       pozvánka se ozvat
 *   Řádek a tlačítko jsou teď JEDEN prvek: dlaždice, která je sama odkazem.
 *
 * ★ POŘADÍ JE ZÁMĚR, NE ABECEDA. E-mail první a přes celou šířku (asynchronní,
 *   nezávazný, nejnižší práh), pak WhatsApp a telefon (rychlé, ale osobní).
 *   GitHub není kanál, je to důkaz — patří do patičky, ne mezi výzvy k akci.
 *
 * `note` je to, co člověk potřebuje vědět DŘÍV, než klikne: jak rychle se ozvu
 * a s kým bude mluvit. Nic z toho není nový slib, všechno stojí i v textu výš.
 */
export const CONTACT_CHANNELS: {
  label: string
  value: string
  note: string
  href: string
  icon: IconName
  /** Barva nese význam: zelená = dostupnost (jako štítek kapacity a rámeček VÝSTUP). */
  tone?: 'green'
}[] = [
  { label: 'WhatsApp', value: PHONE, note: 'Nejrychlejší cesta', href: WHATSAPP, icon: 'whatsapp', tone: 'green' },
  { label: 'Telefon', value: PHONE, note: 'Volejte rovnou mně', href: `tel:${PHONE_TEL}`, icon: 'phone' },
]

export const GITHUB = 'https://github.com/bjkyz'

export const FACE_COUNT = SECTIONS.length
