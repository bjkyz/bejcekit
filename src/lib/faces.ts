import { Quaternion, Vector3 } from 'three'

/**
 * ★ NEMĚNIT. Pořadí stěn je dané geometrií krychle, ne obsahem.
 *
 * Protilehlé stěny krychle jsou od sebe 180°. Kdybychom je proscrollovali
 * v „přirozeném" pořadí (předek → pravá → zadní → levá → horní → dolní),
 * krok horní→dolní by byl 180° otočka — degenerovaný případ slerpu
 * s nejednoznačnou osou. Přesně tam krychle viditelně „přepadává“.
 *
 * Řešení: stěny jdou po hamiltonovské cestě grafu sousednosti (K2,2,2),
 * takže KAŽDÝ krok je přesně 90°. Skládáme je z rotací kolem světových os,
 * ne z ručně opsaných floatů — tabulka je tak ověřitelná a nerozbije se překlepem.
 */
const STEPS: { axis: 'x' | 'y'; deg: number }[] = [
  { axis: 'y', deg: 0 }, //  0 FRONT  +Z  (identita)
  { axis: 'y', deg: -90 }, // 1 RIGHT  +X
  { axis: 'x', deg: +90 }, // 2 TOP    +Y
  { axis: 'y', deg: -90 }, // 3 BACK   -Z
  { axis: 'x', deg: +90 }, // 4 LEFT   -X
  { axis: 'y', deg: -90 }, // 5 BOTTOM -Y
]

const AXIS = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0) }

/** Kvaterniony natočení krychle tak, aby i-tá stěna mířila na kameru (+Z). */
export const FACE_QUATS: Quaternion[] = (() => {
  const out: Quaternion[] = []
  const acc = new Quaternion()
  for (const s of STEPS) {
    // Pre-multiply => rotace kolem SVĚTOVÉ osy, ne kolem lokální.
    const step = new Quaternion().setFromAxisAngle(AXIS[s.axis], (s.deg * Math.PI) / 180)
    acc.premultiply(step)
    out.push(acc.clone().normalize())
  }
  return out
})()

const HALF = 1.5 // krychle 3×3×3
const EPS = 0.001 // aby cedule nez-fightovala se stěnou

/**
 * Kam a jak natočit obsah přilepený na i-tou stěnu.
 *
 * Stěny 2, 3 a 4 dorazí natočené o ±90° v rovině — naivní přilepení textu
 * by dalo na půlce sekcí text NALEŽATO. Trik: obsah dostane lokální kvaternion
 * q⁻¹. Až se krychle dotočí do q, světové natočení obsahu je q · q⁻¹ = identita,
 * tedy vždy přesně čelem ke kameře a vzpřímeně.
 */
export function faceTransform(q: Quaternion): { position: Vector3; quaternion: Quaternion } {
  const inv = q.clone().normalize().invert()
  const position = new Vector3(0, 0, 1).applyQuaternion(inv).multiplyScalar(HALF + EPS)
  return { position, quaternion: inv }
}

export const FACE_TRANSFORMS = FACE_QUATS.map(faceTransform)
