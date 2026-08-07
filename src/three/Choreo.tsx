import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { MathUtils } from 'three'
import { FACE_QUATS } from '../lib/faces'
import { clampDelta, sceneState, smootherstep } from '../lib/scene-state'
import { scrollState } from '../lib/scroll'

const LAST = FACE_QUATS.length - 1

/** Stav mezi snímky. Mimo komponentu — useFrame nesmí alokovat. */
const aim = { v: 0 }
const flow = { v: 0 }
/** Progres z minulého snímku. −1 = ještě jsme neměřili (viz první snímek níž). */
const prev = { p: -1 }

/** Doba doběhu, když se scrolluje. Nízká = kamera drží krok s prstem. */
const FOLLOW = 0.07
/** Doba doběhu, když se stojí. Vyšší = měkké, dlouhé dosednutí nad stěnu. */
const SETTLE = 0.4

/**
 * ★ PÁSMO KLIDU, VE STĚNÁCH ZA SEKUNDU. Pod dolní hranicí je to klid, nad horní
 *   čistý sledovací režim, mezi tím se plynule prolíná.
 *
 * ★★ DŘÍV TO BYL JEDEN PRÁH A BYLA TO CHYBA. Stálo tu `velocity < 0.06 ? … : …`,
 *   takže v jediném snímku, kdy rychlost klesla pod práh, se NAJEDNOU změnily
 *   OBĚ veličiny — cíl i doba doběhu. Cíl přitom skočil až o půl stěny (ze
 *   spojitého progresu na zaokrouhlený), takže kamera na konci každého gesta
 *   dostala mikroškubnutí. Na rychlém scrollu se ztratilo v pohybu, na pomalém
 *   dojezdu bylo vidět. Prolnutí přes pásmo tuhle třídu artefaktů ruší úplně.
 */
const STILL_LO = 0.06
const STILL_HI = 0.32

/**
 * ★ NÁSKOK. Kamera míří tam, kde scroll BUDE za `LEAD` sekund, ne kde je teď.
 *
 * Tlumení je ze své podstaty zpoždění: damper vždycky někde ZA cílem. Při rychlém
 * scrollu se to čte jako gumový provaz mezi prstem a scénou — pohyb je plynulý,
 * ale nepatří uživateli. Náskok o zlomek sekundy to zpoždění přesně vyruší:
 * scéna se přestane vléct a začne jít S rukou. Zadarmo k tomu přijde druhá věc,
 * kterou dělá každý kameraman ručně — záběr se do pohybu NAKLONÍ dřív, než pohyb
 * začne, takže vypadá vedený, ne tažený.
 *
 * Strop je nutný: bez něj by prudké švihnutí kolečkem poslalo cíl o dvě stěny
 * dál a kamera by přestřelila stanici, na které scroll skončil.
 */
const LEAD = 0.085
const LEAD_MAX = 0.22

/** Vyhlazení rychlosti. Surový rozdíl progresu mezi snímky je příliš zubatý. */
const FLOW_SMOOTH = 0.1
/** Strop na měřenou rychlost — proti skoku po deep linku nebo návratu z pozadí. */
const FLOW_MAX = 8

/**
 * ★ ZÁKON DOSEDNUTÍ JAKO SPOJITÁ FUNKCE, NE JAKO ZAOKROUHLENÍ.
 *
 * Kamera má v klidu stát nad stěnou. Napsat to jako `Math.round(progres)` je
 * lákavé a je to past: zaokrouhlení je NESPOJITÉ v půlce mezi stěnami, takže
 * kdykoli tudy uživatel projede pomalu, cíl skočí o půl stěny a kamera sebou
 * trhne. Přesně proto se dřív dosednutí smělo zapnout jen v úplném klidu — a
 * přesně proto vzniklo to škubnutí na konci gesta.
 *
 * Řešení je jiné: nezaokrouhluje se, ale OHÝBÁ. `warp` je rostoucí funkce
 * [0,1]→[0,1] s w(0)=0 a w(1)=1 (tedy spojitá i na hranicích stěn), která ale
 * uprostřed prudce stoupá — desetina cesty se scvrkne na tisícinu, čtyři pětiny
 * se natáhnou skoro na celou. Čtyřnásobný smootherstep dělá přesně tohle.
 *
 * Prakticky: kdekoli kromě těsného okolí půlky (±0.05) je výsledek nerozeznatelný
 * od dosednutí na stěnu. A v té půlce kamera zůstane uprostřed přeletu — což je
 * jediné poctivé místo, protože přesně tam stojí i scroll. Na desktopu se tam
 * ostatně vůbec nedá zastavit, snap scrollu to místo neuznává (lib/scroll.ts).
 */
const warp = (f: number) => smootherstep(smootherstep(smootherstep(smootherstep(f))))

