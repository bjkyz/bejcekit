import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { MathUtils } from 'three'
import { FACE_QUATS } from '../lib/faces'
import { clampDelta, sceneState } from '../lib/scene-state'
import { scrollState } from '../lib/scroll'

const LAST = FACE_QUATS.length - 1

/** Tlumená poloha na dráze. Mimo komponentu — useFrame nesmí alokovat. */
const aim = { v: 0 }

/**
 * ★ JEDINÝ VLASTNÍK POLOHY NA OBĚŽNÉ DRÁZE.
 *
 * Nic nevykresluje. Jen každý snímek přepočítá, kde na trase mezi stěnami
 * choreografie zrovna je, a zapíše to do sceneState. Kamera (Rig), sklo (Shell),
 * jádro (Core), mřížka (EdgeLattice) i bloom (Effects) z toho pak už jenom ČTOU.
 *
 * ★★ PROČ VLASTNÍ KOMPONENTA A NE ŘÁDEK V RIGU:
 *   `heat` čte pět různých useFrame smyček. R3F je volá v pořadí, v jakém se
 *   komponenty připojily — takže kdyby hodnotu psal Rig (připojený až za krychlí),
 *   četlo by sklo i jádro o snímek starší číslo. Choreo se proto montuje jako
 *   PRVNÍ ve Scene.tsx a je mimo <Suspense>: běží tedy i ve chvíli, kdy se model
 *   ještě dopéká, a všichni ostatní čtou vždy čerstvou hodnotu.
 *
 * ★★★ ZÁKON DOSEDNUTÍ. Kamera nikdy nemíří na surový scroll. Míří na tlumenou
 *   hodnotu, která za pohybu sleduje SPOJITÝ progres, ale v klidu se přitáhne
 *   k NEJBLIŽŠÍ CELÉ stěně. Uvíznout na půl cesty mezi stěnami je tím
 *   strukturálně nemožné — na jakémkoli zařízení a při jakémkoli režimu snapu.
 *   Povinný snap scrollu je proto jen třešnička, ne nosná konstrukce.
 */
export default function Choreo() {
  useFrame((_, delta) => {
    const dt = clampDelta(delta)

    const p = MathUtils.clamp(scrollState.progress, 0, LAST)
    const resting = Math.abs(scrollState.velocity) < 0.06

    easing.damp(
      aim,
      'v',
      resting ? Math.round(p) : p,
      resting ? 0.4 : 0.07, // za pohybu jde kamera skoro 1:1 s prstem,
      dt, //                   v klidu delší, měkčí dosednutí nad stěnu
    )

    const i = MathUtils.clamp(Math.floor(aim.v), 0, LAST - 1)
    const frac = MathUtils.clamp(aim.v - i, 0, 1)

    sceneState.aim = aim.v
    // Teplo: 0 nad stěnou, 1 v půlce přeletu. Řídí ostření skla, jas jádra i bloom.
    sceneState.heat = Math.sin(frac * Math.PI)
    sceneState.faceIndex = Math.round(aim.v)
    sceneState.transit = sceneState.heat > 0.02
  })

  return null
}
