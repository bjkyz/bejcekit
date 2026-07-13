import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * ★ POJISTKA, KTERÁ TU CHYBĚLA — A STÁLA CELÝ WEB.
 *
 * Celá architektura stojí na tvrzení „když plátno smažeš, zbude kompletní web".
 * To ale platilo jen na papíře: bez error boundary probublala JAKÁKOLI výjimka
 * z líně načtené scény až do kořene a React odmontoval CELÝ strom — včetně textu,
 * služeb a kontaktů. Z „webu bez krychle" se stala ČERNÁ OBRAZOVKA.
 *
 * Přesně to se stalo na produkci: CSP na Vercelu zakázala WebAssembly, meshopt
 * dekodér modelu spadl, a s ním i všechno ostatní. Lokálně se to nikdy neukázalo,
 * protože vite dev server žádnou CSP hlavičku neposílá.
 *
 * Boundary MUSÍ obalovat i <Suspense> (ne být uvnitř): React lazy() při selhání
 * síťového requestu na chunk odmítne promise, a to je taky výjimka při renderu.
 *
 * Chytáme tedy úplně všechno:
 *   • CSP / WebAssembly (meshopt, draco)
 *   • 404 nebo poškozený GLB
 *   • selhání stažení JS chunku scény (offline, stará cache po deployi)
 *   • pád ovladače WebGL, chybějící kontext, kruhové reference v postprocessingu
 *
 * Cena za selhání je nově přesně to, co dává smysl: krychle není. Web je.
 */
type Props = { children: ReactNode; onError: () => void }

export default class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Ne console.error — tohle NENÍ chyba webu, je to očekávaná degradace.
    console.warn(
      '[scene] 3D vrstva se nenačetla, web běží dál bez ní.\n',
      error.message,
      info.componentStack,
    )
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
