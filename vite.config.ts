import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * ★★ ADRESA WEBU SE PŘESTĚHOVALA DO `src/lib/site.ts`.
 *
 * Bydlela tady, dokud ji potřeboval jen build. Od přidání žurnálu ji potřebuje
 * i `scripts/prerender.mjs` (sitemapa, RSS, strukturovaná data každého článku)
 * a ten se konfigurace na její konstanty zeptat neumí — Vite vrací resolvovanou
 * konfiguraci, ne modul. Adresa by tedy musela být napsaná dvakrát, a přesně
 * proti tomu celá tahle konstrukce vznikla.
 *
 * ★ AŽ SE KOUPÍ `bejcek.it`, MĚNÍ SE JEN JEDEN ŘÁDEK — v `src/lib/site.ts`.
 */
import { SITE_ORIGIN } from './src/lib/site.js'

/**
 * Soubory v public/ se kopírují doslova, takže se v nich token nahrazuje až nad dist/.
 * ★ `sitemap.xml` v seznamu SCHVÁLNĚ NENÍ: od přidání žurnálu se generuje
 *   v prerenderu z reálného seznamu článků (viz scripts/prerender.mjs).
 */
const ORIGIN_FILES = ['robots.txt', 'llms.txt']
const TOKEN = /__SITE_ORIGIN__/g

/**
 * Dosadí SITE_ORIGIN za `__SITE_ORIGIN__`.
 *
 * index.html jde přes transformIndexHtml, protože ten běží i v dev režimu —
 * placeholder se tedy nikdy neukáže v prohlížeči. Statické soubory z public/
 * Vite kopíruje beze změny, ty se proto přepisují až v closeBundle nad hotovým
 * dist/ (stejný postup jako inlineCss níž a ze stejného důvodu).
 *
 * ★ configureServer NENÍ kosmetika: bez něj by `npm run dev` servíroval
 *   robots.txt a sitemap.xml s doslovným „__SITE_ORIGIN__" a vypadalo by to
 *   jako rozbitý build. Dev se musí chovat stejně jako produkce, jinak se
 *   rozdíl dřív nebo později pošle ven.
 */
function siteOrigin(): Plugin {
  return {
    name: 'site-origin',
    transformIndexHtml(html) {
      return html.replace(TOKEN, SITE_ORIGIN)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!ORIGIN_FILES.includes(name)) return next()
        const file = resolve(process.cwd(), 'public', name)
        if (!existsSync(file)) return next()
        res.setHeader('Content-Type', name.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8')
        res.end(readFileSync(file, 'utf8').replace(TOKEN, SITE_ORIGIN))
      })
    },
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      for (const name of ORIGIN_FILES) {
        const file = resolve(dist, name)
        if (!existsSync(file)) continue
        writeFileSync(file, readFileSync(file, 'utf8').replace(TOKEN, SITE_ORIGIN))
      }
    },
  }
}

/**
 * ═══════════ ŽURNÁL V DEV REŽIMU ═══════════
 *
 * ★ V PRODUKCI ŽÁDNÝ ROUTER NENÍ A TENHLE PLUGIN NIC NEDĚLÁ. Každá stránka
 *   žurnálu je vyrobený soubor (`dist/clanky/<slug>.html`) a Vercel ho servíruje
 *   napřímo. Jenže ty soubory vyrábí až prerender po buildu, takže `npm run dev`
 *   by na `/clanky/neco` vrátil 404 a vývoj článků by se dal dělat jen přes
 *   `npm run build`. To je přesně ten druh tření, po kterém se na sekci
 *   vykašle i její autor.
 *
 * Middleware proto v devu podstrčí šablonu `clanky.html`; komponenta si
 * z adresy odvodí, co má vykreslit (`lib/journal-route.ts`) — stejně jako
 * v prohlížeči na produkci. Dev se tedy chová jako produkce, jen bez prerenderu.
 *
 * ★★ SITEMAPU A RSS TU TAKY GENERUJEME, A NENÍ TO KOSMETIKA. Odkaz na
 *   `/rss.xml` visí v hlavičce každé stránky žurnálu; kdyby v devu vracel 404,
 *   vypadalo by to jako rozbitý build a někdo by ten odkaz „opravil" pryč.
 */
