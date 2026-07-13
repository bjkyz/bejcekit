import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import { easing } from 'maath'
import type { Group, MeshPhysicalMaterial } from 'three'
import { clampDelta, sceneState } from '../lib/scene-state'
import { VOID } from './palette'
import type { Tier } from '../lib/quality'

type MTM = MeshPhysicalMaterial & {
  chromaticAberration: number
  anisotropicBlur: number
  distortion: number
  temporalDistortion: number
}

/**
 * Skleněná skořápka 3×3×3.
 *
 * ★ NIKDY NENASTAVUJ `transparent`. MeshTransmissionMaterial je NEPRŮHLEDNÝ
 *   materiál, který ZAPISUJE HLOUBKU. Právě proto pět zadních cedulí neprojde
 *   depth testem v hlavním průchodu a je vidět POUZE skrz refrakční buffer skla
 *   — rozlomené, chromaticky rozložené, ustupující dozadu. Ten „duchový" stoh
 *   JE ten podpis a stojí nula řádků kódu.
 *
 *   Jakmile někdo nastaví `transparent` (třeba aby sklo prolnul v preloaderu),
 *   depthWrite se vypne, změní se pořadí vykreslení a všech pět cedulí VYSKOČÍ
 *   do hlavního průchodu ostře, pozpátku a naležato.
 *   → Proto se animuje SCALE a EMISE. Nikdy opacity.
 */
export default function Shell({ tier }: { tier: Tier }) {
  const mat = useRef<MTM>(null)
  const grp = useRef<Group>(null)

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const h = sceneState.heat

    // Sklo „přeostřuje" během otáčky — cedule se rozmažou do barevného světla
    // a znovu se zaostří, jakmile nová stěna dosedne.
    if (mat.current) {
      easing.damp(mat.current, 'chromaticAberration', 0.06 + h * 0.14, 0.18, dt)
      easing.damp(mat.current, 'anisotropicBlur', 0.12 + h * 0.26, 0.18, dt)
    }
    // Skořápka se při otáčce nepatrně „zapře“. SCALE, ne opacity.
    if (grp.current) easing.damp3(grp.current.scale, 1 - h * 0.035, 0.25, dt)
  })

  if (tier === 'low') {
    /* ★ „LEVNÁ" VARIANTA, KTERÁ BYLA DRAŽŠÍ NEŽ TA DRAHÁ.
       Stálo tu `transmission={0.9}` na obyčejném meshPhysicalMaterial. Jenže
       jakákoli nenulová `transmission` nastartuje ve three vlastní
       `renderTransmissionPass`: scéna se PŘED každým snímkem vykreslí ještě
       jednou do render targetu — v PLNÉM rozlišení plátna, HalfFloat, s MSAA
       a s generováním mipmap. Nejde to zlevnit; `resolution` má jen drei's
       MeshTransmissionMaterial, tenhle ne.

       Výsledek: nejslabší zařízení na webu (tier 'low' = starý telefon) platilo
       full-res druhý průchod, zatímco 'mid' si vystačilo s FBO 256×256.
       Levné patro bylo dražší než střední. Přesně naopak, než mělo být.

       Transmission tady tedy nemá co dělat. Sklo se na 'low' fejkuje průhledností
       a lomem světla na hranách — jeden průchod, žádný extra target. Vypadá to
       o třídu hůř, ale běží to na tom, na čem to běžet má.

       Pozor: materiál je v transparentní frontě (depthWrite:false), takže zadní
       cedule nejsou zakryté — FacePlates je proto na 'low' tieru schová. */
    return (
      <group ref={grp}>
        <mesh>
          <boxGeometry args={[3, 3, 3]} />
          <meshPhysicalMaterial
            transmission={0}
            transparent
            opacity={0.16}
            roughness={0.12}
            metalness={0}
            ior={1.5}
            reflectivity={0.6}
            color="#dff7fb"
          />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={grp}>
      <mesh>
        <boxGeometry args={[3, 3, 3]} />
        <MeshTransmissionMaterial
          // drei exportuje vlastní (velmi široký) typ materiálu; nás zajímají
          // jen ty čtyři vlastnosti, které v useFrame tlumíme.
          ref={mat as never}
          /* `samples` a `transmissionSampler` jdou do konstruktoru → změna
             REMOUNTUJE materiál a rekompiluje shader. Proto konstanty. */
          samples={6}
          /* ★ Bez `resolution` spadne drei's useFBO na PLNOU velikost obrazovky
             × devicePixelRatio — tedy re-render celé scény v retina rozlišení,
             každý snímek. Nejčastější příčina 20fps WebGL webu, oprava na jedno slovo. */
          resolution={tier === 'high' ? 512 : 256}
          backside={tier === 'high'}
          backsideResolution={256}
          transmission={1}
          thickness={1.1}
          roughness={0.08}
          ior={1.42}
          chromaticAberration={0.06}
          anisotropicBlur={0.12}
          distortion={0.12}
          distortionScale={0.25}
          temporalDistortion={0.03}
          attenuationDistance={4}
          attenuationColor="#bff3fb"
          color="#eafcff"
          background={VOID}
        />
      </mesh>
    </group>
  )
}
