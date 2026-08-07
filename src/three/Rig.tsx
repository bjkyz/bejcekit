import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { Euler, MathUtils, Quaternion, Vector3 } from 'three'
import { FACE_CAM_QUATS, SEGMENT_AXIS } from '../lib/faces'
import { clampDelta, ORBIT_PAN, ORBIT_RADIUS, sceneState, smootherstep } from '../lib/scene-state'
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

/**
 * ★ ÚZKO: KRYCHLE JE POZADÍ, NE EXPONÁT — A TO MĚNÍ CELÝ VÝPOČET ODSTUPU.
 *
 * Vzorec výš („vejdi se na výšku i na šířku") je pro objekt, kolem kterého má být
 * vzduch. Na telefonu je poměr stran 0.46, takže „vejít se na šířku" znamená
 * odstup r ≈ 19 — krychle by se scvrkla na placku uprostřed obrazovky a vypadala
 * by jako vzdálený náhled, ne jako stroj, přes který se píše text.
 *
 * Na úzkém displeji se proto neptáme, jak daleko couvnout, aby se objekt vešel,
 * ale JAKOU ČÁST ŠÍŘKY MÁ ZABRAT. Odtud se odstup dopočítá zpátky:
 *
 *     viditelná šířka = 2·tan(fov/2)·r·poměr stran
 *     r = (hrana / podíl) / (2·tan(fov/2)·poměr stran)
 *
 * 0.82 = stěna krychle zabere 82 % šířky displeje. Uprostřed přeletu se silueta
 * roztáhne na stěnovou úhlopříčku (×√2), takže tam krychle okraje mírně přeteče —
 * a to je záměr: pozadí se ořezávat SMÍ, dokonce má. Právě přetečení dělá rozdíl
 * mezi „obrázkem na stránce" a „prostorem, ve kterém stránka stojí".
 */
const NARROW_WIDTH_FRACTION = 0.82

/** Hrana krychle ve světových jednotkách. Viz three/Cube.tsx. */
const CUBE_EDGE = 3

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

/**
 * ★ TŘETÍ OSA KLIDOVÉHO DRIFTU: PŘIBLÍŽENÍ A ODDÁLENÍ.
 *
 * Lissajous výš sune kameru do stran a nahoru dolů — tedy KOLMO na pohled. Takový
 * pohyb se na ploché obrazovce projeví hlavně posunem obrazu; hloubka z něj vzniká
 * jen díky parallaxe mezi prachem a strojem. Chybí ta jediná osa, na které se mění
 * VELIKOST siluety, a právě ta se čte jako prostor: stroj se nadechne a vydechne.
 *
 * Osm promile poloměru je na první pohled neviditelné číslo a je to schválně —
 * má se to poznat až po pár vteřinách dívání, jako že obraz „žije". Cokoli většího
 * začne v periferním vidění pumpovat a z klidné komory je akvárium.
 */
const BREATH_IDLE = 0.008

/**
 * ★ NÁDECH V PŮLCE PŘELETU. Kamera během otáčky couvne o 5,5 % a zase se vrátí.
 *
 * Dělá to najednou tři věci, a proto to má tak dobrý poměr cena/výkon:
 *   • KOMPOZICE. Silueta krychle se uprostřed přeletu roztáhne na stěnovou
 *     úhlopříčku (×√2, viz FIT_SPAN_WIDE níž) — přesně v ten okamžik je jí
 *     v záběru nejtěsněji. Couvnutí jí to místo dá právě tam, kde chybí.
 *   • POHYB. Změna vzdálenosti je jediná složka pohybu kamery, kterou nejde
 *     splést s posunem obrazu: mění MĚŘÍTKO, ne polohu. Oblet je díky ní vidět
 *     i tehdy, když je krychle zrovna natočená symetricky.
 *   • RYTMUS. Pohyb dostane oblouk i ve třetím rozměru, takže se přelet čte jako
 *     jeden vedený tah, ne jako otočení kolem osy.
 *
 * Uplatňuje se AŽ ZA podlahou odstupu (viz FIT_SPAN_*): couvnutí vzdálenost jedině
 * zvětšuje, takže žádnou podlahu porušit nemůže.
 */
const TRANSIT_BREATH = 0.055

