import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import {
  CanvasTexture,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three'
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
 * ★ JAS AKTIVNÍ CEDULE PODLE TOHO, CO PŘED NÍ STOJÍ. Výchozí je 1 (plný jas):
 * na sekcích 01–04 uhne krychle textu do strany a cedule nemá čemu překážet.
 *
 * Výjimky jsou obě STŘEDOVÉ sekce, kde text stojí v ose stěny:
 *   05 KONTAKT — text jde PŘES nápis celou plochou. Cedule na plný jas jím
 *      prosvítala jako rozmazaný druhý nadpis a jediná obrana byl závoj s krytím
 *      0.9, jenže ten zhasnul celou krychli („ztratil se 3D model"). Tlumí se
 *      proto u zdroje a závoj smí zůstat lehký.
 *   00 IDENT — ★ TADY SE UŽ TLUMIT NEMUSÍ. Od zavedení HERO_DROP (viz
 *      lib/scene-state.ts) sjede krychle o pětinu okna dolů, takže stěna i s cedulí
 *      leží POD textem, ve volném pásu. Držet ji na 0.2 by znamenalo schovávat ji
 *      před textem, který tam už není — a přišli bychom o jediný nápis, který je
 *      na první obrazovce vidět uvnitř skla. Dolů se sundá jen tolik, aby nesoupeřil
 *      s nadpisem v DOM.
 * O informaci nejde nikde: tentýž nápis má sekce v DOM kickeru („[ 00 / IDENT ]").
 */
const ACTIVE_OPACITY: Record<number, number> = { 0: 0.5, 5: 0.2 }

/* Pomocné objekty pro test natočení. Mimo komponentu a znovupoužité — useFrame
   nesmí alokovat (šedesátkrát za vteřinu × šest cedulí je práce pro GC zadarmo). */
const normal = new Vector3()
const toCamera = new Vector3()
const worldPos = new Vector3()
const worldQuat = new Quaternion()

function Plate({ i, tier }: { i: number; tier: Tier }) {
  const grp = useRef<Group>(null)
  const mat = useRef<MeshBasicMaterial>(null)
  const t = FACE_TRANSFORMS[i]
  const s = SECTIONS[i]
  /* Skutečný strop ovladače, ne odhad. Na Apple GPU je to 16, na starých Intel 2 —
     a požadovat víc, než karta umí, three tiše ořízne, takže je to bezpečné číslo. */
  const maxAnisotropy = useThree((st) => Math.min(8, st.gl.capabilities.getMaxAnisotropy()))
  const camera = useThree((st) => st.camera)

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
    /* ★★ MIPMAPY MUSÍ BÝT, JINAK SE NÁPIS TŘPYTÍ — a anisotropy je bez nich mrtvý kód.
       Stálo tu `minFilter = LinearFilter` s poznámkou „nápis je vždy zhruba stejně
       velký". Věcně to neplatí: textura je 1024×512 na rovině 2.4×1.2 a kamera je
       na r ≈ 9.6–10.8, takže cedule na obrazovce zabírá kolem 200 px. To je
       minifikace zhruba 5× — přesně režim, pro který mipmapy existují. Bez mip
       řetězce se sousední texely při každém pohybu kamery vzorkují náhodně a text
       jiskří (aliasing), a `anisotropy` NEDĚLÁ NIC, protože anizotropní filtrování
       vybírá právě z mip úrovní.
       LinearMipmapLinear + reálná anisotropie z capabilities: ostrý nápis i při
       šikmém pohledu, a ještě levnější vzorkování než dřív. */
    texture.minFilter = LinearMipmapLinearFilter
    texture.magFilter = LinearFilter
    texture.generateMipmaps = true
    texture.anisotropy = maxAnisotropy
    return texture
  }, [ready, s.plateNum, s.plateCode, maxAnisotropy])

  // Co jsme si sami `new`-li, sami uklidíme.
  useEffect(() => () => tex?.dispose(), [tex])

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const active = sceneState.faceIndex === i

    const activeOpacity = ACTIVE_OPACITY[i] ?? 1
    if (mat.current) easing.damp(mat.current, 'opacity', active ? activeOpacity : 0.22, 0.25, dt)

    /* ★★ NA 'low' SE SKRÝVAJÍ JEN ODVRÁCENÉ CEDULE, NE VŠECHNY KROMĚ AKTIVNÍ.
       Fejk skořápka na tomhle patře nezapisuje hloubku (Shell.tsx), takže ZADNÍ
       cedule by prolezly dopředu a vykreslily se ostře, pozpátku a naležato přes
       přední stěnu. Původní obrana byla „ukaž jen aktivní" — jenže tím zmizelo
       pět ze šesti nápisů a z krychle zbyl drátěný model s jedním štítkem. Přitom
       „duchový stoh" cedulí je podle Shell.tsx podpis celé scény.

       Skrýt stačí ty, které jsou od kamery odvrácené: jejich normála míří pryč,
       takže je stejně nemá být vidět, a právě ony jsou tím, co prolézá. Test je
       jedno skalární násobení na ceduli a na snímek, nula draw callů navíc —
       a vrátí to na nejnižším patře tři nápisy místo jednoho. */
    if (grp.current) {
      if (tier !== 'low') {
        grp.current.visible = true
      } else {
        /* ★ SVĚTOVÁ rotace, ne lokální. Cedule sedí uvnitř `float` (vznášení)
           a `dragRef` (tažení myší), takže se její lokální quaternion s natočením
           krychle vůbec nemění — test by pak platil jen dokud nikdo nesáhne na
           krychli, a přesně v tu chvíli by cedule začaly probleskovat. */
        grp.current.getWorldQuaternion(worldQuat)
        grp.current.getWorldPosition(worldPos)
        normal.set(0, 0, 1).applyQuaternion(worldQuat)
        toCamera.subVectors(camera.position, worldPos).normalize()
        // Malý kladný práh, ne 0: přesně na hraně by cedule při dýchání blikala.
        grp.current.visible = active || normal.dot(toCamera) > 0.02
      }
    }
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
