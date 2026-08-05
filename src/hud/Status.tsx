import { useEffect, useState } from 'react'
import { SECTIONS } from '../content/sections'
import { sceneState } from '../lib/scene-state'

/**
 * ★ STAVOVÝ PANEL. Každý vypsaný údaj je hodnota, kterou aplikace skutečně drží.
 *
 * Řádky 1–4 jsou v --tx-3 (projdou AA) a každý z nich je fakt, který kupujícího
 * zajímá. ŽÁDNÉ SUROVÉ KVATERNIONY — jednatel firmy není porota a „QUAT x +0.7071"
 * ho jen vyloučí.
 *
 * Poslední vlasový řádek je jediný ORNAMENT na webu (--tx-4) — stroj vypisuje
 * vlastní kusovník. Právě tam žije povinná CC-BY atribuce, takže se z právní
 * povinnosti stane to jediné místo, kde si metafora přístroje smí mrknout okem.
 */
export default function Status() {
  const [, tick] = useState(0)

  /* ★ `live` ODDĚLUJE PRVNÍ RENDER OD ŽIVÝCH HODNOT — kvůli hydrataci.
     sceneState je mutabilní modulový stav: server ho vyrenderuje s výchozími
     hodnotami, jenže než na klientu dojde na hydrataci téhle (Suspense)
     hranice, App už ho stihl přepsat — a React #418 pak celý panel zahodí
     a staví znovu. Dokud `live` není true, kreslí se tu proto KONSTANTY
     ('off', stěna 00), na serveru i na klientu stejné. Živé hodnoty panel
     ukáže po mountu — což je i věcně správně: dokud neběží efekt, neběží
     ani scéna, takže „statický režim" není placeholder, ale pravda. */
  const [live, setLive] = useState(false)

  // 8 Hz. Panel nepotřebuje 60 fps a re-render celého HUD by byl plýtvání.
  useEffect(() => {
    setLive(true)
    const id = setInterval(() => tick((n) => n + 1), 125)
    return () => clearInterval(id)
  }, [])

  const i = live ? Math.min(sceneState.faceIndex, SECTIONS.length - 1) : 0
  const s = SECTIONS[i]
  const transit = live && sceneState.transit
  const next = Math.min(i + 1, SECTIONS.length - 1)
  /* Ze sceneState, ne z propu: governor umí patro za běhu snížit a panel
     nesmí ukazovat kvalitu, která už dávno neběží. */
  const tier = live ? sceneState.tier : 'off'

  return (
    <aside className="status" aria-hidden="true">
      <div className="status__head">
        <span className="status__dot" />
        {transit ? (
          <span className="status__transit">
            &gt;&gt; přechod {String(i).padStart(2, '0')} → {String(next).padStart(2, '0')}
          </span>
        ) : (
          <span>
            jednotka 06 · strana {String(i).padStart(2, '0')}/05 · {s.plateCode}
          </span>
        )}
      </div>

      {/* Jen dva řádky — a oba jsou fakt, který kupujícího zajímá.
          Řádek „AKTIVNÍ SUBSYSTÉM" je pryč: duplikoval hlavičku panelu, pravou
          lištu i kicker sekce, a jeho výška tlačila CTA sekcí WEB a AI přímo
          na tenhle panel. */}
      <Row k="Volná kapacita" v="Zbývá 1 místo" ok />
      <Row k="Odezva" v="Do 24 hodin" />

      <div className="status__meta">
        {tier === 'off'
          ? 'statický režim · 3d vypnuto'
          : `${sceneState.fps} fps · tier ${tier} · meshopt · model cc-by m. murdock`}
      </div>
    </aside>
  )
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="status__row">
      <span>{k}</span>
      <span className="status__dots" />
      <span className={`status__v${ok ? ' status__v--ok' : ''}`}>{v}</span>
    </div>
  )
}