function journalDev(): Plugin {
  return {
    name: 'journal-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]

        if (path === '/sitemap.xml' || path === '/rss.xml') {
          try {
            const { ARTICLES, LIVE_TOPICS } = await server.ssrLoadModule('/src/content/journal.ts')
            const seo = await server.ssrLoadModule('/src/lib/seo.ts')
            res.setHeader('Content-Type', 'application/xml; charset=utf-8')
            res.end(path === '/rss.xml' ? seo.renderRss(ARTICLES) : seo.renderSitemap(ARTICLES, LIVE_TOPICS))
            return
          } catch {
            return next()
          }
        }

        /* Jen „hezké" adresy bez přípony — požadavky na /assets, obrázky
           a moduly musí projít beze změny, jinak by se dev server servíroval
           HTML místo JavaScriptu. */
        if (/^\/clanky(\/[a-z0-9/-]*)?$/.test(path)) {
          req.url = '/clanky.html'
        }
        next()
      })
    },
  }
}

/**
 * ★ CSS SE INLINUJE DO HTML. Celý stylesheet má ~6 kB gz — MÉNĚ než jedna
 * síťová otočka na pomalém mobilu. Jako samostatný <link> je render-blokující:
 * prohlížeč na něj čeká s prvním vykreslením ~150–300 ms, které HTML o 7 kB
 * větší vůbec nestojí. HTML se stejně cachuje s max-age=0, takže se tím nic
 * nerozbíjí. (CSP už 'unsafe-inline' pro styly povoluje, viz vercel.json.)
 *
 * Dělá se to v closeBundle nad hotovým dist/ — Rolldown (Vite 8) volá
 * transformIndexHtml dřív než generateBundle, takže elegantnější cesta přes
 * bundle hooky tiše vyrobila HTML bez stylů. Tohle je hloupé a neprůstřelné.
 *
 * ★★ PROJÍŽDÍ VŠECHNA HTML V dist/, NE JEN index.html.
 *   Dokud byl web jednostránkový, stačila jedna napevno napsaná cesta. Od chvíle,
 *   kdy přibyla /projekty, by to tiše znamenalo, že druhá stránka jako JEDINÁ
 *   drží render-blokující <link> na CSS — jenže ten soubor mezitím tenhle plugin
 *   z dist/assets SMAZAL. Výsledek by nebyl pomalejší web, ale web ÚPLNĚ BEZ
 *   STYLŮ, a to jen na jedné podstránce. Proto se seznam bere z adresáře.
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

      /**
       * ★★★ PROCHÁZÍ SE REKURZIVNĚ, NE JEN KOŘEN dist/.
       *
       * Původně tu bylo `readdirSync(dist).filter(f => f.endsWith('.html'))`, což
       * vidí jen soubory v kořeni. Dokud byly všechny stránky v kořeni, fungovalo
       * to; od chvíle, kdy přibyla anglická verze v `dist/en/`, by to znamenalo,
       * že VNOŘENÉ stránky jako jediné drží render-blokující `<link>` na CSS —
       * jenže ten soubor se v dist/assets sice nemaže, ale stránka by ho stahovala
       * navíc a bez inline stylů by nejdřív problikla bez formátování.
       *
       * A hlavně: šablona žurnálu se KLONUJE z hotového HTML (scripts/prerender.mjs),
       * takže by se ta chyba propsala do každého článku.
       *
       * Je to táž třída chyby, kvůli které se sem kdysi doplnilo procházení celého
       * adresáře místo napevno napsaného index.html — jen o patro hloub.
       */
      const pages: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = resolve(dir, entry.name)
          if (entry.isDirectory()) {
            if (entry.name !== 'assets') walk(full)
          } else if (entry.name.endsWith('.html')) {
            pages.push(full)
          }
        }
      }
      walk(dist)

      for (const htmlPath of pages) {
        const html = readFileSync(htmlPath, 'utf8')
          .replace(/[ \t]*<link[^>]*rel="stylesheet"[^>]*>\s*/g, '')
          .replace('</head>', `<style>${css}</style>\n</head>`)
        writeFileSync(htmlPath, html)
      }
      /* ★★ SOUBORY .css SE NEMAŽOU — SHODILY BY 3D V PRODUKCI. Lazy chunk scény
         má sdílený stylesheet v preload seznamu (__vitePreload v index chunku):
         smazaný soubor znamenal na Vercelu 404 → odmítnutý import → SceneBoundary
         3D vypnul na KAŽDÉ návštěvě. Lokálně to `vite preview` maskoval SPA
         fallbackem (na chybějící soubor vrátí 200 s HTML a <link> to spolkne),
         takže se to poznalo až na produkci. Duplikát je levný: soubor se stahuje
         jednou, až když se probouzí scéna, s immutable cache — kdežto regex nad
         minifikovaným JS, který by preload seznam čistil, je past na příští build. */
    },
  }
}

