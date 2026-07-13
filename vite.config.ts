import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
