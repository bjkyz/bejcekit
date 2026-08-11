import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  InstancedMesh,
  LineBasicMaterial,
  Matrix4,
  MeshBasicMaterial,
  Vector3,
} from 'three'
import { clampDelta, sceneState } from '../lib/scene-state'
import type { Tier } from '../lib/quality'

const HALF = 1.5
const STUD = 0.075

/** Osm rohových studů jako JEDEN instancedMesh — hlavní zdroj bloomu ve scéně. */
const CORNERS: Vector3[] = []
for (const x of [-HALF, HALF])
  for (const y of [-HALF, HALF]) for (const z of [-HALF, HALF]) CORNERS.push(new Vector3(x, y, z))

/**
 * ★ INDEXOVÝ ROH. Jeden stud je o polovinu větší než ostatních sedm.
 *
 * Krychle je invariantní vůči celé oktaedrické grupě: otoč ji o 90° kolem libovolné
 * osy a dostaneš TÝŽ OBRÁZEK. A protože kamera po dráze skáče přesně po 90° krocích,
 * znamenalo to, že se po přeletu vrátí do záběru, který je od toho předchozího
 * geometricky nerozeznatelný. Kamera urazila čtvrtinu koule a divák neviděl DŮKAZ,
 * že se něco stalo — jen mihnutí a zase tentýž objekt.
 *
 * Jeden odlišný roh tu symetrii rozbije. Po 90° kroku je jinde, takže silueta je
 * objektivně jiná a oko má čeho se chytit: „stroj je natočený jinak než před chvílí".
 *
 * ★★ JEDEN ROH, NE OSM NÁHODNÝCH VELIKOSTÍ. Osm různě velkých studů vypadá jako chyba
 *   v kódu. Jeden vědomě odlišný se čte jako ZÁMĚR — jako počáteční roh přístroje,
 *   podle kterého se pozná orientace. Přesně tuhle značku má na sobě každý reálný
 *   konektor a každé pouzdro čipu, a proto ji člověk přečte, aniž by o tom věděl.
 *
 * Index 7 = (+1.5, +1.5, +1.5) — poslední v pořadí, ve kterém se roh sype výš.
 */
const INDEX_CORNER = 7
const INDEX_SCALE = 1.5

/**
 * ★★ `toneMapped` MUSÍ ZÁVISET NA PATŘE, JINAK JE 'low' OSM BÍLÝCH ČTVEREČKŮ.
 *
 * Hrany i study jedou na barvě NAD 1.0 (×1.6, resp. ×2.0 → ×3.2 při heat) —
 * to je záměr, bloom je bez toho vůbec nezachytí (luminanceThreshold 0.92).
 *
 * Uvnitř composeru (high/mid) je `toneMapped` stejně no-op: EffectComposer si
 * po dobu své existence přepne renderer na NoToneMapping a mapuje až <ToneMapping>
 * na konci řetězu. Napsat tam `false` tedy nic nedělá a nic nestojí.
 *
 * Na 'low' ale composer neběží a AgX mapuje přímo renderer (ToneSync ve Scene.tsx).
 * Tam `false` znamená „mě nemapuj" — takže se lineární (0.27, 2.28, 2.64) ořízne
 * na (1,1,1). Ze žhavých studů se stanou bílé krychličky bez odstínu a z hran
 * bílé linky. Přesně to, co se hlásilo jako „na slabém stroji je z modelu torzo":
 * scéna neztratila světlo, ztratila ODSTÍN — všechno svítivé přepálilo do bílé.
 */
export default function EdgeLattice({ tier }: { tier: Tier }) {
  const toneMapped = tier === 'low'
  const studs = useRef<InstancedMesh>(null)
  const edgeMat = useRef<LineBasicMaterial>(null)
  const studMat = useRef<MeshBasicMaterial>(null)

  const edges = useMemo(() => new EdgesGeometry(new BoxGeometry(3, 3, 3)), [])
  const studGeo = useMemo(() => new BoxGeometry(STUD, STUD, STUD), [])

  // Co jsme si sami `new`-li, sami uklidíme. (Deklarativní <boxGeometry/> uklízí R3F.)
  useLayoutEffect(
    () => () => {
      edges.dispose()
      studGeo.dispose()
    },
    [edges, studGeo],
  )

  useLayoutEffect(() => {
    if (!studs.current) return
    const m = new Matrix4()
    CORNERS.forEach((c, i) => {
      const s = i === INDEX_CORNER ? INDEX_SCALE : 1
      // Škálovat MUSÍ jít společně s posunem, v jedné matici — setMatrixAt bere celou
      // transformaci instance a druhé volání by to první přepsalo, ne doplnilo.
      m.makeScale(s, s, s).setPosition(c.x, c.y, c.z)
      studs.current!.setMatrixAt(i, m)
    })
    studs.current.instanceMatrix.needsUpdate = true
  }, [])

  // Barvy nad 1.0 — jinak je bloom (luminanceThreshold 0.9) vůbec nezachytí.
  const edgeColor = useMemo(() => new Color('#4fd8e8').multiplyScalar(1.6), [])
  const studBase = useMemo(() => new Color('#4fd8e8').multiplyScalar(2.0), [])
  const studHot = useMemo(() => new Color('#b8f5ff').multiplyScalar(3.2), [])

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const h = sceneState.heat
    if (edgeMat.current) easing.damp(edgeMat.current, 'opacity', 0.5 + h * 0.5, 0.25, dt)
    // Study se během otáčky rozžhaví. Plain lerp — žádná další závislost.
    if (studMat.current) studMat.current.color.lerpColors(studBase, studHot, h)
  })

  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgeMat} color={edgeColor} toneMapped={toneMapped} transparent opacity={0.5} />
      </lineSegments>

      <instancedMesh ref={studs} args={[studGeo, undefined, CORNERS.length]}>
        <meshBasicMaterial ref={studMat} color={studBase} toneMapped={toneMapped} />
      </instancedMesh>
    </group>
  )
}
