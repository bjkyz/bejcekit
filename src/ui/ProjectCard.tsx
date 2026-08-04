import type { Project } from '../content/projects'
import Icon from './Icons'

/**
 * ═══════════ KARTA PROJEKTU ═══════════
 *
 * Celá geometrie 3D je v CSS (styles/projects.css), pohyb v lib/tilt.ts.
 * Tenhle soubor řeší jen strukturu a přístupnost – a obojí má past, kvůli které
 * stojí za to číst dál.
 *
 * ★ CELÁ KARTA JE KLIKATELNÁ, ALE ODKAZ JE JEN JMÉNO PROJEKTU.
 *
 *   Nabízí se obalit celou kartu do <a>. Myší to funguje skvěle a pro odečítač
 *   obrazovky je to katastrofa: jméno odkazu se skládá z veškerého textu uvnitř,
 *   takže by nevidomý uživatel uslyšel jednu souvislou větu dlouhou přes dvě stě
 *   znaků („Super Advokát právní služby online s cenou předem advokátní kancelář
 *   která prodává doručení předrenderované stránky z CDN…") a musel by z ní
 *   vyluštit, kam ten odkaz vlastně vede.
 *
 *   Použitý vzor je „natažený odkaz": odkazem je JEN jméno projektu, a jeho
 *   `::after` se roztáhne přes celou kartu jako neviditelný zásahový obdélník.
 *   Odečítač tedy dostane krátké, smysluplné jméno, myš může klikat kamkoli.
 *
 *   Cena, kterou to stojí: text uvnitř karty nejde označit myší (leží pod tím
 *   obdélníkem). Na kartě portfolia je to přijatelné – nikdo si odsud nekopíruje
 *   odstavce, a kdo chce, otevře odkazovaný web.
 *
 * ★★ FOCUS MUSÍ ROZSVÍTIT CELOU KARTU, NE JEN ŘÁDEK S ODKAZEM.
 *   Když se karta rozsvěcí na `:hover`, ale při tabování jen tence orámuje jméno,
 *   dostane uživatel klávesnice viditelně horší zpětnou vazbu než uživatel myši.
 *   Řeší to `.pcard:focus-within` v CSS – stejný stav jako hover, jen spuštěný
 *   odjinud. Prstenec focusu zůstává tam, kde má být: na odkazu.
 *
 * ★★★ TŘÍDA `.reveal` SEM NEPATŘÍ A NIKDY SEM NESMÍ PŘIJÍT.
 *   Sedí o úroveň výš, na `.pgrid__cell`. Důvod je specificita: `.reveal.is-in`
 *   nastavuje `transform: none` s vahou (0,2,0), zatímco naklápění na `.pcard`
 *   má jen (0,1,0). Na jednom prvku by tedy reveal 3D efekt tiše vypnul — motor
 *   by dál počítal a zapisoval proměnné, karta by se nehnula a nikde by nebyla
 *   chyba. Přesně tak to poprvé i dopadlo (naměřeno `--rx: 2.2deg`, `--lift: 1`
 *   a k tomu `transform: none`). Viz komentář v styles/projects.css.
 */
export default function ProjectCard({ p, i }: { p: Project; i: number }) {
  const headId = `pcard-${p.id}`

  return (
    <article
      className="pcard"
      aria-labelledby={headId}
      /* Naklápění potřebuje vědět, která karta je která; tilt.ts si je hledá
         přes `.pcard`, tohle je jen pro ladění a testy. */
      data-project={p.id}
    >
      {/* ── OBRAZOVKA ────────────────────────────────────────────
          Snímek webu zapuštěný v desce jako displej v přístroji. Vrstva
          odlesku a hranového světla jsou pseudo-elementy v CSS, ne DOM. */}
      <div className="pcard__screen">
        <img
          className="pcard__img"
          src={p.shot.src}
          alt={p.shot.alt}
          width={p.shot.w}
          height={p.shot.h}
          /* ★ ROZMĚRY JSOU POVINNÉ. Bez nich prohlížeč nezná poměr stran, do
             dotečení obrázku drží nulovou výšku a pak layout poskočí – přesně
             ten CLS, který je na tomhle webu strukturálně nulový. */
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          /* První snímek je nejpravděpodobnější LCP kandidát stránky, ostatní
             jsou pod ohybem a nemají proč soutěžit o linku. */
          fetchPriority={i === 0 ? 'high' : 'low'}
        />
        <span className="pcard__glare" aria-hidden="true" />
      </div>

      {/* ── POPIS ────────────────────────────────────────────────── */}
      <div className="pcard__body">
        <p className="pcard__head">
          <span className="pcard__num">{p.num}</span>
          <span className="pcard__domain">{p.domain}</span>
        </p>

        <h2 className="pcard__name" id={headId}>
          <a
            className="pcard__link"
            href={p.href}
            target={p.external ? '_blank' : undefined}
            rel={p.external ? 'noreferrer' : undefined}
          >
            {p.name}
            {/* Ikona je dekorace (aria-hidden), takže smysl „otevře se cizí web"
                musí nést i text pro odečítač. Vizuálně skrytý dodatek to udělá,
                aniž by se do jména odkazu psalo něco navíc pro vidoucí. */}
            <Icon name={p.external ? 'external' : 'back'} size={14} />
            {p.external && <span className="sr-only"> (otevře se v nové kartě)</span>}
          </a>
        </h2>

        <p className="pcard__kind">{p.kind}</p>
        <p className="pcard__sum">{p.summary}</p>

        {/* Popisek a hodnota jsou pár, ne dva odstavce vedle sebe – proto <dl>.
            Odečítač pak umí říct „Doručení: předrenderované stránky z CDN". */}
        <dl className="pcard__facts">
          {p.facts.map((f) => (
            <div className="pcard__fact" key={f.k}>
              <dt className="pcard__fact-k">{f.k}</dt>
              <dd className="pcard__fact-v">{f.v}</dd>
            </div>
          ))}
        </dl>

        {p.outcome && (
          <p className="pcard__outcome">
            <span className="pcard__outcome-k">Výsledek</span>
            {p.outcome}
          </p>
        )}

        {/* Tichý běžící řádek, ne orámované odznaky. Stejný idiom jako `.stack`
            na hlavní stránce a ze stejného důvodu: je to poznámka pod čarou,
            ne šest tlačítek. */}
        <ul className="pcard__stack">
          {p.stack.map((t) => (
            <li className="pcard__chip" key={t}>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
