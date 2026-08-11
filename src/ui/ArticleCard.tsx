import type { Article } from '../content/journal'
import { czechDate } from '../content/journal'
import { resolveEntities } from '../content/entities'

/**
 * Karta článku v seznamu.
 *
 * ★ CELÁ KARTA JE ODKAZ, ALE ODKAZ JE JEN JEDEN. Natažený pseudo-element
 *   (`.acard__link::after`) pokrývá kartu, takže se dá kliknout kamkoli, a
 *   přitom má odečítač obrazovky i Google jediný odkaz s pořádným textem
 *   (nadpisem článku). Verze s odkazem kolem celé karty by nahlásila jeden
 *   odkaz obsahující datum, štítky, nadpis i perex — a takový text nikomu nic
 *   neřekne.
 *
 * ★★ ŠTÍTKY TÉMAT NEJSOU ODKAZY, ačkoli rozcestníky témat existují. Odkaz
 *   uvnitř odkazu je neplatné HTML a v praxi past na klikání. Na téma se dá
 *   dostat z rozcestníku nahoře a z drobečků v článku, což je dost.
 */
export default function ArticleCard({ a }: { a: Article }) {
  /* Dvě firmy stačí. Řádek s osmi štítky přestane být informací a stane se
     texturou — a na kartě jde o to, aby se dalo poznat, jestli je to pro mě. */
  const ents = resolveEntities(a.entities).slice(0, 2)

  return (
    <article className="acard">
      <p className="acard__meta label">
        <time dateTime={a.published}>{czechDate(a.published)}</time>
        <span aria-hidden="true">·</span>
        <span>{a.readingMinutes} min čtení</span>
      </p>

      <h2 className="acard__title">
        <a className="acard__link" href={a.path}>
          {a.title}
        </a>
      </h2>

      <p className="acard__perex">{a.perex}</p>

      <p className="acard__tags">
        {a.resolvedTopics.map((t) => (
          <span className="acard__tag label" key={t.slug}>
            {t.label}
          </span>
        ))}
        {ents.map((e) => (
          <span className="acard__tag acard__tag--ent label" key={e.key}>
            {e.entity.name}
          </span>
        ))}
      </p>
    </article>
  )
}
