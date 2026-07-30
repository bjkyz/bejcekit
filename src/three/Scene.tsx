import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Preload, useProgress } from '@react-three/drei'
import { AgXToneMapping, NoToneMapping, type Group, type Material, type Mesh } from 'three'
import { dprFor, persistTierCap, type Tier } from '../lib/quality'
import { sceneState } from '../lib/scene-state'
import { VOID } from './palette'
import { setLoading } from '../lib/loading'
import Cube from './Cube'
import Lights from './Lights'
import Rig from './Rig'
import Choreo from './Choreo'
import Effects from './Effects'
import Dust from './Dust'
import Deck from './Deck'

/** Patro kvality za běhu. 'off' sem nikdy nedoleze — bez WebGL se Scene nemountuje. */
type Level = Exclude<Tier, 'off'>

/**
 * ★ MODULOVÉ KONSTANTY, NE OBJEKTOVÉ LITERÁLY V JSX.
 *
 * Kdyby se `camera` a `gl` psaly inline (`camera={{ ... }}`), vznikl by při KAŽDÉM
 * renderu Scene nový objekt. R3F pak vidí změněný prop a znovu na kameru aplikuje
 * její výchozí hodnoty — VČETNĚ POZICE. A protože governor mění dpr, Scene se
 * překresluje, kamera se pořád resetuje na výchozí pozici a damp v Rigu s ní jen
 * věčně přetahuje lano. Kamera se pak nikdy nedostane na svou klíčovou pozici
 * a celá choreografie (stoupání nad INFRA, nájezd na AI, dojezd na KONTAKT)
 * je tiše mrtvá. Stabilní identita propu to řeší.
 */
/**
 * Most mezi drei a preloaderem. `useProgress` se volá TADY (uvnitř líně načteného
 * chunku) a výsledek jen zapíše do našeho storu — preloader tak nemusí importovat
 * drei, a three tím pádem nesedí na kritické cestě prvního vykreslení.
 * Musí být uvnitř <Canvas>, protože sleduje three's LoadingManager.
 */
function LoadingBridge() {
  const { progress, active } = useProgress()
  useEffect(() => setLoading(progress, active), [progress, active])
  return null
}

const CAMERA = { fov: 35, position: [0, 0, 8.8] as [number, number, number], near: 0.1, far: 100 }
const GL = {
  toneMapping: NoToneMapping, // ★ viz Effects.tsx — jinak si to composer stejně přepíše
  antialias: false, // multisampling řeší composer
  powerPreference: 'high-performance' as const,
}

/**
 * ═══════════ GOVERNOR — JEDINÝ REGULÁTOR KVALITY ZA BĚHU ═══════════
 *
 * Dřív tu byl drei <PerformanceMonitor> a uměl JEDINOU věc: hýbat s DPR. Jenže
 * na slabém stroji DPR není ta drahá položka — refrakční FBO skla (512²+backside),
 * composer a bloom mají FIXNÍ cenu, kterou žádné snížení rozlišení plátna nesrazí.
 * Stroj, který na to neměl, se trápil na 20 fps s krásně nízkým DPR.
 *
 * Governor má místo toho ŽEBŘÍK, po kterém umí sestoupit až úplně dolů:
 *
 *     1. DPR po −0.25 až na minimum          (levné, zkouší se první)
 *     2. high → mid    sklo bez backside, FBO 256², bez MSAA
 *     3. mid  → low    sklo fejkem, žádný composer, méně prachu
 *     4. low  → PRYČ   3D se vypne úplně a zbude čistý, rychlý web
 *
 * Každý sestup si PAMATUJE (persistTierCap): příští návštěva začne rovnou na
 * patře, které stroj utáhl — první dojem už nikdy není „trhá se to".
 *
 * ★ NAHORU se šplhá JEN DPR. Patro se zpátky nepovyšuje — přepnutí materiálů
 *   znamená rekompilaci shaderů, a governor, který osciluje mezi patry, je horší
 *   než governor, který jednou ustoupí a dá pokoj.
 *
 * ★★ Startuje se KONZERVATIVNĚ (půlka rozsahu DPR, viz initialDpr) a nahoru se jde
 *   až po důkazu. Opačný postup — začít naplno a čekat, až se to sesype — znamená,
 *   že si každý slabší stroj odbyde trhaný úvod přesně v momentě prvního dojmu.
 */
