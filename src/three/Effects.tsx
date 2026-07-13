import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BloomEffect, ToneMappingMode } from 'postprocessing'
import { easing } from 'maath'
import { clampDelta, sceneState } from '../lib/scene-state'
import type { Tier } from '../lib/quality'

/**
 * ★ POZOR NA TÓNOVÉ MAPOVÁNÍ. EffectComposer si po celou dobu své existence
 *   nastaví gl.toneMapping = NoToneMapping (three aplikuje inline tone mapping
 *   jen při renderu na obrazovku, ne do render targetu). Důsledky:
 *     a) <Canvas gl={{ toneMapping: ACESFilmic }}> je TIŠE IGNOROVÁNO,
 *     b) material.toneMapped={false} se uvnitř postprocessingu stane no-opem.
 *   Když scéna po přidání Bloomu vypadá vypráskaně dobíla, tohle je proč.
 *   Řešení: Canvas dostane NoToneMapping a <ToneMapping> je POSLEDNÍ efekt.
 *
 * AgX místo ACESFilmic: ACES křiví sytost a žene světla do bílé. AgX drží odstín
 * i na přepálené emisi — přesně to, co potřebujeme při zážehu jádra.
 *
 * ★★ PROČ SI BLOOM VYRÁBÍME RUČNĚ A NE <Bloom ref={...} />:
 *    r3f-postprocessing dělá uvnitř wrapEffect `useMemo(..., [JSON.stringify(props)])`.
 *    V Reactu 19 je `ref` NORMÁLNÍ PROP → skončí v těch props. R3F na něj pověsí
 *    instanci, která nese svůj interní `__r3f` stav (parent ⇄ children), takže
 *    JSON.stringify narazí na kruhovou referenci, VYHODÍ VÝJIMKU a celé plátno
 *    se vůbec nenamountuje. Tichá past — typecheck ani build ji nevidí.
 *    Vlastní instance + <primitive> ten problém obchází a dá nám přímý zápis.
 */
export default function Effects({ tier }: { tier: Tier }) {
  const bloom = useMemo(
    () =>
      new BloomEffect({
        mipmapBlur: true, // moderní dual-filter řetěz; bez něj je to laciný gauss
        intensity: 0.55,
        luminanceThreshold: 0.92, // selektivní bloom bez <SelectiveBloom>: zazáří jen to,
        luminanceSmoothing: 0.25, // co má emisi > 1 (jádro trysky, hrany, study)
        radius: 0.7,
      }),
    [],
  )

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const h = sceneState.heat
    const i = sceneState.faceIndex

    // AI (03) svítí i v klidu — nejsvětlejší snímek webu padne na nejdražší službu.
    const idle = i === 3 ? 0.75 : 0.55
    easing.damp(bloom, 'intensity', idle + h * 0.4, 0.25, dt)
    easing.damp(bloom.luminanceMaterial, 'threshold', 0.92 - h * 0.1, 0.25, dt)
  })

  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
      {/* dispose={null}: pod StrictModem proběhne mount → unmount → mount, a R3F
          by nám efekt při tom falešném unmountu zlikvidoval. Instance žije po celou
          dobu běhu stránky, takže je to i tak správně. */}
      <primitive object={bloom} dispose={null} />
      {/* Vignette je Effect → smerguje se s ToneMappingem do jednoho passu, prakticky zdarma. */}
      <Vignette offset={0.32} darkness={0.55} />
      {/* MUSÍ BÝT POSLEDNÍ. Přesně jeden tonemap v celé pipeline. */}
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  )
}
