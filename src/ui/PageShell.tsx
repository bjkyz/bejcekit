import { GITHUB, NAV_PAGES, NAV_SECTION_COUNT, SECTIONS } from '../content/sections'
import Icon from './Icons'
import Mark from './Mark'

/**
 * ═══════════ SPOLEČNÁ VÝZTUŽ PODSTRÁNEK ═══════════
 *
 * Navigace a patička pro stránky BEZ krychle (`/projekty`, `/clanky` a všechno
 * pod ním). Úvod má vlastní verzi v `hud/Hud.tsx`, protože tam jsou odkazy na
 * sekce kotvy a musí projít přes Lenis; tady jsou to obyčejné navigace mezi
 * dokumenty a patří prohlížeči.
 *
 * ★ VZNIKLO TO PŘI PŘIDÁNÍ ŽURNÁLU, A PRÁVĚ PROTO. Do té doby měla stránka
 *   projektů navigaci opsanou u sebe a bylo to v pořádku — dokud byla jediná.
 *   S třetí stránkou by se stejný seznam odkazů psal potřetí a první, co by se
 *   stalo, je že by na jedné z nich chyběl nově přidaný odkaz. Seznam cílů žije
 *   v `content/sections.ts` (`NAV_PAGES`), tvar v tomhle souboru.
 *
 * ★★ `nav--page` NENÍ KOSMETIKA. Navigace je fixní deska bez pozadí a na úvodu
 *   jí to projde, protože tam sekce snapují a pod lištou nikdy nic nestojí.
 *   Tady se scrolluje volně, takže jí obsah PROJÍŽDÍ POD RUKAMA a přes značku
 *   by se míhal text. Modifikátor přidává závoj — a musí být, protože stylesheet
 *   je pro všechny stránky společný, takže by holé `.nav::before` zasáhlo i úvod.
 */
export function PageNav({
  /** Která položka svítí jako aktuální. Odpovídá `href` v NAV_PAGES. */
  active,
  /** Kam míří tlačítko vpravo. Na každé stránce je to poptávkový blok NA NÍ. */
  ctaHref,
}: {
  active: string
  ctaHref: string
}) {
  return (
    <nav className="nav nav--page" aria-label="Hlavní navigace">
      <a className="nav__mark" href="/">
        <Mark size={30} />
        <span className="sr-only">bejcek.it, úvod</span>
      </a>
      <div className="nav__links">
        {SECTIONS.slice(1, 1 + NAV_SECTION_COUNT).map((s) => (
          <a className="nav__link" href={`/#${s.id}`} key={s.id}>
            {s.plateCode}
          </a>
        ))}
        {NAV_PAGES.map((p) => (
          <a
            className={`nav__link${active === p.href ? ' is-active' : ''}`}
            href={p.href}
            key={p.href}
            aria-current={active === p.href ? 'page' : undefined}
          >
            {p.label}
          </a>
        ))}
      </div>
      {/* ★ NA KONTAKT NA TÉHLE STRÁNCE, ne pryč na /#kontakt. Posílat člověka,
          který právě čte, přes load jiné stránky je zbytečně ztracený kontext
          (a pár procent z nich se cestou ztratí doslova). */}
      <a className="nav__cta" href={ctaHref}>
        Napište mi
      </a>
    </nav>
  )
}

/**
 * Patička podstránek. Kratší než na úvodu, a schválně: atribuce CC BY se váže
 * k 3D modelu a ten tu neběží. Licenční doložka patří tam, kde se dílo užívá.
 *
 * ★ ODKAZY JSOU TU KVŮLI PROCHÁZENÍ, NE KVŮLI ÚPLNOSTI. Patička je poslední
 *   místo, kde návštěvník ještě může někam jít místo toho, aby zavřel kartu —
 *   a zároveň jediné, které je na každé stránce stejné. Proto z ní vede odkaz
 *   na obě podstránky: dělá to z webu souvislý graf, ne tři ostrovy.
 */
export function PageFooter({ active }: { active?: string }) {
  return (
    <footer className="footer">
      <p className="footer__mark">
        <Mark size={24} />
        <span>
          bejcek<b>.it</b>
        </span>
      </p>
      <p className="footer__links">
        <a href="/">Úvod</a>
        <span aria-hidden="true">·</span>
        {NAV_PAGES.filter((p) => p.href !== active).map((p) => (
          <span className="footer__pair" key={p.href}>
            <a href={p.href}>{p.title}</a>
            <span aria-hidden="true">·</span>
          </span>
        ))}
        <a href={GITHUB} target="_blank" rel="noreferrer">
          <Icon name="github" size={14} />
          github.com/bjkyz
        </a>
        <span aria-hidden="true">·</span>
        {/* ★ Rok se bere z hodin. Prerender běží v Nodu a hydratace v prohlížeči,
            ale obojí ve stejném roce — jediný den, kdy se to může rozejít, je
            Silvestr o půlnoci u návštěvníka s otevřenou kartou. To je přijatelné;
            pevně zapsaný rok, který za rok zestárne, není. */}
        <span>© {new Date().getFullYear()} Jiří Bejček</span>
      </p>
    </footer>
  )
}
