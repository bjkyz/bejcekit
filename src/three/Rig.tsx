import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { MathUtils, Vector3 } from 'three'
import { clampDelta, CAM_KEYS } from '../lib/scene-state'
import { scrollState } from '../lib/scroll'

const LAST = CAM_KEYS.length - 1
const want = new Vector3()
const a = new Vector3()
const b = new Vector3()
const target = new Vector3()

const FOV = 35
const HALF_FOV = MathUtils.degToRad(FOV / 2)
/** Kolik jednotek musí být vidět, aby se krychle (hrana 3) vešla i s rezervou. */
const NEED_SPAN = 4.3

/**
 * Kamera se posouvá po 6 klíčových pozicích podle scrollu.
 *
 * ★ FOV JE KONSTANTNÍ 35 A NIKDY SE NEANIMUJE. Kdyby se animovala pozice
 *   (damp3, smoothTime 0.5) a zároveň FOV (damp, jiný smoothTime), dorazí každá
 *   v jiný snímek a čte se to jako VADNÝ OBJEKTIV, ne jako pohyb kamery.
 *   Jeden smoothTime, jedna veličina — a půlka pocitu na žaludku je pryč.
 *
 * ★ ODSAZENÍ PODLE POMĚRU STRAN. FOV 35° je VERTIKÁLNÍ. Na výšku orientovaném
 *   telefonu (390×844, poměr 0.46) je vodorovné zorné pole úzké: při vzdálenosti
 *   vyladěné pro desktop je vidět jen ~2.1 jednotky na šířku — a krychle o hraně 3
 *   je proto po stranách UŘÍZNUTÁ. (Přesně proto na mobilu „nebyla vidět".)
 *   Vzdálenost se tedy dopočítává z poměru stran, ne z konstanty.
 */
export default function Rig({ parallax }: { parallax: boolean }) {
  const mouse = useRef({ x: 0, y: 0 })
  const size = useThree((s) => s.size)

  useFrame((state, delta) => {
    const dt = clampDelta(delta)

    const p = MathUtils.clamp(scrollState.progress, 0, LAST)
    const i = MathUtils.clamp(Math.floor(p), 0, LAST - 1)
    const t = MathUtils.clamp(p - i, 0, 1)

    a.fromArray(CAM_KEYS[i])
    b.fromArray(CAM_KEYS[i + 1])
    want.lerpVectors(a, b, t * t * (3 - 2 * t))

    // Poměr stran: pro širokoúhlé okno omezuje výška, pro úzké šířka.
    const aspect = size.width / Math.max(1, size.height)
    const needed = NEED_SPAN / (2 * Math.tan(HALF_FOV) * Math.min(aspect, 1))
    const dist = want.length()
    if (dist < needed) want.multiplyScalar(needed / dist)

    // Na úzkém displeji se krychle vysune do HORNÍHO pásu, aby si nelezla
    // do textu, který na mobilu sedí dole. Docílí se to sklopením pohledu POD ni.
    target.set(0, aspect < 0.9 ? -1.15 : 0, 0)

    if (parallax) {
      // Jen desktop. ±0.12 jednotky — dost na hloubku, málo na nevolnost.
      easing.damp(mouse.current, 'x', state.pointer.x * 0.12, 0.35, dt)
      easing.damp(mouse.current, 'y', state.pointer.y * 0.12, 0.35, dt)
      want.x += mouse.current.x
      want.y += mouse.current.y
    }

    easing.damp3(state.camera.position, want, 0.5, dt)
    state.camera.lookAt(target)
  })

  return null
}
