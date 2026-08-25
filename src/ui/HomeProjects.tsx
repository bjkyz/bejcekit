import { m } from 'motion/react'
import { projects } from '../content/i18n'
import { CONTACT_HREF } from '../content/sections'
import { localPath, t } from '../lib/lang'
import Button from './Button'
import { useReducedMotion, useReveal } from '../lib/hooks'
import { revealDelay } from '../lib/reveal'

export default function HomeProjects() {
  const featured = projects().slice(0, 3)
  const reduced = useReducedMotion()
  const sectionRef = useReveal<HTMLElement>(!reduced)

  return (
    <section className="home-work" id="realizace" aria-labelledby="home-work-h" ref={sectionRef}>
      <div className="home-work__inner">
        <header className="home-work__head">
          <p className="kicker label">[ CASE LOG / SELECTED ]</p>
          <h2 className="headline" id="home-work-h">{t({ cs: 'Vybrané realizace.', en: 'Selected work.' })}</h2>
          <p className="body">{t({
            cs: 'Produkční řešení, ne koncepty. Jména klientů kryje mlčenlivost; problém, způsob řešení a technická práce zůstávají konkrétní.',
            en: 'Production systems, not concepts. Client names stay confidential; the problem, solution, and engineering remain concrete.',
          })}</p>
        </header>

        <div className="home-work__grid">
          {featured.map((project, index) => (
            <div className="reveal" style={revealDelay(index, 3)} key={project.id}>
              <m.article className="home-case" initial={false} whileHover={reduced ? undefined : { y: -3 }}>
                <p className="home-case__meta">
                  <span>{project.num}</span>
                  {project.kind}
                </p>
                <h3>{project.name}</h3>
                <dl>
                  <div>
                    <dt>{t({ cs: 'Problém', en: 'Problem' })}</dt>
                    <dd>{project.summary}</dd>
                  </div>
                  <div>
                    <dt>{t({ cs: 'Řešení', en: 'Solution' })}</dt>
                    <dd>{project.facts[0]?.v}</dd>
                  </div>
                  <div>
                    <dt>{t({ cs: 'Výsledek', en: 'Result' })}</dt>
                    <dd>
                      {project.outcome ??
                        t({
                          cs: 'Nasazené produkční řešení, detail na vyžádání.',
                          en: 'A deployed production system, details on request.',
                        })}
                    </dd>
                  </div>
                </dl>
                <ul className="home-case__stack">
                  {project.stack.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </m.article>
            </div>
          ))}
        </div>

        <div className="home-work__actions">
          <Button href={localPath('/projekty')} variant="secondary" arrow="right">
            {t({ cs: 'Prohlédnout všechny projekty', en: 'View all work' })}
          </Button>
          <Button href={localPath(CONTACT_HREF)} variant="text" arrow="right">
            {t({ cs: 'Probrat podobný projekt', en: 'Discuss a similar project' })}
          </Button>
        </div>
      </div>
    </section>
  )
}
