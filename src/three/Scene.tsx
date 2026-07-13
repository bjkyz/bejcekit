import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Preload, useProgress } from '@react-three/drei'
import { Group, NoToneMapping } from 'three'
import { dprFor, type Tier } from '../lib/quality'
import { sceneState } from '../lib/scene-state'
import { VOID } from './palette'
import { setLoading } from '../lib/loading'
import Cube from './Cube'
import Lights from './Lights'
import Rig from './Rig'
import Effects from './Effects'

/**
 * ★ MODULOVÉ KONSTANTY, NE OBJEKTOVÉ LITERÁLY V JSX.
 *
 * Kdyby se `camera` a `gl` psaly inline (`camera={{ ... }}`), vznikl by při KAŽDÉM
 * renderu Scene nový objekt. R3F pak vidí změněný prop a znovu na kameru aplikuje
 * její výchozí hodnoty — VČETNĚ POZICE. A protože <PerformanceMonitor> volá
 * onChange (→ setDpr) několikrát za vteřinu, Scene se překresluje pořád, kamera se
 * pořád resetuje na [0,0,6.4] a damp3 v Rigu s ní jen věčně přetahuje lano.
 * Kamera se pak nikdy nedostane na svou klíčovou pozici a celá choreografie
 * (stoupání nad INFRA, nájezd na AI, dojezd na KONTAKT) je tiše mrtvá.
 * Stabilní identita propu to řeší.
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

export default function Scene({ tier, dragRef }: { tier: Tier; dragRef: React.RefObject<Group | null> }) {
  const [min, max] = dprFor(tier)
  const [dpr, setDpr] = useState(max)
  const [visible, setVisible] = useState(true)
  const wrap = useRef<HTMLDivElement>(null)

  sceneState.tier = tier

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
   * ★ ROZMĚR PLÁTNA SE NESMÍ NECHAT NA `position: fixed; inset: 0`.
   *
   * Fixní prvek se sází podle LAYOUTOVÉHO viewportu (window.innerWidth), který se
   * na mobilu liší od toho VIDITELNÉHO (documentElement.clientWidth). Naměřeno na
   * skutečných profilech: iPhone 15 → innerWidth 521 vs clientWidth 393,
   * Pixel 7 → 540 vs 412. Plátno pak bylo o třetinu širší než obrazovka, krychle
   * se vykreslovala do jeho středu — a na displeji tím pádem utekla doprava
   * a byla useknutá. (Přesně proto „na mobilu nebyla vidět".)
   *
   * clientWidth/clientHeight je jediná hodnota, která odpovídá tomu, co uživatel
   * doopravdy vidí. R3F pak plátno nasadí na tenhle obal.
   */
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const fit = () => {
      const de = document.documentElement
      el.style.width = `${de.clientWidth}px`
      el.style.height = `${de.clientHeight}px`
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
        dpr={dpr}
        /* 'demand' by scénu zamrazil uprostřed dojezdu ve chvíli, kdy přestanou
           chodit scroll eventy — my všechno tlumíme, takže potřebujeme 'always'.
           Zato ho škrtíme viditelností. */
        frameloop={visible ? 'always' : 'never'}
        camera={CAMERA}
        gl={GL}
      >
        <color attach="background" args={[VOID.r, VOID.g, VOID.b]} />

        <PerformanceMonitor
          bounds={() => [45, 60]}
          flipflops={3}
          onChange={({ fps, factor }) => {
            sceneState.fps = Math.round(fps) // mutace, ne state → žádný re-render
            // Kvantizace + bail-out: onChange chodí několikrát za vteřinu a syrová
            // float hodnota by pokaždé vyvolala re-render celé Scene.
            const next = Math.round((min + (max - min) * factor) * 20) / 20
            setDpr((cur) => (Math.abs(cur - next) < 0.05 ? cur : next))
          }}
          onFallback={() => setDpr(min)}
        />

        <LoadingBridge />

        <Suspense fallback={null}>
          <Lights />
          <Cube tier={tier} dragRef={dragRef} />
          {/* ★ Preload UVNITŘ Suspense: bez něj se shadery kompilují až na PRVNÍM
              snímku po odchodu preloaderu → ~300ms zámrz přesně v okamžiku,
              před kterým měl preloader chránit. */}
          <Preload all />
        </Suspense>

        <Rig parallax={parallax} />
        {tier !== 'low' && <Effects tier={tier} />}
      </Canvas>
    </div>
  )
}
