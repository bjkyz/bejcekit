import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { Euler, MathUtils, Quaternion, Vector3 } from 'three'
import { FACE_CAM_QUATS } from '../lib/faces'
import { clampDelta, ORBIT_PAN, ORBIT_RADIUS, sceneState } from '../lib/scene-state'
import { SIDE_BY_SIDE } from '../lib/stage'

const LAST = FACE_CAM_QUATS.length - 1

/* Pracovní objekty mimo komponentu — useFrame běží 60×/s a nesmí alokovat. */
const orbit = new Quaternion() // čisté natočení na dráze (bez panorámy)
const pan = new Quaternion() // kompoziční panoráma v LOKÁLNÍM rámci kamery
const euler = new Euler(0, 0, 0, 'YXZ') // YXZ = nejdřív otoč, pak zvedni. Jako hlava.
const right = new Vector3()
const up = new Vector3()

const FOV = 35
const HALF_FOV = MathUtils.degToRad(FOV / 2)

/**
 * ★ KOLIK JEDNOTEK MUSÍ BÝT VIDĚT NA VÝŠKU. Tohle je celá kompozice ve dvou číslech.
 *
 * Krychle má hranu 3. Jenže 3 NENÍ to, co je z ní vidět: uprostřed přeletu se na ni
 * kamera dívá zešikma a její SILUETA se roztáhne na stěnovou úhlopříčku 3·√2 = 4.24.
 * (Tělesová úhlopříčka 3·√3 = 5.20 se neuplatní, na tu se kamera po naší dráze
 * nikdy nepodívá — každý krok je přesně 90° kolem světové osy, viz lib/faces.ts.)
 *
 * Stálo tu jediné číslo 4.3 — tedy PŘESNĚ ta úhlopříčka, nula rezervy.
 *
 * ★★ POZOR, JE TO PODLAHA, NE CÍL. Odstup se počítá jako max(ORBIT_RADIUS, needed),
 *   takže je to TVRDÝ SPODNÍ LIMIT. Když se nastaví moc vysoko, přebije VŠECHNY
 *   radiusy ze scene-state.ts a všech šest stanic dosedne na jedno a totéž číslo:
 *   nádech nad IDENT i nájezd na AI tiše zmizí a záběr zplihne do konstanty.
 *   Proto dvě hodnoty, ne jedna.
 */

/** ŠIROKO: jen pojistka pro úzká okna. 5.6 → podlaha 8.88, tedy POD nejmenším
    radiusem (9.6) — na běžném displeji tudíž nikdy nezabere a rozpětí stanic platí. */
const FIT_SPAN_WIDE = 5.6

/** JEVIŠTĚ: tady podlaha naopak vládne, protože pás je malý a krychle v něm musí mít
    vzduch nahoře (navigace) i dole (hrana jeviště). 7.4 → silueta zabere 57 % výšky
    pásu, kolem dokola zbývá ~30 px. Kompozici tu dělá pás, ne rozpětí radiusů. */
const FIT_SPAN_STAGED = 7.4

/**
 * ★ NAVIGACE STOJÍ V JEVIŠTI. Krychle se proto neusadí do jeho geometrického středu,
 *   ale do středu toho, co z něj po navigaci ZBYDE.
 *
 * Lišta má 24 px odsazení + 44px dotykový cíl + 24 px = ~92 px a leží NAD plátnem
 * (--z-hud > --z-stage). Bez téhle korekce si sedne krychli přesně na temeno: horní
 * rohové study mizí za „bejcek.it" a objekt vypadá useknutý shora.
 * Posun dolů = půlka té výšky, protože se tím střed volné plochy trefí přesně.
 */
const STAGE_NAV_PX = 92

/** Parallax: posun kamery do strany. Dost na hloubku, málo na nevolnost. */
const PARALLAX = 0.12

