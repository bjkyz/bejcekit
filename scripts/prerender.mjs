/**
 * ═══════════ BUILD-TIME PRERENDER ═══════════
 *
 * Běží PO `vite build` (viz package.json) a plní <div id="root"> v hotových
 * dist/*.html vyrenderovaným obsahem stránky. Klient pak jen hydratuje.
 *
 * Mechanika: Vite dev server v middleware režimu umí přes ssrLoadModule
 * spustit TSX přímo v Nodu — žádný druhý produkční build, žádný dist-ssr.
 * Render sdílí týž zdrojový strom jako klient, takže se nemá jak rozejít.
 *
 * ★ MUSÍ BĚŽET AŽ PO inlineCss/siteOrigin (oba jedou v closeBundle uvnitř
 *   `vite build`): vkládá se do finálního HTML s inline styly a dosazenou
 *   adresou. Vložení je čistá náhrada řetězce, ničemu dalšímu nesahá na disk.
 *
 * ★★ KDYŽ RENDER SPADNE, BUILD MUSÍ SPADNOUT TAKY (exit 1). Tichý fallback
 *   na prázdný root by znamenal, že se regrese pozná až z horšího Lighthouse
 *   v produkci — přesně ten druh chyby, který nikdo nehledá.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const dist = resolve(process.cwd(), 'dist')

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  // Bez logu: dev server tu je jen kompilátor TSX→JS pro jeden import.
  logLevel: 'error',
})

try {
  const { PAGES } = await vite.ssrLoadModule('/src/entry-prerender.tsx')
  for (const [page, render] of Object.entries(PAGES)) {
    const file = resolve(dist, page)
    const html = readFileSync(file, 'utf8')
    const marker = '<div id="root"></div>'
    if (!html.includes(marker)) {
      throw new Error(`${page}: nenalezen prázdný #root — prerender už proběhl, nebo se změnil template`)
    }
    const app = render()
    writeFileSync(file, html.replace(marker, `<div id="root">${app}</div>`))
    console.log(`prerender: ${page} +${(app.length / 1024).toFixed(1)} kB HTML`)
  }
} catch (err) {
  console.error('prerender selhal:', err)
  process.exitCode = 1
} finally {
  await vite.close()
}
