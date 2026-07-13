import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { easing } from 'maath'
import type { Group, MeshBasicMaterial } from 'three'
import { FACE_TRANSFORMS } from '../lib/faces'
import { SECTIONS } from '../content/sections'
import { clampDelta, sceneState } from '../lib/scene-state'
import type { Tier } from '../lib/quality'

/* ★ troika si BEZ `font` tiše stáhne Roboto z fonts.gstatic.com.
   Shipujeme vlastní .ttf (ne .woff2 — troika parsuje ttf/otf/woff spolehlivě).
   `characters` předehřeje SDF atlas, aby cedule nenaskočily o snímek později. */
const FONT = `${import.meta.env.BASE_URL}fonts/troika/GeistMono-Medium-ascii.ttf`
const WARM = '0123456789 /[]-ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Cedule na stěnách krychle.
 *
 * Popisky jsou ZÁMĚRNĚ jen ASCII (IDENT, WEB, INFRA, AI, PROCES, KONTAKT).
 * Uvnitř skla by chybějící háček (prázdný čtvereček) byl nejhůř k odhalení.
 * Veškerá čeština s diakritikou žije v DOM — tam ji přečte i Google a čtečka.
 */
function Plate({ i, tier }: { i: number; tier: Tier }) {
  const grp = useRef<Group>(null)
  const num = useRef<MeshBasicMaterial>(null)
  const code = useRef<MeshBasicMaterial>(null)
  const t = FACE_TRANSFORMS[i]
  const s = SECTIONS[i]

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const active = sceneState.faceIndex === i
    const want = active ? 1 : 0.22

    if (num.current) easing.damp(num.current, 'opacity', want * 0.75, 0.25, dt)
    if (code.current) easing.damp(code.current, 'opacity', want, 0.25, dt)

    /* ★ Na 'low' tieru je skořápka meshPhysicalMaterial s transparent →
       depthWrite:false, takže zadní cedule NEJSOU zakryté a vykreslily by se
       ostře, pozpátku a naležato přes přední stěnu. Proto je tam schováme.
       (Musí to být tady v useFrame — sceneState re-render nespouští.) */
    if (grp.current) grp.current.visible = tier !== 'low' || active
  })

  return (
    <group ref={grp} position={t.position} quaternion={t.quaternion}>
      <Text
        font={FONT}
        characters={WARM}
        fontSize={0.26}
        letterSpacing={0.14}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.42, 0]}
      >
        {s.plateNum}
        <meshBasicMaterial ref={num} color="#b8f5ff" toneMapped={false} transparent depthWrite={false} opacity={0.2} />
      </Text>

      <Text
        font={FONT}
        characters={WARM}
        fontSize={0.4}
        letterSpacing={0.06}
        anchorX="center"
        anchorY="middle"
        position={[0, -0.06, 0]}
      >
        {s.plateCode}
        <meshBasicMaterial ref={code} color="#4fd8e8" toneMapped={false} transparent depthWrite={false} opacity={0.22} />
      </Text>
    </group>
  )
}

export default function FacePlates({ tier }: { tier: Tier }) {
  return (
    <>
      {SECTIONS.map((_, i) => (
        <Plate key={i} i={i} tier={tier} />
      ))}
    </>
  )
}
