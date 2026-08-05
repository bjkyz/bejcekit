import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import { Group, Mesh, MeshStandardMaterial, PointLight } from 'three'
import { clampDelta, sceneState } from '../lib/scene-state'
import { CYAN } from './palette'
import type { Tier } from '../lib/quality'

/* meshopt komprese → dekodér je inlinovaný v three-stdlib. Nula konfigurace,
   nula CDN. (Draco by si tiše stáhl WASM z gstatic.com.) */
const MODEL = `${import.meta.env.BASE_URL}models/core.v2.glb`

/* ★ DRUHÝ ARGUMENT = useDraco, A MUSÍ BÝT `false`.
   Komentář výš tvrdil „nula CDN" — jenže `useGLTF(MODEL)` bere DEFAULTY, a ten
   pro Draco je `true`. drei proto ke každému načtení připojil DRACOLoader
   s dekodérem z https://www.gstatic.com/draco/. Zachránilo nás jen to, že
   v modelu žádný Draco payload není, takže se ta cesta nikdy nespustila.
   Byla to ale nastražená mina: `connect-src 'self'` v CSP by ten request
   zablokovala v tu vteřinu, co by kdokoli model re-exportoval s Draco —
   a padlo by to úplně stejně jako meshopt. Vypínáme to natvrdo. */
const USE_DRACO = false

/* ★ ZMĚŘENO, NE ODHADNUTO (viz Box3 nad GLB):
   model má maxDim 4.075 jednotky — je tedy VĚTŠÍ než 3jednotková krychle.
   Chceme ho uvnitř skla nechat dýchat → cílíme na ~1.75 jednotky. */
const MODEL_MAX_DIM = 4.075
const FIT = 1.75 / MODEL_MAX_DIM // ≈ 0.43

/**
 * „Primary Ion Drive" — Mike Murdock, CC BY 4.0.
 * Atribuce je SMLUVNÍ POVINNOST, ne zdvořilost. Je na dvou místech: v patičce
 * sekce 05 a ve stavovém panelu. Nikdy ji neodstraňuj z estetických důvodů.
 *
 * ★ EMISE PATŘÍ JEN NA `constant2`. Model má tři materiály a emisi má
 *   AUTORSKY jen `constant2` (oranžové jádro trysky, emissive #9a9300).
 *   `constant1` je matná bílá konstrukce a `HoloFillDark` je průhledný plášť.
 *   Když se azurová emise nasype na VŠECHNY (což byla moje první verze),
 *   rozsvítí se celý model, bloom to rozmázne a scéna je přepálená doběla.
 *   Svítí jen to, co svítit má — zbytek je tmavý kov, který jen odráží.
 */
export default function Core({ tier }: { tier: Tier }) {
  const grp = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const { scene, animations } = useGLTF(MODEL, USE_DRACO)
  const { actions } = useAnimations(animations, grp)

  /** Jen materiály, které mají doopravdy zářit — ty jediné se animují. */
  const glow = useMemo(() => {
    const out: MeshStandardMaterial[] = []
    scene.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      const mat = m.material as MeshStandardMaterial
      if (mat?.name === 'constant2' && !out.includes(mat)) out.push(mat)
    })
    return out
  }, [scene])

  useLayoutEffect(() => {
    const done = new Set<string>()
    scene.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      const mat = m.material as MeshStandardMaterial
      if (!mat || done.has(mat.uuid)) return
      done.add(mat.uuid)

      if (mat.name === 'constant2') {
        // JEDINÝ zdroj záře. Tmavý podklad, ať veškerou práci odvede emise + bloom.
        mat.color.set('#123a42')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0 // zapálí se až po loadu, z preloaderu
        mat.toneMapped = false
      } else if (mat.name === 'HoloFillDark') {
        mat.color.set('#0a1f26')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0.18
      } else {
        // constant1 — konstrukce. Světlejší kov, než by člověk čekal: ve tmavé
        // komoře za sklem se jinak slije s pozadím a model zmizí.
        mat.color.set('#2c3a41')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0.1
        mat.metalness = 0.8
        mat.roughness = 0.35
      }
    })
  }, [scene])

  // Zapečená rotační animace („Main", 10 s) — živé jádro zadarmo.
  useEffect(() => {
    const first = Object.values(actions)[0]
    if (!first) return
    first.reset().play()
    first.timeScale = 0.35
    return () => {
      first.stop()
    }
  }, [actions])

  useFrame((state, delta) => {
    const dt = clampDelta(delta)
    const h = sceneState.heat
    const i = sceneState.faceIndex

    // Zážeh z preloaderu: vystřelí na hodnotu a tady se tlumí zpátky k nule.
    easing.damp(sceneState, 'boost', 0, 0.55, dt)

    /* Klidový jas: 3.0 základ, 4.0 na úvodu (00), 3.8 na AI (03), 4.2 na kontaktu (05).
       ★ ÚVOD SVÍTÍ VÍC NEŽ ZÁKLAD, protože od HERO_DROP (lib/scene-state.ts) leží
       stroj ve volném pásu pod textem a je to JEDINÝ obraz, který na první obrazovce
       nese celou scénu — dřív se tam schovával za závoj a klidový jas 3.0 byl počítaný
       na to, aby textem neprosvítal. Kontakt zůstává nejsvětlejší: stroj je nabuzený
       a čeká na vstup. */
    const idle = i === 0 ? 4.0 : i === 3 ? 3.8 : i === 5 ? 4.2 : 3.0
    const wantEmissive = idle + h * 1.8 + sceneState.boost

    for (const m of glow) easing.damp(m, 'emissiveIntensity', wantEmissive, 0.3, dt)
    if (light.current) easing.damp(light.current, 'intensity', 3 + wantEmissive, 0.3, dt)

    // Jádro se během otáčky opře PROTI skořápce a pak ji dožene.
    if (inner.current) inner.current.rotation.y -= 0.9 * h * dt

    /* ★ KOLÉBÁNÍ BĚŽÍ I NA 'low'. Býval tu guard `tier !== 'low'` a byl to špatný
       obchod: zápis do rotation.z stojí NULU (žádný draw call, žádný shader, jeden
       float), zatímco vypnuté kolébání stojí přesně to, co scéna na slabém telefonu
       potřebuje nejvíc — aby vypadala živě. Šetřilo se tam, kde se nedalo ušetřit,
       za cenu obrazu právě tam, kde byl nejmrtvější. */
    if (grp.current) grp.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
  })

  return (
    <group ref={grp} scale={FIT * (tier === 'low' ? 0.9 : 1)}>
      <group ref={inner}>
        {/* dispose={null} — R3F by jinak při unmountu zlikvidoval i položku
            v useGLTF cache („model je po návratu černý"). */}
        <primitive object={scene} dispose={null} />
      </group>
      {/* Bloom se NEREFRAKTUJE skrz sklo (MTM renderuje svoje FBO mimo composer).
          Kompenzujeme tím, že jádro nese SKUTEČNÉ světlo — sklo je tak nasvícené
          zevnitř a čte se jako zdroj světla za sklem. Nebojuj s pipeline. */}
      <pointLight ref={light} color={CYAN} intensity={4} distance={6} decay={2} />
    </group>
  )
}

useGLTF.preload(MODEL, USE_DRACO)
