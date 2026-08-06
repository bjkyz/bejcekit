/**
 * ═══════════ ANONYMIZACE SNÍMKU REFERENCE (NDA) ═══════════
 *
 *   node scripts/blur-refs.mjs <ostrý-snímek.webp> <ref-NN>
 *   → zapíše public/projects/<ref-NN>.webp
 *
 * Vyrábí snímek pro zamčenou kartu na /projekty. Dvě operace v jednom průchodu:
 *
 * 1) GAUSSOVSKÝ BLUR 26 px (na předloze 1440×900). Rozmazává se SOUBOR, ne CSS:
 *    ostrý originál nesmí do sítě vůbec – CSS filtr se dá vypnout jedním
 *    kliknutím v devtools. 26 px nechá čitelnou kompozici a barvy („lehce
 *    poznat, co to je"), ale žádný text ani tvář.
 *
 * 2) RADIÁLNÍ SCRIM POD PLOMBOU (elipsa 52 % × 58 % plochy, střed 0.34 →
 *    0.10 → 0). Dřív ho kreslilo CSS na `.pcard__seal` přes celou obrazovku
 *    karty – per-pixel gradient + alfa-blend při každém rasteru, ×3 karty.
 *    Zapečený do souboru stojí nula za běhu a vypadá stejně.
 *
 * ★ Ostré předlohy se v repu NEVEDOU (viz content/projects.ts). Když je
 *   potřeba snímek přegenerovat, ostrá předloha je v git historii před
 *   zamčením (git show <commit>:public/projects/<klient>.webp) nebo se
 *   pořídí znovu headless Chromem (viz README).
 *
 * Bez závislostí: žádný ImageMagick ani sharp – headless Chrome + canvas
 * přes CDP. Node 24 má globální WebSocket i fetch.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9231
const BLUR = 26

const [src, name] = process.argv.slice(2)
if (!src || !/^ref-\d+$/.test(name ?? '')) {
  console.error('užití: node scripts/blur-refs.mjs <ostrý-snímek.webp> <ref-NN>')
  process.exit(1)
}
const srcAbs = isAbsolute(src) ? src : resolve(process.cwd(), src)
const outAbs = resolve(process.cwd(), `public/projects/${name}.webp`)

const profile = mkdtempSync(join(tmpdir(), 'bjk-blur-'))
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--allow-file-access-from-files',
    '--no-first-run',
    `--user-data-dir=${profile}`,
    'file:///',
  ],
  { stdio: 'ignore' },
)

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('chrome se nenastartoval')
}

const ws = new WebSocket(await wsUrl())
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const mid = ++id
    pending.set(mid, res)
    ws.send(JSON.stringify({ id: mid, method, params }))
    setTimeout(() => {
      if (pending.has(mid)) {
        pending.delete(mid)
        rej(new Error(`${method} timeout`))
      }
    }, 30000)
  })

try {
  /* Přesah kresby o 2× poloměr bluru: rozmazání u hran by jinak vytáhlo
     průhledné okraje. Scrim kreslí elipsu přes scale trik – canvas API umí
     radiální gradient jen kruhový. */
  const expr = `(async () => {
    const img = new Image()
    img.src = 'file://${srcAbs}'
    await img.decode()
    const w = img.naturalWidth, h = img.naturalHeight
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const x = c.getContext('2d')
    const pad = ${BLUR} * 2
    x.filter = 'blur(${BLUR}px)'
    x.drawImage(img, -pad, -pad, w + 2 * pad, h + 2 * pad)
    x.filter = 'none'
    const rx = w * 0.52, ry = h * 0.58
    x.save()
    x.translate(w / 2, h / 2)
    x.scale(1, ry / rx)
    const g = x.createRadialGradient(0, 0, 0, 0, 0, rx)
    g.addColorStop(0, 'rgba(8, 9, 10, 0.34)')
    g.addColorStop(0.62, 'rgba(8, 9, 10, 0.10)')
    g.addColorStop(0.82, 'rgba(8, 9, 10, 0)')
    x.fillStyle = g
    x.fillRect(-w / 2, (-h / 2) * (rx / ry), w, h * (rx / ry))
    x.restore()
    return c.toDataURL('image/webp', 0.8)
  })()`
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  const data = r.result?.result?.value
  if (!data?.startsWith?.('data:image/webp')) {
    throw new Error(`render selhal: ${JSON.stringify(r).slice(0, 400)}`)
  }
  writeFileSync(outAbs, Buffer.from(data.split(',')[1], 'base64'))
  console.log(`${outAbs} zapsán (blur ${BLUR}px + scrim)`)
} finally {
  chrome.kill()
  rmSync(profile, { recursive: true, force: true })
}