/**
 * ★ KLIDOVÝ DRIFT — SCÉNA NIKDY NESMÍ BÝT MRTVÝ OBRÁZEK.
 *
 * Když se přestane scrollovat, `aim` dosedne na celou stěnu a kamera se zastaví.
 * Na desktopu ji drží při životě parallax myši. Na TELEFONU ale myš není — a scéna
 * tam tím pádem ZTUHLA do statického renderu. Přesně to je ten pocit „na mobilu se
 * nic neděje": ne že by tam krychle nebyla, ona se jen vůbec nehýbe.
 *
 * Drift je pomalý Lissajous kolem stanice: kamera se sama sune po malé smyčce.
 * A protože se doopravdy POSOUVÁ (ne jen natáčí), rozjede se paralaxa mezi hranami,
 * jádrem a sklem — stroj má hloubku i vteřinu poté, co uživatel pustil prst.
 *
 * ★★ Periody jsou NESOUDĚLNÉ (0.053 a 0.083 Hz). Kdyby byly v celočíselném poměru,
 *   smyčka by se uzavřela a oko by po pár vteřinách chytlo opakování — a nic
 *   nevypadá tak mrtvě jako pohyb, o kterém víš, co udělá dál.
 */
const DRIFT_TOUCH = 0.09 // na dotyku nese drift veškerý život scény
const DRIFT_MOUSE = 0.04 // na myši jen podbarvuje parallax, ať se nepere s rukou

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * ★ KAMERA OBÍHÁ KRYCHLI. Krychle se neotáčí — viz ORBIT_* v lib/scene-state.ts
 *   a FACE_CAM_QUATS v lib/faces.ts, kde je odvození i důvody.
 *
 * ★★ POZICE I NATOČENÍ SE POČÍTAJÍ Z JEDNOHO KVATERNIONU, a proto se NIKDY
 *   nemůžou rozejít. Kdyby se tlumily zvlášť (damp3 na pozici, dampQ na natočení),
 *   dorazila by každá v jiný snímek: kamera by na okamžik stála nad jednou stěnou
 *   a koukala na jinou, krychle by při každém přeletu uplavala ze středu záběru.
 *   Tlumí se proto JEDINÁ veličina — poloha na dráze (`aim`, viz Choreo.tsx) —
 *   a z té se obojí odvodí. Jeden zdroj pravdy, žádné dohánění.
 *
 * ★★★ NIKDE SE NEVOLÁ lookAt(). Nad horní a pod dolní stěnou je degenerované
 *   (směr pohledu rovnoběžný s `up`) a obraz by tam škubl. Viz FACE_CAM_QUATS.
 */
