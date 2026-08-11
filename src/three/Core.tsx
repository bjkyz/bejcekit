import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { easing } from 'maath'
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SRGBColorSpace,
  SpriteMaterial,
} from 'three'
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
 * ═══════════ ZÁŘE PRO PATRO BEZ COMPOSERU ═══════════
 *
 * ★ NA 'LOW' NEBĚŽÍ BLOOM — A BLOOM JE TU POLOVINA OBRAZU.
 *
 * Celá scéna je postavená na tom, že pár prvků má emisi NAD 1.0 (jádro trysky,
 * hrany, rohové study) a composer z nich udělá světlo, které se rozlévá do okolí.
 * Bez composeru se ta samá čísla jenom ořežou tónovým mapováním na bílou tečku:
 * stroj přestane svítit a zbudou z něj obrysy. Právě proto vypadá nejnižší patro
 * jako „chybějící model" — nechybí geometrie, chybí SVĚTLO.
 *
 * Zář je náhrada za jeden jediný, ale nejdůležitější případ: měkký halo kolem
 * jádra. Je to JEDEN sprite s radiálním přechodem, aditivně míchaný — tedy jeden
 * quad, nula render targetů, nula průchodů navíc. Proti skutečnému bloomu je to
 * hrubé (nezná okolní geometrii a nezáří z hran), ale nese tu jednu věc, kvůli
 * které se na stroj člověk dívá: že uvnitř něco hoří.
 *
 * ★ Textura se kreslí do <canvas>, ne načítá ze souboru — ze stejného důvodu jako
 *   cedule (viz FacePlates.tsx): 128×128 přechod je pár řádků kódu a nula requestů.
 */
const HALO_PX = 128

/** Fáze kolébání mezi snímky — z clampnuté delty, ne z clock.elapsedTime,
    ať po návratu karty z pozadí neskočí (táž past jako drift, viz Rig.tsx). */
const sway = { t: 0 }

