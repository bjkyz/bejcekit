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
  /**
   * ★ SPECIFIKACE ÚVODU. Existuje jen na sekci 00 a je to TÝŽ obsah, který tam
   * dřív stál jako tři odrážky pod sebou — jen posazený do jednoho pásu na patě
   * obrazovky (viz .hero-spec v sections.css).
   *
   * Není to kosmetika. Odrážky stály uprostřed sloupce a užíraly ~120 px svislého
   * místa PŘESNĚ TAM, kde je za textem stroj; pás na patě stojí ~55 px a uvolní
   * pětinu okna, do které smí krychle sjet (HERO_DROP, lib/scene-state.ts).
   * Vedlejší efekt je čitelnost: `k` je nárok, `v` je jeho podmínka, takže se to
   * dá přejet očima, kdežto tři plné věty pod sebou se musí přečíst celé.
   */
  specs?: { k: string; v: string }[]
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
/**
 * ★ mailto S PŘEDMĚTEM, ne holá adresa. Prázdný předmět je malé, ale skutečné
 * tření („co mám napsat do subjectu?") a příchozí mail bez předmětu se navíc
 * hůř třídí. Jen předmět — předvyplněné TĚLO působí jako formulářový spam
 * a přepisuje se hůř, než se píše. Kopírovací tlačítko dál kopíruje holý EMAIL.
 */
export const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Poptávka z bejcek.it')}`

/**
 * ★★ KAM VEDOU VŠECHNY VÝZVY K AKCI. JEDNO MÍSTO, JEDNA CESTA.
 *
 * Dřív byla CTA rozstřelená mezi tři cíle: kotvu `#kontakt` (scroll přes pět
 * obrazovek WebGL), `mailto:` (otevře cizí aplikaci a prázdné okno s otázkou
 * „co mám napsat") a kotvu `#poptavka` na podstránkách. Tři různé prahy, tři
 * různé zážitky a ani jeden z nich neměl vlastní URL, kterou by šlo poslat,
 * inzerovat nebo změřit.
 *
 * ★ Kotvy `#kontakt` a `#poptavka` se tím NERUŠÍ: sekce 05 na úvodu zůstává
 *   (krychle musí mít přesně šest stěn) a poptávkové bloky na podstránkách taky.
 *   Jen z nich přestaly být CÍLE — jsou to rozcestníky, které vedou sem.
 *
 * ★★ MUSÍ STÁT NAD `SECTIONS`, KTERÉ HO POUŽÍVAJÍ. `const` je sice hoistovaný,
 *   ale do doby vyhodnocení leží v temporal dead zone — a `SECTIONS` je taky
 *   modulová konstanta, takže se vyhodnotí PŘI IMPORTU. S deklarací níž v souboru
 *   by import celého modulu skončil na `ReferenceError` a spadl by s ním celý web,
 *   včetně prerenderu. (Ověřeno: build zhavaroval hned při prvním pokusu.)
 */
export const CONTACT_HREF = '/kontakt'