/**
 * ★ NÁKLON DO ZATÁČKY. Kameraman i pilot dělají totéž: když se točí doleva,
 *   nakloní se doleva. Bez toho je oblet geometricky správný a mrtvý.
 *
 * Amplituda je 1,2° a víc si tu nedovol. Vodorovná linka textu v DOM zůstává
 * vodorovná pořád, takže každý stupeň navíc je stupeň NESOULADU mezi 3D vrstvou
 * a stránkou nad ní — nad ~3° to přestane vypadat jako režie a začne to vypadat
 * jako rozbité vykreslování (týž strop platí pro statický roll v ORBIT_PAN).
 *
 * ★★ NAKLÁNÍ SE JEN VE VODOROVNÝCH ZATÁČKÁCH, a pozná se to VÝPOČTEM, ne tabulkou:
 *   náklon patří k rychlosti otáčení kolem SVISLÉ OSY KAMERY. Stačí tedy skalární
 *   součin osy otáčení daného úseku dráhy (SEGMENT_AXIS) s vektorem „nahoru" té
 *   kamery. Vyjde ±1 na vodorovných přeletech a 0 na svislých — a hlavně to platí
 *   i nad pólem, kde je „vodorovně" něco úplně jiného než ve světových osách.
 *   Ručně opsaná tabulka „na kterých úsecích se naklánět" by tuhle past minula.
 */
const BANK = 0.021

/** Tlumení odstupu. Krátké — má vyhladit skok při změně okna, ne přidat setrvačnost. */
const DOLLY_SMOOTH = 0.12

/**
 * ★ PŘÍLET. Scéna nenaskočí, ale DOSEDNE — kamera dojede z 16 % větší dálky.
 *
 * Plátno se mountuje až po `load` + prvním volnu (viz useArmed v App.tsx), tedy
 * ve chvíli, kdy už návštěvník na stránku kouká a čte. Krychle se do hotového
 * obrazu do té doby prostě STŘIHLA: jeden snímek nic, další snímek stroj v plné
 * velikosti. Střih je nejtvrdší přechod, jaký film zná, a tady navíc přišel
 * v okamžiku, který si nikdo nevybral.
 *
 * Dvouvteřinový nájezd z toho udělá příjezd. Nestojí nic (je to jedno číslo
 * v už existujícím tlumení odstupu), nezdrží nic (obsah je dávno vykreslený)
 * a potká se přesně se zážehem jádra, který v tu chvíli pouští preloader —
 * takže se stroj rozsvítí ve stejnou vteřinu, kdy k němu kamera dojede.
 *
 * ★ Hodnota žije MIMO komponentu schválně: po remountu plátna (ztráta WebGL
 *   kontextu, viz MAX_RESTORES ve Scene.tsx) se přílet NEOPAKUJE. Obnova po
 *   pádu kontextu má být neviditelná oprava, ne druhá premiéra.
 */
const ARRIVE_BACK = 0.16
const ARRIVE_SMOOTH = 0.55