const DPR_STEP = 0.25
const FPS_DOWN = 34 // pod tímhle se sestupuje
const FPS_UP = 56 // nad tímhle se DPR vrací nahoru
const FPS_ABORT = 20 // hluboko pod použitelností → 3D jde pryč úplně

function Governor({
  level,
  min,
  cap,
  dpr,
  setDpr,
  demote,
}: {
  level: Level
  min: number
  cap: number
  dpr: number
  setDpr: (d: number) => void
  demote: (from: Level) => void
}) {
  const ema = useRef(60)
  const holdUntil = useRef(0) // po každém zásahu chvíli ticho — ať se změna stihne projevit
  const badSince = useRef(0)

  useFrame((_, delta) => {
    const now = performance.now()

    /* Návrat karty z pozadí (frameloop 'never' → 'always') dá jednorázovou deltu
       v řádu sekund. To není fps, to byl spánek — vzorek zahodit a chvíli počkat. */
    if (delta <= 0 || delta > 0.5) {
      holdUntil.current = Math.max(holdUntil.current, now + 1000)
      return
    }

    ema.current += (Math.min(120, 1 / delta) - ema.current) * 0.08
    sceneState.fps = Math.round(ema.current)

    // Warm-up po mountu: kompilace shaderů a parsování GLB dávají falešné propady.
    if (holdUntil.current === 0) holdUntil.current = now + 3000
    if (now < holdUntil.current) {
      badSince.current = 0
      return
    }

    if (ema.current < FPS_DOWN) {
      if (dpr > min + 0.01) {
        setDpr(Math.max(min, Math.round((dpr - DPR_STEP) * 20) / 20))
        holdUntil.current = now + 2000
      } else if (level !== 'low') {
        demote(level)
        holdUntil.current = now + 4000 // rekompilace shaderů — delší klid
      } else if (badSince.current === 0) {
        badSince.current = now
      } else if (ema.current < FPS_ABORT && now - badSince.current > 4000) {
        /* Nejnižší patro, minimální DPR, a pořád pod 20 fps: tenhle stroj na
           WebGL prostě nemá (typicky GPU, které proklouzlo detekcí). Krychle
           není podmínka — web bez ní je kompletní. Viz App.tsx / SceneBoundary. */
        demote('low')
      }
      return
    }

    badSince.current = 0
    if (ema.current > FPS_UP && dpr < cap - 0.01) {
      setDpr(Math.min(cap, Math.round((dpr + DPR_STEP) * 20) / 20))
      holdUntil.current = now + 1500
    }
  })

  return null
}

/**
 * ★ TONEMAPPING PODLE PATRA. Na 'low' není composer, takže <ToneMapping> efekt
 *   (AgX) nejede — a HDR emise (study 2–3.2×, hrany 1.6×) by bez mapování ořezaly
 *   do bílých fleků. Řešení: na 'low' mapuje AgX přímo renderer.
 *
 *   Na 'high'/'mid' MUSÍ zůstat NoToneMapping — composer si to stejně vynutí
 *   a mapuje až jako poslední efekt (viz Effects.tsx), jinak by se mapovalo dvakrát.
 *
 *   Po změně renderer.toneMapping vyžadují VŠECHNY materiály needsUpdate
 *   (tone mapping je zapečený v shaderu) — proto ten traverse.
 *
 *   Passive useEffect schválně: cleanup odmontovaného EffectComposeru si
 *   gl.toneMapping vrací na svou zapamatovanou hodnotu, a kdyby tohle byl
 *   layout effect, composer by nás při sestupu na 'low' přepsal ZPĚTNĚ.
 */
