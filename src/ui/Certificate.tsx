import { certificate } from '../content/i18n'
import { t } from '../lib/lang'
import Icon from './Icons'

/**
 * ═══════════ CERTIFIKÁT ═══════════
 *
 * ★★ DOKLAD SE MÁ DÁT OTEVŘÍT, JINAK JE TO JEN OBRÁZEK. Náhled je proto
 *   odkaz na skutečné PDF s QR kódem vydavatele. Certifikát, který nejde
 *   ověřit, je na obchodní stránce spíš přítěž: čtenář ho podvědomě přečte
 *   jako ozdobu a přestane věřit i tomu, co je kolem.
 *
 * ★ OBRÁZEK MÁ `width`/`height` A `loading="lazy"`. Rozměry drží poměr stran
 *   z HTML, takže se layout nehne, až soubor doteče (CLS). Lazy proto, že blok
 *   stojí hluboko pod ohybem a 113 kB nemá co dělat na kritické cestě.
 *
 * ★ SVĚTLÝ DOKUMENT NA TMAVÉM WEBU je jediné místo, kde se to děje. Neřeší se
 *   to ztlumením (šedý certifikát vypadá jako neplatný), ale rámem a zářivým
 *   podkladem: dokument má vypadat jako dokument položený na stole.
 */
export default function Certificate() {
  const C = certificate()
  return (
    <figure className="cert">
      <a className="cert__shot" href={C.pdf} target="_blank" rel="noreferrer">
        <img
          src={C.image}
          width={C.imageW}
          height={C.imageH}
          loading="lazy"
          decoding="async"
          alt={t({
            cs: `Certifikát ${C.title} vydaný ${C.issuer} pro Jiřího Bejčka, 20 vyučovacích hodin.`,
            en: `${C.title} certificate issued by ${C.issuer} to Jiří Bejček, 20 hours of instruction.`,
          })}
        />
        <span className="cert__open label">
          <Icon name="external" size={13} />
          {t({ cs: 'Otevřít certifikát', en: 'Open certificate' })}
        </span>
      </a>

      <figcaption className="cert__body">
        <p className="cert__kicker label">{t({ cs: 'Doložená kvalifikace', en: 'Verified credential' })}</p>
        <h3 className="cert__title">{C.title}</h3>
        <p className="cert__issuer label">{C.issuer}</p>

        <ul className="cert__facts">
          {C.facts.map((f) => (
            <li key={f.k}>
              <span className="cert__fact-k label">{f.k}</span>
              <span className="cert__fact-v">{f.v}</span>
            </li>
          ))}
        </ul>

        <p className="cert__lead">{t({ cs: 'Co kurz obsahoval:', en: 'What the course covered:' })}</p>
        <ul className="cert__topics">
          {C.topics.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
