/**
 * ★ OBSAH STRÁNKY /projekty. Jediný soubor, který se sahá při přidání reference.
 *
 * Platí tu stejná pravidla jako v content/sections.ts:
 *   • ŽÁDNÉ DLOUHÉ POMLČKY (—). Krátká pomlčka (–) nebo dvojtečka.
 *   • Veškerá čeština s diakritikou žije v DOM, ne ve WebGL.
 *
 * ★★ A JEDNO NAVÍC, KTERÉ JE TU DŮLEŽITĚJŠÍ NEŽ VŠECHNO OSTATNÍ:
 *
 *   KAŽDÉ TVRZENÍ NA KARTĚ MUSÍ JÍT OVĚŘIT KLIKNUTÍM NA ODKAZ.
 *
 *   Portfolio je jediné místo webu, kde se dá lhát tak, že se to poznat nedá –
 *   nikdo si nevygoogluje, jestli jsi opravdu ušetřil klientovi 30 % nákladů.
 *   Právě proto tu žádná taková čísla nejsou. `facts` jsou výhradně věci
 *   odečtené ze živého webu (hlavičky odpovědi, strukturovaná data, formát
 *   obrázků), tedy to, co si návštěvník může za dvě minuty ověřit sám.
 *
 *   Když k projektu přibude číslo od klienta (tržby, konverze, doba odezvy),
 *   patří do `outcome` – a jen tehdy, když ho klient smí zveřejnit a ty ho
 *   umíš doložit. Nezveřejnitelný výsledek se prostě neuvede. Prázdné pole je
 *   lepší než tvrzení, které při první otázce spadne.
 */

export interface Project {
  /** Kotva v DOM a klíč Reactu. */
  id: string
  /** Pořadové číslo pro mono readout. Drží se formátu sekcí: '01', '02'… */
  num: string
  name: string
  /** Doména bez protokolu. Je to readout, ne odkaz – čte se jako štítek přístroje. */
  domain: string
  href: string
  /** Čím ten web je. Krátká jmenná fráze, ne věta. */
  kind: string
  /** Co to řeší a pro koho. Dvě až tři věty, ne odstavec. */
  summary: string
  /**
   * Ověřitelná fakta o nasazení. `k` je popisek, `v` hodnota.
   * ★ Jen to, co jde odečíst ze živého webu. Viz hlavička souboru.
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
  /** Odkaz se otevře v nové kartě jen u cizích domén. */
  external: boolean
  /** Tenhle web. Karta pak nese jinou hlavičku ('tento web' místo domény). */
  self?: boolean
}

/**
 * ★ POŘADÍ JE ZÁMĚR, NE ABECEDA.
 * První karta je ta, která nejlíp vysvětlí, co za práci člověk kupuje –
 * tedy nejúplnější zakázka. Vlastní web jde naopak POSLEDNÍ: je to důkaz
 * řemesla, ale zároveň jediná položka, kterou si nikdo neobjednal.
 */
export const PROJECTS: Project[] = [
  {
    id: 'superadvokat',
    num: '01',
    name: 'Super Advokát',
    domain: 'superadvokat.com',
    href: 'https://www.superadvokat.com',
    kind: 'Právní služby online s cenou předem',
    summary:
      'Advokátní kancelář, která prodává konkrétní právní služby po internetu: klient si vybere svou situaci, cenu vidí ještě před objednáním a advokát se ozve do 24 hodin. Web proto musí unést ceník, objednávku i více jazyků a přitom zůstat rychlý.',
    facts: [
      /* ★ POPISKY JEDNOSLOVNĚ. Lišta `.pcard__fact-k` je 6.5rem široká a
         dvouslovný popisek se v ní zalomí, takže se řádek fakta rozjede na dva
         různě vysoké sloupce. Naměřeno na „Pro vyhledávače". */
      { k: 'Doručení', v: 'Předrenderované stránky z CDN (ISR), ne skládání na serveru při každém požadavku' },
      { k: 'Vyhledávače', v: 'Strukturovaná data LegalService, kontakty i adresa kanceláře' },
      { k: 'Jazyky', v: 'hreflang pro cizojazyčné verze, takže se nepřebíjejí ve výsledcích' },
      { k: 'Obrázky', v: 'WebP a odložené načítání pod ohybem' },
    ],
    stack: ['Next.js', 'React', 'Vercel', 'ISR', 'JSON-LD', 'hreflang'],
    shot: {
      src: '/projects/superadvokat.webp',
      alt: 'Úvodní obrazovka webu Super Advokát s nadpisem Advokát online s pevnou cenou předem a fotografií advokáta.',
      w: 1440,
      h: 900,
    },
    external: true,
  },
  {
    id: 'aktutter',
    num: '02',
    name: 'Advokátní kancelář Tutter',
    domain: 'aktutter.cz',
    href: 'https://aktutter.cz',
    kind: 'Prezentace advokátní kanceláře',
    summary:
      'Prezentace pražské kanceláře s praxí od roku 1991: přehled oblastí práva, tým, blog a bezplatná úvodní konzultace. Úkolem webu je nést důvěryhodnost a dovést člověka k té jeho oblasti práva dřív, než odejde jinam.',
    facts: [
      { k: 'Vyhledávače', v: 'Časté dotazy ve strukturovaných datech, takže se můžou objevit přímo ve výsledku' },
      { k: 'Jazyky', v: 'hreflang pro cizojazyčnou verzi' },
      { k: 'Soukromí', v: 'Souhlas s cookies, který jde skutečně odmítnout, ne jen odklikat' },
      { k: 'Obrázky', v: 'WebP a odložené načítání' },
    ],
    stack: ['Nuxt', 'Vue', 'Vercel', 'JSON-LD FAQ', 'hreflang'],
    shot: {
      src: '/projects/aktutter.webp',
      alt: 'Úvodní obrazovka webu Advokátní kanceláře Tutter s nadpisem Naše zkušenosti jsou klíčem k Vašemu úspěchu.',
      w: 1440,
      h: 900,
    },
    external: true,
  },
  {
    id: 'slyx',
    num: '03',
    name: 'SLYX Fashions',
    domain: 'slyx.com',
    href: 'https://slyx.com',
    kind: 'Značkový web módní dílny, USA',
    summary:
      'Web americké značky, která šije latexovou módu na míru. Stojí na obrazu, ne na textu: video přes celou plochu, animace řízené scrollem a galerie zakázkové výroby. Anglicky, pro zákazníky mimo Česko.',
    facts: [
      { k: 'Pojetí', v: 'Video hero přes celou šířku, obsah nastupuje animací při scrollu' },
      { k: 'Doručení', v: 'Cloudflare, tedy edge síť blízko americkým zákazníkům' },
      { k: 'Jazyk', v: 'Anglicky, mimo český trh' },
    ],
    stack: ['Vue', 'GSAP', 'Cloudflare'],
    shot: {
      src: '/projects/slyx.webp',
      alt: 'Úvodní obrazovka webu SLYX Fashions s videem modelky v latexovém oblečení na černém pozadí.',
      w: 1440,
      h: 900,
    },
    external: true,
  },
  {
    id: 'bejcekit',
    num: '04',
    name: 'bejcek.it',
    domain: 'tento web',
    href: '/',
    kind: 'Portfolio se 3D scénou v prohlížeči',
    summary:
      'Web, na kterém právě jste. Skleněný stroj uprostřed není obrázek, ale scéna počítaná v prohlížeči, kolem které obíhá kamera podle scrollu. Postavil jsem ho hlavně proto, abych na něm mohl ukázat, že se výkon a efekt nevylučují.',
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
    external: false,
    self: true,
  },
]