function ToneSync({ level }: { level: Level }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const want = level === 'low' ? AgXToneMapping : NoToneMapping
    if (gl.toneMapping === want) return
    gl.toneMapping = want
    scene.traverse((o) => {
      const m = (o as Mesh).material as Material | Material[] | undefined
      if (!m) return
      for (const mat of Array.isArray(m) ? m : [m]) mat.needsUpdate = true
    })
  }, [level, gl, scene])
  return null
}

/**
 * ★ ZTRÁTA WEBGL KONTEXTU — na mobilu se to DĚJE, není to teoretická situace.
 * Stačí přepnout na jinou appku, nechat telefon chvíli ležet nebo mít pod tlakem
 * paměť: OS GPU kontext prostě sebere. three sice zavolá preventDefault a kontext
 * se obnoví, jenže tím se obnoví jen RENDERER — ne to, co na něm viselo.
 * Refrakční FBO skla (drei useFBO) i cedule (CanvasTexture) po obnově ukazují
 * na mrtvé GPU objekty a krychle zůstane černá napořád.
 *
 * Jediná spolehlivá odpověď je postavit plátno znovu od nuly: `key` na <Canvas>.
 * Strop na dva pokusy — když kontext padá pořád dokola, zařízení na to prostě
 * nemá a další remount by byl jen blikající smyčka. Web funguje i bez krychle.
 */
const MAX_RESTORES = 2

