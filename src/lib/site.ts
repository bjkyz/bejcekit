/**
 * ★★ JEDINÉ MÍSTO NA CELÉM WEBU, KDE JE NAPSANÁ JEHO ADRESA.
 *
 * Dřív ta konstanta bydlela ve vite.config.ts. Musela se přestěhovat sem,
 * protože ji od přidání žurnálu potřebuje i `scripts/prerender.mjs`: ten
 * generuje sitemapu, RSS a strukturovaná data pro každý článek, a to všechno
 * jsou absolutní URL. Config si o svou vlastní konstantu říct neumí (Vite
 * vrací resolvovanou konfiguraci, ne modul), takže by adresa musela být
 * napsaná dvakrát — a přesně to je chyba, kvůli které tenhle soubor vznikl.
 *
 * Kdo ji čte:
 *   • vite.config.ts — plugin `siteOrigin` dosazuje za token `__SITE_ORIGIN__`
 *     v index.html, projekty.html, clanky.html a ve statických souborech
 *   • scripts/prerender.mjs — hlavičky článků, sitemap.xml, rss.xml, JSON-LD
 *
 * ★ AŽ SE KOUPÍ `bejcek.it`, MĚNÍ SE JEN TENHLE ŘÁDEK. Bez lomítka na konci.
 *
 * Proč to vůbec bylo drahé: `<link rel="canonical">` mířící jinam, než web
 * doopravdy stojí, říká Googlu „pravá verze je jinde". Když to jinde
 * neodpovídá, nemusí se web zaindexovat vůbec.
 */
export const SITE_ORIGIN = 'https://bejcekit.vercel.app'

/** Značka. Je to JMÉNO, ne adresa — při stěhování domény se nemění. */
export const SITE_NAME = 'bejcek.it'

/** Autor všeho obsahu. Jeden člověk, jedna entita ve strukturovaných datech. */
export const AUTHOR_NAME = 'Jiří Bejček'

/**
 * ★ STABILNÍ `@id` UZLY GRAFU STRUKTUROVANÝCH DAT.
 *
 * Schema.org neumí říct „ten člověk, co je na úvodní stránce" jinak než
 * odkazem na `@id`. Když se to napíše pokaždé jinak, vznikne Googlu pět
 * různých autorů místo jednoho — a autorita se nesečte, což je celý smysl
 * E-E-A-T. Proto jsou identifikátory tady a nikde jinde se neskládají ručně.
 */
export const ID = {
  /** ProfessionalService v index.html. */
  identity: `${SITE_ORIGIN}/#identity`,
  /** Person — autor článků. Definuje se v hlavičce žurnálu, odkazuje se všude. */
  person: `${SITE_ORIGIN}/#person`,
  /** WebSite — kořen celého webu. */
  website: `${SITE_ORIGIN}/#website`,
  /** Blog — kolekce článků. */
  blog: `${SITE_ORIGIN}/clanky#blog`,
} as const
