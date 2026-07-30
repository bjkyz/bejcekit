import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { easing } from 'maath'
import type { PointLight } from 'three'
import { clampDelta, sceneState } from '../lib/scene-state'
import { AMBI, CYAN, RIM } from './palette'

/**
 * ★ ŽÁDNÝ <Environment preset="city">. Preset si za běhu stahuje HDR z pmndrs CDN
 *   — a MeshTransmissionMaterial je BEZ envMapy vizuálně mrtvý, takže by ten fetch
 *   seděl přesně na kritické cestě toho, aby sklo vypadalo jako sklo: skořápka by
 *   ~300 ms po zvednutí opony přeskočila ze šedého plastu na sklo. Přesně ten snímek,
 *   kvůli kterému preloader existuje.
 *
 *   Tři Lightformery místo toho: nula requestů, `frames={1}` → vyrenderuje se JEDNOU.
 *
 * Žádné shadow mapy nikde. MTM zapisuje hloubku a je neprůhledný → castShadow
 * by pod „sklem" udělal plný černý čtverec.
 */
export default function Lights() {
  const rim = useRef<PointLight>(null)

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    // INFRA (02) je chladnější a kliničtější — barva datacentra.
    const want = sceneState.faceIndex === 2 ? 9 : 5
    if (rim.current) easing.damp(rim.current, 'intensity', want, 0.5, dt)
  })

  /* Celé osvětlení je ZÁMĚRNĚ slabé. Scéna má být tmavá komora, ve které
     svítí jediná věc — jádro. Každé světlo navíc sebere bloomu kontrast
     a text nad plátnem přestane být čitelný. */
  return (
    <>
      <ambientLight color={AMBI} intensity={0.8} />

      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.8} color="#bfe9f2" position={[0, 4, 3]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#4fd8e8" position={[-5, 0, 2]} scale={[4, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#52aeff" position={[5, -1, -3]} scale={[5, 5, 1]} />
        {/* ★ ČTVRTÝ, ÚZKÝ A OSTRÝ — a stojí schválně MIMO OSY stěn (4.5, 3.5, −4.5).
            Odlesk na skle je funkcí ODRAZU vektoru pohledu, takže se při obletu sune
            po skořápce ZHRUBA DVOJNÁSOBNOU rychlostí než kamera. Je to tedy druhá věc
            (po prachu), na které je pohyb kamery vidět — a tady přímo na povrchu stroje.
            Kdyby seděl na ose některé stěny, na té stanici by ztuhl přesně uprostřed
            a vypadal by jako vada v materiálu.
            frames={1} → prostředí se peče JEDNOU. Za snímek to tedy nestojí nic. */}
        <Lightformer form="rect" intensity={1.4} color="#b8f5ff" position={[4.5, 3.5, -4.5]} scale={[3, 3, 1]} />
      </Environment>

      <pointLight ref={rim} color={RIM} intensity={5} position={[-4, 2.5, 3]} distance={16} decay={2} />
      <pointLight color={CYAN} intensity={3} position={[4, -2, 2]} distance={14} decay={2} />
    </>
  )
}
