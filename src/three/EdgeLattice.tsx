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

const HALF = 1.5
const STUD = 0.075

/** Osm rohových studů jako JEDEN instancedMesh — hlavní zdroj bloomu ve scéně. */
const CORNERS: Vector3[] = []
for (const x of [-HALF, HALF])
  for (const y of [-HALF, HALF]) for (const z of [-HALF, HALF]) CORNERS.push(new Vector3(x, y, z))

export default function EdgeLattice() {
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
      m.makeTranslation(c.x, c.y, c.z)
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
        <lineBasicMaterial ref={edgeMat} color={edgeColor} toneMapped={false} transparent opacity={0.5} />
      </lineSegments>

      <instancedMesh ref={studs} args={[studGeo, undefined, CORNERS.length]}>
        <meshBasicMaterial ref={studMat} color={studBase} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
