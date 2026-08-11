/**
 * ★ OBSAH STRÁNKY /projekty. Jediný soubor, který se sahá při přidání reference
 *   (pojistku, že se jméno klienta nedostane do buildu, drží scripts/prerender.mjs).
 *
 * Platí tu stejná pravidla jako v content/sections.ts:
 *   • ŽÁDNÉ DLOUHÉ POMLČKY (—). Krátká pomlčka (–) nebo dvojtečka.
 *   • Veškerá čeština s diakritikou žije v DOM, ne ve WebGL.
 *
 * ★★ REFERENCE JSOU OD 2026-08-05 POD PLOMBOU (`locked`). Klientské zakázky
 *    kryje mlčenlivost, takže se ukazují jen v obrysech a detail se VYŽÁDÁ.
 *    Zámek není ústupek, je to obchodní argument: stejná smlouva, která chrání
 *    tyhle klienty, bude chránit i toho příštího. Z toho plynou dvě pravidla:
 *
 *    1) ZAMČENÁ KARTA NESMÍ KLIENTA PROZRADIT – a hlídá to TYP, ne kázeň.
 *       `Project` je rozlišený svaz: zamčená větev vůbec nemá kam napsat
 *       doménu nebo odkaz (`href?: never`) a snímek bere jen anonymní soubor
 *       (`/projects/ref-*.webp`). K tomu konvence, které typ neuhlídá:
 *       žádný přesný letopočet ani doslovná fráze z klientova webu (obojí
 *       najde vyhledávač na první pokus) a snímek jde ven VÝHRADNĚ rozmazaný.
 *       Rozmazává se SOUBOR (`node scripts/blur-refs.mjs`), ne CSS: ostrý
 *       originál nesmí do sítě vůbec, filtr v CSS se dá vypnout v devtools
 *       jedním kliknutím.
 *
 *    2) CO JE POD PLOMBOU, MUSÍ BÝT PRAVDA DOLOŽITELNÁ NA SCHŮZCE. Anonymita
 *       není licence ke lhaní – naopak: `facts` zůstávají věci odečtené z toho
 *       běžícího webu a na vyžádání se ukážou i s tím webem. Číslo od klienta
 *       patří do `outcome` jen když ho klient dovolil zveřejnit a jde doložit.
 *
 *    Jediná karta bez plomby je bejcek.it – web, na kterém návštěvník právě
 *    stojí, je jediná reference, kterou smí (a musí) jít ověřit klikem.
 */

/** Kotva poptávkového bloku na /projekty. Čte ji sekce (id), nav i zamčené
 *  karty; jediné místo, které se mění, kdyby se blok přejmenoval. */
export const INQUIRY_ANCHOR = 'poptavka'

/** Štítek v readout řádku zamčené karty – místo domény, kterou nést nesmí. */
export const LOCKED_DOMAIN = 'diskrétní reference'

interface ProjectCore {
  /** Kotva v DOM a klíč Reactu. ★ U zamčených anonymní (renderuje se do DOM). */
  id: string
  /** Pořadové číslo pro mono readout. Drží se formátu sekcí: '01', '02'… */
  num: string
  /** U zamčených popis oboru („Advokátní kancelář, Praha"), ne jméno klienta. */
  name: string
  /** Čím ten web je. Krátká jmenná fráze, ne věta. */
  kind: string
  /** Co to řeší a pro koho. Dvě až tři věty, ne odstavec. */
  summary: string
  /**
   * Ověřitelná fakta o nasazení. `k` je popisek, `v` hodnota.
   * ★ Jen to, co jde odečíst ze živého webu. Viz hlavička souboru.
   * ★ Popisky jednoslovně: lišta `.pcard__fact-k` je 6.5rem široká a dvouslovný
   *   popisek se v ní zalomí (naměřeno na „Pro vyhledávače").
   */
  facts: { k: string; v: string }[]
  stack: string[]
  /**
   * Měřitelný výsledek, který klient smí zveřejnit. Nepovinné SCHVÁLNĚ:
   * u většiny zakázek žádný takový údaj zveřejnit nelze a vymyslet se nesmí.
   */
  outcome?: string
  shot: {
    src: string
    alt: string
    /** ★ Rozměry MUSÍ sedět se souborem: bez nich prohlížeč nezná poměr stran
        a při dotečení obrázku poskočí layout (CLS). Snímky jsou 1440×900. */
    w: number
    h: number
  }
}

/**
 * ★ ROZLIŠENÝ SVAZ, NE HROMÁDKA VOLITELNÝCH POLÍ. Dřívější tvar (`href?`,
 * `external?`, `self?` vedle `locked?`) dovoloval 16 kombinací, z nichž legální
 * byly tři – včetně té nejdražší chyby: zamčené karty s doménou klienta v datech
 * (bundle by ji odvezl do prohlížeče, i kdyby ji render nepoužil). Teď je
 * „zamčená karta s odkazem" chyba překladu, ne revizní položka.
 *
 * Co si komponenta ODVODÍ, tady schválně není: cíl zamčené karty
 * (`#${INQUIRY_ANCHOR}`), štítek místo domény (LOCKED_DOMAIN), štítek „živá
 * ukázka" (má ho každá odemčená karta) i chování odkazu do ciziny (z tvaru
 * `href`). Viz ui/ProjectCard.tsx.
 */