export const SECTIONS: Section[] = [
  {
    id: 'ident',
    kicker: '[ 00 / IDENT ]',
    plateCode: 'IDENT',
    plateNum: '00',
    headline: 'Software, který pracuje za vás.',
    /**
     * ★ HERO SE ČTE NA TELEFONU, NE NA 27" MONITORU. Tři věty, ne šest:
     *   na 360px displeji je z každé věty navíc řádek a tlačítka se odsouvají
     *   pod spodní hranu obrazovky. Fakta patří do `specs` na patě, ty se dají
     *   SKENOVAT — odstavec se musí přečíst celý, nebo vůbec.
     *
     * ★★ NABÍDKA JE POSTAVENÁ NA PROBLÉMU, NE NA TECHNOLOGII. Zákazník neví,
     *   jestli potřebuje agenta, API nebo databázi, a vědět to nemá. Ví jen,
     *   co mu bere čas. Proto hero říká „řekněte mi, co vás zdržuje", ne
     *   výčet zkratek — ten je až ve stacku o dvě obrazovky níž.
     */
    body:
      'Jsem Jiří Bejček. Stavím AI, automatizace a software na míru, které šetří čas a odstraňují ruční práci. Vy popíšete problém. Já navrhnu a dodám řešení.',
    bullets: [],
    specs: [
      { k: 'Jeden inženýr, ne agentura', v: 'Mluvíte přímo se mnou. Navrhnu, postavím i nasadím.' },
      { k: 'Pevná cena a termín', v: 'Dostanete je písemně před začátkem.' },
      { k: 'Odpovím do 24 hodin', v: 'I o víkendu. Pracuji po celém Česku.' },
    ],
    status: 'Přijímám nové projekty',
    cta: { label: 'Probrat projekt', href: CONTACT_HREF },
    /**
     * ★ DRUHÉ TLAČÍTKO VEDE NA SLUŽBY, NE NA SEKCE POD SEBOU.
     *   Scroll dolů i pravá lišta nabízejí totéž co odkaz na sekci, takže by
     *   to byla třetí cesta k témuž. `/sluzby` je oproti tomu obsah, který se
     *   na šest stěn krychle nevešel — a na telefonu je tohle jediná cesta,
     *   jak se k němu z úvodu dostat (odkazy v liště jsou pod 800 px skryté).
     */
    ghostCta: { label: 'Zobrazit služby', href: '/sluzby' },
    align: 'center',
    subsystem: 'IDENTIFIKACE',
  },
  {
    id: 'ai',
    kicker: '[ 01 / AI ]',
    plateCode: 'AI',
    plateNum: '01',
    headline: 'AI, která pracuje s vašimi daty.',
    body:
      'Odpovídá z vašich dokumentů, uvádí zdroje a umí spustit další krok procesu.',
    bullets: [
      'Interní asistenti odpovídají z vašich dokumentů a ověřených zdrojů.',
      'Smlouvy, faktury a objednávky vytěží a zapíšou přímo do systému.',
      'AI agenti provedou úkol napříč nástroji, ne jen odpoví.',
      'Návratnost spočítáme předem. Když nedává smysl, řeknu to.',
    ],
    /**
     * Nejsilnější argument téhle sekce: ověřitelný důkaz místo tvrzení.
     * ★ MUSÍ ZŮSTAT PRAVDA. Žurnál na `/clanky` opravdu píše denní linka
     *   postavená na Claude (viz api/cron/publish-article.ts) a zdroje si
     *   vymyslet nemůže, protože nedostane možnost napsat URL. Kdyby se ta
     *   linka vypnula, tahle věta musí ze stránky zmizet jako první.
     */
    proof:
      'Ukázka v provozu: AI linka na tomto webu připravuje články žurnálu. Každý má datum a zdroje, takže výsledek můžete ověřit.',
    deliverable: {
      label: 'Co dostanete',
      text: 'Nasazené řešení napojené na vaše systémy, dokumentaci a přehled ušetřeného času.',
    },
    stack: ['Anthropic API', 'OpenAI API', 'RAG', 'MCP', 'Vektorová DB', 'Python'],
    cta: { label: 'Probrat AI řešení', href: CONTACT_HREF },
    ghostCta: { label: 'Ukázka: žurnál', href: '/clanky' },
    align: 'left',
    subsystem: 'AI SYSTÉMY',
  },
  {
    id: 'automatizace',
    kicker: '[ 02 / AUTO ]',
    plateCode: 'AUTO',
    plateNum: '02',
    headline: 'Opakovanou práci převezme automatizace.',
    body:
      'E-maily, dokumenty a data propojí jeden workflow. Člověk řeší jen výjimky.',
    bullets: [
      'Načte e-mail nebo dokument a vytáhne potřebná data.',
      'Data zkontroluje a zapíše do CRM, databáze nebo účetního systému.',
      'Pošle výsledek, upozorní na chybu a uloží dohledatelnou stopu.',
    ],
    deliverable: {
      label: 'Co dostanete',
      text: 'Nasazený workflow, dokumentaci a přehled ušetřeného času.',
    },
    stack: ['n8n', 'API', 'Webhooky', 'PostgreSQL', 'Node.js', 'Cron'],
    cta: { label: 'Probrat automatizaci', href: CONTACT_HREF },
    align: 'right',
    subsystem: 'AUTOMATIZACE',
  },
  {
    id: 'software',
    kicker: '[ 03 / SOFTWARE ]',
    plateCode: 'SOFTWARE',
    plateNum: '03',
    headline: 'Software podle vašeho procesu.',
    body:
      'Stavím interní nástroje, klientské portály, dashboardy a SaaS. Od rychlého MVP po produkt pro tisíce uživatelů.',
    bullets: [
      'Interní nástroje a portály spojí dokumenty, data a workflow.',
      'SaaS zahrne účty, předplatné, platby i administraci.',
      'Dashboardy ukážou čísla, podle kterých se dá rozhodnout.',
      'Weby a aplikace stavím rychlé, bezpečné a připravené na růst.',
    ],
    deliverable: {
      label: 'Co dostanete',
      text: 'Nasazenou aplikaci, zdrojový kód, přístupy, dokumentaci a plán dalšího rozvoje.',
    },
    stack: ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Vercel'],
    cta: { label: 'Probrat software', href: CONTACT_HREF },
    ghostCta: { label: 'Zobrazit projekty', href: '/projekty' },
    align: 'left',
    subsystem: 'SOFTWARE NA MÍRU',
  },
  {
    id: 'proces',
    kicker: '[ 04 / PROCES ]',
    plateCode: 'PROCES',
    plateNum: '04',
    headline: 'Od problému k nasazenému řešení.',
    body:
      'Stačí popsat, co dnes děláte ručně nebo co chcete vytvořit. Technické zadání připravím já.',
    bullets: [],
    /* ★ ČTYŘI KROKY, NE PĚT. Sekce se musí vejít do 100svh i na notebooku
       1440×900 (viz --sp-* v tokens.css); pátá dlaždice ji přetáhne a spodek
       s tlačítkem se uřízne. „Nasazení" a „rozvoj" jsou navíc pro klienta
       jedna fáze: běží to a dělá se to dál. */
    steps: [
      {
        title: 'Analýza',
        text: 'Na úvodním hovoru společně pojmenujeme problém, cíl a priority.',
      },
      {
        title: 'Návrh',
        text: 'Dostanete návrh řešení, rozsah, pevnou cenu a termín písemně.',
      },
      {
        title: 'Stavba',
        text: 'Nasazuji průběžně. Běžící verzi vidíte od začátku vývoje.',
      },
      {
        title: 'Provoz a rozvoj',
        text: 'Po nasazení řeším monitoring, úpravy a další rozvoj.',
      },
    ],
    cta: { label: 'Domluvit úvodní hovor', href: CONTACT_HREF },
    align: 'right',
    subsystem: 'PRACOVNÍ POSTUP',
  },
  {
    id: 'kontakt',
    kicker: '[ 05 / KONTAKT ]',
    plateCode: 'KONTAKT',
    plateNum: '05',
    /**
     * ★★★ TAHLE SEKCE JE OD ZAVEDENÍ `/kontakt` ROZCESTNÍK, NE CÍL.
     *
     * Krychle musí mít PŘESNĚ ŠEST STĚN — sedmá scénu shodí (`FACE_TRANSFORMS[6]`
     * je undefined) a pátá by nechala kameru viset na prázdné pozici. Kontakt
     * z ní tedy zmizet nemůže, i když se vlastní poptávka přestěhovala na
     * samostatnou stránku s formulářem.
     *
     * Ze sekce se proto stalo to jediné, co dává smysl: konec scrollu, který
     * má jednu silnou větu a jedno velké tlačítko. Text se ZKRÁTIL na polovinu,
     * protože všechno, co tu dřív stálo (co se dozvíte, do kdy, co když nejsem
     * ten pravý), je teď na `/kontakt` u formuláře — tedy tam, kde se to čte
     * ve chvíli rozhodování, ne o pět obrazovek dřív.
     *
     * ★ Kanály pod tím zůstávají: kdo nechce formulář, nemá důvod klikat dál.
     */
    headline: 'Popište problém. Navrhnu další krok.',
    body:
      'Stačí pár vět. Do 24 hodin odpovím osobně a řeknu, zda a jak dává řešení smysl.',
    bullets: [],
    cta: { label: 'Probrat projekt', href: CONTACT_HREF },
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

/**
 * ═══════════ PODSTRÁNKY V NAVIGACI ═══════════
 *
 * ★ JEDEN SEZNAM PRO TŘI NAVIGACE. Úvod (`hud/Hud.tsx`), projekty i žurnál
 *   (`ui/PageShell.tsx`) vykreslují tytéž odkazy. Dokud byla podstránka jedna,
 *   byl seznam opsaný na dvou místech a šlo to; při přidání žurnálu by se
 *   opisoval potřetí a první, co by se stalo, je že by někde chyběl.
 *
 * `label` je verzálkový štítek do lišty, `title` věta do patičky — je to týž
 * cíl řečený dvěma hlasy, ne dvě různé věci.
 *
 * ★★ VÍC POLOŽEK SEM NEPŘIDÁVEJ BEZ ZMĚŘENÍ. Lišta nese ještě tři služby
 *   (`SECTIONS.slice(1, 4)`), značku a tlačítko; na 1280px displeji je to
 *   napjaté a šestá položka by řádek přetáhla přes značku. Kdyby přibyla další
 *   stránka, ustoupí jedna služba — na ty se dá skočit i pravou lištou
 *   a scrollem, kdežto na jinou stránku se jinak nedostaneš.
 */
export const NAV_PAGES: { label: string; title: string; href: string }[] = [
  { label: 'SLUŽBY', title: 'Služby', href: '/sluzby' },
  { label: 'PROJEKTY', title: 'Projekty', href: '/projekty' },
  { label: 'ŽURNÁL', title: 'Žurnál', href: '/clanky' },
]


/**
 * ★★ KOLIK SEKCÍ ÚVODU SE VEJDE DO LIŠTY VEDLE PODSTRÁNEK.
 *
 * Lišta nese značku, odkazy a tlačítko. S třemi podstránkami zbývá místo na
 * DVĚ sekce, ne tři: šestá položka se na 1280px displeji začne tlačit ke značce.
 * Vypadává SOFTWARE — schválně, protože ten má na `/sluzby` tři vlastní skupiny
 * (interní nástroje, SaaS, web), kdežto na AI a automatizaci vede jinak jen
 * scroll. Na všech šest stěn se dá pořád skočit pravou lištou.
 */
export const NAV_SECTION_COUNT = 2

export const FACE_COUNT = SECTIONS.length