function drawHalo(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = HALO_PX
  const g = c.getContext('2d')!
  const h = HALO_PX / 2
  const grd = g.createRadialGradient(h, h, 0, h, h, h)
  /* Jádro světlé a úzké, spád dlouhý. Lineární přechod by dal kotouč s viditelnou
     hranou — mezikroky ho ohnou do křivky, která se čte jako rozptyl, ne jako disk. */
  grd.addColorStop(0, 'rgba(184,245,255,0.95)')
  grd.addColorStop(0.14, 'rgba(120,232,246,0.45)')
  grd.addColorStop(0.38, 'rgba(79,216,232,0.14)')
  grd.addColorStop(1, 'rgba(79,216,232,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, HALO_PX, HALO_PX)
  return c
}

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
  const halo = useRef<SpriteMaterial>(null)
  const { scene, animations } = useGLTF(MODEL, USE_DRACO)
  const { actions } = useAnimations(animations, grp)

  // Zář existuje JEN tam, kde chybí bloom. Na 'mid' a 'high' by se s ním sčítala.
  const haloTex = useMemo(() => {
    if (tier !== 'low') return null
    const t = new CanvasTexture(drawHalo())
    t.colorSpace = SRGBColorSpace
    return t
  }, [tier])
  useEffect(() => () => haloTex?.dispose(), [haloTex])

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

      /* ★★★ NEJDŮLEŽITĚJŠÍ ŘÁDEK V CELÉM SOUBORU. Bez něj neplatí NIC z toho,
         co se o pár řádků níž nastavuje jako barva materiálu.

         Model nese u KAŽDÉ primitivy atribut COLOR_0 (ověřeno v GLB: 6 mesh
         primitiv, všechny mají NORMAL+COLOR_0+POSITION). Když GLTFLoader takový
         atribut najde, naklonuje materiál a zapne `vertexColors = true` — a v
         shaderu three je to prosté `diffuseColor *= vColor`, tedy NÁSOBENÍ.

         Vertex barvy v tomhle modelu jsou zbytky původního Sketchfab materiálu:
         čistě červená, čistě modrá a čistě žlutá. Takže:
           constant1  #2c3a41 × (0.9, 0, 0)      → zelený i modrý kanál na NULU
           constant2  #123a42 × (0.9, 0.9, 0)    → modrý kanál na nulu, z azurové oliva
         Model se tím kreslil na ~10 % zamýšleného jasu a ve špatných odstínech —
         a to na VŠECH patrech, ne jen na 'low'. Právě proto vypadal „nezpracovaně":
         nešlo o chybějící efekty, ale o to, že paleta níž se nikdy neuplatnila.

         ★ `needsUpdate` je povinné: vertexColors je shader define (USE_COLOR),
         změna bez rekompilace se tiše neprojeví.

         (Emise se tím nikdy neovlivnila — vColor násobí jen diffuse, ne
         totalEmissiveRadiance. Proto zář jádra fungovala a chyby si nikdo nevšiml.) */
      mat.vertexColors = false
      mat.needsUpdate = true

      if (mat.name === 'constant2') {
        // JEDINÝ zdroj záře. Tmavý podklad, ať veškerou práci odvede emise + bloom.
        mat.color.set('#123a42')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0 // zapálí se až po loadu, z preloaderu
        /* ★ toneMapped PODLE PATRA, ne natvrdo `false`.
           Uvnitř composeru (high/mid) je `toneMapped` stejně no-op — composer si
           vynutí NoToneMapping na rendereru a mapuje až <ToneMapping> na konci.
           Na 'low' ale composer NEBĚŽÍ a mapuje AgX přímo renderer (ToneSync ve
           Scene.tsx) — a tam `false` znamenalo, že se emise ~5.8 vůbec nenamapuje
           a ořízne se do bílé. Jádro tedy na nejnižším patře nebylo žhavé, ale
           přepálené: bílá tečka bez odstínu. Tohle je druhá polovina toho,
           proč 'low' vypadalo jako torzo. */
        mat.toneMapped = tier === 'low'
      } else if (mat.name === 'HoloFillDark') {
        mat.color.set('#0a1f26')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0.18
      } else {
        /* constant1 — nosná konstrukce. Po vypnutí vertex barev se konečně
           uplatní tahle barva, takže může být TMAVŠÍ než dřív: #2c3a41 bylo
           zesvětlené proto, aby model po vynásobení červenou vůbec nezmizel.
           Teď by při té hodnotě konstrukce přesvítila jádro. */
        mat.color.set('#1d2830')
        mat.emissive.copy(CYAN)
        mat.emissiveIntensity = 0.1
        mat.metalness = 0.72
        /* ★★ ROUGHNESS 0.42, NE 0.3 — A JE TO OPRAVA ZRNĚNÍ, NE ESTETIKA.
           Model má normály uložené jako 8bitové oktaedrální (BYTE/normalized,
           ověřeno v GLB), takže na hladkých válcových plochách jsou kvantované.
           Úzký specular lalok (nízká roughness) tu nepřesnost zvětšuje: sousední
           trojúhelníky trefí odlesk různě a plocha se rozsype na bílé tečky.
           Širší lalok tytéž normály zprůměruje a povrch se čte jako souvislý kov.
           Naměřeno na snímcích při 51k trojúhelnících na ~250 px siluety, tedy
           ~4 trojúhelníky na pixel — režim, kde je zrnění nejvíc vidět. */
        mat.roughness = 0.42
        /* ★ Env mapa místo ambientu. Prostředí (Lights.tsx) dává SMĚR — odlesk
           má kde vzniknout a kov se čte jako kov. Ambient plní plošně a plochý
           kov vypadá jako plast. Nula runtime nákladů: `frames={1}`, mapa je
           upečená a intenzita je jen násobič ve fragment shaderu.
           1.25, ne 1.9: nad ~1.5 přesvítí konstrukce jádro a stroj přestane mít
           jedno ohnisko — a jedno ohnisko je celá kompozice téhle scény. */
        mat.envMapIntensity = 1.25
      }
    })
  }, [scene, tier])

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

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    sway.t += dt
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
    /* Zář jede po TÉŽE křivce jako emise, jen převedená do krytí — jinak by se
       při zážehu z preloaderu rozsvítilo jádro a halo kolem něj zůstalo stát. */
    if (halo.current) easing.damp(halo.current, 'opacity', 0.1 + wantEmissive * 0.055, 0.3, dt)

    /* ★ JÁDRO SE BĚHEM OTÁČKY OPŘE PROTI POHYBU A PAK HO DOŽENE — a musí se opřít
       PROTI TOMU, KAM SE ZROVNA JEDE. Dřív tu bylo znaménko natvrdo, takže se při
       scrollování zpátky nahoru jádro opíralo do STEJNÉ strany jako při cestě dolů:
       setrvačnost, která nezná směr, není setrvačnost, ale ornament.
       Rychlost se klampuje na ±1 — nad jednu stěnu za sekundu už je to plný odpor
       a rychlejší švihnutí nemá jádro roztočit dokola. */
    if (inner.current) inner.current.rotation.y -= 0.9 * h * MathUtils.clamp(sceneState.flow, -1, 1) * dt

    /* ★ KOLÉBÁNÍ BĚŽÍ I NA 'low'. Býval tu guard `tier !== 'low'` a byl to špatný
       obchod: zápis do rotation.z stojí NULU (žádný draw call, žádný shader, jeden
       float), zatímco vypnuté kolébání stojí přesně to, co scéna na slabém telefonu
       potřebuje nejvíc — aby vypadala živě. Šetřilo se tam, kde se nedalo ušetřit,
       za cenu obrazu právě tam, kde byl nejmrtvější. */
    if (grp.current) grp.current.rotation.z = Math.sin(sway.t * 0.2) * 0.05
  })

  return (
    <>
      {/* ★ ŽÁDNÉ ZMENŠOVÁNÍ NA 'low'. Bývalo tu `FIT * (tier === 'low' ? 0.9 : 1)`
          a byl to obchod pozpátku: na patře, kde je model ze všeho nejhůř vidět
          (bez bloomu, bez refrakce, bez pěti cedulí), se ještě o desetinu zmenšil.
          Zmenšení nic nešetří — je to táž geometrie, jen na míň pixelech — a bralo
          přesně to jediné, co na slabém stroji zbývá: velikost siluety. */}
      <group ref={grp} scale={FIT}>
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

      {/* ★ ZÁŘ STOJÍ MIMO `grp`, TEDY MIMO ZMENŠENÍ NA FIT (≈0.39). Uvnitř by se
          scvrkla spolu s modelem a halo o průměru 1,2 jednotky by nemělo kolem
          čeho zářit. Tady je v měřítku scény, takže přesahuje jádro a rozlévá se
          do skořápky — přesně jako bloom, který na tomhle patře chybí.
          Sprite je vždy čelem ke kameře, takže mu kolébání ani protiběh jádra
          nemají co vzít; jeho místo je střed stroje a ten se nehýbe. */}
      {haloTex && (
        <sprite scale={[2.9, 2.9, 1]}>
          <spriteMaterial
            ref={halo}
            map={haloTex}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      )}
    </>
  )
}

useGLTF.preload(MODEL, USE_DRACO)
