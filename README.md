# bejcek.it · „Jednotka 06"

3D scroll-driven web pro nezávislého IT inženýra. Uprostřed je skleněná krychle
se žhavým reaktorem uvnitř; kamera ji podle scrollu obíhá po stěnách a každá
stěna je jedna sekce webu.

Web má **čtyři části** (vícestránkový build, žádný router):

| URL | Soubor | Co to je |
|---|---|---|
| `/` | `index.html` → `src/main.tsx` → `App.tsx` | úvod s krychlí, šest sekcí |
| `/sluzby` | `sluzby.html` → `src/sluzby.tsx` → `ServicesPage.tsx` | celý katalog nabídky + technologie + certifikát |
| `/projekty` | `projekty.html` → `src/projekty.tsx` → `ProjectsPage.tsx` | reference, 3D karty, **bez WebGL a bez Lenisu** |
| `/clanky`, `/clanky/<článek>`, `/clanky/tema/<téma>` | `clanky.html` → `src/clanky.tsx` → `JournalRoot.tsx` | žurnál. **Z jedné šablony vyrábí prerender všechny stránky** – viz níž |

**Lighthouse (desktop): 100 / 100 / 100 / 100** na obou stránkách (výkon,
přístupnost, best practices, SEO), agentic-browsing 100. Mobil: `/projekty` 97,
`/` 87 (LCP 2,0 s). Naměřeno lokálně na `npm run preview`.

Obě stránky se při buildu **prerenderují do HTML** (`scripts/prerender.mjs`,
spouští se jako součást `npm run build`): obsah je v `dist/*.html` přímo,
klient ho jen hydratuje (`hydrateRoot`). První vykreslení tedy nečeká na JS —
proto LCP 2,0 s místo dřívějších ~3,8 s. Dev server prerender nemá a renderuje
klasicky (větev v `main.tsx`/`projekty.tsx`).

