import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * ★ CSS SE INLINUJE DO index.html. Celý stylesheet má ~5.6 kB gz — MÉNĚ než jedna
 * síťová otočka na pomalém mobilu. Jako samostatný <link> je render-blokující:
 * prohlížeč na něj čeká s prvním vykreslením ~150–300 ms, které HTML o 7 kB
 * větší vůbec nestojí. HTML se stejně cachuje s max-age=0, takže se tím nic
 * nerozbíjí. (CSP už 'unsafe-inline' pro styly povoluje, viz vercel.json.)
 *
 * Dělá se to v closeBundle nad hotovým dist/ — Rolldown (Vite 8) volá
 * transformIndexHtml dřív než generateBundle, takže elegantnější cesta přes
 * bundle hooky tiše vyrobila HTML bez stylů. Tohle je hloupé a neprůstřelné.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const assets = resolve(dist, 'assets')
      const cssFiles = readdirSync(assets).filter((f) => f.endsWith('.css'))
      if (cssFiles.length === 0) return
      const css = cssFiles.map((f) => readFileSync(resolve(assets, f), 'utf8')).join('')
      const htmlPath = resolve(dist, 'index.html')
      const html = readFileSync(htmlPath, 'utf8')
        .replace(/[ \t]*<link[^>]*rel="stylesheet"[^>]*>\s*/g, '')
        .replace('</head>', `<style>${css}</style>\n</head>`)
      writeFileSync(htmlPath, html)
      for (const f of cssFiles) rmSync(resolve(assets, f))
    },
  }
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  // Keeps the dev server from re-optimising (and full-reloading) mid-session.
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing'],
  },
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vite 8 běží na Rolldownu, který `manualChunks` sice zavolá, ale výsledek
        // si pak přeskupí sám (three končilo slepené v postprocessing chunku).
        // `advancedChunks` je nativní API Rolldownu a drží. Dělíme těžké knihovny
        // JMENOVITĚ — plošný `vendor` chunk by rozbil code-splitting.
        codeSplitting: {
          /* ★ POŘADÍ ROZHODUJE — vyhrává první shoda.
             `react` MUSÍ být první. Bez toho Rolldown přilepí react-dom do chunku
             s @react-three, hlavní bundle si ten chunk kvůli createRoot vytáhne
             STATICKY — a s ním celou three.js. Líné načítání scény je pak k ničemu
             a Vite navíc vloží modulepreload na 330 kB, které stránka k vykreslení
             textu vůbec nepotřebuje.
             Koncové [\\/] je podstatné: „react/" se nesmí trefit do
             „react-reconciler/", který patří ke scéně, ne k Reactu. */
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'three-stdlib', test: /node_modules[\\/]three-stdlib[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/ },
            { name: 'postprocessing', test: /node_modules[\\/]postprocessing[\\/]/ },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
