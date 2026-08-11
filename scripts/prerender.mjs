/**
 * ═══════════ BUILD-TIME PRERENDER ═══════════
 *
 * Běží PO `vite build` (viz package.json) a dělá tři věci:
 *   1) plní <div id="root"> v hotových dist/*.html vyrenderovaným obsahem
 *   2) z jedné šablony `dist/clanky.html` VYRÁBÍ celý žurnál — rozcestník,
 *      stránku pro každý článek a pro každé dost velké téma
 *   3) generuje sitemap.xml, rss.xml a doplňuje llms.txt
 *
 * Mechanika: Vite dev server v middleware režimu umí přes ssrLoadModule
 * spustit TSX přímo v Nodu — žádný druhý produkční build, žádný dist-ssr.
 * Render sdílí týž zdrojový strom jako klient, takže se nemá jak rozejít.
 *
 * ★ MUSÍ BĚŽET AŽ PO inlineCss/siteOrigin (oba jedou v closeBundle uvnitř
 *   `vite build`): vkládá se do finálního HTML s inline styly a dosazenou
 *   adresou. Články se klonují z hotového `dist/clanky.html`, takže inline CSS
 *   i správné cesty ke skriptům dědí zadarmo.
 *
 * ★★ KDYŽ RENDER SPADNE, BUILD MUSÍ SPADNOUT TAKY (exit 1). Tichý fallback
 *   na prázdný root by znamenal, že se regrese pozná až z horšího Lighthouse
 *   v produkci — přesně ten druh chyby, který nikdo nehledá. U žurnálu to platí
 *   dvojnásob: články sem zapisuje robot bez dozoru a build je poslední místo,
 *   kde se vadný článek dá zachytit dřív, než ho uvidí návštěvník.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { createServer } from 'vite'

const dist = resolve(process.cwd(), 'dist')

/**
 * ★ POJISTKA NDA. Reference jsou anonymizované (src/content/projects.ts) a
 * jména klientů NESMÍ do žádného textového souboru v dist/ — ani do HTML,
 * ani do llms.txt nebo strukturovaných dat. Data to vynucují typem, jenže
 * `noscript` v projekty.html a llms.txt jsou ručně psané kopie a tenhle
 * seznam je jediné místo, které je hlídá. Když se jméno objeví, build spadne —
 * únik pod NDA se má poznat tady, ne od klienta.
 *
 * ★★ OD PŘIDÁNÍ ŽURNÁLU HLÍDÁ I ROBOTA. Články píše jazykový model a ten
 * o mlčenlivosti nic neví; kdyby v nějakém oborovém zdroji narazil na jméno
 * klienta a použil ho, projde to celou linkou až sem. Tahle kontrola je
 * poslední, kde se to dá zastavit.
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

const ROOT_MARKER = '<div id="root"></div>'
const HEAD_BEGIN = '<!-- head:begin -->'
const HEAD_END = '<!-- head:end -->'

/** Vloží obsah do #root. Marker musí existovat, jinak se prerender nekonal. */
function fillRoot(html, app, label) {
  if (!html.includes(ROOT_MARKER)) {
    throw new Error(`${label}: nenalezen prázdný #root — prerender už proběhl, nebo se změnil template`)
  }
  return html.replace(ROOT_MARKER, `<div id="root">${app}</div>`)
}

/**
 * Vymění blok hlavičky mezi značkami za vygenerovaný.
 * ★ Značky musí zůstat v šabloně (clanky.html) — bez nich by článek dostal
 *   titulek a popisek rozcestníku a všechny stránky žurnálu by ve výsledcích
 *   vyhledávání vypadaly stejně, tedy jako duplicity.
 */
function replaceHead(html, head, label) {
  const from = html.indexOf(HEAD_BEGIN)
  const to = html.indexOf(HEAD_END)
  if (from === -1 || to === -1) throw new Error(`${label}: v šabloně chybí značky head:begin / head:end`)
  return `${html.slice(0, from + HEAD_BEGIN.length)}\n    ${head}\n    ${html.slice(to)}`
}