## Spuštění

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # produkční build do dist/
npm run preview   # náhled produkčního buildu
```

## Nasazení na Vercel

Konfigurace je hotová v `vercel.json` (cache hlavičky, bezpečnostní hlavičky, CSP).
Vercel projekt sám rozpozná jako Vite, není co nastavovat.

```bash
npx vercel          # náhledový deploy
npx vercel --prod   # produkce
```

Nebo přes web: naimportuj repozitář na vercel.com, framework se detekuje sám
(build `npm run build`, výstup `dist`).

**Doména je na JEDINÉM místě: konstanta `SITE_ORIGIN` v `src/lib/site.ts`.**
Do souborů se dosazuje za token `__SITE_ORIGIN__` (plugin `siteOrigin`, funguje
i v dev režimu). Až se koupí `bejcek.it`, mění se jen ten jeden řádek — nikde
jinde adresa napsaná není. Nový soubor v `public/`, který má obsahovat adresu,
se ale musí přidat do pole `ORIGIN_FILES`, jinak v produkci zůstane doslovný token.

Čisté URL (`/projekty` místo `/projekty.html`) dělá `cleanUrls: true` ve
`vercel.json`. Žádný rewrite k tomu potřeba není — je to opravdový soubor.

CSP v `vercel.json` je záměrně přísná (`default-src 'self'`) — web nedělá jediný
požadavek na cizí doménu, takže si to může dovolit. Když někdy přidáš analytiku
nebo externí skript, musíš ho do CSP doplnit, jinak ho prohlížeč zablokuje.

### ★ Do `vercel.json` se NESMÍ psát komentáře

Vercel validuje konfiguraci proti přísnému schématu a **každý neznámý klíč shodí
celý deploy**, ne jen tu jednu hlavičku:

```
The `vercel.json` schema validation failed with the following message:
`headers[4]` should NOT have additional property `comment`
```

Stalo se to 2026-08-11: do hlaviček se v dobré víře dopsaly klíče `comment`
s vysvětlením cache pravidel. Web se lokálně stavěl, commit byl na GitHubu — a
produkce přitom půl dne držela starší verzi, protože build padal ještě před
prvním řádkem. **Vercel navíc hlásí vždy jen tu první chybu**, takže tři cizí
klíče = tři spadlé deploye.

Hlídá to teď `checkVercelJson()` v `scripts/prerender.mjs`: `npm run build`
spadne dřív, než se dá něco takového odeslat. Vysvětlení patří sem, ne do JSONu.

### Cache hlavičky a proč jsou takové

| Cesta | Pravidlo | Důvod |
|---|---|---|
| `/assets/*`, `/fonts/*`, `/media/*`, `/models/*` | `max-age=31536000, immutable` | Mají otisk obsahu v názvu (nebo se nikdy nemění), takže se smí cachovat navždy. Nová verze = nový název. |
| `/projects/*`, `og.png`, `favicon.svg`, `apple-touch-icon.png`, certifikát | `max-age=604800, stale-while-revalidate=86400` | Obrázky a PDF v `public/` **nemají otisk v názvu**, takže `immutable` nesmí být. Týden na CDN s revalidací na pozadí: návštěvník nikdy nečeká. |
| všechno ostatní kromě `/api/*` | `max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400` | HTML prohlížeč revaliduje vždy, CDN si ho ale drží. Web se přestavuje jednou denně, takže drtivá většina požadavků skončí na edge a origin se skoro nevzbudí. |

`Strict-Transport-Security` je nastavená na dva roky včetně subdomén a `preload`:
web běží výhradně přes HTTPS a nikdy nebude jinak.

## Kde co upravit

| Chci změnit | Soubor |
|---|---|
| **Texty, služby, kontakty, telefon** | `src/content/sections.ts` — jediný soubor s obsahem úvodu |
| **Anglické texty (všechny stránky)** | `src/content/en.ts` — protějšek všech `content/*.ts` |
| **Krátké texty rozhraní (obě verze)** | `t({ cs: …, en: … })` přímo v komponentě (`src/lib/lang.ts`) |
| **Anglické adresy a co má/nemá překlad** | `ROUTES` v `src/lib/lang.ts` |
| **Katalog služeb, technologie, certifikát** | `src/content/services.ts` |
| **Projekty a reference** | `src/content/projects.ts` + snímky v `public/projects/` |
| **Článek** (opravit, stáhnout) | `src/content/articles/<slug>.json` — jeden soubor = jeden článek |
| **Témata žurnálu** | `src/content/topics.ts` |
| **Firmy, které jde v článcích označit** | `src/content/entities.ts` |
| **Zdroje, ze kterých robot čerpá** | `FEEDS` v `api/cron/publish-article.ts` |
| **Titulky, popisky a JSON-LD žurnálu** | `src/lib/seo.ts` — jediné místo, kde vzniká hlavička |
| Barvy, písma, rozestupy, časování | `src/styles/tokens.css` — jediný zdroj pravdy |
| Vzhled karet projektů | `src/styles/projects.css`, pohyb v `src/lib/tilt.ts` |
| Pozice a odstup kamery po sekcích | `src/lib/scene-state.ts` (`ORBIT_RADIUS`, `ORBIT_PAN`) |
| Adresa webu | `SITE_ORIGIN` v `src/lib/site.ts` (jediné místo) |

**Pořadí služeb** se mění přeuspořádáním pole v `sections.ts`. Do `src/lib/faces.ts`
nesahej — tam je pořadí dané geometrií krychle (viz níž).

**Nabídka žije na dvou místech a je to záměr.** Úvod PRODÁVÁ (tři obrazovky,
každá jeden slib), `/sluzby` VYJMENOVÁVÁ (celý katalog, ať si člověk najde svůj
případ). Texty se proto nesmí opisovat: dvě stránky s týmž obsahem jsou pro
vyhledávač duplicita a jedna z nich vypadne.

**★ DO `SECTIONS` NEPŘIDÁVEJ SEDMOU POLOŽKU.** Pole je 1:1 svázané s geometrií
krychle: šest stěn, šest sekcí. Sedmá položka scénu nezhorší, ale **shodí** —
`FACE_TRANSFORMS[6]` je `undefined`, `FacePlates` na to sáhne při renderu,
`SceneBoundary` výjimku chytí a 3D zmizí z webu úplně. A i kdyby ne, `Choreo`
klampuje polohu na dráze na pět, takže by kamera na posledních dvou sekcích
zamrzla. Nový obsah tedy patří na **vlastní stránku** (jako `/projekty`), ne
do `SECTIONS`.

## Dvojjazyčnost: česky na kořeni, anglicky pod `/en/`

Web má od 2026-08-14 anglickou verzi: `/en`, `/en/services`, `/en/work`,
`/en/contact`. **Žurnál anglicky NENÍ** a je to rozhodnutí, ne opomenutí —
články píše každý den cron přes jazykový model, takže by druhá větev znamenala
druhé volání modelu denně, druhý RSS kanál a riziko, že se překlad rozejde
s originálem (`journal: null` v `ROUTES`).

Jak to drží pohromadě:

- **Jazyk je modulový stav, ne React context** (`src/lib/lang.ts`). Web je MPA:
  každá stránka je vlastní dokument s vlastním `<html lang>`, takže se jazyk za
  běhu nikdy nemění. V prohlížeči ho nastaví vstupní bod z `document.documentElement.lang`
  (`adoptDocumentLang()`) PŘED hydratací, v prerenderu `entry-prerender.tsx` před
  každým `renderToString`.
- **Anglické stránky nemají vlastní skripty.** `en/index.html` ukazuje na týž
  `/src/main.tsx` jako česká verze; liší se jediný atribut v HTML. Osm skoro
  identických vstupních souborů by se při první změně rozešlo.
- **Odkazy překládá `localPath()`**, ne komponenty. Obsah dál píše `/kontakt`
  a na anglické verzi z toho vyjde `/en/contact`. Neznámá cesta projde beze
  změny (kotvy, soubory, externí odkazy).
- **Obsah se skládá v `src/content/i18n.ts`**: kostra z české verze, texty
  z `en.ts`. Když přibude sekce nebo karta, anglická verze se NEROZBIJE —
  ukáže na tom místě češtinu, dokud překlad nedorazí.
- **`hreflang` je obousměrný a na každé stránce včetně sebe sama** (v `<head>`
  i v sitemapě přes `xhtml:link`). Neúplný klastr Google zahodí celý a obě
  verze pak soupeří jako duplicity. `x-default` míří na češtinu.
- **Formulář posílá skryté pole `lang`.** Bez JS odpovídá `api/contact.ts`
  přesměrováním — bez toho pole by anglický návštěvník po odeslání skončil na
  české stránce. Podle téhož pole volí funkce jazyk hlášek. ★ Klíče chyb
  (`?chyba=jmeno`) zůstávají české: je to protokol, ne text pro člověka.

## Vzhled: lehký neobrutalismus

Poloměry byly 2–3 px roztroušené v šesti souborech. Dvě věci na tom byly špatně
a ani jedna není vkus: 2px zaoblení **není vidět**, ale zároveň brání tomu, aby
hrany různých prvků lícovaly; a roztroušená hodnota se dřív nebo později rozejde.
Teď je z toho soustava — `--r-tile: 0` v `tokens.css`, jedno místo.

„Lehký" znamená, že se mění **konstrukce, ne paleta**. Neobrutalismus, jak se
dnes nosí, přidává křiklavé plochy a komiksové stíny; tenhle web má tmavou scénu
a jednu akcentovou rodinu, do které by to udeřilo jako cizí těleso. Bere se z něj
jen to, co pomáhá přehledu:

- **pravé úhly**, aby prvky lícovaly a bloky se daly odečíst okem
- **rám, který je opravdu vidět** (`--line-3`, 3:1 — WCAG 1.4.11 u ovládacích prvků)
- **plné barevné pásky u faktů** (`--bar`): důkaz, „co dostanete" i štítek
  dostupnosti mají teď jeden tvar — zelená páska vlevo, žádný banner
- **tvrdý, nerozostřený posun** (`--shadow-hard`) jen na hlavní vyplněné akci

## Co je potřeba vědět, než do toho sáhneš

Za každým bodem je chyba, která se těžko hledá. Všechny už se jednou staly.

- **`src/lib/faces.ts` — pořadí stěn.** Protilehlé stěny krychle jsou od sebe 180°,
  což je degenerovaný případ slerpu (nejednoznačná osa) a krychle v něm viditelně
  „přepadává". Stěny proto jdou po hamiltonovské cestě, kde je **každý krok přesně 90°**.

- **Hero se NIKDY nesmí odhalovat přes `opacity`.** Chrome element s `opacity: 0`
  do LCP nezapočítává. Reveal animace hero sekce posouvala LCP o víc než sekundu
  a srážela Lighthouse výkon z 97 na 81. Hero nastupuje **jen posunem** (transform).

- **`Shell.tsx` — nikdy nenastavuj `transparent` na skle.** `MeshTransmissionMaterial`
  je neprůhledný a zapisuje hloubku. Právě proto jsou zadní cedule vidět jen skrz
  refrakci, a to je ten „duchový" efekt. Zapnutím `transparent` vyskočí všechny
  pozpátku do popředí. Animuj `scale` a emisi, nikdy opacity.

- **`Effects.tsx` — Bloom se vyrábí ručně a vkládá přes `<primitive>`.** Nedávej mu
  `ref`. V Reactu 19 je `ref` normální prop a `@react-three/postprocessing` na propech
  volá `JSON.stringify` → kruhová reference → **plátno se vůbec nenamountuje.**

- **`FacePlates.tsx` — mesh nevznikne, dokud není hotová textura.** Přidání mapy
  k už zkompilovanému materiálu three nepřekompiluje (chce `needsUpdate`), takže by
  na stěně svítil holý bílý obdélník místo nápisu.

- **`Scene.tsx` — `camera` a `gl` jsou modulové konstanty, ne objektové literály.**
  Inline literál = nový objekt při každém renderu → R3F resetuje pozici kamery
  a celá choreografie je tiše mrtvá.

- **`Scene.tsx` — rozměr plátna se nastavuje z `documentElement.clientWidth`.**
  `position: fixed; inset: 0` se sází podle *layoutového* viewportu, který se na
  mobilu liší od viditelného (iPhone 15: 521 vs 393 px) → krychle by utekla mimo obraz.

- **Pořadí stylesheetů v produkci NENÍ pořadí importů.** `inlineCss()` slepuje
  všechny `.css` z `dist/assets` v pořadí, v jakém leží v adresáři – takže
  `projects.css` skončí ZA `journal.css`, i když se importuje dřív. Pravidlo
  v novém stylesheetu, které přepisuje starší třídu (`.page`, `.footer`,
  `.page__cta`), proto musí mít **vyšší specificitu**, ne jen pozdější pořadí.
  Stálo to jeden článek roztažený přes celé okno.

- **`vite.config.ts` — skupina `react` musí být PRVNÍ.** Jinak Rolldown přilepí
  react-dom k `@react-three` a hlavní bundle si kvůli `createRoot` stáhne celou
  three.js na kritickou cestu. Líné načítání scény je pak k ničemu.

- **`lib/` nesmí importovat three jako hodnotu, jen jako typ.** Jediné
  `import { Color } from 'three'` v souboru, který čte HUD, vrátí three.js do
  hlavního bundlu zadními vrátky. Barvy scény proto žijí v `src/three/palette.ts`.

- **`tokens.css` smí v média dotazech měnit jen `:root` proměnné.** Média dotaz
  nezvyšuje specificitu, takže komponentní pravidlo by přebil později importovaný
  `sections.css`.

- **Cedule na krychli jsou schválně bez diakritiky** (`IDENT`, `WEB`, `INFRA`…).
  Veškerá čeština žije v DOM — tam ji přečte Google i čtečka.

- **Žádné dlouhé pomlčky (—) v textech.** V češtině se skoro nepoužívají a jsou to
  nejnápadnější stopy po strojově psaném textu.

- **`projects.css` — na `.pcard` nikdy `overflow: hidden` ani `backdrop-filter`.**
  Obojí podle specifikace zplošťuje 3D scénu, takže `transform-style: preserve-3d`
  se tiše zahodí a hloubka vrstev uvnitř karty přestane fungovat. Ořezává se až
  na `.pcard__screen`, která žádné 3D potomky nemá.

- **`projects.css` — hloubku dělá obrazovka couvající dozadu, ne text jedoucí dopředu.**
  `transform` z prvku udělá containing block pro absolutně pozicované potomky.
  Kdyby ho měl `.pcard__body`, natažený zásahový obdélník odkazu (`.pcard__link::after`)
  by kryl jen text a **klik do obrázku, tedy do dvou třetin karty, by nikam nevedl.**

- **`.reveal` a naklápění karty nesmí být na jednom prvku.** `.reveal.is-in` má
  `transform: none` se specificitou (0,2,0) a přebilo by rotaci na `.pcard` (0,1,0).
  Karta by se nehnula, JS by přitom spokojeně počítal a v konzoli by nebylo nic.
  Reveal proto sedí na `.pgrid__cell`.

- **`inlineCss` ve `vite.config.ts` projíždí všechna HTML v `dist/`.** Kdyby znal
  jen `index.html`, druhá stránka by jako jediná držela render-blokující `<link>`
  na CSS soubor, který tentýž plugin o řádek níž smaže — tedy stránka úplně bez stylů.

## Licence 3D modelu

Model `public/models/core.v2.glb` je **„Primary Ion Drive" od Mikea Murdocka,
licence CC BY 4.0**. Atribuce je **smluvní povinnost**, ne zdvořilost — je uvedená
v patičce sekce 05 a ve stavovém panelu. Neodstraňuj ji z estetických důvodů.

> Pozor: `DamagedHelmet.glb`, po kterém většina návodů sáhne jako první,
> je licenčně kontaminovaný (nese i CC-BY-**NC**, tedy zákaz komerčního užití).
> Pro placený web ho nepoužívej.

## Výkon

Úvodní stránka váží se vším **~880 kB** (JS+CSS + 501 kB model), ale na kritické
cestě je jen **~80 kB gz** — three.js se načítá až po vykreslení textu.

`/projekty` je podstatně lehčí: **~71 kB gz JS** (React + sdílený chunk + vlastní
kód) a čtyři snímky po 27–70 kB, načítané líně. **Three.js ani Lenis si nebere
vůbec** — kdyby projekty byly jen další sekcí úvodu, platil by za ně i návštěvník,
který se k referencím nikdy nedostane.

- **CSS je inline v obou HTML** (viz `inlineCss` ve `vite.config.ts`): ~7.6 kB gz
  nestojí za render-blokující request.
- **Snímky projektů jsou WebP 1440×900** vyrobené headless Chromem přes CDP
  (`Page.captureScreenshot` s `format: 'webp'`). V `<img>` mají povinné
  `width`/`height` a kontejner `aspect-ratio`, takže při dotečení nemají co posunout.
- **3D se importuje až po `load` + idle** (`useArmed` v `App.tsx`), ne hned po
  hydrataci — vyhodnocení three.js jinak blokovalo překreslení textu a Chrome ho
  počítal do LCP (naměřeno 6.4 s místo 2.6 s).
- **`font-display: optional`**: překreslení po výměně fontu je nový LCP kandidát;
  preloadovaný font první paint skoro vždy stihne, a když ne, jedna návštěva
  pojede na systémovém písmu.

### Odstupňovaná kvalita (staré PC, slabé mobily)

O kvalitě 3D rozhodují dvě vrstvy v `src/lib/quality.ts` a `src/three/Scene.tsx`:

1. **Detekce před startem** — `failIfMajorPerformanceCaveat` odhalí softwarové
   WebGL (SwiftShader na PC s blocklistovanou grafikou → 3D se vůbec nezapne),
   renderer string odhalí staré integrované Intel GPU (počet jader CPU o grafice
   neříká nic), Save-Data / 2G vypne 3D úplně.
2. **Governor za běhu** — měří fps a sestupuje po žebříku: DPR ↓ → `high→mid`
   (sklo bez backside, FBO 256², bez MSAA) → `mid→low` (sklo fejkem, bez
   composeru) → **3D pryč** (web zůstane, viz `SceneBoundary`). Každý sestup se
   pamatuje 7 dní (`localStorage`), takže příští návštěva začne rovnou na patře,
   které stroj utáhl. Nahoru se vrací jen DPR — patra ne, ať governor neosciluje.

Bez WebGL jede i scroll nativně (Lenis se nespouští) a stavový panel poctivě
hlásí „statický režim".

Vědomě tu **není GSAP ani troika** (drei `<Text>`). GSAP obsluhoval tři drobnosti
za 30 kB gz, troika byl celý font engine kvůli šesti ASCII nápisům. Obojí nahradilo
pár řádků v `src/lib/spring.ts` a canvas textura.

## Přístupnost

- Veškerý obsah je v reálném sémantickém DOM. **Vypni WebGL a zbude kompletní,
  indexovatelný web se službami** — plátno je `aria-hidden`.
- `prefers-reduced-motion` vypne 3D, Lenis i naklápění karet a vykreslí obsah
  staticky. Nic přitom nezmizí: karta jen stojí rovně a snímek se nenechá ztlumený.
- **Karty projektů: „natažený odkaz".** Odkazem je jen jméno projektu (odečítač
  obrazovky tedy slyší krátké smysluplné jméno, ne dvě stě znaků popisu), ale jeho
  `::after` se roztáhne přes celou kartu, takže myš i prst mohou klikat kamkoli.
  Focus z klávesnice rozsvítí celou kartu přes `:focus-within`, aby měl uživatel
  klávesnice stejnou zpětnou vazbu jako uživatel myši.
- Scroll je **skutečný scroll dokumentu**, žádné scroll-jacking. Klávesnice,
  Cmd+F i `#kotvy` fungují.
- Povinný snap se zapíná, jen když se každá sekce vejde do okna; jinak `proximity`.
- **Nula requestů na cizí domény** — fonty i model jsou self-hosted.

## Co ještě doplnit

- IČO do kontaktní sekce v `src/content/sections.ts`.
- **Další projekty do `src/content/projects.ts`.** Ke každému nový snímek do
  `public/projects/` (WebP 1440×900). Pole `outcome` je nepovinné schválně:
  patří tam jen měřitelný výsledek, který klient smí zveřejnit a který umíš
  doložit. `facts` jsou výhradně věci odečtené z živého webu — portfolio je
  jediné místo, kde se dá lhát nepoznatelně, a proto se tam nelže vůbec.

(`og:image` už je hotový: `public/og.png` + meta v `index.html`. Přegenerovat jde
ze šablony v repu úpravou `public/og.png` — 1200×630, tmavé pozadí, krychle.)

## Žurnál: obsah, který si web píše sám

`/clanky` je třetí část webu. Články **zakládá jednou denně robot** a web se z nich
při buildu přestaví na statické stránky. Nikde není databáze ani API za běhu:
článek je JSON soubor v repozitáři, stránka je HTML v `dist/`.

```
05:00 UTC   Vercel Cron  →  /api/cron/publish-article
                            ├─ stáhne RSS kanály (FEEDS)
                            ├─ zjistí, o čem se už psalo
                            ├─ Claude napíše článek v pevném schématu
                            ├─ kontrola (délky, zdroje, entity, NDA)
                            └─ commit src/content/articles/<slug>.json
                                    ↓ push do master
                            Vercel build → prerender → hotové stránky
```

### Proč si model nemůže nic vymyslet

To je celý smysl té konstrukce a je dobré ji nerozbít:

- **Odkazy.** Model URL nepíše. Dostane očíslovaný seznam položek z kanálů
  a vrací **čísla** (`sourceIndexes`); adresu i vydavatele k nim dopíše kód.
- **Firmy.** Značkují se klíčem do ručně ověřeného rejstříku
  (`src/content/entities.ts`), který je ve schématu jako výčet. Firma, kterou
  nikdo ručně neschválil, se do článku nedostane – a s ní ani odkaz na ni.
- **Entity v datech se berou z TEXTU**, ne ze seznamu, který model vrátí. Blok
  „Zmíněné společnosti" tedy nemůže obsahovat firmu, o které článek nemluví.
- **Datum** se bere z hodin serveru.
- **Vadný článek shodí build** (`assertArticle` v `src/content/journal.ts`).
  Radši červené CI než stránka s prázdným nadpisem.

### Co je potřeba nastavit na Vercelu

Settings → Environment Variables:

| Proměnná | K čemu |
|---|---|
| `ANTHROPIC_API_KEY` | klíč z console.anthropic.com |
| `GITHUB_TOKEN` | fine-grained token, práva **Contents: Read and write** na tenhle repozitář |
| `GITHUB_REPO` | `bjkyz/bejcekit` |
| `GITHUB_BRANCH` | `master` (nepovinné) |
| `CRON_SECRET` | libovolný náhodný řetězec; Vercel ho sám posílá v hlavičce `Authorization` |
| `JOURNAL_MODEL` | nepovinné, přepíše model (výchozí `claude-haiku-4-5`) |

Ruční spuštění (stejná hlavička, jakou posílá plánovač):

```bash
curl -X GET https://bejcekit.vercel.app/api/cron/publish-article \
  -H "Authorization: Bearer $CRON_SECRET"
```

**★ Změna modelu není jen změna řetězce.** Rodiny se liší v tom, co API přijme:
Haiku 4.5 nezná `effort` (vrátí 400), Opus 5 nezná `budget_tokens`. Parametry
proto skládá `modelOptions()` podle jména modelu – když přidáváš další, přidej
ho do té větve, jinak vydávání tiše přestane fungovat.

**★ Doba běhu je 60 s a je to strop tarifu Hobby.** Vyšší `maxDuration`
nasazením projde, ale funkce se pak při každém zavolání složí ještě před
vlastním kódem a Vercel vrátí holé `FUNCTION_INVOCATION_FAILED` — chybu, ze
které se příčina nepozná. Haiku se do 60 s vejde s rezervou; silnější model
potřebuje tarif Pro **a zároveň** zvednout tohle číslo.

### Rozcestníky témat vznikají samy

Téma dostane vlastní stránku `/clanky/tema/<téma>` **až od třetího článku**
(`TOPIC_MIN_ARTICLES`). Do té doby na něj nikde nevede odkaz a není ani
v sitemapě – stránka se dvěma odkazy je slabý obsah a Google ji buď
nezaindexuje, nebo si o webu udělá horší obrázek. Práh čte prerender i klient
ze stejné konstanty, jinak by se rozešla hydratace.

### Co se generuje při buildu

`sitemap.xml`, `rss.xml` a sekce žurnálu v `llms.txt` (token `__JOURNAL__`)
vyrábí `scripts/prerender.mjs` z reálného seznamu článků. **Needituj je ručně,
přepíšou se.** Proto taky `public/sitemap.xml` už neexistuje.

## Pečeť s býkem (video)

`public/media/bull.mp4` je značka v pohybu – býk ze `ui/Mark.tsx` jako 3D render.
Používá se na `/clanky` (velká) a pod každým článkem u jména autora (malá).

- Zdrojové video je **mimo `public/`**, v `media-src/bejkule.mp4` (15 MB, gitignorováno).
  Web verze má **447 kB**: `ffmpeg -i media-src/bejkule.mp4 -an -vf scale=720:-2
  -c:v libx264 -preset slow -crf 27 -movflags +faststart public/media/bull.mp4`.
- Zvuková stopa je zahozená ve zdroji, ne jen vypnutá atributem.
- `preload="none"` + poster: do sítě nejde ani bajt videa, dokud se pečeť
  neobjeví v okně. Přehrává se jen když je vidět, a vůbec ne při
  `prefers-reduced-motion` nebo `Save-Data`.
- **Rozměry 720 × 964 jsou v `ui/BullSeal.tsx` i v CSS.** Když se video vymění
  za jiné, musí se změnit obojí, jinak poskočí layout (CLS).
- Obdélník kolem videa maže **maska**, ne blend mode: pozadí renderu je
  světlejší než web, takže `screen` ani `lighten` ho neodstraní.


## Doložená kvalifikace (certifikát)

Certifikát Agentic Engineering (r_d by Laba) je na `/sluzby` v bloku „Kdo to staví".
Data jsou v `CERTIFICATE` v `src/content/services.ts`, komponenta v `src/ui/Certificate.tsx`.

- Soubor má **URL-bezpečné jméno** `public/certifikat-agentic-engineering.pdf`.
  Originál se jmenoval „Jiri Bejcek – Certifikát – Agentic Engineering.pdf" a mezery
  s pomlčkami by se v adrese zakódovaly do šňůry, kterou nejde nikam poslat.
- Náhled `public/media/certifikat.jpg` (1200 × 674). **Rozměry jsou i v `CERTIFICATE`
  a čte je `<img width height>`** – bez nich poskočí layout, až obrázek doteče (CLS).
- Ve strukturovaných datech je jako `hasCredential` na osobě, a to na **dvou**
  místech: `index.html` (founder u ProfessionalService) a `sluzby.html`. Obě míří
  na `@id` `#person` / `#identity`, takže Google nevidí dva různé lidi.
- ★ Tlačítko „Otevřít certifikát" leží **vlevo dole**, protože vpravo dole je
  v dokumentu ověřovací QR kód. Zakrýt ho vlastním prvkem by z dokladu udělalo obrázek.