export default function Rig({ parallax }: { parallax: boolean }) {
  const mouse = useRef({ x: 0, y: 0 })
  const size = useThree((s) => s.size)

  useFrame((state, delta) => {
    const dt = clampDelta(delta)
    const cam = state.camera
    const time = state.clock.elapsedTime

    /* ── 1. KDE NA DRÁZE JSME ──────────────────────────────── */
    const a = MathUtils.clamp(sceneState.aim, 0, LAST)
    const i = MathUtils.clamp(Math.floor(a), 0, LAST - 1)
    const t = smoothstep(MathUtils.clamp(a - i, 0, 1))

    // Slerp = oblet po nejkratším oblouku. Každý krok je přesně 90° (viz faces.ts).
    orbit.slerpQuaternions(FACE_CAM_QUATS[i], FACE_CAM_QUATS[i + 1], t)

    /* ── 2. JAK DALEKO ─────────────────────────────────────── */
    let r = MathUtils.lerp(ORBIT_RADIUS[i], ORBIT_RADIUS[i + 1], t)

    /* ★ ODSTUP PODLE POMĚRU STRAN. FOV 35° je VERTIKÁLNÍ, takže na úzkém plátně
       je vodorovné zorné pole užší než svislé a krychle by se po stranách UŘÍZLA.
       Vzdálenost se proto dopočítává z poměru stran, nikdy z konstanty.

       Na mobilu je plátno JEVIŠTĚ (horní pás, viz lib/stage.ts), takže sem chodí
       poměr toho PÁSU (~390×354, tedy 1.10) — ne poměr celého telefonu (0.46).
       To je mimochodem druhá polovina opravy mobilu: při poměru 0.46 musela kamera
       couvat až na r ≈ 14, aby se krychle vešla na šířku, a stroj se scvrkl.
       V pásu se vejde při r ≈ 11.7 a zůstane velký a čitelný i na 390px displeji. */
    const staged = sceneState.staged
    const aspect = size.width / Math.max(1, size.height)
    const span = staged ? FIT_SPAN_STAGED : FIT_SPAN_WIDE
    const needed = span / (2 * Math.tan(HALF_FOV) * Math.min(aspect, 1))
    if (r < needed) r = needed

    // Kamera sedí PŘESNĚ na normále stěny, ve vzdálenosti r. Bez alokace.
    cam.position.set(0, 0, r).applyQuaternion(orbit)

    /* ── 3. KOMPOZICE: uhni krychlí textu ──────────────────── */
    /* Panoráma platí jen tam, kde text stojí VEDLE krychle. V režimu jeviště má text
       plnou šířku a sedí POD plátnem — uhýbat do strany před textem, který žádnou
       stranu nemá, by krychli jen bezdůvodně vystrčilo z osy jeviště. */
    const wide = size.width > SIDE_BY_SIDE
    const p0 = ORBIT_PAN[i]
    const p1 = ORBIT_PAN[i + 1]

    let yaw = wide ? MathUtils.lerp(p0.yaw, p1.yaw, t) : 0
    let pitch = wide ? MathUtils.lerp(p0.pitch, p1.pitch, t) : 0
    const roll = wide ? MathUtils.lerp(p0.roll, p1.roll, t) : 0

    /* Uhnout navigaci, která stojí v horním pruhu jeviště (viz STAGE_NAV_PX).
       Úhel se počítá ze VZDÁLENOSTI, ne z konstanty — posun na obrazovce tak zůstane
       stejný, ať je kamera jakkoli daleko a ať má telefon jakoukoli výšku. */
    if (staged) {
      const unitsPerPx = (2 * Math.tan(HALF_FOV) * r) / size.height
      pitch += Math.atan2((STAGE_NAV_PX / 2) * unitsPerPx, r)
    }

    /* ── 4. POSUN KAMERY: parallax myši + klidový drift ────── */
    /* ★ SKUTEČNÝ PARALLAX = POSUN KAMERY, ne jen natočení. Kdyby se kamera jen
       natočila, posunul by se obraz jako celek a žádná hloubka nevznikne. Teprve
       když se kamera opravdu POSUNE do strany, začnou se bližší a vzdálenější části
       stroje vůči sobě míjet — a přesně kvůli tomu tu parallax je.

       Drift i parallax se proto skládají do JEDNOHO posunu a aplikují se jednou.
       Kdyby každý řešil svoje natočení zvlášť, korekce záběru níž by se počítala
       ze špatného čísla a krychle by uplavala ze středu. */
    /* Za přeletu drift ustoupí režii: kamera zrovna letí po dráze, o život scény
       je postaráno a dvě vrstvy pohybu přes sebe by se jen praly. Nejsilnější je
       tam, kde je nejvíc potřeba — v klidu nad stěnou. */
    const gain = (parallax ? DRIFT_MOUSE : DRIFT_TOUCH) * (0.35 + 0.65 * (1 - sceneState.heat))
    let offX = Math.sin(time * 0.29) * gain // perioda 21.7 s
    let offY = Math.cos(time * 0.43) * gain * 0.62 // perioda 14.6 s — nesoudělná s tou nad ní

    if (parallax) {
      easing.damp(mouse.current, 'x', state.pointer.x * PARALLAX, 0.35, dt)
      easing.damp(mouse.current, 'y', state.pointer.y * PARALLAX, 0.35, dt)
      offX += mouse.current.x
      offY += mouse.current.y
    }

    /* Posouvá se v LOKÁLNÍM rámci kamery (její vlastní doprava/nahoru), aby to
       fungovalo stejně nad horní stěnou jako pod tou dolní. */
    right.set(1, 0, 0).applyQuaternion(orbit)
    up.set(0, 1, 0).applyQuaternion(orbit)
    cam.position.addScaledVector(right, offX)
    cam.position.addScaledVector(up, offY)

    /* …a dorovnat záběr zpátky na krychli. Bez tohohle by posun kamery vysunul
       krychli ze středu a parallax by se choval jako rozházená kompozice.
       Posun doprava → krychle uteče doleva → dorovná se kladným yaw. */
    yaw += Math.atan2(offX, r)
    pitch -= Math.atan2(offY, r)

    /* ── 5. SLOŽIT ─────────────────────────────────────────── */
    /* Panoráma se PŘINÁSOBÍ ZPRAVA, tedy v lokálním rámci kamery: „otoč se o pár
       stupňů stranou od toho, kam koukáš". Kdyby se násobila zleva, otáčela by se
       kolem SVĚTOVÝCH os a nad horní stěnou by se z yaw stal roll. */
    euler.set(pitch, yaw, roll)
    pan.setFromEuler(euler)
    cam.quaternion.copy(orbit).multiply(pan)
  })

  return null
}