export default function Scene({
  tier,
  dragRef,
  onFail,
}: {
  tier: Tier
  dragRef: React.RefObject<Group | null>
  onFail: () => void
}) {
  const [level, setLevel] = useState<Level>(() => (tier === 'off' ? 'low' : tier))
  const [min, max] = dprFor(level)
  /* Strop je i devicePixelRatio: na displeji s DPR 1 nemá smysl kreslit v 1.5×
     a zahazovat 125 % pixelů navíc — supersampling, o který nikdo nežádal. */
  const cap = Math.min(max, window.devicePixelRatio || 1)
  const floor = Math.min(min, cap)
  // Start v půlce rozsahu; governor si během pár vteřin došplhá na strop.
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, (min + max) / 2))
  const [visible, setVisible] = useState(true)
  const [generation, setGeneration] = useState(0)
  const restores = useRef(0)
  const wrap = useRef<HTMLDivElement>(null)

  /* Antialias jen tam, kde nepojede composer (ten má vlastní multisampling).
     Vyhodnocuje se JEDNOU při vzniku kontextu — pozdější sestup na 'low' už AA
     nedostane (kontext se kvůli tomu nepřestavuje; mírné zubatění je přijatelná
     cena za záchranu snímkové frekvence). */
  const [glProps] = useState(() => ({ ...GL, antialias: tier === 'low' }))

  sceneState.tier = level

  const demote = useCallback(
    (from: Level) => {
      if (from === 'low') {
        persistTierCap('off')
        onFail()
        return
      }
      const next: Level = from === 'high' ? 'mid' : 'low'
      persistTierCap(next)
      setDpr((d) => Math.min(d, dprFor(next)[1]))
      setLevel(next)
    },
    [onFail],
  )

  /* Největší reálná úspora baterie: když plátno není vidět (nebo je karta na
     pozadí), frameloop se úplně zastaví. */
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    const onVis = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > 0)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  /**
   * ★ ŠÍŘKU PLÁTNA SE NESMÍ NECHAT NA `width: 100%`.
   *
   * Fixní prvek se sází podle LAYOUTOVÉHO viewportu (window.innerWidth), který se
   * na mobilu liší od toho VIDITELNÉHO (documentElement.clientWidth). Naměřeno na
   * skutečných profilech: iPhone 15 → innerWidth 521 vs clientWidth 393,
   * Pixel 7 → 540 vs 412. Plátno pak bylo o třetinu širší než obrazovka, krychle
   * se vykreslovala do jeho středu — a na displeji tím pádem utekla doprava
   * a byla useknutá. (Přesně proto „na mobilu nebyla vidět".)
   *
   * ★★ VÝŠKU NAOPAK NESAHÁME. Tu vlastní CSS (--stage-h: 42svh, viz lib/stage.ts):
   *   svh se na rozdíl od clientHeight nemění při vysouvání mobilní URL lišty,
   *   takže se pás při rolování nedýchá a odsazení sekcí pod ním nikam neposkakuje.
   *   Kdyby si výšku počítalo CSS zvlášť a JS zvlášť, rozejdou se — a krychle
   *   vyleze textu do řádku přesně ve chvíli, kdy někdo scrolluje.
   *
   * R3F si velikost plátna bere z tohohle obalu, takže se tím zároveň mění poměr
   * stran, se kterým počítá odstup kamery v Rig.tsx.
   */
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => {
      el.style.width = `${document.documentElement.clientWidth}px`
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])

  const parallax = tier === 'high' && !window.matchMedia('(pointer: coarse)').matches

  return (
    // aria-hidden na OBALU, ne na <Canvas> — R3F negarantuje průchod propů
    // na podkladový <canvas> element. Plátno nesmí být ani tabovatelné.
    <div ref={wrap} className="canvas-layer" aria-hidden="true">
      <Canvas
        key={generation} // ★ viz MAX_RESTORES — obnova po ztrátě kontextu
        dpr={dpr}
        /* 'demand' by scénu zamrazil uprostřed dojezdu ve chvíli, kdy přestanou
           chodit scroll eventy — my všechno tlumíme, takže potřebujeme 'always'.
           Zato ho škrtíme viditelností. */
        frameloop={visible ? 'always' : 'never'}
        camera={CAMERA}
        gl={glProps}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          /* three si `webglcontextlost` odchytává samo (a volá preventDefault,
             bez kterého by prohlížeč kontext nikdy neobnovil), takže tady jen
             čekáme na obnovu a postavíme scénu znovu. */
          canvas.addEventListener(
            'webglcontextrestored',
            () => {
              if (restores.current >= MAX_RESTORES) return
              restores.current += 1
              setGeneration((g) => g + 1)
            },
            { once: true },
          )
        }}
      >
        <color attach="background" args={[VOID.r, VOID.g, VOID.b]} />

        <Governor level={level} min={floor} cap={cap} dpr={dpr} setDpr={setDpr} demote={demote} />
        <ToneSync level={level} />

        <LoadingBridge />

        {/* ★ CHOREO MUSÍ BÝT PRVNÍ A MIMO <Suspense>.
            Píše sceneState.aim/heat, ze kterých pak čte pět dalších useFrame smyček
            (Rig, Shell, Core, EdgeLattice, Effects). R3F je volá v pořadí připojení,
            takže kdyby Choreo viselo až za krychlí, četli by ostatní o snímek starší
            hodnotu. A mimo Suspense proto, aby dráha žila i ve chvíli, kdy se model
            ještě dopéká — kamera pak po doskočení preloaderu nikam neskáče. */}
        <Choreo />

        {/* ★ SVĚT, VŮČI KTERÉMU JE VIDĚT, ŽE SE KAMERA HÝBE.
            Obojí stojí MIMO <Suspense> a mimo krychli: nečeká to na model a hlavně
            to nesmí viset na `dragRef` — tažením myší se hýbe STROJ, ne svět.
            Kdyby se prach otočil s ním, přestal by být souřadnicovou soustavou
            a parallax by začal lhát. Viz Dust.tsx. */}
        <Dust tier={level} />
        <Deck tier={level} />

        <Suspense fallback={null}>
          <Lights />
          <Cube tier={level} dragRef={dragRef} />
          {/* ★ Preload UVNITŘ Suspense: bez něj se shadery kompilují až na PRVNÍM
              snímku po odchodu preloaderu → ~300ms zámrz přesně v okamžiku,
              před kterým měl preloader chránit. */}
          <Preload all />
        </Suspense>

        <Rig parallax={parallax} />
        {level !== 'low' && <Effects tier={level} />}
      </Canvas>
    </div>
  )
}
