import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { clampDelta } from '../lib/scene-state'
import type { Tier } from '../lib/quality'
import Shell from './Shell'
import Core from './Core'
import EdgeLattice from './EdgeLattice'
import FacePlates from './FacePlates'
import TracePulse from './TracePulse'

/**
 * ★ KRYCHLE SE NEOTÁČÍ. STOJÍ.
 *
 * Dřív se točila podle scrollu a kamera kolem ní jen mírně poposedávala. Teď je to
 * naopak: krychle je přibitý exponát v počátku a scroll posílá na oblet KAMERU
 * (viz three/Rig.tsx a ORBIT_* v lib/scene-state.ts).
 *
 * Rozdíl není kosmetický. Když se otáčí objekt, divák podvědomě ví, že sedí pořád
 * na místě a jen se vrtí — je to exponát na otočném talíři. Když ho obletí kamera,
 * dostane stroj STÁLÉ MÍSTO V PROSTORU a pohybuje se divák. Teprve tím vznikne
 * pocit, že je někde: nad strojem, za ním, pod ním.
 *
 * Zbývá tu proto jediný vlastní pohyb — vznášení. A to je schválně: úplně nehybný
 * objekt vypadá jako obrázek, ne jako stroj pod proudem.
 *
 * ★★ CO TU UŽ NENÍ: zákon dosednutí a výpočet `heat`. Přestěhovaly se do
 *   three/Choreo.tsx — jsou to vlastnosti DRÁHY, ne krychle, a kdyby je počítalo
 *   něco, co se ani nehýbe, nikdo by je tu příště nehledal.
 */

/** Fáze vznášení mezi snímky. Mimo komponentu — useFrame nesmí alokovat. */
const phase = { t: 0 }
export default function Cube({ tier, dragRef }: { tier: Tier; dragRef: React.RefObject<Group | null> }) {
  const float = useRef<Group>(null)

  /* Vznášení jede z VLASTNÍ fáze, ne z clock.elapsedTime. Hodiny běží i se
     zastaveným frameloopem, takže po návratu karty z pozadí by fáze skočila
     o celou dobu spánku a stroj by se přemístil až o půl amplitudy — cvaknutí
     přesně v okamžiku návratu (táž past jako drift kamery, viz Rig.tsx).
     Amplituda je v setinách jednotky: stroj dýchá, neplave. */
  useFrame((_, delta) => {
    if (!float.current) return
    float.current.position.y = Math.sin(phase.t * 0.45) * 0.045
    float.current.position.x = Math.cos(phase.t * 0.31) * 0.025
    phase.t += clampDelta(delta)
  })

  return (
    <group ref={float}>
      {/* dragRef = ADITIVNÍ offset z tažení myší (jen sekce 00, viz ui/GrabPlate).
          Jediné místo, kde se krychlí vůbec hne — a hne s ní uživatel, ne scroll.
          Po puštění se pružinou vrátí do nuly. */}
      <group ref={dragRef}>
        <Shell tier={tier} />
        {/* ★ EdgeLattice potřebuje `tier` kvůli tónovému mapování: na 'low' neběží
            composer, takže emise nad 1.0 se musí mapovat na rendereru, jinak se
            ořízne do bílé. Viz komentář v EdgeLattice.tsx. */}
        <EdgeLattice tier={tier} />
        <FacePlates tier={tier} />
        <TracePulse />
        {/* Jádro má vlastní pohyb a protiběh — proto vlastní komponenta. */}
        <Core tier={tier} />
      </group>
    </group>
  )
}
