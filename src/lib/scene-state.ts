import type { Tier } from './quality'

/**
 * Mutovatelný stav scény, sdílený mezi useFrame smyčkami.
 * Nikdy ne React state — tohle se čte 60×/s.
 */
export const sceneState = {
  /**
   * ★ SPOJITÁ POLOHA KAMERY NA OBĚŽNÉ DRÁZE. 0 = stěna 00, 2.5 = půl cesty
   * mezi stěnou 02 a 03. Píše ji JEDINÝ vlastník (three/Choreo.tsx), všichni
   * ostatní ji jen čtou. Není to surový scroll: je v ní zaneseno tlumení
   * i zákon dosednutí, takže se kamera vždycky uklidní přesně nad stěnou.
   */
  aim: 0,
  /** 0 na stěně, 1 v půlce přeletu. Řídí ostření skla, jas jádra i bloom. */
  heat: 0,
  /** Nejbližší celá stěna (kam kamera míří). */
  faceIndex: 0,
  transit: false,
  fps: 60,
  tier: 'high' as Tier,
  /** Zážeh jádra. Preloader ho vystřelí na 6 AŽ po doparsování GLB; Core ho pak
      tlumí zpět k nule. Mesh, který ještě neexistuje, nejde zapálit — proto se
      to nedělá shaderem v preloaderu, ale rampou světla po loadu. */
  boost: 0,
}

/**
 * ★ STROP NA DELTU. Když se karta vrátí z pozadí, dostane useFrame deltu
 * o velikosti několika SEKUND — a krychle by se teleportovala.
 *
 * Strop ale nesmí být příliš nízký: při 1/30 dostane damper jen 33 ms „času"
 * na snímek, i když reálně uběhlo 200 ms — pod 30 fps by pak celá scéna běžela
 * ve ZPOMALENÉM FILMU a působila lepivě. 1/15 s je kompromis: násobně sekundovou
 * deltu zkrátí na neviditelných 67 ms, ale časování drží správně až do 15 fps.
 */
export const clampDelta = (delta: number) => Math.min(delta, 1 / 15)

/* Barvy scény (THREE.Color) žijí v src/three/palette.ts — tenhle soubor
   čte i HUD a preloader, a nesmí proto tahat three do hlavního bundlu.
   Ze stejného důvodu jsou klíče níž HOLÁ ČÍSLA, ne Vector3/Quaternion:
   kvaterniony oběžné dráhy se dopočítávají v lib/faces.ts, kam three smí. */

/**
 * ═══════════ OBĚŽNÁ DRÁHA KAMERY ═══════════
 *
 * ★ KRYCHLE SE NEOTÁČÍ. OBÍHÁ JI KAMERA. Tohle je nosná myšlenka celé scény.
 *
 * Krychle stojí v počátku, nehnutě, jako exponát. Scroll ji neroztáčí — posílá
 * kameru na oblet kolem ní. Stěny se proto střídají tím, že se k nim kamera
 * DOLETÍ, ne tím, že se k ní krychle natočí.
 *
 * Není to kosmetický rozdíl. Otáčení objektem je trik: divák ví, že tam pořád
 * sedí a jen se vrtí. Obletět ho znamená, že má stálé místo v prostoru a divák
 * se pohybuje kolem NĚJ — a to je jediný důvod, proč 3D na webu vůbec dává smysl.
 * Zadarmo tím vzniká i mapa prostoru: nahoru nad stroj, za něj, pod něj.
 *
 * Trasa (pořadí je dané geometrií v lib/faces.ts, viz hamiltonovská cesta):
 *   00 IDENT   čelo   +Z   kamera stojí před strojem
 *   01 WEB     vpravo +X   oblet doprava
 *   02 INFRA   nahoře +Y   kamera stoupá NAD stroj a dívá se do něj shora
 *   03 AI      zezadu −Z   přelet za stroj
 *   04 PROCES  vlevo  −X   sestup na druhý bok
 *   05 KONTAKT dole   −Y   kamera je POD strojem, ten se nad ní tyčí
 *
 * Samotné natočení kamery se nedopočítává tady, ale v lib/faces.ts
 * (FACE_CAM_QUATS) — tam je i vysvětlení, proč se nikde nevolá lookAt().
 */

