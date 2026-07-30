import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, type Points } from 'three'
import type { Tier } from '../lib/quality'

/**
 * ★ PRACHOVÉ POLE — TA JEDINÁ VĚC, KVŮLI KTERÉ JE OBLET VŮBEC VIDĚT.
 *
 * ═══════════ PROČ TO TU DŘÍV NEBYLO VIDĚT ═══════════
 *
 * Scéna měla JEDINÝ objekt a ten seděl PŘESNĚ V PIVOTU otáčení. Kamera kolem něj
 * obíhala po dokonalé kouli — jenže krychle je invariantní vůči celé oktaedrické
 * grupě, takže po 90° kroku vypadá skoro stejně. Geometricky se dělo hodně,
 * OPTICKY NIC: ve výsledném obrázku se nehnulo skoro nic, o co by oko mohlo pohyb
 * zaklesnout.
 *
 * Není to problém krychle. Je to problém PRÁZDNÉHO SVĚTA. Pohyb se nedá vidět sám
 * o sobě — vždycky jen VŮČI NĚČEMU. A vůči čemu, když je scéna jinak prázdná?
 *
 * Prach je ta odpověď: řídká kulová slupka bodů, které stojí ve SVĚTĚ. Jakmile se
 * kamera pohne, začnou se blízké body míjet s dalekými (parallax) a celé pole se
 * sveze do strany (rotace). Tím se pohyb kamery zhmotní. Krychle sama nemusí dělat
 * vůbec nic.
 *
 * ★★ PRACH SE NESMÍ HÝBAT. NIKDY. Ani rotace, ani drift, ani mihotání.
 *
 *   Je to lákavé („ať to trochu žije") a je to ta nejhorší věc, kterou tu jde udělat.
 *   Prach NENÍ dekorace — prach JE SOUŘADNICOVÁ SOUSTAVA. Je to jediný pevný bod,
 *   vůči kterému divák vidí, že se pohybuje ON. Ve chvíli, kdy se rozhýbe, začne
 *   parallax lhát: obraz se pořád mění, ale nedá se z něj přečíst, kdo se hýbe.
 *   A přesně tím se rozpadne celá teze webu — „krychle stojí, obíhá ji kamera".
 *
 *   SVĚT STOJÍ. HÝBE SE KAMERA. Odsud nikam.
 *
 * ★★★ POD PRAHEM BLOOMU, SCHVÁLNĚ. Jas 0.5 při barvě #6fb9c9 je pod
 *   luminanceThreshold 0.92 (viz Effects.tsx), takže prach do bloomu VŮBEC nevstoupí.
 *   Kdyby vstoupil, roztekl by se do mléčného oparu přes celé plátno — tedy do přesně
 *   té šedé kaše, kvůli které se tenhle web předělával. Nikdy sem nedávej #b8f5ff.
 *
 * Zadarmo k tomu: prach se vykreslí i do refrakčního bufferu skla, takže skrz krychli
 * prosvítá lomený. Nejlepší hloubkový vjem na webu za nula řádků kódu navíc.
 */

/** Řídké pole je souřadnicová soustava. Husté je „další WebGL web s částicemi". */
const COUNT: Record<Tier, number> = { high: 320, mid: 180, low: 100, off: 0 }

/** Slupka kolem scény. Vnitřní poloměr je ZA krychlí (silueta sahá 2.6), vnější
    v dálce, aby bylo co míjet. Kamera obíhá na r ≈ 10–12, tedy uvnitř slupky. */
const R_MIN = 6
const R_MAX = 26

/**
 * ★ DETERMINISTICKÝ GENERÁTOR, ne Math.random(). Prach se sype jednou při mountu,
 *   ale scéna se umí postavit ZNOVU (ztráta WebGL kontextu → nový `key` na Canvas,
 *   viz MAX_RESTORES ve Scene.tsx). S Math.random() by se po obnově vysypalo úplně
 *   jiné pole a hvězdy by za běhu přeskočily. Se seedem je obraz vždycky týž.
 */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function build(n: number): BufferAttribute {
  const rand = rng(0x5eed)
  const pos = new Float32Array(n * 3)

  for (let i = 0; i < n; i++) {
    /* ★ SMĚR PŘES MARSAGLIU, ne přes náhodné úhly. Kdyby se braly theta a phi
       rovnoměrně, body by se nahustily kolem PÓLŮ — a protože kamera přesně nad pól
       (stěna +Y, INFRA) a pod pól (−Y, KONTAKT) doletí, byla by ta chyba vidět jako
       chuchvalec hvězd na dvou z šesti stanic. */
    const u = rand() * 2 - 1
    const th = rand() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)

    /* ★ TŘETÍ ODMOCNINA. Objem slupky roste s r³, takže rovnoměrné r by nasypalo
       neúměrně moc bodů dovnitř, k pozorovateli. cbrt to rozprostře OBJEMOVĚ
       rovnoměrně: pole vypadá stejně husté zblízka i do dálky. */
    const r = Math.cbrt(rand()) * (R_MAX - R_MIN) + R_MIN

    pos[i * 3] = r * s * Math.cos(th)
    pos[i * 3 + 1] = r * s * Math.sin(th)
    pos[i * 3 + 2] = r * u
  }

  return new BufferAttribute(pos, 3)
}

export default function Dust({ tier }: { tier: Tier }) {
  const ref = useRef<Points>(null)

  const geo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', build(COUNT[tier]))
    return g
  }, [tier])

  // Co jsme si sami `new`-li, sami uklidíme.
  useLayoutEffect(() => () => geo.dispose(), [geo])

  return (
    // renderOrder −1: prach jde ven jako první, aby ho krychle mohla normálně zakrýt.
    // Bez toho by na 'low' tieru (kde je skořápka průhledná a NEZAPISUJE hloubku)
    // aditivní body prosvítaly skrz stroj dopředu a vypadalo by to jako chyba.
    <points ref={ref} geometry={geo} renderOrder={-1} frustumCulled={false}>
      <pointsMaterial
        size={0.03}
        sizeAttenuation
        color="#6fb9c9"
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