function write(relPath, contents) {
  const file = resolve(dist, relPath)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, contents)
}

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  // Bez logu: dev server tu je jen kompilátor TSX→JS pro pár importů.
  logLevel: 'error',
})

try {
  /* ── 1. STATICKÉ STRÁNKY ───────────────────────────────────── */
  const { PAGES, renderJournal } = await vite.ssrLoadModule('/src/entry-prerender.tsx')
  for (const [page, render] of Object.entries(PAGES)) {
    const file = resolve(dist, page)
    const app = render()
    writeFileSync(file, fillRoot(readFileSync(file, 'utf8'), app, page))
    console.log(`prerender: ${page} +${(app.length / 1024).toFixed(1)} kB HTML`)
  }

  /* ── 2. ŽURNÁL ──────────────────────────────────────────────
     Šablona se načte JEDNOU a pro každou stránku se z ní udělá kopie.
     `dist/clanky.html` v tu chvíli už má inlinovaný CSS a dosazenou adresu,
     takže to všechno každý článek zdědí, aniž by se cokoli opakovalo. */
  const { ARTICLES, LIVE_TOPICS } = await vite.ssrLoadModule('/src/content/journal.ts')
  const seo = await vite.ssrLoadModule('/src/lib/seo.ts')

  const shellPath = resolve(dist, 'clanky.html')
  const shell = readFileSync(shellPath, 'utf8')

  /** Vyrobí jednu stránku žurnálu ze šablony. */
  const emit = (relPath, route, head) => {
    const app = renderJournal(route)
    const html = replaceHead(fillRoot(shell, app, relPath), seo.renderHead(head), relPath)
    write(relPath, html)
    return app.length
  }

  let bytes = emit('clanky.html', { kind: 'hub' }, seo.headForHub(ARTICLES))
  for (const a of ARTICLES) {
    bytes += emit(`clanky/${a.slug}.html`, { kind: 'article', slug: a.slug }, seo.headForArticle(a))
  }
  for (const t of LIVE_TOPICS) {
    bytes += emit(`clanky/tema/${t.slug}.html`, { kind: 'topic', slug: t.slug }, seo.headForTopic(t))
  }
  console.log(
    `prerender: žurnál — 1 rozcestník + ${ARTICLES.length} článků + ${LIVE_TOPICS.length} témat, ` +
      `${(bytes / 1024).toFixed(1)} kB HTML`,
  )

  /* ── 3. STROJOVĚ ČITELNÉ SOUBORY ────────────────────────────
     ★ SITEMAPA SE GENERUJE, NEUDRŽUJE. Od chvíle, kdy články přibývají bez
     zásahu člověka, je ručně psaný seznam URL zaručeně zastaralý seznam —
     a sitemapa, která neodpovídá webu, je horší než žádná. Ze stejného důvodu
     zmizel `public/sitemap.xml`. */
  write('sitemap.xml', seo.renderSitemap(ARTICLES, LIVE_TOPICS))
  write('rss.xml', seo.renderRss(ARTICLES))
  console.log(`prerender: sitemap.xml + rss.xml`)

  /* llms.txt je rozcestník pro jazykové modely. Token `__JOURNAL__` v něm
     drží místo pro seznam článků; zbytek souboru je ručně psaný. */
  const llmsPath = resolve(dist, 'llms.txt')
  const llms = readFileSync(llmsPath, 'utf8')
  if (!llms.includes('__JOURNAL__')) throw new Error('llms.txt: chybí token __JOURNAL__')
  writeFileSync(llmsPath, llms.replace('__JOURNAL__', seo.renderLlmsSection(ARTICLES, LIVE_TOPICS)))

  checkNda(dist)
  console.log('prerender: NDA kontrola čistá')
} catch (err) {
  console.error('prerender selhal:', err)
  process.exitCode = 1
} finally {
  await vite.close()
}
