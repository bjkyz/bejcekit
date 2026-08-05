import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { CanvasTexture, Group, LinearFilter, MeshBasicMaterial, SRGBColorSpace } from 'three'
import { FACE_TRANSFORMS } from '../lib/faces'
import { SECTIONS } from '../content/sections'
import { clampDelta, sceneState } from '../lib/scene-state'
import type { Tier } from '../lib/quality'

/**
 * Cedule na stěnách krychle.
 *
 * ★ CANVAS TEXTURA, NE drei <Text>.
 *   drei's <Text> je obal nad troika-three-text — plnohodnotný SDF textový engine
 *   (~100 kB gz). Platit ho za ŠEST KRÁTKÝCH NÁPISŮ, které se nikdy nemění, je
 *   nesmysl. Navíc si troika bez explicitního `font` tiše stahuje Roboto
 *   z fonts.gstatic.com, takže s ním musel ve /public bydlet ještě 30kB TTF.
 *
 *   Vykreslení do <canvas> a nahrání jako textura umí prohlížeč sám: nula
 *   závislostí, nula souborů navíc, jeden draw call na ceduli. A protože je to
 *   normální mesh s mapou, spadne do refrakčního bufferu skla úplně stejně —
 *   „duchový" efekt zadních cedulí zůstává.
 *
 * Popisky jsou ZÁMĚRNĚ ASCII (IDENT, WEB, INFRA…). Veškerá čeština s diakritikou
 * žije v DOM, kde ji přečte Google i čtečka.
 */

const W = 1024
const H = 512
/** Rovina, na kterou se textura promítá (krychle má hranu 3). */
const PLANE: [number, number] = [2.4, 1.2]

function drawPlate(num: string, code: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.clearRect(0, 0, W, H)
  g.textAlign = 'center'
  g.textBaseline = 'middle'

  // Číslo stěny — menší, světlejší.
  g.font = '500 84px "Geist Mono", ui-monospace, monospace'
  g.fillStyle = '#b8f5ff'
  g.letterSpacing = '14px'
  g.fillText(num, W / 2, 150)

  // Kód služby — hlavní nápis.
  g.font = '500 132px "Geist Mono", ui-monospace, monospace'
  g.fillStyle = '#4fd8e8'
  g.letterSpacing = '10px'
  g.fillText(code, W / 2, 330)

  return c
}

/**
 * ★ NA STŘEDOVÝCH SEKCÍCH (00, 05) SE AKTIVNÍ CEDULE TLUMÍ, NE ROZSVĚCÍ.
 * Text tam stojí PŘES střed stěny, přesně přes nápis — cedule na plný jas
 * prosvítala odstavcem jako rozmazaný druhý nápis a jediná obrana byl závoj
 * s krytím 0.9, který ovšem zhasnul celou krychli („ztratil se 3D model").
 * Ztlumení cedule tady, u zdroje, nechá závoj lehký a krychli viditelnou.
 * O informaci nejde: tentýž nápis má sekce v DOM kickeru („[ 00 / IDENT ]").
 */
const CENTER_SECTIONS = new Set([0, 5])

function Plate({ i, tier }: { i: number; tier: Tier }) {
  const grp = useRef<Group>(null)
  const mat = useRef<MeshBasicMaterial>(null)
  const t = FACE_TRANSFORMS[i]
  const s = SECTIONS[i]

  // Kreslíme AŽ po doběhnutí fontů — jinak canvas sáhne po systémovém fallbacku
  // a nápis bude jinou písmovkou než zbytek webu.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    document.fonts.ready.then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  const tex = useMemo(() => {
    if (!ready) return null
    const texture = new CanvasTexture(drawPlate(s.plateNum, s.plateCode))
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter // bez mipmap: nápis je vždy zhruba stejně velký
    texture.magFilter = LinearFilter
    texture.anisotropy = 4
    return texture
  }, [ready, s.plateNum, s.plateCode])

  // Co jsme si sami `new`-li, sami uklidíme.
  useEffect(() => () => tex?.dispose(), [tex])

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const active = sceneState.faceIndex === i

    const activeOpacity = CENTER_SECTIONS.has(i) ? 0.2 : 1
    if (mat.current) easing.damp(mat.current, 'opacity', active ? activeOpacity : 0.22, 0.25, dt)

    /* ★ Na 'low' tieru je skořápka meshPhysicalMaterial s transparent →
       depthWrite:false, takže zadní cedule NEJSOU zakryté a vykreslily by se
       ostře, pozpátku a naležato přes přední stěnu. Proto je tam schováme.
       (Musí to být v useFrame — sceneState re-render nespouští.) */
    if (grp.current) grp.current.visible = tier !== 'low' || active
  })

  /* ★ DOKUD NENÍ TEXTURA, MESH VŮBEC NEVZNIKNE.
     Kdyby se vykreslil s `map={null}` a textura se doplnila až potom, three by
     shader NEPŘEKOMPILOVAL (přidání mapy vyžaduje material.needsUpdate) a na
     stěně by zůstal svítit holý bílý obdélník místo nápisu. Tohle je ta klasická
     past: materiál musí mapu dostat rovnou při vzniku. */
  if (!tex) return null

  return (
    <group ref={grp} position={t.position} quaternion={t.quaternion}>
      <mesh>
        <planeGeometry args={PLANE} />
        <meshBasicMaterial ref={mat} map={tex} transparent toneMapped={false} depthWrite={false} opacity={0.22} />
      </mesh>
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
