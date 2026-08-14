/**
 * ═══════════ OBSAH PODLE JAZYKA ═══════════
 *
 * ★★★ JEDNO MÍSTO, KDE SE ČESKÝ A ANGLICKÝ OBSAH POTKÁVAJÍ.
 *
 * České texty žijí v `sections.ts`, `services.ts`, `projects.ts` a `contact.ts`,
 * anglické v `en.ts`. Komponenty ale nesmí vědět ani o jednom souboru: kdyby si
 * každá vybírala sama, byla by to podmínka na dvaceti místech a první, co by se
 * stalo, je poloviční překlad — anglická stránka s českým tlačítkem.
 *
 * ★★ ANGLICKÁ DATA JSOU JEN TEXTY, NE CELÉ ZÁZNAMY. `en.ts` neobsahuje `align`,
 *   `href`, rozměry snímků ani `stack` — tedy nic, co je STAVBA, ne obsah.
 *   Merge níž proto bere kostru z české verze a přepisuje v ní jen slova.
 *   Důsledek, na kterém záleží: když se přidá sekce, karta nebo skupina služeb,
 *   anglická verze se NEROZBIJE. Ukáže na tom místě češtinu, dokud překlad
 *   nedorazí — a chybějící překlad je vada obsahu, ne pád stránky.
 *
 * ★ ODKAZY SE PŘEKLÁDAJÍ PŘES `localPath()` (lib/lang.ts), ne ručně. Obsah tedy
 *   dál píše `/kontakt` a na anglické verzi z toho vyjde `/en/contact`.
 *
 * ★ FUNKCE, NE KONSTANTY. Jazyk se nastavuje až za běhu (vstupní bod v prohlížeči,
 *   prerender na serveru), takže hodnota spočítaná při importu modulu by byla
 *   vždycky česká. Volá se to při renderu, kde už jazyk platí.
 */

import { isEn, localPath } from '../lib/lang'
import {
  CERTIFICATE,
  SERVICE_GROUPS,
  TECH_STACK,
  type ServiceGroup,
} from './services'
import { CONTACT_CHANNELS, NAV_PAGES, SECTIONS, type Section } from './sections'
import { LOCKED_DOMAIN, PROJECTS, type Project } from './projects'
import { CONTACT_CHANNELS_PAGE, CONTACT_FAQ, INQUIRY_KINDS, WHAT_HAPPENS } from './contact'
import {
  CERTIFICATE_EN,
  CONTACT_EN,
  LOCKED_DOMAIN_EN,
  PROJECT_CARD_EN,
  PROJECTS_EN,
  SECTIONS_EN,
  SERVICE_GROUPS_EN,
  TECH_STACK_EN,
  UI_EN,
} from './en'

/** Malá pomůcka: `readonly {k,v}[]` z `as const` na zapisovatelné pole. */
const pairs = (list: readonly { k: string; v: string }[]) => list.map((x) => ({ k: x.k, v: x.v }))

/* ═══════════ ÚVODNÍ STRÁNKA ═══════════ */

/**
 * Šest sekcí krychle. ★ POČET SE NESMÍ LIŠIT MEZI JAZYKY — stěna i vykresluje
 * sekci i, takže sedmá položka scénu shodí a pátá by nechala kameru viset.
 * Merge to drží strukturálně: iteruje se přes ČESKÉ pole a anglické texty se
 * doplňují podle pořadí.
 */
export function sections(): Section[] {
  if (!isEn()) return SECTIONS
  return SECTIONS.map((cs, i) => {
    const en = SECTIONS_EN[i]
    if (!en) return cs
    return {
      ...cs,
      kicker: en.kicker,
      plateCode: en.plateCode,
      plateNum: en.plateNum,
      headline: en.headline,
      body: en.body,
      bullets: [...en.bullets],
      subsystem: en.subsystem,
      ...('specs' in en && en.specs ? { specs: pairs(en.specs) } : {}),
      ...('status' in en && en.status ? { status: en.status } : {}),
      ...('proof' in en && en.proof ? { proof: en.proof } : {}),
      ...('deliverable' in en && en.deliverable
        ? { deliverable: { label: en.deliverable.label, text: en.deliverable.text } }
        : {}),
      ...('steps' in en && en.steps ? { steps: en.steps.map((s) => ({ title: s.title, text: s.text })) } : {}),
      ...('stack' in en && en.stack ? { stack: [...en.stack] } : {}),
      ...(cs.cta && 'cta' in en && en.cta ? { cta: { label: en.cta.label, href: localPath(cs.cta.href) } } : {}),
      ...(cs.ghostCta && 'ghostCta' in en && en.ghostCta
        ? { ghostCta: { label: en.ghostCta.label, href: localPath(cs.ghostCta.href) } }
        : {}),
    }
  })
}

