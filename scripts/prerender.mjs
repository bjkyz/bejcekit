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
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createServer } from 'vite'

const dist = resolve(process.cwd(), 'dist')

/**
 * ★ POJISTKA NDA. Reference jsou anonymizované (src/content/projects.ts) a
 * jména klientů NESMÍ do žádného textového souboru v dist/ — ani do HTML,
 * ani do llms.txt nebo strukturovaných dat. Data to vynucují typem, jenže
 * `noscript` v projekty.html a llms.txt jsou ručně psané kopie a tenhle
 * seznam je jediné místo, které je hlídá. Když se jméno objeví, build spadne —
 * únik pod NDA se má poznat tady, ne od klienta.
 * Při přidání zamčené reference sem přidej klientovy identifikátory.
 */
const NDA_BLOCKLIST = ['superadvokat', 'tutter', 'slyx']

function checkNda(root) {
  const offenders = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (['.html', '.txt', '.xml', '.json', '.js', '.css', '.webmanifest'].includes(extname(entry.name))) {
        const body = readFileSync(path, 'utf8').toLowerCase()
        for (const term of NDA_BLOCKLIST) if (body.includes(term)) offenders.push(`${path}: „${term}"`)
      }
    }
  }
  walk(root)
  if (offenders.length) {
    throw new Error(`NDA kontrola: jméno klienta uniklo do buildu –\n  ${offenders.join('\n  ')}`)
  }
}

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
  checkNda(dist)
  console.log('prerender: NDA kontrola čistá')
} catch (err) {
  console.error('prerender selhal:', err)
  process.exitCode = 1
} finally {
  await vite.close()
}
