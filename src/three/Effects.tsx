import { useMemo, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, BloomEffect, ToneMappingMode } from 'postprocessing'
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

  /**
   * ★ POTOMCI SE SKLÁDAJÍ DO POLE, NE PODMÍNKAMI V JSX.
   *   `EffectComposer` z @react-three/postprocessing má potomky typované jako
   *   `JSX.Element | JSX.Element[]`, takže `{podmínka && <X/>}` neprojde
   *   překladem — `false` není Element. Pole se `.filter(Boolean)` je jediný
   *   tvar, který zvládne volitelné efekty a zároveň zachová POŘADÍ, na kterém
   *   tady všechno stojí (tone mapping musí zůstat poslední).
   */
  const passes = [
    /* dispose={null}: pod StrictModem proběhne mount → unmount → mount, a R3F
       by nám efekt při tom falešném unmountu zlikvidoval. Instance žije po celou
       dobu běhu stránky, takže je to i tak správně. */
    <primitive key="bloom" object={bloom} dispose={null} />,

    /* ★★ SMAA NA 'mid' — TAM DNES NEBYLO ŽÁDNÉ AA VŮBEC.
       Plátno se vytváří s `antialias: false` (Scene.tsx) a composer měl na 'mid'
       `multisampling: 0`, takže střední patro bylo na hranách HORŠÍ než 'low',
       které MSAA na plátně dostane. A celá silueta téhle scény jsou 1px linky
       (hrany krychle, paluba, pulz) — tedy nejhorší možný případ pro chybějící AA.

       SMAA je post-process, tedy o řád levnější než MSAA 4 na celém bufferu,
       a navíc vyhladí i to, co přijde rozzubené z refrakčního bufferu skla —
       což MSAA neumí, protože ten buffer vzniká mimo composer.

       Na 'high' se nepřidává: tam už MSAA 4 na composeru je a dvojí AA je jen
       dvojí cena za měkčí obraz.

       ★ CSP: `postprocessing` má obě vyhledávací textury SMAA inlinované jako
       base64 v bundlu, takže to nestojí ani jeden request. `connect-src 'self'`
       ve vercel.json se tím nemusí sahat. */
    tier === 'mid' ? <SMAA key="smaa" /> : null,

    /* Vignette je Effect → smerguje se s ToneMappingem do jednoho passu, prakticky zdarma. */
    <Vignette key="vignette" offset={0.32} darkness={0.55} />,

    /* ★ Jemný šum PROTI PRUHOVÁNÍ, ne pro efekt. Scéna je téměř černá komora
       plná dlouhých měkkých spádů (viněta, halo, útlum prachu) a na 8bitovém
       výstupu se v nich tvoří viditelné pásy. Noise je `Effect`, takže se
       smerguje do téhož passu jako viněta a tonemap — nula průchodů navíc.
       Krytí 0.015: pod prahem vědomého vnímání, nad prahem banding. */
    <Noise key="noise" premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.015} />,

    /* MUSÍ BÝT POSLEDNÍ. Přesně jeden tonemap v celé pipeline. */
    <ToneMapping key="tonemap" mode={ToneMappingMode.AGX} />,
  ].filter(Boolean) as ReactElement[]

  return <EffectComposer multisampling={tier === 'high' ? 4 : 0}>{passes}</EffectComposer>
}