export type Project =
  | (ProjectCore & {
      /** Reference pod NDA: bez jména, bez odkazu, snímek jen rozmazaný. */
      locked: true
      /** Anonymní soubor je vynucený typem: `klient.webp` neprojde překladem. */
      shot: ProjectCore['shot'] & { src: `/projects/ref-${string}.webp` }
      href?: never
      domain?: never
    })
  | (ProjectCore & {
      locked?: false
      href: string
      /** Doména bez protokolu. Je to readout, ne odkaz – štítek přístroje. */
      domain: string
    })

/**
 * ★ POŘADÍ JE ZÁMĚR, NE ABECEDA.
 * První karta je ta, která nejlíp vysvětlí, co za práci člověk kupuje –
 * tedy nejúplnější zakázka. Vlastní web jde naopak POSLEDNÍ: je to důkaz
 * řemesla, ale zároveň jediná položka, kterou si nikdo neobjednal.
 */
export const PROJECTS: Project[] = [
  {
    id: 'ref-01',
    num: '01',
    name: 'Právní služby s cenou předem',
    locked: true,
    kind: 'Objednávkový web advokátní kanceláře',
    summary:
      'Advokátní kancelář prodává právní služby po internetu: klient si vybere situaci, cenu vidí před objednáním a případ jde rovnou advokátovi.',
    facts: [
      { k: 'Doručení', v: 'Předrenderované stránky z CDN (ISR), ne skládání na serveru při každém požadavku' },
      { k: 'Vyhledávače', v: 'Strukturovaná data LegalService, kontakty i adresa kanceláře' },
      { k: 'Jazyky', v: 'hreflang pro cizojazyčné verze, takže se nepřebíjejí ve výsledcích' },
      { k: 'Obrázky', v: 'WebP a odložené načítání pod ohybem' },
    ],
    stack: ['Next.js', 'React', 'Vercel', 'ISR', 'JSON-LD', 'hreflang'],
    shot: {
      src: '/projects/ref-01.webp',
      alt: 'Záměrně rozmazaný snímek úvodní obrazovky advokátního webu s ceníkem a objednávkou; detail reference je chráněný mlčenlivostí.',
      w: 1440,
      h: 900,
    },
  },
  {
    id: 'ref-02',
    num: '02',
    name: 'Advokátní kancelář, Praha',
    locked: true,
    kind: 'Prezentace kanceláře s poradnou',
    summary:
      'Zavedená pražská kancelář: oblasti práva, tým, blog, bezplatná konzultace. Úkolem webu je dovést člověka k jeho oblasti práva dřív, než odejde jinam.',
    facts: [
      { k: 'Vyhledávače', v: 'Časté dotazy ve strukturovaných datech, takže se můžou objevit přímo ve výsledku' },
      { k: 'Jazyky', v: 'hreflang pro cizojazyčnou verzi' },
      { k: 'Soukromí', v: 'Souhlas s cookies, který jde skutečně odmítnout, ne jen odklikat' },
      { k: 'Obrázky', v: 'WebP a odložené načítání' },
    ],
    stack: ['Nuxt', 'Vue', 'Vercel', 'JSON-LD FAQ', 'hreflang'],
    shot: {
      src: '/projects/ref-02.webp',
      alt: 'Záměrně rozmazaný snímek úvodní obrazovky webu advokátní kanceláře; detail reference je chráněný mlčenlivostí.',
      w: 1440,
      h: 900,
    },
  },
  {
    id: 'ref-03',
    num: '03',
    name: 'Módní značka, USA',
    locked: true,
    kind: 'Značkový web zakázkové dílny',
    summary:
      'Americká značka, která šije módu na míru. Web stojí na obrazu, ne na textu: video přes celou plochu a animace řízené scrollem.',
    facts: [
      { k: 'Pojetí', v: 'Video hero přes celou šířku, obsah nastupuje animací při scrollu' },
      { k: 'Doručení', v: 'Cloudflare, tedy edge síť blízko americkým zákazníkům' },
      { k: 'Jazyk', v: 'Anglicky, mimo český trh' },
    ],
    stack: ['Vue', 'GSAP', 'Cloudflare'],
    shot: {
      src: '/projects/ref-03.webp',
      alt: 'Záměrně rozmazaný snímek úvodní obrazovky webu módní značky s velkými fotografiemi; detail reference je chráněný mlčenlivostí.',
      w: 1440,
      h: 900,
    },
  },
  {
    id: 'bejcekit',
    num: '04',
    name: 'bejcek.it',
    domain: 'tento web',
    href: '/',
    kind: 'Portfolio se 3D scénou v prohlížeči',
    summary:
      'Web, na kterém právě jste. Skleněný stroj uprostřed není obrázek, ale scéna počítaná v prohlížeči, kolem které obíhá kamera podle scrollu.',
    facts: [
      { k: 'Rychlost', v: 'Lighthouse 100 / 100 / 100 / 100 na desktopu. Změřte si to sami.' },
      { k: 'Odolnost', v: 'Na slabém stroji scéna sama sestoupí o patro níž a nakonec se vzdá. Web zůstane celý.' },
      { k: 'Stabilita', v: 'CLS 0. Layout na 3D nikde nevisí ani jedním pixelem.' },
      { k: 'Pořadí', v: 'three.js se stahuje až po vykreslení textu, takže na čtení se nikdy nečeká.' },
    ],
    stack: ['React', 'TypeScript', 'three.js', 'Vite', 'Vercel'],
    shot: {
      src: '/projects/bejcekit.webp',
      alt: 'Úvodní obrazovka webu bejcek.it s nadpisem Weby, které vydělávají. IT, které nespadne.',
      w: 1440,
      h: 900,
    },
  },
]
