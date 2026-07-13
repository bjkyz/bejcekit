import { Color } from 'three'

/**
 * Barvy scény jako THREE.Color — memoizované. Nikdy `new Color()` uvnitř renderu.
 *
 * ★ ŽIJÍ TADY, NE V lib/scene-state.ts. Ten stav si čte i HUD a preloader
 *   (hlavní bundle) — a kdyby s sebou tahal `import { Color } from 'three'`,
 *   přitáhne celou three.js na kritickou cestu prvního vykreslení a všechna
 *   práce s líným načítáním scény je k ničemu.
 *   Pravidlo: lib/ nesmí importovat three jako hodnotu. Jen typy.
 */
export const VOID = new Color('#08090a')
export const CYAN = new Color('#4fd8e8')
export const HOT = new Color('#b8f5ff')
export const RIM = new Color('#52aeff')
export const AMBI = new Color('#0b1a22')
