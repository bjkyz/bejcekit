/**
 * Mikroskopický typovaný emitter. Odděluje snap → puls po hraně → HUD → scramble,
 * aniž by kterákoli z těch věcí způsobila re-render Reactu.
 */
type Events = {
  'face:land': number
  'face:leave': number
}

type Handler<K extends keyof Events> = (payload: Events[K]) => void

const map = new Map<keyof Events, Set<Handler<never>>>()

export const bus = {
  on<K extends keyof Events>(k: K, fn: Handler<K>): () => void {
    let set = map.get(k)
    if (!set) map.set(k, (set = new Set()))
    set.add(fn as Handler<never>)
    return () => {
      set!.delete(fn as Handler<never>)
    }
  },
  emit<K extends keyof Events>(k: K, payload: Events[K]): void {
    const set = map.get(k)
    if (!set) return
    for (const fn of set) (fn as Handler<K>)(payload)
  },
}
