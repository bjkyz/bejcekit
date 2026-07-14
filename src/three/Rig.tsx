import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { Euler, MathUtils, Quaternion, Vector3 } from 'three'
import { FACE_CAM_QUATS } from '../lib/faces'
import { clampDelta, ORBIT_PAN, ORBIT_RADIUS, sceneState } from '../lib/scene-state'

const LAST = FACE_CAM_QUATS.length - 1

/* Pracovní objekty mimo komponentu — useFrame běží 60×/s a nesmí alokovat. */
const orbit = new Quaternion() // čisté natočení na dráze (bez panorámy)
const pan = new Quaternion() // kompoziční panoráma v LOKÁLNÍM rámci kamery
const euler = new Euler(0, 0, 0, 'YXZ') // YXZ = nejdřív otoč, pak zvedni. Jako hlava.
const right = new Vector3()
const up = new Vector3()

const FOV = 35
const HALF_FOV = MathUtils.degToRad(FOV / 2)
/** Kolik jednotek musí být vidět, aby se krychle (hrana 3) vešla i s rezervou. */
const NEED_SPAN = 4.3

/** ★ Musí souhlasit s breakpointem v layout.css (max-width: 1024px). */
const SIDE_BY_SIDE = 1024

/** O kolik se krychle vysune nad text, když text sedí pod ní (mobil). V jednotkách. */
const PORTRAIT_LIFT = 1.15

/** Parallax: posun kamery do strany. Dost na hloubku, málo na nevolnost. */
const PARALLAX = 0.12

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * ★ KAMERA OBÍHÁ KRYCHLI. Krychle se neotáčí — viz ORBIT_* v lib/scene-state.ts
 *   a FACE_CAM_QUATS v lib/faces.ts, kde je odvození i důvody.
 *
 * ★★ POZICE I NATOČENÍ SE POČÍTAJÍ Z JEDNOHO KVATERNIONU, a proto se NIKDY
 *   nemůžou rozejít. Kdyby se tlumily zvlášť (damp3 na pozici, dampQ na natočení),
 *   dorazila by každá v jiný snímek: kamera by na okamžik stála nad jednou stěnou
 *   a koukala na jinou, krychle by při každém přeletu uplavala ze středu záběru.
 *   Tlumí se proto JEDINÁ veličina — poloha na dráze (`aim`, viz Choreo.tsx) —
 *   a z té se obojí odvodí. Jeden zdroj pravdy, žádné dohánění.
 *
 * ★★★ NIKDE SE NEVOLÁ lookAt(). Nad horní a pod dolní stěnou je degenerované
 *   (směr pohledu rovnoběžný s `up`) a obraz by tam škubl. Viz FACE_CAM_QUATS.
 */