/**
 * Podstránky v liště. Cíle se překládají, žurnál zůstává český (viz ROUTES).
 *
 * ★★ `foreign` ZNAČÍ ODKAZ, KTERÝ VEDE DO JINÉHO JAZYKA. Týká se právě jednoho
 *   cíle — žurnálu z anglické verze — a není to detail: odkaz, který beze slova
 *   vysype anglického návštěvníka na české články, je nejotravnější druh
 *   překvapení, jaké navigace umí. Vizuálně se lišta nemění (verzálkové „JOURNAL
 *   (CZ)" by z pěti položek udělalo šest), ale odkaz dostane `hreflang` a text
 *   pro odečítač — takže o tom ví jak člověk s odečítačem, tak vyhledávač.
 *   V patičce a v menu, kde je místo, se to řekne rovnou v názvu.
 */
export function navPages(): { label: string; title: string; href: string; foreign?: boolean }[] {
  if (!isEn()) return NAV_PAGES
  return NAV_PAGES.map((p, i) => {
    const en = UI_EN.nav.NAV_PAGES[i]
    const href = localPath(p.href)
    /* `localPath` vrátil TÚTÉŽ cestu → v tomhle jazyce protějšek neexistuje. */
    const foreign = href === p.href && p.href !== '/'
    return {
      label: en?.label ?? p.label,
      title: foreign ? `${en?.title ?? p.title} (Czech)` : (en?.title ?? p.title),
      href,
      ...(foreign ? { foreign: true } : {}),
    }
  })
}

/* ═══════════ /sluzby ═══════════ */

export function serviceGroups(): ServiceGroup[] {
  if (!isEn()) return SERVICE_GROUPS
  return SERVICE_GROUPS.map((cs, i) => {
    const en = SERVICE_GROUPS_EN[i]
    if (!en) return cs
    return {
      ...cs,
      code: en.code,
      title: en.title,
      lead: en.lead,
      items: pairs(en.items),
      ...(en.punch ? { punch: en.punch } : {}),
    }
  })
}

export function techStack(): { group: string; items: string[] }[] {
  if (!isEn()) return TECH_STACK
  return TECH_STACK.map((cs, i) => {
    const en = TECH_STACK_EN[i]
    return en ? { group: en.group, items: [...en.items] } : cs
  })
}

/**
 * Certifikát. ★ Název, vydavatel a soubor jsou vlastní jména — nepřekládají se.
 *
 * ★★ VLASTNÍ ROZHRANÍ, NE `typeof CERTIFICATE`. Zdrojová data jsou `as const`,
 *   takže z `topics` je n-tice DOSLOVNÝCH ŘETĚZCŮ („Architektura a principy AI
 *   agentů" jako TYP) a anglická verze se do ní nemá jak vejít. Widening je tady
 *   ta správná operace: komponenta potřebuje seznam řetězců, ne důkaz, které
 *   konkrétní řetězce to jsou.
 */
export interface CertificateView {
  title: string
  issuer: string
  date: string
  topics: string[]
  facts: { k: string; v: string }[]
  pdf: string
  image: string
  imageW: number
  imageH: number
}

export function certificate(): CertificateView {
  const src = isEn() ? CERTIFICATE_EN : CERTIFICATE
  return {
    title: CERTIFICATE.title,
    issuer: CERTIFICATE.issuer,
    date: CERTIFICATE.date,
    pdf: CERTIFICATE.pdf,
    image: CERTIFICATE.image,
    imageW: CERTIFICATE.imageW,
    imageH: CERTIFICATE.imageH,
    topics: [...src.topics],
    facts: pairs(src.facts),
  }
}

/* ═══════════ /projekty ═══════════ */

