import { LOCKED_DOMAIN, type Project } from '../content/projects'
import { CONTACT_HREF } from '../content/sections'
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
 *   znaků a musel by z ní vyluštit, kam ten odkaz vlastně vede.
 *
 *   Použitý vzor je „natažený odkaz": odkazem je JEN jméno projektu, a jeho
 *   `::after` se roztáhne přes celou kartu jako neviditelný zásahový obdélník.
 *   Odečítač tedy dostane krátké, smysluplné jméno, myš může klikat kamkoli.
 *
 *   Cena, kterou to stojí: text uvnitř karty nejde označit myší (leží pod tím
 *   obdélníkem). Na kartě portfolia je to přijatelné – nikdo si odsud nekopíruje
 *   odstavce, a kdo chce, otevře odkazovaný web.
 *
 * ★★ ZAMČENÁ KARTA (reference pod NDA) VEDE NA #poptavka, NE NA KLIENTŮV WEB.
 *   Zámek by byl mrtvý konec: člověk klikne, nic se nestane, odchází. Takhle je
 *   to nejkratší cesta k jediné akci, která detail reference opravdu odemkne –
 *   napsat si o něj. Odečítač se pravdu dozví z přípisku ve jménu odkazu
 *   („detail na vyžádání"), vidoucí z pečeti přes snímek. Pečeť je `aria-hidden`:
 *   je to táž informace podruhé, jen namalovaná.
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
  /* ★ CELÝ REŽIM KARTY SE ODVODÍ TADY, NA JEDNOM MÍSTĚ. Data nesou jen to,
     co se odvodit nedá (viz rozlišený svaz v content/projects.ts):
     • zamčená karta vede na poptávkový blok, ne na klientův web,
     • místo domény nese štítek LOCKED_DOMAIN,
     • „do ciziny" se pozná z tvaru odkazu, ne z ručního příznaku, který by
       se při příští veřejné referenci zapomněl nastavit. */
  const href = p.locked ? CONTACT_HREF : p.href
  const domain = p.locked ? LOCKED_DOMAIN : p.domain
  const external = !p.locked && /^https?:\/\//.test(p.href)
  const icon = p.locked ? 'lock' : external ? 'external' : 'back'

  return (
    <article
      /* ★ `--wide` dostává jen první karta a jen nad 62rem (viz projects.css).
         Pořadí je záměr: první položka je nejúplnější zakázka, takže dostane
         nejvíc místa a jako jediná ukáže snímek dost velký na to, aby se v něm
         dalo něco přečíst. */
      className={`pcard${i === 0 ? ' pcard--wide' : ''}`}
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
          /* ★ `sizes` BEZ `srcset` NENÍ ZBYTEČNÉ. Zdrojová sada je jen jedna
             (1440px), takže prohlížeč nemá z čeho vybírat — ale `sizes` mu říká,
             jak VELKÝ ten obrázek na stránce bude, což používá při rozhodování
             o dekódování a prioritě. A hlavně je to jediné místo, kde je ta
             informace zapsaná, až se sada rozšíří.
             Široká první karta zabírá zhruba polovinu mřížky (strop 78rem),
             ostatní při dvou sloupcích ~590 px; na telefonu je to plná šířka. */
          sizes={i === 0 ? '(min-width: 62rem) 40rem, 100vw' : '(min-width: 62rem) 37rem, 100vw'}
        />
        <span className="pcard__glare" aria-hidden="true" />
        {/* Plomba přes zamčený snímek. Čistě vizuální dvojnice informace,
            kterou nese jméno odkazu – proto aria-hidden. Sedí UVNITŘ
            `.pcard__screen` (pointer-events: none), takže nekrade kliky
            nataženému odkazu. Typografii jí dává sdílená `.label`;
            ztmavení pod ní je zapečené přímo ve snímku (scripts/blur-refs.mjs),
            ne v CSS – viz komentář u `.pcard__seal` ve stylech. */}
        {p.locked && (
          <span className="pcard__seal label" aria-hidden="true">
            <span className="pcard__seal-head">
              <Icon name="lock" size={12} />
              Chráněno NDA
            </span>
            <span>Detail na vyžádání</span>
          </span>
        )}
      </div>

      {/* ── POPIS ────────────────────────────────────────────────── */}
      <div className="pcard__body">
        <p className="pcard__head">
          <span className="pcard__num">{p.num}</span>
          <span className="pcard__domain">{domain}</span>
          {/* Zelená = stav, stejně jako štítek kapacity na úvodu: na tuhle
              práci se dá kliknout a běží. Štítek má KAŽDÁ odemčená karta –
              plomba a kontrolka jsou dvě poloviny jedné osy, takže se žádná
              karta nemůže ocitnout bez stavu. Kontrast je záměr: tři karty
              říkají „diskrétnost", čtvrtá „a takhle to pak žije". */}
          {!p.locked && (
            <span className="pcard__live">
              <span className="pcard__live-dot" />
              živá ukázka
            </span>
          )}
        </p>

        <h2 className="pcard__name" id={headId}>
          <a
            className="pcard__link"
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {p.name}
            {/* Ikona je dekorace (aria-hidden), takže smysl („otevře cizí web",
                „je pod zámkem") musí nést i text pro odečítač. Vizuálně skrytý
                dodatek to udělá, aniž by se do jména odkazu psalo něco navíc
                pro vidoucí. */}
            <Icon name={icon} size={14} />
            {p.locked && <span className="sr-only"> (pod NDA, detail na vyžádání)</span>}
            {external && <span className="sr-only"> (otevře se v nové kartě)</span>}
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
