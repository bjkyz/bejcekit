/**
 * Miniaturní store průběhu načítání.
 *
 * ★ PROČ VŮBEC EXISTUJE: preloader potřebuje znát průběh, ale drei's `useProgress`
 *   by si do HLAVNÍHO bundlu přitáhlo drei → a s ním three. Tím by celá 3D knihovna
 *   seděla na kritické cestě prvního vykreslení a Lighthouse by to (právem) trestal.
 *
 *   Takhle je to obráceně: `useProgress` volá až komponenta UVNITŘ líně načtené
 *   scény a výsledek sem jen zapisuje. Preloader si ho odsud přečte a o three
 *   nemá ani tušení.
 */
type Listener = (progress: number, active: boolean) => void

let progress = 0
let active = true
const listeners = new Set<Listener>()

export function setLoading(p: number, a: boolean): void {
  if (p === progress && a === active) return
  progress = p
  active = a
  for (const fn of listeners) fn(progress, active)
}

export function subscribeLoading(fn: Listener): () => void {
  listeners.add(fn)
  fn(progress, active)
  return () => {
    listeners.delete(fn)
  }
}
