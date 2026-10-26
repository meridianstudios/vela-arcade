// Sanity-checks the catalogue: run `npm run check` after adding a game.
//  - in-house games have their file and load the bridge with a matching slug
//  - external games answer and do not forbid being framed
//  - no em-dashes in any copy
import { existsSync, readFileSync } from 'node:fs'
import { GAMES, TAGS, playable } from '../src/games.js'

let problems = 0
const fail = (g, msg) => { problems++; console.log(`  x ${g.slug}: ${msg}`) }

const slugs = new Set()
for (const g of GAMES) {
  if (slugs.has(g.slug)) fail(g, 'duplicate slug')
  slugs.add(g.slug)
  for (const t of g.tags) if (!TAGS.includes(t)) fail(g, `unknown tag "${t}"`)
  for (const field of ['title', 'description', 'controls', 'players']) {
    if (g[field] && g[field].includes('—')) fail(g, `em-dash in ${field}`)
  }
  if (!playable(g)) continue

  if (g.kind === 'inhouse') {
    const file = new URL(`../public${g.src}`, import.meta.url)
    if (!existsSync(file)) { fail(g, `missing ${g.src}`); continue }
    const html = readFileSync(file, 'utf8')
    if (!html.includes('_shared/bridge.js')) fail(g, 'does not load the bridge')
    else if (!html.includes(`data-game="${g.slug}"`)) fail(g, 'bridge data-game does not match slug')
    if (html.includes('—')) fail(g, 'em-dash somewhere in the game file')
  } else {
    try {
      const res = await fetch(g.src, { redirect: 'follow' })
      const xfo = res.headers.get('x-frame-options')
      const csp = res.headers.get('content-security-policy') || ''
      if (!res.ok && res.status !== 403) fail(g, `HTTP ${res.status}`)
      if (xfo) fail(g, `X-Frame-Options: ${xfo} (will not load in the player)`)
      if (/frame-ancestors/i.test(csp) && !/frame-ancestors[^;]*\*/i.test(csp)) fail(g, `CSP frame-ancestors may block framing: ${csp}`)
    } catch (e) {
      fail(g, `unreachable (${e.message})`)
    }
  }
}

console.log(problems ? `\n${problems} problem(s).` : `All ${GAMES.length} games look good.`)
process.exit(problems ? 1 : 0)