export default function Rig({ parallax }: { parallax: boolean }) {
  const mouse = useRef({ x: 0, y: 0 })
  const size = useThree((s) => s.size)

  useFrame((state, delta) => {
    const dt = clampDelta(delta)
    const cam = state.camera

    /* ── 1. KDE NA DRÁZE JSME ──────────────────────────────── */
    const a = MathUtils.clamp(sceneState.aim, 0, LAST)
    const i = MathUtils.clamp(Math.floor(a), 0, LAST - 1)
    const t = smoothstep(MathUtils.clamp(a - i, 0, 1))

    // Slerp = oblet po nejkratším oblouku. Každý krok je přesně 90° (viz faces.ts).
    orbit.slerpQuaternions(FACE_CAM_QUATS[i], FACE_CAM_QUATS[i + 1], t)

    /* ── 2. JAK DALEKO ─────────────────────────────────────── */
    let r = MathUtils.lerp(ORBIT_RADIUS[i], ORBIT_RADIUS[i + 1], t)

    /* ★ ODSTUP PODLE POMĚRU STRAN. FOV 35° je VERTIKÁLNÍ. Na telefonu na výšku
       (390×844, poměr 0.46) je vodorovné zorné pole úzké: při vzdálenosti vyladěné
       pro desktop by bylo vidět jen ~2.1 jednotky na šířku — a krychle o hraně 3
       by byla po stranách UŘÍZNUTÁ. Vzdálenost se proto dopočítává z poměru stran,
       nikdy z konstanty. (Přesně tohle je důvod, proč krychle kdysi „na mobilu
       nebyla vidět".) */
    const aspect = size.width / Math.max(1, size.height)
    const needed = NEED_SPAN / (2 * Math.tan(HALF_FOV) * Math.min(aspect, 1))
    if (r < needed) r = needed

    // Kamera sedí PŘESNĚ na normále stěny, ve vzdálenosti r. Bez alokace.
    cam.position.set(0, 0, r).applyQuaternion(orbit)

    /* ── 3. KOMPOZICE: uhni krychlí textu ──────────────────── */
    /* Panoráma platí jen tam, kde text stojí VEDLE krychle. Pod 1024px mu layout.css
       dá plnou šířku a posadí ho POD ni — uhýbat do strany před textem, který žádnou
       stranu nemá, by krychli jen bezdůvodně vystrčilo z osy. */
    const wide = size.width > SIDE_BY_SIDE
    const p0 = ORBIT_PAN[i]
    const p1 = ORBIT_PAN[i + 1]

    let yaw = wide ? MathUtils.lerp(p0.yaw, p1.yaw, t) : 0
    let pitch = wide ? MathUtils.lerp(p0.pitch, p1.pitch, t) : 0
    const roll = wide ? MathUtils.lerp(p0.roll, p1.roll, t) : 0

    /* Na úzkém displeji se krychle vysune do HORNÍHO pásu, aby si nelezla do textu,
       který na mobilu sedí dole. Kamera se k tomu SKLOPÍ POD ni: záporný pitch =
       kamera se dívá dolů = krychle vyjede nahoru. Úhel se počítá ze vzdálenosti,
       takže posun na obrazovce zůstane stejný, ať je kamera jakkoli daleko. */
    if (aspect < 0.9) pitch -= Math.atan2(PORTRAIT_LIFT, r)

    /* ── 4. PARALLAX (jen desktop) ─────────────────────────── */
    if (parallax) {
      easing.damp(mouse.current, 'x', state.pointer.x * PARALLAX, 0.35, dt)
      easing.damp(mouse.current, 'y', state.pointer.y * PARALLAX, 0.35, dt)

      /* ★ SKUTEČNÝ PARALLAX = POSUN KAMERY, ne jen natočení. Kdyby se kamera jen
         natočila, posunul by se obraz jako celek a žádná hloubka nevznikne. Teprve
         když se kamera opravdu POSUNE do strany, začnou se bližší a vzdálenější části
         stroje vůči sobě míjet — a přesně kvůli tomu tu parallax je.
         Posouvá se v LOKÁLNÍM rámci kamery (její vlastní doprava/nahoru), aby to
         fungovalo stejně nad horní stěnou jako pod tou dolní. */
      right.set(1, 0, 0).applyQuaternion(orbit)
      up.set(0, 1, 0).applyQuaternion(orbit)
      cam.position.addScaledVector(right, mouse.current.x)
      cam.position.addScaledVector(up, mouse.current.y)

      /* …a dorovnat záběr zpátky na krychli. Bez tohohle by posun kamery vysunul
         krychli ze středu a parallax by se choval jako rozházená kompozice.
         Posun doprava → krychle uteče doleva → dorovná se kladným yaw. */
      yaw += Math.atan2(mouse.current.x, r)
      pitch -= Math.atan2(mouse.current.y, r)
    }

    /* ── 5. SLOŽIT ─────────────────────────────────────────── */
    /* Panoráma se PŘINÁSOBÍ ZPRAVA, tedy v lokálním rámci kamery: „otoč se o pár
       stupňů stranou od toho, kam koukáš". Kdyby se násobila zleva, otáčela by se
       kolem SVĚTOVÝCH os a nad horní stěnou by se z yaw stal roll. */
    euler.set(pitch, yaw, roll)
    pan.setFromEuler(euler)
    cam.quaternion.copy(orbit).multiply(pan)
  })

  return null
}
