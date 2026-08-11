import { Fragment, type ReactNode } from 'react'
import { ENTITIES } from '../content/entities'
import type { Block } from '../content/journal'

/**
 * ═══════════ TĚLO ČLÁNKU ═══════════
 *
 * ★ ČLÁNEK NENÍ HTML, JE TO SEZNAM BLOKŮ. Text píše robot (viz
 *   `api/cron/publish-article.ts`) a kdyby směl zapsat HTML, byla by to
 *   nejpřímější cesta k injektáži skriptu na vlastní web — a taky k rozbité
 *   typografii, protože by si po čase začal vymýšlet vlastní třídy. Blok má
 *   pět tvarů, každý má jeden vzhled a nic víc se do článku dostat nedá.
 *
 * ★★ ZNAČKOVÁNÍ FIREM: `[[klíč]]` NEBO `[[klíč|tvar slova]]`.
 *
 *   V textu se firma nepíše jménem, ale klíčem do rejstříku
 *   (`content/entities.ts`). Má to dva důvody a oba jsou podstatné:
 *
 *   • Čeština SKLOŇUJE. „od [[google|Googlu]]", „podle [[anthropic|Anthropicu]]" —
 *     bez druhé části zápisu by článek psal „od Google" a četlo by se to jako
 *     strojový překlad. Zobrazuje se druhá část, do dat jde první.
 *
 *   • Jméno v textu a entita ve strukturovaných datech se NEMŮŽOU rozejít,
 *     protože pocházejí z jednoho zápisu. Kdyby se seznam `entities` v JSONu
 *     udržoval zvlášť od textu, po deseti článcích by v něm byly firmy, které
 *     v textu nejsou, a naopak.
 *
 *   Neznámý klíč se vykreslí jako obyčejný text. Tichý výpadek je tu správně:
 *   překlep v klíči nemá shodit článek, jen přijít o zvýraznění.
 */

/** `[[klic]]` nebo `[[klic|zobrazený tvar]]` */
const ENT = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g

/**
 * Rozseká text na kusy a značky firem. Vrací pole uzlů, ne HTML —
 * `dangerouslySetInnerHTML` se v tomhle souboru nesmí objevit ani jednou.
 */
export function markup(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  ENT.lastIndex = 0
  while ((m = ENT.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = m[1]
    const label = m[2] ?? ENTITIES[key as keyof typeof ENTITIES]?.name ?? m[1]
    out.push(
      ENTITIES[key as keyof typeof ENTITIES] ? (
        <span className="ent" key={`${key}-${m.index}`}>
          {label}
        </span>
      ) : (
        <Fragment key={`x-${m.index}`}>{label}</Fragment>
      ),
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'h2':
            /* ★ id z pořadí, ne ze jména. Nadpisy se dají odkázat kotvou, ale
               přejmenování nadpisu nesmí rozbít odkaz — pořadové id je stabilní
               vůči úpravě textu a nesrozumitelné jen tomu, kdo ho nečte. */
            return (
              <h2 className="art__h2" id={`kap-${i}`} key={i}>
                {markup(b.text)}
              </h2>
            )
          case 'ul':
            return (
              <ul className="art__list" key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{markup(it)}</li>
                ))}
              </ul>
            )
          case 'quote':
            return (
              <figure className="art__quote" key={i}>
                <blockquote>{markup(b.text)}</blockquote>
                {b.cite && <figcaption className="label">{b.cite}</figcaption>}
              </figure>
            )
          case 'note':
            /* Deska s rámečkem. Jediné místo v článku, kde text stojí v krabici —
               ze stejného důvodu jako sekce 05 na úvodu: krabice kolem textu je
               nejrychlejší způsob, jak z webu udělat administraci, takže se
               vyplatí jen tam, kde má význam „tohle je jiný druh věty". */
            return (
              <aside className="art__note" key={i}>
                <p className="art__note-k label">{b.k}</p>
                <p>{markup(b.text)}</p>
              </aside>
            )
          default:
            return (
              <p className="art__p" key={i}>
                {markup(b.text)}
              </p>
            )
        }
      })}
    </>
  )
}
