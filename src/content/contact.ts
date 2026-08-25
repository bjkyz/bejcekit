/**
 * ═══════════ OBSAH A KONFIGURACE STRÁNKY /kontakt ═══════════
 *
 * ★★ PROČ VLASTNÍ STRÁNKA A NE KOTVA `#kontakt` NA ÚVODU.
 *
 * Do téhle chvíle vedly všechny výzvy k akci na kotvu — tedy na SCROLL přes pět
 * obrazovek 3D scény. To má tři vady, a žádná z nich není estetická:
 *   • kotva nemá vlastní URL, takže se nedá poslat, změřit ani inzerovat
 *   • na telefonu je scroll přes pět sekcí s WebGL to nejdražší, co se dá po
 *     člověku chtít přesně ve chvíli, kdy se rozhodl napsat
 *   • cíl byl `mailto:`, což je nejvyšší práh, jaký kontaktní cesta může mít —
 *     otevře se cizí aplikace, prázdné okno a otázka „co mám napsat"
 *
 * Formulář ten práh sundá na tři pole. Kanály zůstanou vedle něj pro toho,
 * kdo formuláře zásadně nevyplňuje.
 *
 * ★ ŽÁDNÉ DLOUHÉ POMLČKY (—), stejně jako v content/sections.ts.
 */

import { EMAIL, PHONE, PHONE_TEL, WHATSAPP } from './sections'
import type { IconName } from '../ui/Icons'

/** Cesta stránky. Čte ji navigace, patičky, CTA sekcí i sitemapa. */
export const CONTACT_PATH = '/kontakt'

/**
 * ★★ KAM SE FORMULÁŘ ODESÍLÁ. Musí to být stejná adresa v `action` atributu
 *   i ve `fetch()` — právě proto je tady, a ne dvakrát v komponentě.
 *   Bez JS odešle prohlížeč obyčejný POST na tuhle cestu (viz `api/contact.ts`,
 *   který na `Accept: text/html` odpoví přesměrováním, ne JSONem).
 */
export const CONTACT_ENDPOINT = '/api/contact'

/**
 * ★★★ HONEYPOT. Pole, které je pro člověka neviditelné a pro robota lákavé.
 *
 * Jméno musí vypadat jako běžné pole formuláře — `website` je klasika, protože
 * roboti se ho snaží vyplnit skoro vždycky. Kdyby se jmenovalo `honeypot`,
 * kterýkoli trochu chytřejší skript ho přeskočí.
 *
 * ★ SKRÝVÁ SE CSS TŘÍDOU, NE `type="hidden"`. Skryté pole robot pozná podle
 *   typu a nevyplní ho; vizuálně odsunuté pole vypadá v DOM úplně normálně.
 *   K tomu `tabindex={-1}` a `autocomplete="off"`, aby na něj nešlo tabovat
 *   a aby ho prohlížeč sám nepředvyplnil skutečnému člověku.
 */
export const HONEYPOT_FIELD = 'website'

/** Meze, které musí platit stejně na klientovi i na serveru. */
export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 160 },
  company: { max: 120 },
  /** 20 znaků je práh smysluplnosti: „ahoj" poptávka není. */
  message: { min: 20, max: 4000 },
} as const

/**
 * ★ ČÍM ZAČÍT. Nepovinné, ale zdaleka nejužitečnější pole na stránce.
 *
 * Není to segmentace pro CRM, je to POMŮCKA PRO PISATELE: prázdné textové pole
 * je nejtěžší část každého formuláře („co mám napsat?"). Když si člověk nejdřív
 * klikne na téma, má o čem psát a zpráva je konkrétnější.
 * Hodnoty jsou stabilní klíče (do e-mailu i pro případné měření), popisky se
 * překládají.
 */
export const INQUIRY_KINDS: { value: string; label: string }[] = [
  { value: 'ai', label: 'AI do firmy' },
  { value: 'automatizace', label: 'Automatizace procesu' },
  { value: 'software', label: 'Software na míru' },
  { value: 'web', label: 'Web nebo aplikace' },
  { value: 'nevim', label: 'Zatím nevím' },
]

/**
 * Kanály vedle formuláře. Pořadí je záměr, ne abeceda: nejrychlejší nahoře.
 * GitHub tu není — to je důkaz, ne kanál, a patří do patičky.
 */
export const CONTACT_CHANNELS_PAGE: {
  label: string
  value: string
  note: string
  href: string
  icon: IconName
  tone?: 'green'
}[] = [
  {
    label: 'WhatsApp',
    value: PHONE,
    note: 'Nejrychlejší. Napište i jednu větu.',
    href: WHATSAPP,
    icon: 'whatsapp',
    tone: 'green',
  },
  { label: 'Telefon', value: PHONE, note: 'Volejte rovnou mně, nikdo to nepřepojuje.', href: `tel:${PHONE_TEL}`, icon: 'phone' },
  { label: 'E-mail', value: EMAIL, note: 'Když radši píšete z vlastní schránky.', href: `mailto:${EMAIL}`, icon: 'mail' },
]

/**
 * ★ CO SE STANE POTOM. Tři kroky pod formulářem.
 *
 * Nejčastější důvod, proč se člověk formuláři vyhne, není nedůvěra, ale
 * NEJISTOTA: netuší, co odesláním spustí. Kdo ví, že první krok je nezávazná
 * odpověď do 24 hodin a ne obchodník na telefonu, odešle spíš.
 */
export const WHAT_HAPPENS: { k: string; v: string }[] = [
  { k: 'Do 24 hodin', v: 'Odpovím vám osobně. I o víkendu.' },
  { k: 'Úvodní hovor', v: 'Zdarma a nezávazně. Ujasníme si problém a cíl.' },
  { k: 'Cena a termín', v: 'Dostanete je písemně před začátkem.' },
]

/**
 * ★★ ČASTÉ DOTAZY. Kromě toho, že sundávají námitky, jsou to jediná
 *   strukturovaná data typu FAQPage mimo články — a kontakt je ta stránka,
 *   která má vydělávat. Odpovědi musí zůstat pravdivé a doložitelné.
 */
export const CONTACT_FAQ: { q: string; a: string }[] = [
  {
    q: 'Kolik to bude stát?',
    a: 'Menší automatizace začínají v desítkách tisíc korun, software na míru se odvíjí od rozsahu. Přesnou cenu dostanete písemně před začátkem.',
  },
  {
    q: 'Musím vědět, co přesně chci?',
    a: 'Ne. Stačí popsat, co dnes děláte ručně nebo co vás zdržuje. Technické zadání připravím já.',
  },
  {
    q: 'Jak dlouho to trvá?',
    a: 'Menší automatizace obvykle trvají několik týdnů, software na míru měsíce. Běžící verzi nasazuji průběžně.',
  },
  {
    q: 'Pracujete i mimo Prahu?',
    a: 'Ano, celé Česko. Většina práce běží remote, na schůzku dojedu, když dává smysl.',
  },
  {
    q: 'Co když na to nejste ten pravý?',
    a: 'Řeknu to rovnou a doporučím vhodnější cestu. Zakázku bez smysluplného přínosu nevezmu.',
  },
  {
    q: 'Komu patří výsledný kód?',
    a: 'Vám. Dostanete zdrojový kód, přístupy i dokumentaci, takže nejste závislí na jednom dodavateli.',
  },
]
