import { useLayoutEffect, useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three'
import type { Tier } from '../lib/quality'

/**
 * ★ PALUBA — VODOROVNÁ ROVINA POD STROJEM. Jediná věc na webu, která říká, KDE NAHOŘE.
 *
 * ═══════════ PROBLÉM, KTERÝ ŘEŠÍ ═══════════
 *
 * Dráha kamery má šest stanic a dvě z nich jsou PÓLY: 02 INFRA (kamera je NAD strojem
 * a dívá se dolů) a 05 KONTAKT (kamera je POD ním a dívá se nahoru). Tohle jsou
 * dramaticky nejsilnější dva záběry celé choreografie.
 *
 * Jenže bez vodorovné roviny vypadají ÚPLNĚ STEJNĚ. Krychle je symetrická, prach je
 * izotropní (rozprostřený do všech směrů stejně) — takže „shora" a „zdola" dávají
 * doslova týž obrázek. Třetina webu tím tiše přišla o svůj smysl a nikdo by nepoznal
 * proč: obrazu nic nechybí, jen nic neříká.
 *
 * Paluba tu symetrii rozbije, protože rozbít ji umí jedině něco, co má SAMO nahoře
 * a dole. A pak se stanice čtou samy:
 *
 *     02 INFRA    paluba je hluboko pod strojem, soustředné kruhy kolem něj
 *                 → „dívám se do stroje shora"
 *     05 KONTAKT  paluba je MEZI okem a strojem, kouká se skrz mříž vzhůru
 *                 → „stroj se nade mnou tyčí"    ← jediný takový okamžik na webu
 *     rovník      paluba ubíhá do dálky ve spodní části záběru
 *                 → „stojím na podlaze komory"
 *
 * ★★ TICHÁ, NE OZDOBNÁ. Barva --neon-4 (#06414a) je nejtmavší člen palety a krytí
 *   sahá nanejvýš na 0.16 u středu. Je hluboko pod prahem bloomu (0.92), takže nikdy
 *   nezazáří a nikdy nekřičí. Má se přečíst periferně — jako podlaha, ne jako grafika.
 *   Kdyby byla vidět „na první pohled", je moc silná: podlaha, které si všimneš,
 *   je špatná podlaha.
 *
 * ★★★ depthWrite: false — paluba nesmí NIC zakrýt. Na stanici 05 leží mezi kamerou
 *   a strojem a kdyby zapisovala hloubku, uřízla by z něj kus.
 */

/** 1.9 jednotky pod spodní stěnou krychle (ta sahá k y = −1.5). Dost na to, aby
    byla čitelně „pod", ne tak hluboko, aby v záběru zmizela. */
const Y = -3.4

const R_IN = 1.6
const R_OUT = 9

/** Krytí u středu. Světlo stroje se rozlévá po podlaze a k okrajům mizí do tmy. */
const A_MAX = 0.16

const RINGS = [2.2, 4.0, 5.8, 7.6]
const RING_SEG = 96
/** Na 'low' tieru méně paprsků — pořád je to podlaha, jen řidší. */
const SPOKES: Record<Tier, number> = { high: 24, mid: 24, low: 16, off: 0 }
/** Paprsek se dělí na dílky, aby po něm mohlo krytí plynule vyhasnout. */
const SPOKE_SEG = 8

const HUE = new Color('#06414a')

/** Krytí klesá lineárně od středu k okraji. Žádný shader — je to ve vrcholových barvách. */
const fade = (r: number) => A_MAX * Math.max(0, 1 - (r - R_IN) / (R_OUT - R_IN))

function build(spokes: number): BufferGeometry {
  const pos: number[] = []
  const col: number[] = []

  /* lineSegments = PÁRY vrcholů. (Spojitá lomená čára by chtěla <line>, a ten se
     v JSX pere se SVG <line>. Stejná past je popsaná v TracePulse.tsx.) */
  const push = (x: number, z: number, r: number) => {
    pos.push(x, Y, z)
    const a = fade(r)
    col.push(HUE.r * a, HUE.g * a, HUE.b * a)
  }

  // Soustředné kruhy — ty nesou „shora" (kolem stroje) i „zdola" (skrz ně vzhůru).
  for (const r of RINGS) {
    for (let k = 0; k < RING_SEG; k++) {
      const a0 = (k / RING_SEG) * Math.PI * 2
      const a1 = ((k + 1) / RING_SEG) * Math.PI * 2
      push(Math.cos(a0) * r, Math.sin(a0) * r, r)
      push(Math.cos(a1) * r, Math.sin(a1) * r, r)
    }
  }

  // Paprsky — ty nesou ubíhající perspektivu na rovníkových stanicích.
  for (let j = 0; j < spokes; j++) {
    const th = (j / spokes) * Math.PI * 2
    const cx = Math.cos(th)
    const cz = Math.sin(th)
    for (let k = 0; k < SPOKE_SEG; k++) {
      const r0 = R_IN + ((R_OUT - R_IN) * k) / SPOKE_SEG
      const r1 = R_IN + ((R_OUT - R_IN) * (k + 1)) / SPOKE_SEG
      push(cx * r0, cz * r0, r0)
      push(cx * r1, cz * r1, r1)
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3))
  return g
}

export default function Deck({ tier }: { tier: Tier }) {
  const geo = useMemo(() => build(SPOKES[tier]), [tier])
  useLayoutEffect(() => () => geo.dispose(), [geo])

  return (
    <lineSegments geometry={geo} renderOrder={-1} frustumCulled={false}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={1} /* útlum je ve vrcholových barvách, ne tady */
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  )
}