/**
 * ★★ NDA PLATÍ V OBOU JAZYCÍCH. Merge sahá jen na texty; `src` snímku, plomba
 *   `locked` ani chybějící `href` se z anglické verze nedají přepsat, protože
 *   tam ta pole vůbec nejsou. Typový svaz z `projects.ts` tím zůstává v platnosti.
 */
export function projects(): Project[] {
  if (!isEn()) return PROJECTS
  return PROJECTS.map((p) => {
    const en = PROJECTS_EN.find((x) => x.id === p.id)
    if (!en) return p
    const text = {
      name: en.name,
      kind: en.kind,
      summary: en.summary,
      facts: pairs(en.facts),
    }
    return p.locked
      ? { ...p, ...text, shot: { ...p.shot, alt: en.shot.alt } }
      : { ...p, ...text, shot: { ...p.shot, alt: en.shot.alt }, domain: 'domain' in en ? en.domain : p.domain }
  })
}

export function lockedDomain(): string {
  return isEn() ? LOCKED_DOMAIN_EN : LOCKED_DOMAIN
}

/** Štítky karty projektu. Drží pohromadě plombu, kontrolku a texty pro odečítač. */
export function projectCardLabels() {
  return isEn()
    ? {
        ndaSeal: PROJECT_CARD_EN.ndaSeal,
        detailOnRequest: PROJECT_CARD_EN.detailOnRequest,
        live: PROJECT_CARD_EN.live,
        outcome: PROJECT_CARD_EN.outcome,
        srLocked: PROJECT_CARD_EN.srLocked,
        srExternal: PROJECT_CARD_EN.srExternal,
      }
    : {
        ndaSeal: 'Chráněno NDA',
        detailOnRequest: 'Detail na vyžádání',
        live: 'živá ukázka',
        outcome: 'Výsledek',
        srLocked: ' (pod NDA, detail na vyžádání)',
        srExternal: ' (otevře se v nové kartě)',
      }
}

/* ═══════════ /kontakt ═══════════ */

/**
 * ★ HODNOTY (`value`) ZŮSTÁVAJÍ ČESKÉ I V ANGLICKÉ VERZI. Jsou to stabilní klíče,
 *   které chodí do e-mailu a které kontroluje `api/contact.ts` (a ten se
 *   schválně na nic neimportuje). Překládá se popisek, ne klíč.
 */
export function inquiryKinds(): { value: string; label: string }[] {
  if (!isEn()) return INQUIRY_KINDS
  return INQUIRY_KINDS.map((k, i) => ({ value: k.value, label: CONTACT_EN.INQUIRY_KINDS[i]?.label ?? k.label }))
}

export function contactChannelsPage(): typeof CONTACT_CHANNELS_PAGE {
  if (!isEn()) return CONTACT_CHANNELS_PAGE
  return CONTACT_CHANNELS_PAGE.map((c, i) => ({
    ...c,
    label: CONTACT_EN.CONTACT_CHANNELS_PAGE[i]?.label ?? c.label,
    note: CONTACT_EN.CONTACT_CHANNELS_PAGE[i]?.note ?? c.note,
  }))
}

/**
 * Kanály v závěru krychle (sekce 05). ★ `content/en.ts` je nemá — přeložené tam
 * jsou jen kanály na stránce `/kontakt`, které mají jiné, delší poznámky. Dvě
 * různá místa, dva různé texty; překlad proto bydlí tady, u toho svého.
 * ★ „WhatsApp" se nepřekládá, je to vlastní jméno.
 */
export function contactChannelsHome(): typeof CONTACT_CHANNELS {
  if (!isEn()) return CONTACT_CHANNELS
  const en = [
    { label: 'WhatsApp', note: 'Fastest way to reach me' },
    { label: 'Phone', note: 'You get me directly' },
  ]
  return CONTACT_CHANNELS.map((c, i) => ({ ...c, label: en[i]?.label ?? c.label, note: en[i]?.note ?? c.note }))
}

export function whatHappens(): { k: string; v: string }[] {
  return isEn() ? pairs(CONTACT_EN.WHAT_HAPPENS) : WHAT_HAPPENS
}

export function contactFaq(): { q: string; a: string }[] {
  return isEn() ? CONTACT_EN.CONTACT_FAQ.map((f) => ({ q: f.q, a: f.a })) : CONTACT_FAQ
}
