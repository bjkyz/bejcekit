import { Color } from 'three'
import type { Tier } from './quality'

/**
 * Mutovatelný stav scény, sdílený mezi useFrame smyčkami.
 * Nikdy ne React state — tohle se čte 60×/s.
 */
export const sceneState = {
  /** 0 na stěně, 1 v půlce otáčky. Řídí ostření skla, jas jádra i bloom. */
  heat: 0,
  /** Nejbližší celá stěna (kam krychle míří). */
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

/** Barvy scény — memoizované. Nikdy `new Color()` uvnitř renderu. */
export const VOID = new Color('#08090a')
export const CYAN = new Color('#4fd8e8')
export const HOT = new Color('#b8f5ff')
export const RIM = new Color('#52aeff')
export const AMBI = new Color('#0b1a22')

/**
 * Klíčové pozice kamery pro 6 sekcí. FOV je konstantní 35 a NIKDY se neanimuje.
 *
 * ★ SPOČÍTÁNO, NE ODHADNUTO. Při fov 35° a kameře na z=6.4 je čelní stěna
 *   (z=+1.5, tedy 4.9 od kamery) vysoká 2·4.9·tan(17.5°) = 3.09 jednotky —
 *   krychle o hraně 3 by tedy zabrala 97 % výšky okna a neměla by kam dýchat.
 *   Na z≈8.8 vychází viditelná výška ~4.6, takže stěna sedí na ~65 % okna.
 */
export const CAM_KEYS: [number, number, number][] = [
  [0, 0, 8.8], // 00 IDENT   — nejdál, text jde přes střed
  [1.3, 0.3, 8.7], // 01 WEB
  [-0.6, 1.6, 8.6], // 02 INFRA — kamera stoupá: pohled DOVNITŘ stroje shora
  [0.35, -0.25, 8.3], // 03 AI    — nejblíž (kromě kontaktu)
  [-1.6, -0.4, 9.2], // 04 PROCES — odstup, nejklidnější záběr webu
  [0, 0.55, 7.9], // 05 KONTAKT — stroj je nabuzený a čeká na vstup
]