/** Odstup a doznívající přílet mezi snímky. Mimo komponentu — useFrame nesmí alokovat. */
const dolly = { r: 0 }
const arrive = { v: 1 }

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
    /* ★ SMOOTHERSTEP, NE SMOOTHSTEP — viz lib/scene-state.ts. Na hranici stěn se
       mění OSA otáčení (viz faces.ts), takže tam musí být nulová nejen rychlost,
       ale i zrychlení. Se smoothstepem tam zůstávalo slyšitelné klepnutí. */
    const t = smootherstep(MathUtils.clamp(a - i, 0, 1))

    // Slerp = oblet po nejkratším oblouku. Každý krok je přesně 90° (viz faces.ts).
    orbit.slerpQuaternions(FACE_CAM_QUATS[i], FACE_CAM_QUATS[i + 1], t)

    /* ── 2. JAK DALEKO ─────────────────────────────────────── */
    let r = MathUtils.lerp(ORBIT_RADIUS[i], ORBIT_RADIUS[i + 1], t)

    /* ★ ODSTUP PODLE POMĚRU STRAN. FOV 35° je VERTIKÁLNÍ, takže na úzkém plátně
       je vodorovné zorné pole užší než svislé.

       ŠIROKO se krychle musí celá VEJÍT (je to exponát, kolem kterého má být vzduch),
       ÚZKO má naopak šířku VYPLNIT (je to pozadí pod textem) — viz NARROW_WIDTH_FRACTION.
       Obě větve končí u tvrdé podlahy odstupu; ta širokoúhlá je schválně tak nízko,
       aby na běžném displeji nikdy nezabrala a rozpětí stanic ze scene-state.ts platilo. */
    const aspect = size.width / Math.max(1, size.height)
    const wide = size.width > SIDE_BY_SIDE
    const needed = wide
      ? FIT_SPAN_WIDE / (2 * Math.tan(HALF_FOV) * Math.min(aspect, 1))
      : CUBE_EDGE / NARROW_WIDTH_FRACTION / (2 * Math.tan(HALF_FOV) * aspect)
    if (r < needed) r = needed

    /* Nádech v půlce přeletu, klidové dýchání a doznívající přílet. Všechno tři
       odstup jen ZVĚTŠUJE, takže se to smí počítat až za podlahou — porušit ji
       to nemá jak. */
    const calm = 0.35 + 0.65 * (1 - sceneState.heat)
    easing.damp(arrive, 'v', 0, ARRIVE_SMOOTH, dt)
    r *=
      1 + TRANSIT_BREATH * sceneState.heat + Math.sin(time * 0.19) * BREATH_IDLE * calm + ARRIVE_BACK * arrive.v

    /* ★ ODSTUP SE TLUMÍ. Ne kvůli dráze (ta je spojitá sama o sobě), ale kvůli
       ZMĚNÁM OKNA: otočení telefonu nebo tažení za roh okna přehodí větev výpočtu
       i poměr stran, a kamera by v jednom snímku skočila o jednotku a půl. Krátká
       konstanta z toho udělá pohyb, ale nepřidá do dráhy setrvačnost.
       První snímek se dosazuje napřímo — jinak by kamera startovala z počátku,
       tedy zevnitř krychle. */
    if (dolly.r === 0) dolly.r = r
    easing.damp(dolly, 'r', r, DOLLY_SMOOTH, dt)
    r = dolly.r

    // Kamera sedí PŘESNĚ na normále stěny, ve vzdálenosti r. Bez alokace.
    cam.position.set(0, 0, r).applyQuaternion(orbit)

    /* ── 3. KOMPOZICE: uhni krychlí textu ──────────────────── */
    /* ★ VODOROVNÉ panoráma platí jen tam, kde text stojí VEDLE krychle (viz
       SIDE_BY_SIDE). Na úzkém displeji má text plnou šířku a krychle je pozadí
       pod ním — uhýbat do strany před textem, který žádnou stranu nemá, by stroj
       jen bezdůvodně vystrčilo z osy a jedna hrana by vyjela z obrazu víc než druhá.
       Roll je ze stejného soudku: koření pro kompozici vedle sebe.

       ★★ SVISLÉ panoráma se ale uplatňuje VŠUDE, a je to podstatný rozdíl.
       Výšku má i telefon — dokonce jí má vzhledem k šířce nejvíc — takže rozdělit
       okno na „text nahoře, stroj dole" jde právě tam nejlíp. Přesně na tom stojí
       úvodní sekce (viz HERO_DROP v lib/scene-state.ts): kdyby se pitch na úzkém
       displeji zahodil spolu s yaw, zůstala by krychle na mobilu uprostřed za
       textem a celá oprava viditelnosti modelu by platila jen pro desktop. */
    const p0 = ORBIT_PAN[i]
    const p1 = ORBIT_PAN[i + 1]

    let yaw = wide ? MathUtils.lerp(p0.yaw, p1.yaw, t) : 0
    let pitch = MathUtils.lerp(p0.pitch, p1.pitch, t)
    let roll = wide ? MathUtils.lerp(p0.roll, p1.roll, t) : 0

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
       tam, kde je nejvíc potřeba — v klidu nad stěnou. (`calm` výš je táž váha;
       počítá se jednou a používá se i pro klidové dýchání odstupu.) */
    const gain = (parallax ? DRIFT_MOUSE : DRIFT_TOUCH) * calm
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

    /* ── 4b. NÁKLON DO ZATÁČKY ─────────────────────────────── */
    /* Kolik z otáčení tohohle úseku připadá na SVISLOU osu kamery: ±1 na
       vodorovných přeletech, 0 na svislých a plynulý přechod nad pólem. Násobí se
       teplem, takže náklon vzniká a zaniká spolu s přeletem, a rychlostí na dráze,
       aby se kamera naklonila na správnou stranu i při scrollování zpátky nahoru. */
    roll -= MathUtils.clamp(sceneState.flow, -1, 1) * SEGMENT_AXIS[i].dot(up) * BANK * sceneState.heat

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
