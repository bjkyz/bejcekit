# bejcek.it — „Jednotka 06"

3D scroll-driven web pro nezávislého IT inženýra. Uprostřed je skleněná krychle
se žhavým reaktorem uvnitř; scroll ji otáčí po stěnách a každá stěna je jedna
sekce webu.

## Spuštění

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # produkční build do dist/
npm run preview   # náhled produkčního buildu
```

## Kde co upravit

| Chci změnit | Soubor |
|---|---|
| **Texty, služby, kontakty** | `src/content/sections.ts` — jediný soubor s obsahem |
| Barvy, písma, rozestupy, časování | `src/styles/tokens.css` — jediný zdroj pravdy |
| Pozice kamery po sekcích | `src/lib/scene-state.ts` (`CAM_KEYS`) |

**Pořadí služeb** se mění přeuspořádáním pole v `sections.ts`. Do `src/lib/faces.ts`
nesahej — tam je pořadí dané geometrií krychle (viz níž).

## Co je potřeba vědět, než do toho sáhneš

Tyhle věci nejsou libovůle. Za každou z nich je chyba, která se těžko hledá.

- **`src/lib/faces.ts` — pořadí stěn.** Protilehlé stěny krychle jsou od sebe 180°,
  což je degenerovaný případ slerpu (nejednoznačná osa) a krychle v něm viditelně
  „přepadává". Stěny proto jdou po hamiltonovské cestě, kde je **každý krok přesně 90°**.

- **`Shell.tsx` — nikdy nenastavuj `transparent` na skle.** `MeshTransmissionMaterial`
  je neprůhledný a zapisuje hloubku. Právě proto jsou zadní cedule vidět jen skrz
  refrakci — a to je ten „duchový" efekt. Zapnutím `transparent` vyskočí všechny
  pozpátku do popředí. Animuj `scale` a emisi, nikdy opacity.

- **`Effects.tsx` — Bloom se vyrábí ručně a vkládá přes `<primitive>`.** Nedávej mu
  `ref`. V Reactu 19 je `ref` normální prop a `@react-three/postprocessing` na propech
  dělá `JSON.stringify` → kruhová reference → **plátno se vůbec nenamountuje.**

- **`Scene.tsx` — `camera` a `gl` jsou modulové konstanty, ne objektové literály.**
  Inline literál = nový objekt při každém renderu → R3F resetuje pozici kamery
  a celá choreografie je tiše mrtvá.

- **`Scene.tsx` — rozměr plátna se nastavuje z `documentElement.clientWidth`.**
  `position: fixed; inset: 0` se sází podle *layoutového* viewportu, který se na
  mobilu liší od viditelného (iPhone 15: 521 vs 393 px) → krychle by utekla mimo obraz.

- **`tokens.css` smí v média dotazech měnit jen `:root` proměnné.** Média dotaz
  nezvyšuje specificitu, takže komponentní pravidlo by přebil později importovaný
  `sections.css`.

- **Cedule na krychli jsou schválně bez diakritiky** (`IDENT`, `WEB`, `INFRA`…).
  Troika font má ASCII subset; háček by se uvnitř skla změnil v prázdný čtvereček.
  Veškerá čeština žije v DOM — tam ji přečte Google i čtečka.

## Licence 3D modelu

Model `public/models/core.v1.glb` je **„Primary Ion Drive" od Mikea Murdocka,
licence CC BY 4.0**. Atribuce je **smluvní povinnost**, ne zdvořilost — je uvedená
v patičce sekce 05 a ve stavovém panelu. Neodstraňuj ji z estetických důvodů.

> Pozor: `DamagedHelmet.glb`, což je model, po kterém většina návodů sáhne jako první,
> je licenčně kontaminovaný (nese i CC-BY-**NC**, tedy zákaz komerčního užití).
> Pro placený web ho nepoužívej.

## Přístupnost a výkon

- Veškerý obsah je v reálném sémantickém DOM. **Vypni WebGL a zbude kompletní,
  indexovatelný web se službami** — plátno je `aria-hidden` a nic nosného v něm není.
- `prefers-reduced-motion` vypne 3D i Lenis a vykreslí obsah staticky.
- Scroll je **skutečný scroll dokumentu**, žádné scroll-jacking. Klávesnice,
  Cmd+F i `#kotvy` fungují.
- Povinný snap se zapíná, jen když se každá sekce vejde do okna; jinak `proximity`.
- **Nula requestů na cizí domény** — fonty i model jsou self-hosted.

## Co ještě doplnit

- Telefon a IČO do `CONTACT_ROWS` v `src/content/sections.ts` (zatím tam nejsou).
