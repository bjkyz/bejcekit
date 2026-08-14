import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial } from 'three'
import { FACE_TRANSFORMS } from '../lib/faces'
import { clampDelta, sceneState } from '../lib/scene-state'
import { bus } from '../lib/bus'
import { FACE_COUNT } from '../content/sections'

const HALF = 1.42
const PER_SIDE = 40
const STEPS = PER_SIDE * 4 // bodů po obvodu (bez uzavíracího duplikátu)
const CONTACT = FACE_COUNT - 1

const HOT = new Color('#b8f5ff').multiplyScalar(3)

/**
 * Obvod stěny jako <lineSegments> — tedy PÁRY vrcholů.
 * (Spojitá lomená čára by potřebovala <line>, což se v JSX pere se SVG <line>.)
 * `u` drží pro každý vrchol jeho pozici po obvodu 0..1, aby po něm mohla běžet hlava.
 */
function build(): { positions: Float32Array; u: Float32Array; count: number } {
  const corners: [number, number][] = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
  ]
  const pt = (k: number): [number, number] => {
    const side = Math.floor(k / PER_SIDE) % 4
    const t = (k % PER_SIDE) / PER_SIDE
    const [ax, ay] = corners[side]
    const [bx, by] = corners[(side + 1) % 4]
    return [ax + (bx - ax) * t, ay + (by - ay) * t]
  }

  const count = STEPS * 2 // 2 vrcholy na segment
  const positions = new Float32Array(count * 3)
  const u = new Float32Array(count)

  for (let i = 0; i < STEPS; i++) {
    const [ax, ay] = pt(i)
    const [bx, by] = pt(i + 1)
    const v = i * 2
    positions[v * 3] = ax
    positions[v * 3 + 1] = ay
    positions[v * 3 + 2] = 0
    positions[(v + 1) * 3] = bx
    positions[(v + 1) * 3 + 1] = by
    positions[(v + 1) * 3 + 2] = 0
    u[v] = i / STEPS
    u[v + 1] = (i + 1) / STEPS
  }
  return { positions, u, count }
}

/**
 * Potvrzení dosednutí: světlo oběhne obvod nové čelní stěny (700 ms).
 * Jedna geometrie, přepolohovaná na aktivní stěnu — ne šest objektů.
 * Na kontaktu (05) se puls opakuje pořád dokola: stroj je nabuzený a čeká na vstup.
 */
export default function TracePulse() {
  const grp = useRef<Group>(null)
  const mat = useRef<LineBasicMaterial>(null)
  const t = useRef(1) // 1 = doběhlo, nic není vidět

  const { geo, u, count } = useMemo(() => {
    const b = build()
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(b.positions, 3))
    g.setAttribute('color', new BufferAttribute(new Float32Array(b.count * 3), 3))
    return { geo: g, u: b.u, count: b.count }
  }, [])

  useLayoutEffect(() => () => geo.dispose(), [geo])

  useEffect(
    () =>
      bus.on('face:land', (i) => {
        if (!grp.current) return
        const f = FACE_TRANSFORMS[i]
        grp.current.position.copy(f.position).multiplyScalar(1.005)
        grp.current.quaternion.copy(f.quaternion)
        t.current = 0
      }),
    [],
  )

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const looping = sceneState.faceIndex === CONTACT

    if (t.current >= 1 && looping) t.current = 0
    if (t.current >= 1) {
      if (mat.current && mat.current.opacity !== 0) mat.current.opacity = 0
      return
    }
    t.current = Math.min(1, t.current + dt / 0.7)

    const col = geo.getAttribute('color') as BufferAttribute
    const arr = col.array as Float32Array
    const head = t.current

    for (let k = 0; k < count; k++) {
      let d = head - u[k]
      if (d < 0) d += 1 // zabalení přes konec obvodu
      const glow = Math.max(0, 1 - d / 0.16) ** 2 // krátká kometí stopa za hlavou
      arr[k * 3] = HOT.r * glow
      arr[k * 3 + 1] = HOT.g * glow
      arr[k * 3 + 2] = HOT.b * glow
    }
    col.needsUpdate = true

    if (mat.current) mat.current.opacity = looping ? 1 : 1 - Math.max(0, (t.current - 0.85) / 0.15)
  })

  return (
    <group ref={grp}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial ref={mat} vertexColors toneMapped={false} transparent opacity={0} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
