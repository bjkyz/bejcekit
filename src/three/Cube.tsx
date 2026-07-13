import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Group, MathUtils, Quaternion } from 'three'
import { FACE_QUATS } from '../lib/faces'
import { scrollState } from '../lib/scroll'
import { clampDelta, sceneState } from '../lib/scene-state'
import type { Tier } from '../lib/quality'
import Shell from './Shell'
import Core from './Core'
import EdgeLattice from './EdgeLattice'
import FacePlates from './FacePlates'
import TracePulse from './TracePulse'

const LAST = FACE_QUATS.length - 1
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Cíl otáčky — mimo komponentu, ať se každý snímek nealokuje. */
const target = new Quaternion()
const aim = { v: 0 }

export default function Cube({ tier, dragRef }: { tier: Tier; dragRef: React.RefObject<Group | null> }) {
  const spin = useRef<Group>(null)
  const float = useRef<Group>(null)

  useFrame((state, delta) => {
    const dt = clampDelta(delta)

    /* ═══════════════ ZÁKON DOSEDNUTÍ ═══════════════
       Krychle nikdy nemíří na surový scroll. Míří na tlumenou hodnotu `aim`,
       která za pohybu sleduje SPOJITÝ progres, ale v klidu se přitáhne
       k NEJBLIŽŠÍ CELÉ stěně.

       Díky tomu je „uvíznutí mezi stěnami" strukturálně nemožné na jakémkoli
       zařízení a při jakémkoli režimu snapu — povinný snap je tak jen třešnička,
       ne nosná konstrukce.                                                     */
    const p = MathUtils.clamp(scrollState.progress, 0, LAST)
    const resting = Math.abs(scrollState.velocity) < 0.06

    easing.damp(
      aim,
      'v',
      resting ? Math.round(p) : p,
      resting ? 0.4 : 0.07, // za pohybu jde krychle skoro 1:1 s prstem,
      dt, //                   v klidu delší, měkčí dojezd na stěnu
    )

    const i = MathUtils.clamp(Math.floor(aim.v), 0, LAST - 1)
    const frac = MathUtils.clamp(aim.v - i, 0, 1)
    const t = smoothstep(frac)

    // slerp dá odezvu, dampQ na to navrství skutečnou setrvačnost.
    target.slerpQuaternions(FACE_QUATS[i], FACE_QUATS[i + 1], t)

    if (spin.current) {
      // eps 1e-4, ne výchozích 1e-3 — to je NA SLOŽKU a viditelně zastaví
      // rotaci kousek před stěnou.
      easing.dampQ(spin.current.quaternion, target, 0.26, dt, undefined, undefined, 1e-4)
    }

    // Teplo: 0 na stěně, 1 v půlce otáčky. Řídí ostření skla, jas jádra i bloom.
    sceneState.heat = Math.sin(frac * Math.PI)
    sceneState.faceIndex = Math.round(aim.v)
    sceneState.transit = sceneState.heat > 0.02

    // Klidové vznášení — jemné, jinak se to pere s otáčením.
    if (float.current) {
      const e = state.clock.elapsedTime
      float.current.position.y = Math.sin(e * 0.45) * 0.045
      float.current.position.x = Math.cos(e * 0.31) * 0.025
    }
  })

  return (
    <group ref={float}>
      {/* dragRef = ADITIVNÍ offset z tažení myší. Je to VLASTNÍ skupina nad
          `spin`, takže se s tlumením otáčky nikdy nepere — jen se přičte. */}
      <group ref={dragRef}>
        <group ref={spin}>
          <Shell tier={tier} />
          <EdgeLattice />
          <FacePlates tier={tier} />
          <TracePulse />
        </group>
        {/* Jádro se NEOTÁČÍ se skořápkou — má vlastní pohyb a protiběh. */}
        <Core tier={tier} />
      </group>
    </group>
  )
}
