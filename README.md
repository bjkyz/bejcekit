# bejcek.it · „Jednotka 06"

3D scroll-driven web pro nezávislého IT inženýra. Uprostřed je skleněná krychle
se žhavým reaktorem uvnitř; scroll ji otáčí po stěnách a každá stěna je jedna
sekce webu.

**Lighthouse (desktop): 100 / 100 / 100 / 100** (výkon, přístupnost, best practices, SEO).

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

**Po prvním nasazení uprav doménu na dvou místech:**

- `public/robots.txt` a `public/sitemap.xml` (obojí obsahuje `https://bejcek.it/`)

CSP v `vercel.json` je záměrně přísná (`default-src 'self'`) — web nedělá jediný
požadavek na cizí doménu, takže si to může dovolit. Když někdy přidáš analytiku
nebo externí skript, musíš ho do CSP doplnit, jinak ho prohlížeč zablokuje.

## Kde co upravit

| Chci změnit | Soubor |
|---|---|
| **Texty, služby, kontakty, telefon** | `src/content/sections.ts` — jediný soubor s obsahem |
| Barvy, písma, rozestupy, časování | `src/styles/tokens.css` — jediný zdroj pravdy |
| Pozice kamery po sekcích | `src/lib/scene-state.ts` (`CAM_KEYS`) |

**Pořadí služeb** se mění přeuspořádáním pole v `sections.ts`. Do `src/lib/faces.ts`
nesahej — tam je pořadí dané geometrií krychle (viz níž).

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

## Licence 3D modelu

Model `public/models/core.v2.glb` je **„Primary Ion Drive" od Mikea Murdocka,
licence CC BY 4.0**. Atribuce je **smluvní povinnost**, ne zdvořilost — je uvedená
v patičce sekce 05 a ve stavovém panelu. Neodstraňuj ji z estetických důvodů.

> Pozor: `DamagedHelmet.glb`, po kterém většina návodů sáhne jako první,
> je licenčně kontaminovaný (nese i CC-BY-**NC**, tedy zákaz komerčního užití).
> Pro placený web ho nepoužívej.

## Výkon

Celá stránka váží **877 kB** (376 kB gz JS+CSS + 501 kB model), ale na kritické
cestě je jen **~80 kB gz** — three.js se načítá až po vykreslení textu.

- **CSS je inline v `index.html`** (viz `inlineCss` ve `vite.config.ts`): 5.6 kB gz
  nestojí za render-blokující request.
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
- `prefers-reduced-motion` vypne 3D i Lenis a vykreslí obsah staticky.
- Scroll je **skutečný scroll dokumentu**, žádné scroll-jacking. Klávesnice,
  Cmd+F i `#kotvy` fungují.
- Povinný snap se zapíná, jen když se každá sekce vejde do okna; jinak `proximity`.
- **Nula requestů na cizí domény** — fonty i model jsou self-hosted.

## Co ještě doplnit

- IČO do `CONTACT_ROWS` v `src/content/sections.ts`.
- Ověřit odkazy na LinkedIn a GitHub — jsou odhadnuté.

(`og:image` už je hotový: `public/og.png` + meta v `index.html`. Přegenerovat jde
ze šablony v repu úpravou `public/og.png` — 1200×630, tmavé pozadí, krychle.)