/**
 * ★ JEDINÝ VLASTNÍK POLOHY NA OBĚŽNÉ DRÁZE.
 *
 * Nic nevykresluje. Jen každý snímek přepočítá, kde na trase mezi stěnami
 * choreografie zrovna je, a zapíše to do sceneState. Kamera (Rig), sklo (Shell),
 * jádro (Core), mřížka (EdgeLattice) i bloom (Effects) z toho pak už jenom ČTOU.
 *
 * ★★ PROČ VLASTNÍ KOMPONENTA A NE ŘÁDEK V RIGU:
 *   `heat` čte pět různých useFrame smyček. R3F je volá v pořadí, v jakém se
 *   komponenty připojily — takže kdyby hodnotu psal Rig (připojený až za krychlí),
 *   četlo by sklo i jádro o snímek starší číslo. Choreo se proto montuje jako
 *   PRVNÍ ve Scene.tsx a je mimo <Suspense>: běží tedy i ve chvíli, kdy se model
 *   ještě dopéká, a všichni ostatní čtou vždy čerstvou hodnotu.
 */
export default function Choreo() {
  /* ★ MĚŘENÍ RYCHLOSTI SE PŘI KAŽDÉM PŘIPOJENÍ ZAČÍNÁ ZNOVU.
     `prev` je modulový stav, takže remount plátna (ztráta WebGL kontextu, viz
     MAX_RESTORES ve Scene.tsx) by ho zdědil z doby PŘED výpadkem. Kdyby se mezitím
     scrollovalo, spočítala by se z toho rozdílu jednorázová rychlost, která se
     nikdy nestala — a kamera by po obnově švihla náskokem do prázdna. */
  useEffect(() => {
    prev.p = -1
    flow.v = 0
  }, [])

  useFrame((_, delta) => {
    const dt = clampDelta(delta)
    const p = MathUtils.clamp(scrollState.progress, 0, LAST)

    /* ── RYCHLOST SE MĚŘÍ Z PROGRESU, NE Z LENISU ────────────────────────
       Diference vlastního progresu je jediné číslo, které znamená totéž na
       desktopu i na telefonu, při 60 i při 120 Hz, pod Lenisem i pod nativním
       scrollem (v jednoduchém režimu Lenis vůbec neběží a `velocity` je natvrdo 0
       — kamera by tam o dosednutí přišla úplně).

       ★★ NULOVÁ DELTA MUSÍ MÍT VLASTNÍ VĚTEV, NE JEN STROP NA VÝSLEDKU.
       R3F umí zavolat useFrame s delta 0 (první snímek, dva snímky se stejným
       časovým razítkem, návrat plátna do viditelnosti). Dělení nulou samo o sobě
       dá ±Infinity, což by strop ořízl — jenže ve stojící scéně je čitatel taky
       nula, a 0/0 je NaN. Ten se pak přes damper prolije do `aim`, z indexu stěny
       se stane NaN, slerp dostane `undefined` a CELÁ SCÉNA SPADNE (SceneBoundary
       ji sundá a web zůstane bez 3D). Jedna nedělitelná nula uměla shodit krychli. */
    /* ★ PRVNÍ SNÍMEK ROVNOU NA MÍSTĚ, ŽÁDNÝ PŘELET Z NULY.
       Dvě mouchy jednou ranou. Za prvé rychlost: `prev.p` je po startu neznámé
       a při vstupu přes kotvu by z rozdílu pěti stěn za jeden snímek vyšlo číslo,
       které by cíl vystřelilo mimo dráhu. Za druhé kompozice: `aim` startuje na
       nule, jenže scroll nemusí — prohlížeč po reloadu obnoví polohu a kotva
       z jiné stránky přistane rovnou v sekci. Kamera pak na úvod prolétla půlku
       oběžné dráhy jen proto, aby dorazila tam, kde už dávno stojí stránka.
       Není to efekt, je to dohánění: divák vidí pohyb, který nezpůsobil a který
       mu nic neříká. Scéna se má objevit ZARÁMOVANÁ; jediný úvodní pohyb, který
       si tu zasloužil místo, je přílet kamery (viz ARRIVE_BACK v Rig.tsx). */
    if (prev.p < 0) {
      prev.p = p
      aim.v = p
    }
    const raw = dt > 0 ? MathUtils.clamp((p - prev.p) / dt, -FLOW_MAX, FLOW_MAX) : flow.v
    prev.p = p
    easing.damp(flow, 'v', raw, FLOW_SMOOTH, dt)
    sceneState.flow = flow.v

    /* ── KLID vs. POHYB, spojitě ─────────────────────────────────────── */
    const speed = Math.abs(flow.v)
    const still = 1 - smootherstep(MathUtils.clamp((speed - STILL_LO) / (STILL_HI - STILL_LO), 0, 1))

    /* ── CÍL: v pohybu předbíhá prst, v klidu dosedá na stěnu ─────────── */
    const base = Math.floor(p)
    const snapped = base + warp(p - base)
    const lead = MathUtils.clamp(flow.v * LEAD, -LEAD_MAX, LEAD_MAX)
    const target = MathUtils.clamp(MathUtils.lerp(p + lead, snapped, still), 0, LAST)

    easing.damp(aim, 'v', target, MathUtils.lerp(FOLLOW, SETTLE, still), dt)

    const i = MathUtils.clamp(Math.floor(aim.v), 0, LAST - 1)
    const frac = MathUtils.clamp(aim.v - i, 0, 1)

    sceneState.aim = aim.v
    // Teplo: 0 nad stěnou, 1 v půlce přeletu. Řídí ostření skla, jas jádra i bloom.
    sceneState.heat = Math.sin(frac * Math.PI)
    sceneState.faceIndex = Math.round(aim.v)
    sceneState.transit = sceneState.heat > 0.02
  })

  return null
}