/**
 * Vzdálenost kamery od středu krychle pro každou stěnu. Jediné, co dělá
 * „dynamiku" záběru: nádech (odstup) a příklon (nájezd).
 *
 * ★ SPOČÍTÁNO, NE ODHADNUTO. Při fov 35° je viditelná výška ve vzdálenosti R
 *   rovna 2·R·tan(17.5°) = 0.63·R. Pro R = 8.6 to dělá 5.4 jednotky, takže stěna
 *   o hraně 3 zabere ~55 % výšky okna a má kam dýchat. Pod R ≈ 6.8 by se krychle
 *   do okna přestala vejít úplně — proto se to hlídá ještě jednou za běhu
 *   (NEED_SPAN v three/Rig.tsx), kde do toho mluví i poměr stran displeje.
 */
export const ORBIT_RADIUS: number[] = [
  8.8, // 00 IDENT   — nejdál, text jde přes střed a potřebuje klid
  8.5, // 01 WEB
  8.6, // 02 INFRA   — shora
  8.3, // 03 AI      — nejtěsnější záběr, stroj je na dosah
  9.2, // 04 PROCES  — největší odstup, nejklidnější záběr webu
  8.2, // 05 KONTAKT — zblízka a zespodu: stroj se tyčí a čeká na vstup
]

/**
 * ★ KOMPOZIČNÍ PANORÁMA. Kamera se natočí o pár stupňů STRANOU, aby krychle
 *   uhnula textu. Řeší to ten nejstarší problém téhle stránky: text a stroj
 *   si lezou do zorného pole.
 *
 *   Krychle je přibitá v počátku, hýbat s ní nejde. Uhnout tedy musí ZÁBĚR —
 *   a protože se svět promítá kolem osy pohledu, platí to obráceně, než čekáš:
 *
 *       kamera se natočí DOLEVA  →  krychle se na obrazovce vysune DOPRAVA
 *
 *   Sekce se střídají left/right (`align` v content/sections.ts) a text sedí vždy
 *   v jedné půlce mřížky. Panorámu tedy sázíme tak, aby krychle skončila v té
 *   DRUHÉ půlce. Text a stroj se přestanou překrývat, aniž bychom cokoli zakrývali.
 *
 * ★★ ROZSAH JE SPOČÍTANÝ. yaw 0.125 rad (7.2°) při R = 8.6 vysune krychli o
 *   R·tan(0.125) = 1.08 jednotky. Půlka viditelné šířky je 0.315·R·poměr stran:
 *   na 16:9 to dělá 4.8, na užším 16:10 (1440×900, poměr 1.6) jen 4.3. Silueta
 *   krychle sahá ~2.1 od středu, takže i na tom užším zbývá ~1.1 jednotky rezervy
 *   a hrana se nikam neuřízne.
 *
 *   Bylo tu 0.105 a na 1440px to nestačilo: světlá stěna krychle podlézala levý
 *   okraj textového sloupce přesně tam, kde sedí indexy kroků (01–04), a ty jsou
 *   záměrně tiché (--neon-3) — přes rozsvícené sklo se ztratily. Radši uhnout
 *   strojem než přidávat další závoj: závoj řeší následek, kompozice příčinu.
 *
 *   Nad ~0.2 rad se ale stěna začne dívat znatelně z boku a cedule se perspektivně
 *   rozjede. Strop je tvrdý, víc než pár stupňů si tu nedovol.
 *
 * Náklon (roll) je jen koření: ±1.6°. Nad ~3° přestane být vodorovná linka
 * vodorovná, text v DOM ale zůstane rovný — a ten nesoulad vypadá jako rozbité
 * vykreslování, ne jako režie. Sekce 00 a 05 mají nulu: tam jde text PŘES střed
 * a záběr musí stát v ose.
 */
export interface OrbitPan {
  /** + = krychle se vysune DOPRAVA (text je tedy vlevo). */
  yaw: number
  /** + = krychle klesne DOLŮ. */
  pitch: number
  roll: number
}

export const ORBIT_PAN: OrbitPan[] = [
  { yaw: 0, pitch: 0, roll: 0 }, //             00 IDENT   — text přes střed, záběr v ose
  { yaw: 0.125, pitch: -0.02, roll: -0.02 }, //  01 WEB     — text vlevo  → krychle doprava
  { yaw: -0.125, pitch: -0.03, roll: 0.028 }, // 02 INFRA   — text vpravo → krychle doleva
  { yaw: 0.125, pitch: 0.01, roll: -0.016 }, //  03 AI      — text vlevo  → krychle doprava
  { yaw: -0.125, pitch: -0.02, roll: 0.024 }, // 04 PROCES  — text vpravo → krychle doleva
  { yaw: 0, pitch: 0.02, roll: 0 }, //           05 KONTAKT — text přes střed, záběr v ose
]

