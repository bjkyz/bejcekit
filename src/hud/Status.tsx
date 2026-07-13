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
export default function Status({ tier }: { tier: string }) {
  const [, tick] = useState(0)

  // 8 Hz. Panel nepotřebuje 60 fps a re-render celého HUD by byl plýtvání.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 125)
    return () => clearInterval(id)
  }, [])

  const i = Math.min(sceneState.faceIndex, SECTIONS.length - 1)
  const s = SECTIONS[i]
  const transit = sceneState.transit
  const next = Math.min(i + 1, SECTIONS.length - 1)

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
            jednotka 06 · strana {String(i).padStart(2, '0')}/05 — {s.plateCode}
          </span>
        )}
      </div>

      {/* Jen dva řádky — a oba jsou fakt, který kupujícího zajímá.
          Řádek „AKTIVNÍ SUBSYSTÉM" je pryč: duplikoval hlavičku panelu, pravou
          lištu i kicker sekce, a jeho výška tlačila CTA sekcí WEB a AI přímo
          na tenhle panel. */}
      <Row k="Stav" v="Přijímám nové projekty" />
      <Row k="Odezva" v="Do 24 hodin" />

      <div className="status__meta">
        {sceneState.fps} fps · tier {tier} · meshopt · model cc-by m. murdock
      </div>
    </aside>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="status__row">
      <span>{k}</span>
      <span className="status__dots" />
      <span className="status__v">{v}</span>
    </div>
  )
}