export default defineConfig({
  /* ★ siteOrigin PŘED inlineCss. Oba sahají na dist/index.html v closeBundle;
     siteOrigin ho ale mění přes transformIndexHtml (tedy dřív, než se soubor
     vůbec zapíše), takže inlineCss už čte hotovou adresu a nemá co přepsat. */
  plugins: [react(), siteOrigin(), journalDev(), inlineCss()],
  // Keeps the dev server from re-optimising (and full-reloading) mid-session.
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing'],
  },
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  build: {
    target: 'es2022',
    rollupOptions: {
      /**
       * ★ VÍCESTRÁNKOVÝ BUILD. Dvě HTML = dva vstupní body a dva nezávislé stromy.
       *
       * Projekty by šly udělat i jako sedmá sekce úvodu, ale stály by dvakrát:
       * na hlavní stránce nejde přidat sekci bez zásahu do geometrie krychle
       * (šest stěn, šest sekcí — sedmá položka scénu shodí, viz ProjectsPage.tsx),
       * a hlavně by kotva `#projekty` neměla vlastní URL, titulek ani náhled
       * pro sdílení. Reference se posílají odkazem, takže URL je požadavek,
       * ne kosmetika.
       *
       * Vercel má `cleanUrls: true`, takže se `dist/projekty.html` naservíruje
       * na `/projekty`. Žádný rewrite ve vercel.json k tomu není potřeba —
       * je to opravdový soubor, ne routa SPA.
       *
       * ★★ Sdílený kód (React, styly, ui/) skončí ve společném chunku, takže
       *   se za něj neplatí dvakrát. Naopak three.js zůstane jen tam, kde se
       *   opravdu importuje — tedy na úvodu. Stránka projektů ho nestáhne.
       */
      /* resolve(process.cwd(), …), ne __dirname: tenhle soubor je ESM (package.json
         má "type": "module"), kde __dirname neexistuje. Stejný postup používají
         i oba pluginy výš. */
      /* ★ TŘETÍ VSTUP NENÍ TŘETÍ STRÁNKA, ALE ŠABLONA CELÉHO ŽURNÁLU.
         `clanky.html` se přeloží jednou a `scripts/prerender.mjs` z něj pak
         naklonuje rozcestník, každý článek i každé téma. Kdyby měl mít každý
         článek vlastní vstup, musel by se s každým novým článkem měnit tenhle
         soubor — a ten se mění, jen když se mění stavba webu, ne obsah. */
      input: {
        index: resolve(process.cwd(), 'index.html'),
        projekty: resolve(process.cwd(), 'projekty.html'),
        sluzby: resolve(process.cwd(), 'sluzby.html'),
        /* ★ Kontakt je vlastní stránka, ne kotva. Kotva `#kontakt` na úvodu
           nemá vlastní URL, titulek ani náhled pro sdílení — a hlavně vede přes
           scroll pěti obrazovkami WebGL. Konverzní cesta musí být co nejkratší. */
        kontakt: resolve(process.cwd(), 'kontakt.html'),
        clanky: resolve(process.cwd(), 'clanky.html'),
      },
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
