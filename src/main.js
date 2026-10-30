import './style.css'
import { GAMES, TAGS, bySlug, playable } from './games.js'
import { UPDATES, CURRENT_VERSION } from './updates.js'
import { RULES } from './rules.js'
import { startHeartbeat, countOnline, visitTotals } from './online.js'
import * as Account from './account.js'

const app = document.getElementById('app')
const searchInput = document.getElementById('search')

/* ── device storage ──────────────────────────────────────────────
   Bests are written by the games themselves (bridge.js) under the same
   origin, so the arcade only reads them. Recents are ours. */

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  },
}
const bestFor = (slug) => Number(store.get('vela:best:' + slug, 0)) || 0
const recents = () => store.get('vela:recent', []).filter((s) => bySlug(s) && playable(bySlug(s)))
function markPlayed(slug) {
  store.set('vela:recent', [slug, ...recents().filter((s) => s !== slug)].slice(0, 6))
}

/* ── helpers ─────────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const fmt = (n) => Number(n).toLocaleString('en-US')
const art = (g, cls = '') =>
  `<div class="art ${cls}"><svg viewBox="0 0 64 64" aria-hidden="true">${g.art}</svg></div>`

// The Vela mark, the owner's own picture.
const VELA_MARK = '<svg viewBox="10.16 9.77 79.68 86.23" aria-hidden="true"><polygon class="mk-o" points="40,9.77 10.16,27 10.16,73 50,96 89.84,73 89.84,27 60,9.77 60,21.32 79.84,32.78 79.84,67.22 50,84.45 20.16,67.22 20.16,32.78 40,21.32"/><polygon class="mk-i" points="30,38.65 40,32.9 40,55.1 50,60.9 60,55.1 60,32.9 70,38.65 70,60.9 50,72.4 30,60.9"/></svg>'

// An account's picture: a game's icon (or the first letter) on its colour.
function avatarHTML(p, cls = '') {
  const g = p.avatar && p.avatar !== 'vela' && bySlug(p.avatar)
  const color = Account.okColor(p.color) ? p.color : Account.COLORS[0]
  const inner = p.avatar === 'vela' ? VELA_MARK : g
    ? `<svg viewBox="0 0 64 64" aria-hidden="true">${g.art}</svg>`
    : esc(((p.display || p.name || '?').trim()[0] || '?').toUpperCase())
  return `<span class="av ${cls}${color === Account.OWNER_COLOR ? ' dark' : ''}" style="--av:${color}">${inner}</span>`
}

// Tags next to a name. Staff tags are the rules' to check; a game tag shows
// only while the account is in that game's top 10, with its place.
const STAFF_TAGS = { owner: 'Owner', founder: 'Founder', developer: 'Developer', mod: 'Moderator' }
function tagHTML(t, place) {
  if (STAFF_TAGS[t]) return `<span class="tag ${t}">${STAFF_TAGS[t]}</span>`
  const g = bySlug(t)
  return g && place ? `<span class="rec${place > 1 ? ' lo' : ''}" title="No. ${place} in ${esc(g.title)}"><svg viewBox="0 0 64 64" aria-hidden="true">${g.art}</svg>#${place}</span>` : ''
}
const placeIn = (ranks, slug, id) => ((ranks && ranks[slug]) || []).indexOf(id) + 1
function tagsHTML(p, ranks, cls = '') {
  const id = p.id || p.uid
  const html = (p.tags || []).map((t) => tagHTML(t, placeIn(ranks, t, id))).join('')
  return html ? `<span class="tags${cls ? ' ' + cls : ''}">${html}</span>` : ''
}
// The games named in these accounts' tags, to look their places up.
const tagGames = (rows) => [...new Set(rows.flatMap((r) => (r.tags || []).filter((t) => !STAFF_TAGS[t])))]

// A name on a leaderboard, linking to the profile.
function whoHTML(p, ranks) {
  return `<a class="who" href="/u/${esc(p.name)}" data-link>${avatarHTML(p, 'sm')}<span class="who-name${p.flair ? ' orange' : ''}">${esc(p.display || p.name)}</span>${tagsHTML(p, ranks)}</a>`
}

function card(g, i) {
  const best = g.scores ? bestFor(g.slug) : 0
  const soon = !playable(g)
  const inner = `
    ${art(g)}
    <div class="card-body">
      <div class="card-top">
        <h3>${esc(g.title)}</h3>
        <span class="label">${soon ? 'In development' : esc(g.players)}</span>
      </div>
      ${best ? `<div class="card-meta"><span class="label">${esc(g.bestLabel || 'Best')} <span class="best">${fmt(best)}</span></span></div>` : ''}
    </div>`
  return soon
    ? `<article class="card is-soon" data-slug="${g.slug}" style="--i:${i}">${inner}</article>`
    : `<a class="card" href="/play/${g.slug}" data-link data-slug="${g.slug}" style="--i:${i}">${inner}</a>`
}

/* ── lobby ───────────────────────────────────────────────────── */

let activeTag = 'All'

// Third-party games (anything with `via`) get their own shelf, after ours.
const SHELVES = [
  { title: 'Vela originals', games: GAMES.filter((g) => !g.via) },
  { title: 'Embedded games', games: GAMES.filter((g) => g.via) },
]
const shelf = ({ title, games }) => games.length ? `
      <section class="shelf">
        <h2 class="label">${title}<span class="count">${games.filter(playable).length}</span></h2>
        <div class="grid">${games.map(card).join('')}</div>
      </section>` : ''

function renderHome() {
  document.title = 'Vela Arcade'
  document.body.classList.remove('is-playing')
  const recent = recents().map(bySlug)

  app.innerHTML = `
    <div class="wrap">
      <div class="toolbar">
        <h1>Games<span class="count">${GAMES.filter(playable).length}</span></h1>
        <div class="tabs" role="tablist" aria-label="Filter games">
          ${['All', ...TAGS].map((t) => `<button class="tab${t === activeTag ? ' on' : ''}" data-tag="${t}" role="tab" aria-selected="${t === activeTag}">${t}</button>`).join('')}
        </div>
      </div>
      ${recent.length ? `
      <div class="recent-row">
        <span class="label">Recent</span>
        ${recent.map((g) => `
          <a href="/play/${g.slug}" data-link>
            ${art(g, 'mini')}
            <strong>${esc(g.title)}</strong>
            ${g.scores && bestFor(g.slug) ? `<em>${fmt(bestFor(g.slug))}</em>` : ''}
          </a>`).join('')}
      </div>` : ''}

      ${SHELVES.map(shelf).join('')}
      <p class="empty" hidden>No games match "<span class="q"></span>".</p>
    </div>
  `
  applyFilter()
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase()
  let shown = 0
  app.querySelectorAll('.grid .card').forEach((el) => {
    const g = bySlug(el.dataset.slug)
    const text = `${g.title} ${g.tags.join(' ')}`.toLowerCase()
    const ok = (activeTag === 'All' || g.tags.includes(activeTag)) && (!q || text.includes(q))
    el.hidden = !ok
    if (ok) shown++
  })
  app.querySelectorAll('.shelf').forEach((el) => { el.hidden = !el.querySelector('.card:not([hidden])') })
  const empty = app.querySelector('.empty')
  if (empty) {
    empty.hidden = shown > 0
    empty.querySelector('.q').textContent = q || activeTag
  }
}

app.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab')
  if (!tab) return
  activeTag = tab.dataset.tag
  app.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('on', t === tab)
    t.setAttribute('aria-selected', t === tab)
  })
  applyFilter()
})

searchInput.addEventListener('input', () => {
  if (location.pathname !== '/') navigate('/', { keepSearch: true })
  else applyFilter()
})
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { searchInput.value = ''; applyFilter(); searchInput.blur() }
  if (e.key === 'Enter') {
    const first = app.querySelector('.grid a.card:not([hidden])')
    if (first) navigate(first.getAttribute('href'))
  }
})
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput && !document.body.classList.contains('is-playing')) {
    e.preventDefault()
    searchInput.focus()
  }
})

/* ── player ──────────────────────────────────────────────────── */


// Third-party games run with everything they need except navigating the top
// page, so an ad inside one cannot send the whole site somewhere else.
const THIRD_PARTY_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-orientation-lock allow-modals'

/* ── leaderboards ────────────────────────────────────────────────
   Every scored game of ours has one. Entries come from accounts only. */

const hasBoard = (g) => g.scores && !g.via

const boardGames = () => GAMES.filter((g) => hasBoard(g) && playable(g))

// Fills whichever #board-list is on the page (game page or Leaderboards tab).
// A moderator also gets Remove and Ban on every row but their own.
async function showBoard(g) {
  const list = document.getElementById('board-list')
  if (!list) return
  const data = await Account.leaderboard(g.slug)
  if (document.getElementById('board-list') !== list) return // left the page meanwhile
  if (!data) { list.innerHTML = '<li class="board-note">&ndash;</li>'; return }
  if (!data.top.length) { list.innerHTML = '<li class="board-note">No scores yet</li>'; return }
  const ranks = await Account.ranks(tagGames(data.top))
  if (document.getElementById('board-list') !== list) return
  const me = Account.current()
  const mod = me && me.mod
  list.innerHTML = data.top.map((r, i) => `
    <li class="${r.you ? 'you' : ''}"><span class="rank">${i + 1}</span>${whoHTML(r, ranks)}<span class="pts">${fmt(r.score)}</span>${mod && !r.you ? `
      <span class="mod-tools"><button class="mod-btn" data-act="remove" data-slug="${g.slug}" data-id="${esc(r.id)}" data-name="${esc(r.name)}">Remove</button><button class="mod-btn" data-act="ban" data-slug="${g.slug}" data-id="${esc(r.id)}" data-name="${esc(r.name)}">Ban</button></span>` : ''}</li>`).join('')
    + (data.you && me ? `<li class="you sep"><span class="rank"></span>${whoHTML({ ...me, id: me.uid, tags: [] })}<span class="pts">${fmt(data.you.score)}</span></li>` : '')
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('.mod-btn')
  if (!b) return
  const { act, slug, id, name } = b.dataset
  const game = slug && bySlug(slug)
  let display = ''
  if (act === 'rename') {
    display = (prompt(`New display name for @${name}`, b.dataset.display) || '').trim()
    const bad = display && Account.checkDisplay(display)
    if (!display) return
    if (bad) return alert(bad)
  } else {
    const ask = {
      ban: `Ban ${name}? They are removed from every leaderboard and cannot post again.`,
      unban: `Lift the ban on ${name}?`,
      reset: `Reset ${name}? Their display name, picture and featured record go back to the defaults.`,
      promote: `Make ${name} a moderator?`,
      demote: `Remove ${name} as a moderator?`,
      record: `Remove ${name}'s ${game ? game.title : ''} record of ${fmt(b.dataset.score)}? It cannot be posted again; only a better score can.`,
      remove: `Remove ${name} from this leaderboard?`,
    }[act]
    if (!ask || !confirm(ask)) return
  }
  b.disabled = true
  const slugs = boardGames().map((g) => g.slug)
  try {
    if (act === 'ban') await Account.ban(id, name, slugs)
    else if (act === 'unban') await Account.unban(id)
    else if (act === 'reset') await Account.resetProfile(id, name, slugs)
    else if (act === 'promote') await Account.promote(id, name)
    else if (act === 'demote') await Account.demote(id, name)
    else if (act === 'rename') await Account.rename(id, name, display, slugs)
    else if (act === 'record') await Account.removeRecord(id, name, slug, Number(b.dataset.score))
    else await Account.removeEntry(slug, id)
  } catch (err) {
    console.warn('staff action failed', err)
    alert('That did not go through. Try again.')
  }
  if (/^\/(u\/|staff)/.test(location.pathname)) route()
  else refreshBoard()
})

/* The Leaderboards tab: every scored game down the side, one board at a time,
   so viewing it costs one board's worth of reads, not all of them. */
function renderLeaderboards(slug) {
  const games = boardGames()
  const fromRecent = recents().map(bySlug).find((g) => g && hasBoard(g))
  const g = (slug && games.find((x) => x.slug === slug)) || fromRecent || games[0]
  document.title = `Leaderboards · Vela Arcade`
  document.body.classList.remove('is-playing')
  app.innerHTML = `
    <div class="wrap">
      <div class="toolbar">
        <h1>Leaderboards</h1>
      </div>
      <div class="lb">
        <nav class="lb-games" aria-label="Games">${games.map((x) => `
          <a href="/leaderboards/${x.slug}" data-link class="${x === g ? 'on' : ''}">${art(x, 'mini')}<span>${esc(x.title)}</span></a>`).join('')}
        </nav>
        <section class="lb-board">
          <div class="lb-head">
            ${art(g, 'mini')}
            <div><h2>${esc(g.title)}</h2><span class="label">${esc(g.bestLabel || 'Best score')}</span></div>
            <a class="btn" href="/play/${g.slug}" data-link>Play</a>
          </div>
          <ol class="board-list" id="board-list" data-slug="${g.slug}"></ol>
        </section>
      </div>
    </div>`
  const on = app.querySelector('.lb-games a.on')
  if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' })
  showBoard(g)
}

/* The Rules tab: every game with a rulebook down the side, one at a time. */
function renderRules(slug) {
  const games = GAMES.filter((x) => RULES[x.slug] && playable(x)).sort((a, b) => a.title.localeCompare(b.title))
  const g = games.find((x) => x.slug === slug) || games[0]
  document.title = `Rules · Vela Arcade`
  document.body.classList.remove('is-playing')
  app.innerHTML = `
    <div class="wrap">
      <div class="toolbar">
        <h1>Rules</h1>
      </div>
      <div class="lb">
        <nav class="lb-games" aria-label="Games">${games.map((x) => `
          <a href="/rules/${x.slug}" data-link class="${x === g ? 'on' : ''}">${art(x, 'mini')}<span>${esc(x.title)}</span></a>`).join('')}
        </nav>
        <section class="lb-board">
          <div class="lb-head">
            ${art(g, 'mini')}
            <div><h2>${esc(g.title)}</h2><span class="label">${esc(g.players)}</span></div>
            <a class="btn" href="/play/${g.slug}" data-link>Play</a>
          </div>
          <div class="rules rules-page">${RULES[g.slug].map((sec) => `
            <section>
              <h3>${esc(sec.h)}</h3>
              <ul>${sec.items.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>
            </section>`).join('')}
          </div>
        </section>
      </div>
    </div>`
  const on = app.querySelector('.lb-games a.on')
  if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' })
}

function renderPlay(slug) {
  const g = bySlug(slug)
  if (!g || !playable(g)) return renderMissing()

  document.title = `${g.title} · Vela Arcade`
  document.body.classList.add('is-playing')
  markPlayed(slug)

  const more = GAMES.filter((x) => x.slug !== slug && playable(x)).slice(0, 5)
  const external = g.kind === 'embed'
  // An invite link (/play/chess?room=ABC123) passes its query on to the game.
  // GameDistribution credits ad revenue to the page named in gd_sdk_referrer_url.
  const frameSrc = g.via === 'GameDistribution'
    ? `${g.src}?gd_sdk_referrer_url=${encodeURIComponent(location.origin + location.pathname)}`
    : external ? g.src : g.src + location.search

  app.innerHTML = `
    <section class="player">
      <div class="player-bar">
        <a class="icon-btn" href="/" data-link aria-label="Back to all games">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
        </a>
        <div class="player-title">
          ${art(g, 'mini')}
          <h1>${esc(g.title)}</h1>
        </div>
        <div class="player-actions">
          <button class="icon-btn" id="restart" aria-label="Reload game" title="Reload">
            <svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
          </button>
          ${external ? `
          <a class="icon-btn" href="${esc(g.src)}" target="_blank" rel="noopener" aria-label="Open in a new tab" title="Open in a new tab">
            <svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
          </a>` : ''}
          <button class="icon-btn" id="fullscreen" aria-label="Full screen" title="Full screen">
            <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
          </button>
        </div>
      </div>
      <div class="stage" id="stage">
        <div class="loader" id="loader"><div class="loader-dots"><i></i><i></i><i></i><i></i></div></div>
        <iframe id="frame" title="${esc(g.title)}" src="${esc(frameSrc)}"
          allow="fullscreen; autoplay; clipboard-write; gamepad"${g.via ? ` sandbox="${THIRD_PARTY_SANDBOX}"` : ''}></iframe>
      </div>
    </section>

    <section class="wrap about">
      <div>
        <span class="label">About</span>
        <p class="about-text">${esc(g.description)}</p>
        <dl class="facts">
          <dt>Players</dt><dd>${esc(g.players)}</dd>
          ${g.via ? `<dt>From</dt><dd>${g.by ? `${esc(g.by)}, via ` : ''}${esc(g.via)}</dd>` : ''}
          ${g.controls ? `<dt>Controls</dt><dd>${esc(g.controls)}</dd>` : ''}
          ${external && !g.via && g.tags.includes('Multiplayer') ? `<dt>Rooms</dt><dd>Room codes and invite links come from the game, so friends can join from their own devices.</dd>` : ''}
        </dl>
        ${RULES[g.slug] ? `
        <div class="rules">
          <span class="label">Rules</span>
          ${RULES[g.slug].map((sec) => `
          <section>
            <h3>${esc(sec.h)}</h3>
            <ul>${sec.items.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>
          </section>`).join('')}
        </div>` : ''}
      </div>
      <div>
        ${hasBoard(g) ? `
        <div class="board">
          <div class="board-top"><span class="label">Leaderboard</span><a class="label" href="/leaderboards/${g.slug}" data-link>All leaderboards</a></div>
          <ol class="board-list" id="board-list" data-slug="${g.slug}"></ol>
        </div>` : ''}
        <span class="label">More games</span>
        <div class="more">${more.map((x) => `
          <a href="/play/${x.slug}" data-link>
            ${art(x, 'mini')}
            <span><strong>${esc(x.title)}</strong><em>${esc(x.players)}</em></span>
          </a>`).join('')}
        </div>
      </div>
    </section>
  `

  const frame = document.getElementById('frame')
  const stage = document.getElementById('stage')
  const loader = document.getElementById('loader')

  // In-house games load near-instantly. External ones only tell us the
  // document loaded, and an app like Wildcard still has to boot after that,
  // so hold the loader a moment rather than flashing an empty frame.
  frame.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('gone'), external ? 1200 : 0)
    focusFrame()
  })

  // Clicking anywhere in the stage hands keyboard focus to the game, so arrow
  // keys move the snake instead of scrolling the page.
  function focusFrame() {
    try { frame.contentWindow.focus() } catch {}
    frame.focus()
  }
  stage.addEventListener('pointerdown', focusFrame)

  if (hasBoard(g)) showBoard(g)

  document.getElementById('restart').addEventListener('click', () => {
    loader.classList.remove('gone')
    frame.src = frameSrc
  })

  document.getElementById('fullscreen').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else if (stage.requestFullscreen) stage.requestFullscreen().then(focusFrame).catch(() => {})
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen()
  })

}

/* ── updates ─────────────────────────────────────────────────── */

const longDate = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function gameList(title, games) {
  if (!games.length) return ''
  return `
    <div class="log-games">
      <span class="label">${title}<span class="count">${games.length}</span></span>
      <div class="log-tiles">${games.map((g) => `
        <a href="/play/${g.slug}" data-link>${art(g, 'mini')}<strong>${esc(g.title)}</strong></a>`).join('')}
      </div>
    </div>`
}

function renderUpdates() {
  document.title = 'Updates · Vela Arcade'
  document.body.classList.remove('is-playing')
  app.innerHTML = `
    <div class="wrap">
      <div class="toolbar">
        <h1>Updates</h1>
      </div>
      ${UPDATES.map((u) => {
        const games = u.games.map(bySlug).filter(Boolean)
        return `
      <article class="log" id="v${esc(u.version)}">
        <div class="log-head">
          <h2>${esc(u.version)}</h2>
          <span class="label">${longDate(u.date)}</span>
          ${Number(u.version) < 1 ? '<span class="label log-pre">Pre-release</span>' : ''}
        </div>
        <div class="log-body">
          ${gameList('New Vela originals', games.filter((g) => !g.via))}
          ${gameList('New embedded games', games.filter((g) => g.via))}
          ${u.changes.length ? `
          <div>
            <span class="label">Changes</span>
            <ul class="log-changes">${u.changes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>` : ''}
        </div>
      </article>`
      }).join('')}
    </div>`
}

/* ── online ──────────────────────────────────────────────────── */

let onlineTimer = null
function renderOnline() {
  document.title = 'Online · Vela Arcade'
  document.body.classList.remove('is-playing')
  app.innerHTML = `
    <div class="wrap">
      <div class="toolbar">
        <h1>Online</h1>
      </div>
      <section class="online">
        <strong id="online-num">&ndash;</strong>
        <span class="label">Players online now</span>
      </section>
      <section class="online-totals">
        <div><strong id="online-today">&ndash;</strong><span class="label">Players today</span></div>
        <div><strong id="online-all">&ndash;</strong><span class="label">Players all time</span></div>
      </section>
    </div>`
  const show = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n == null ? '–' : fmt(n) }
  const refresh = async () => {
    if (!document.getElementById('online-num')) { clearInterval(onlineTimer); onlineTimer = null; return }
    if (document.hidden) return
    const [n, totals] = await Promise.all([countOnline(), visitTotals()])
    show('online-num', n)
    show('online-today', totals.today)
    show('online-all', totals.allTime)
  }
  clearInterval(onlineTimer)
  // Give this tab's first heartbeat a moment to land so it counts itself.
  setTimeout(refresh, 800)
  onlineTimer = setInterval(refresh, 15000)
}

function renderMissing() {
  document.title = 'Not found · Vela Arcade'
  document.body.classList.remove('is-playing')
  app.innerHTML = `
    <section class="wrap missing">
      <span class="label">404</span>
      <h1>No game at this address.</h1>
      <a class="btn" href="/" data-link>All games</a>
    </section>`
}

/* ── settings ────────────────────────────────────────────────────
   Signed-in only. The look (display name, picture, colour, tags, favourite
   game, and the owner's name colour) is saved together; password and deletion each ask for the
   current password. */

function renderSettings() {
  document.title = 'Settings · Vela Arcade'
  document.body.classList.remove('is-playing')
  const me = Account.current()
  const head = '<div class="toolbar"><h1>Settings</h1></div>'
  if (!me) {
    app.innerHTML = `<div class="wrap">${head}<div class="set-out"><button class="btn" id="settings-sign-in">Sign in</button></div></div>`
    return
  }
  if (!me.display) { app.innerHTML = `<div class="wrap">${head}</div>`; return } // profile still loading

  const pickable = GAMES.filter(playable)
  const mine = Account.savedBests()
  const scored = boardGames().filter((g) => mine[g.slug] > 0)
  app.innerHTML = `
    <div class="wrap">
      ${head}
      <div class="settings">
        <form class="set" id="look-form" novalidate>
          <div class="set-preview" id="set-preview"></div>
          <label class="field"><span class="label">Display name</span>
            <input name="display" maxlength="20" autocomplete="off" spellcheck="false" value="${esc(me.display)}" />
          </label>
          <div class="field"><span class="label">Picture</span>
            <button type="button" class="btn ghost" id="pick-open" aria-expanded="false">Change picture</button>
            <div class="av-grid" id="av-grid" hidden>${[...(me.owner ? ['vela'] : []), '', ...pickable.map((g) => g.slug)].map((slug) => `
              <button type="button" class="av-pick${slug === me.avatar ? ' on' : ''}" data-avatar="${slug}" aria-label="${slug === 'vela' ? 'Vela' : slug ? esc(bySlug(slug).title) : 'First letter'}" aria-pressed="${slug === me.avatar}">${avatarHTML({ ...me, avatar: slug }, 'pick')}</button>`).join('')}
            </div>
          </div>
          <div class="field"><span class="label">Colour</span>
            <div class="swatches">${[...Account.COLORS, ...(me.owner ? [Account.OWNER_COLOR] : [])].map((c) => `
              <button type="button" class="swatch${c === me.color ? ' on' : ''}" data-color="${c}" style="--av:${c}" aria-label="Colour ${c}" aria-pressed="${c === me.color}"></button>`).join('')}
            </div>
          </div>
          ${me.owner ? `<div class="field"><span class="label">Name colour</span>
            <div class="seg" id="flair">${[['', 'Default'], ['orange', 'Orange']].map(([v, label]) => `
              <button type="button" class="${v === me.flair ? 'on' : ''}" data-flair="${v}" aria-pressed="${v === me.flair}">${label}</button>`).join('')}
            </div>
          </div>` : ''}
          <div class="field"><span class="label">Tags <span class="tag-count" id="tag-count"></span></span>
            <div class="tag-picks" id="tag-picks"></div>
          </div>
          <label class="field"><span class="label">Favourite game</span>
            <select name="fav"><option value="">None</option>${pickable.map((g) => `<option value="${g.slug}"${g.slug === me.fav ? ' selected' : ''}>${esc(g.title)}</option>`).join('')}</select>
          </label>
          <div class="set-row">
            <button class="btn" type="submit">Save</button>
            <a class="btn ghost" href="/u/${esc(me.name)}" data-link>View profile</a>
          </div>
          <p class="set-msg" id="look-msg" role="status"></p>
        </form>

        <section class="set set-private">
          <h2 class="label">Password</h2>
          <button type="button" class="btn ghost" id="pass-open">Change password</button>
          <form class="set" id="pass-form" novalidate hidden>
            <input type="text" name="username" autocomplete="username" value="${esc(me.name)}" hidden />
            <label class="field"><span class="label">Current password</span><input type="password" name="current" autocomplete="current-password" /></label>
            <label class="field"><span class="label">New password</span><input type="password" name="next" autocomplete="new-password" /></label>
            <label class="field"><span class="label">Repeat new password</span><input type="password" name="again" autocomplete="new-password" /></label>
            <div class="set-row">
              <button class="btn" type="submit">Save password</button>
              <button class="btn ghost" type="button" data-close="pass">Cancel</button>
            </div>
          </form>
          <p class="set-msg" id="pass-msg" role="status"></p>
        </section>

        <section class="set">
          <h2 class="label">Account</h2>
          <div class="set-row">
            <button class="btn ghost" type="button" id="settings-sign-out">Sign out</button>
            <button class="btn ghost" type="button" id="del-open">Delete account</button>
          </div>
          <form class="set" id="del-form" novalidate hidden>
            <label class="field"><span class="label">Password</span><input type="password" name="password" autocomplete="current-password" /></label>
            <div class="set-row">
              <button class="btn danger" type="submit">Delete for good</button>
              <button class="btn ghost" type="button" data-close="del">Cancel</button>
            </div>
          </form>
          <p class="set-msg" id="del-msg" role="status"></p>
        </section>
      </div>
    </div>`

  // The look being edited, drawn live in the preview.
  const draft = { display: me.display, avatar: me.avatar, color: me.color, tags: [...me.tags], flair: me.flair, fav: me.fav }
  let ranks = {}
  // Tags this account can wear: its staff tags now, its top 10 games once
  // the boards answer.
  const staffTags = me.owner ? Account.OWNER_TAGS : me.mod ? [Account.MOD_TAG] : []
  let wearable = staffTags
  const form = document.getElementById('look-form')
  const drawTags = () => {
    const full = draft.tags.length >= Account.MAX_TAGS
    document.getElementById('tag-count').textContent = `${draft.tags.length}/${Account.MAX_TAGS}`
    document.getElementById('tag-picks').innerHTML = wearable.map((t) => {
      const on = draft.tags.includes(t)
      return `<button type="button" class="tag-pick${on ? ' on' : ''}" data-tag="${t}" aria-pressed="${on}"${!on && full ? ' disabled' : ''}>${tagHTML(t, placeIn(ranks, t, me.uid))}${STAFF_TAGS[t] ? '' : `<span>${esc(bySlug(t).title)}</span>`}</button>`
    }).join('') || '<span class="board-note">None</span>'
  }
  const preview = () => {
    const p = { ...me, ...draft, display: draft.display.trim() || me.name }
    document.getElementById('set-preview').innerHTML = `${avatarHTML(p, 'lg')}<div class="set-id"><span><strong class="${p.flair ? 'orange' : ''}">${esc(p.display)}</strong>${tagsHTML(p, ranks)}</span><span class="pf-at">@${esc(me.name)}</span></div>`
    form.querySelectorAll('.av-pick .av').forEach((el) => el.style.setProperty('--av', p.color))
    form.querySelectorAll('.av-pick[data-avatar=""] .av').forEach((el) => { el.textContent = (p.display[0] || '?').toUpperCase() })
  }
  preview()
  drawTags()

  // Game tags are for games this account is in the top 10 of, best place first.
  Account.ranks(scored.map((g) => g.slug)).then((r) => {
    if (!document.getElementById('tag-picks')) return
    ranks = r
    const placed = scored.map((g) => g.slug).filter((t) => placeIn(r, t, me.uid))
      .sort((a, b) => placeIn(r, a, me.uid) - placeIn(r, b, me.uid))
    wearable = [...staffTags, ...placed]
    draft.tags = draft.tags.filter((t) => wearable.includes(t))
    drawTags()
    preview()
  })

  form.addEventListener('click', (e) => {
    const open = e.target.closest('#pick-open')
    const pick = e.target.closest('.av-pick')
    const sw = e.target.closest('.swatch')
    const tag = e.target.closest('.tag-pick')
    const flair = e.target.closest('[data-flair]')
    if (open) {
      const grid = document.getElementById('av-grid')
      grid.hidden = !grid.hidden
      open.setAttribute('aria-expanded', String(!grid.hidden))
      open.textContent = grid.hidden ? 'Change picture' : 'Done'
      return
    }
    if (pick) {
      draft.avatar = pick.dataset.avatar
      form.querySelectorAll('.av-pick').forEach((b) => { b.classList.toggle('on', b === pick); b.setAttribute('aria-pressed', b === pick) })
    } else if (sw) {
      draft.color = sw.dataset.color
      form.querySelectorAll('.swatch').forEach((b) => { b.classList.toggle('on', b === sw); b.setAttribute('aria-pressed', b === sw) })
    } else if (tag) {
      const t = tag.dataset.tag
      draft.tags = draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t].slice(0, Account.MAX_TAGS)
      drawTags()
    } else if (flair) {
      draft.flair = flair.dataset.flair
      form.querySelectorAll('[data-flair]').forEach((b) => { b.classList.toggle('on', b === flair); b.setAttribute('aria-pressed', b === flair) })
    } else return
    preview()
  })
  form.addEventListener('input', () => {
    draft.display = form.display.value
    draft.fav = form.fav.value
    preview()
  })

  const say = (id, text, bad) => { const el = document.getElementById(id); el.textContent = text; el.classList.toggle('bad', !!bad) }
  const busy = async (f, run) => {
    const go = f.querySelector('button[type="submit"]')
    go.disabled = true
    try { await run() } finally { go.disabled = false }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    busy(form, async () => {
      try {
        await Account.saveProfile({ ...draft, display: draft.display.trim() })
        say('look-msg', 'Saved')
      } catch (x) { say('look-msg', x.message, true) }
    })
  })

  // Password and deletion stay closed until asked for, and close again (with
  // their fields cleared) on Cancel.
  const pass = document.getElementById('pass-form')
  const del = document.getElementById('del-form')
  const panes = { pass: [pass, 'pass-open', 'pass-msg'], del: [del, 'del-open', 'del-msg'] }
  const show = (key, on) => {
    const [f, opener, msg] = panes[key]
    f.hidden = !on
    document.getElementById(opener).hidden = on
    if (!on) f.reset()
    say(msg, '')
    if (on) f.querySelector('input[type="password"]').focus()
  }
  document.getElementById('pass-open').addEventListener('click', () => show('pass', true))
  document.getElementById('del-open').addEventListener('click', () => show('del', true))
  app.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => show(b.dataset.close, false)))

  pass.addEventListener('submit', (e) => {
    e.preventDefault()
    if (pass.next.value !== pass.again.value) return say('pass-msg', 'New passwords do not match', true)
    busy(pass, async () => {
      try {
        await Account.changePassword(pass.current.value, pass.next.value)
        show('pass', false)
        say('pass-msg', 'Password changed')
      } catch (x) { say('pass-msg', x.message, true) }
    })
  })

  del.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!del.password.value) return say('del-msg', 'Enter your password', true)
    if (!confirm(`Delete ${me.name}? Your profile and leaderboard entries are removed for good. Bests stay on this device.`)) return
    busy(del, async () => {
      try {
        await Account.deleteAccount(del.password.value, boardGames().map((g) => g.slug))
        navigate('/')
      } catch (x) { say('del-msg', x.message, true) }
    })
  })
}

document.addEventListener('click', async (e) => {
  if (e.target.closest('#settings-sign-in')) openDialog()
  else if (e.target.closest('#settings-sign-out')) { await Account.signOut(); navigate('/') }
})

/* ── profiles ────────────────────────────────────────────────────
   Anyone's, by username: their look, featured record, favourite game and
   every score they have on a leaderboard, with the No. 1s marked. */

async function renderProfile(name) {
  const path = location.pathname
  document.title = 'Player · Vela Arcade'
  document.body.classList.remove('is-playing')
  app.innerHTML = '<div class="wrap profile"></div>'
  const p = await Account.profile(name)
  if (location.pathname !== path) return
  if (!p) {
    app.innerHTML = `
      <section class="wrap missing">
        <span class="label">${p === null ? '404' : 'Offline'}</span>
        <h1>${p === null ? `No player called ${esc(name)}.` : 'Could not load this player.'}</h1>
        <a class="btn" href="/leaderboards" data-link>Leaderboards</a>
      </section>`
    return
  }

  const games = boardGames().filter((g) => p.bests[g.slug] > 0)
  const [ranks, rank] = await Promise.all([
    Account.ranks([...new Set([...games.map((g) => g.slug), ...tagGames([p])])]),
    Account.role(p.uid),
  ])
  if (location.pathname !== path) return
  const place = (slug) => placeIn(ranks, slug, p.uid)
  games.sort((a, b) => (place(a.slug) || 99) - (place(b.slug) || 99))
  const firsts = games.filter((g) => place(g.slug) === 1)
  const placed = games.filter((g) => place(g.slug))
  // The first game tag still in its top 10 gets the big tile.
  const featured = bySlug(p.tags.find((t) => !STAFF_TAGS[t] && place(t)) || '')
  // The rank shows once: as a tag if they wear it, otherwise on its own.
  const roleTag = rank === 'owner' ? 'owner' : rank === 'mod' ? Account.MOD_TAG : ''
  const fav = p.fav && bySlug(p.fav)
  const me = Account.current()
  const self = me && me.uid === p.uid
  const shown = p.display || p.name
  document.title = `${shown} · Vela Arcade`

  app.innerHTML = `
    <div class="wrap profile">
      <header class="pf-head">
        ${avatarHTML(p, 'xl')}
        <div class="pf-id">
          <h1 class="${p.flair ? 'orange' : ''}">${esc(shown)}</h1>
          ${tagsHTML(p, ranks, 'pf-tags')}
          <span class="pf-at">${roleTag && !p.tags.includes(roleTag) ? `<span class="role">${rank === 'owner' ? 'Owner' : 'Moderator'}</span>` : ''}@${esc(p.name)}${p.joined ? ` &middot; Joined ${p.joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}</span>
        </div>
        <div class="pf-actions">
          ${self ? '<a class="btn" href="/settings" data-link>Settings</a>' : ''}
          ${me && me.mod && !self && rank !== 'owner' ? `<span class="mod-tools">${me.owner ? `
            <button class="mod-btn" data-act="rename" data-id="${esc(p.uid)}" data-name="${esc(p.name)}" data-display="${esc(shown)}">Rename</button>
            <button class="mod-btn" data-act="${rank === 'mod' ? 'demote' : 'promote'}" data-id="${esc(p.uid)}" data-name="${esc(p.name)}">${rank === 'mod' ? 'Remove moderator' : 'Make moderator'}</button>` : ''}
            <button class="mod-btn" data-act="reset" data-id="${esc(p.uid)}" data-name="${esc(p.name)}">Reset profile</button>
            <button class="mod-btn" data-act="ban" data-id="${esc(p.uid)}" data-name="${esc(p.name)}">Ban</button></span>` : ''}
        </div>
      </header>
      <div class="pf-tiles">
        ${featured ? `
        <a class="pf-tile feat" href="/leaderboards/${featured.slug}" data-link>
          <span class="label">Featured record</span>
          <span class="pf-game">${art(featured, 'mini')}<strong>${esc(featured.title)}</strong></span>
          <span class="pf-num">${fmt(p.bests[featured.slug])}</span>
          <span class="label">No. ${place(featured.slug)} &middot; ${esc(featured.bestLabel || 'Best score')}</span>
        </a>` : ''}
        <div class="pf-tile"><span class="label">No. 1 records</span><span class="pf-num">${firsts.length}</span></div>
        <div class="pf-tile"><span class="label">Top 10 placings</span><span class="pf-num">${placed.length}</span></div>
        <div class="pf-tile"><span class="label">Games on the boards</span><span class="pf-num">${games.length}</span></div>
        ${fav ? `
        <a class="pf-tile" href="/play/${fav.slug}" data-link>
          <span class="label">Favourite game</span>
          <span class="pf-game">${art(fav, 'mini')}<strong>${esc(fav.title)}</strong></span>
        </a>` : ''}
      </div>
      <section>
        <h2 class="label pf-sub">Records</h2>
        ${games.length ? `<ol class="board-list pf-list">${games.map((g) => `
          <li><a class="pf-row" href="/leaderboards/${g.slug}" data-link>${art(g, 'mini')}<span>${esc(g.title)}</span></a>${place(g.slug) ? tagHTML(g.slug, place(g.slug)) : '<span></span>'}<span class="pts">${fmt(p.bests[g.slug])}</span>${me && me.owner ? `<button class="mod-btn" data-act="record" data-id="${esc(p.uid)}" data-name="${esc(p.name)}" data-slug="${g.slug}" data-score="${p.bests[g.slug]}">Remove</button>` : ''}</li>`).join('')}
        </ol>` : '<p class="board-note">No scores yet</p>'}
      </section>
    </div>`
}

/* ── staff ───────────────────────────────────────────────────────
   Moderators and owners. Everyone on staff and every ban in one place;
   owners add and remove moderators here. */

async function renderStaff() {
  const path = location.pathname
  document.title = 'Staff · Vela Arcade'
  document.body.classList.remove('is-playing')
  const me = Account.current()
  const head = '<div class="toolbar"><h1>Staff</h1></div>'
  if (!me || !me.mod) { app.innerHTML = `<div class="wrap">${head}</div>`; return }
  app.innerHTML = `<div class="wrap">${head}</div>`
  let s
  try { s = await Account.staff() } catch {
    app.innerHTML = `<div class="wrap">${head}<p class="board-note staff-note">Could not load staff.</p></div>`
    return
  }
  if (location.pathname !== path) return
  const row = (p, tools = '') => `<li><a class="who" href="/u/${esc(p.name)}" data-link><span class="who-name">${esc(p.name)}</span></a><span></span>${tools}</li>`
  const tool = (act, p, label) => `<button class="mod-btn" data-act="${act}" data-id="${esc(p.uid)}" data-name="${esc(p.name)}">${label}</button>`
  const list = (items, toolsFor) => items.length
    ? `<ol class="board-list staff-list">${items.map((p) => row(p, toolsFor(p))).join('')}</ol>`
    : '<p class="board-note">None</p>'
  app.innerHTML = `
    <div class="wrap">
      ${head}
      <div class="staff">
        <section class="set">
          <h2 class="label">Owners</h2>
          ${list(s.owners, () => '')}
        </section>
        <section class="set">
          <h2 class="label">Moderators</h2>
          ${list(s.mods, (p) => (me.owner ? tool('demote', p, 'Remove') : ''))}
          ${me.owner ? `
          <form class="set-row staff-add" id="staff-add" novalidate>
            <input class="staff-input" name="username" placeholder="Username" maxlength="16" autocomplete="off" autocapitalize="off" spellcheck="false" />
            <button class="btn" type="submit">Make moderator</button>
          </form>
          <p class="set-msg" id="staff-msg" role="status"></p>` : ''}
        </section>
        <section class="set">
          <h2 class="label">Banned</h2>
          ${list(s.bans, (p) => tool('unban', p, 'Unban'))}
        </section>
      </div>
    </div>`

  const add = document.getElementById('staff-add')
  if (!add) return
  add.addEventListener('submit', async (e) => {
    e.preventDefault()
    const msg = document.getElementById('staff-msg')
    const go = add.querySelector('button')
    go.disabled = true
    msg.classList.remove('bad')
    try {
      const p = await Account.profile(add.username.value.trim())
      if (!p) throw new Error('No player with that username')
      await Account.promote(p.uid, p.name)
      route()
    } catch (x) {
      msg.textContent = x.message === 'No player with that username' ? x.message : 'That did not go through. Try again.'
      msg.classList.add('bad')
      go.disabled = false
    }
  })
}

/* ── routing ─────────────────────────────────────────────────── */

function route() {
  const play = location.pathname.match(/^\/play\/([\w-]+)\/?$/)
  if (play) renderPlay(play[1])
  else if (location.pathname === '/' || location.pathname === '/index.html') renderHome()
  else if (location.pathname.replace(/\/$/, '') === '/updates') renderUpdates()
  else if (location.pathname.replace(/\/$/, '') === '/online') renderOnline()
  else if (/^\/leaderboards(\/[\w-]+)?\/?$/.test(location.pathname)) renderLeaderboards(location.pathname.split('/')[2])
  else if (/^\/rules(\/[\w-]+)?\/?$/.test(location.pathname)) renderRules(location.pathname.split('/')[2])
  else if (location.pathname.replace(/\/$/, '') === '/settings') renderSettings()
  else if (location.pathname.replace(/\/$/, '') === '/staff') renderStaff()
  else if (/^\/u\/\w+\/?$/.test(location.pathname)) renderProfile(location.pathname.split('/')[2])
  else renderMissing()
  const here = '/' + (location.pathname.split('/')[1] || '')
  document.querySelectorAll('.nav-link').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === here))
  // Tiles stagger in on their own; everything else eases up as one page.
  const first = app.firstElementChild
  if (first && !app.querySelector('.grid')) first.classList.add('page-in')
}

function navigate(href, { keepSearch = false } = {}) {
  if (!keepSearch) searchInput.value = ''
  history.pushState(null, '', href)
  route()
  if (!keepSearch) window.scrollTo(0, 0)
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  if (a.getAttribute('href') !== location.pathname) navigate(a.getAttribute('href'))
})
window.addEventListener('popstate', route)

/* ── account ─────────────────────────────────────────────────────
   Optional. One quiet button in the bar; nothing else on the site asks. */

const accountEl = document.getElementById('account')
const personIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>'

function renderAccount({ user }) {
  if (!user) {
    accountEl.innerHTML = `
      <button class="account-btn" id="sign-in" aria-label="Sign in">
        ${personIcon}<span>Sign in</span>
      </button>`
    return
  }
  accountEl.innerHTML = `
    <button class="account-btn signed" id="account-open" aria-haspopup="true" aria-expanded="false" aria-label="Account">
      ${avatarHTML(user)}
    </button>
    <div class="account-menu" id="account-menu" hidden>
      <span class="label">${esc(user.display || user.name)}${user.owner ? ' &middot; Owner' : user.mod ? ' &middot; Moderator' : ''}</span>
      <a class="account-item" href="/u/${esc(user.name)}" data-link>Profile</a>
      <a class="account-item" href="/settings" data-link>Settings</a>
      ${user.mod ? '<a class="account-item" href="/staff" data-link>Staff</a>' : ''}
      <div class="account-switch">${Account.otherAccounts().map((s) => `
        <button class="account-other" data-app="${esc(s.app)}">${avatarHTML(s, 'sm')}<span>${esc(s.display || s.name)}</span></button>`).join('')}
        ${Account.canAddAccount() ? '<button class="account-item" id="add-account">Add account</button>' : ''}
      </div>
      <button class="account-item" id="sign-out">Sign out</button>
    </div>`
}

// Bests may arrive from another device after the lobby has drawn.
function refreshBests() {
  document.querySelectorAll('.card[data-slug]').forEach((el) => {
    const g = bySlug(el.dataset.slug)
    const best = g && g.scores ? bestFor(g.slug) : 0
    if (!best) return
    let meta = el.querySelector('.card-meta')
    if (!meta) { meta = document.createElement('div'); meta.className = 'card-meta'; el.querySelector('.card-body').append(meta) }
    meta.innerHTML = `<span class="label">${esc(g.bestLabel || 'Best')} <span class="best">${fmt(best)}</span></span>`
  })
}

// The leaderboard on screen (game page or Leaderboards tab), if it shows one of
// the changed games.
function refreshBoard(slugs) {
  const list = document.getElementById('board-list')
  const g = list && bySlug(list.dataset.slug)
  if (g && (!slugs || slugs.includes(g.slug))) showBoard(g)
}

let lastUser = null
Account.onChange((state) => {
  renderAccount(state)
  if (state.bestsChanged) refreshBests()
  if (state.boardsChanged) refreshBoard(state.boardsChanged)
  // Redraw on sign-in, sign-out, and when moderator status or the profile
  // arrives. Settings and profile pages depend on who is signed in.
  const u = state.user
  const who = u ? u.uid + (u.mod ? ':mod' : '') + (u.owner ? ':own' : '') + (u.display ? ':p' : '') : null
  if (who !== lastUser) {
    lastUser = who
    if (/^\/(settings|staff|u\/)/.test(location.pathname)) route()
    else refreshBoard()
  }
})

/* The sign-in form: a username and a password. Opened only from the button. */
const dialog = document.createElement('div')
dialog.className = 'dialog-back'
dialog.hidden = true
dialog.innerHTML = `
  <form class="dialog" id="auth-form" novalidate>
    <div class="dialog-tabs" role="tablist">
      <button type="button" class="dialog-tab on" data-mode="in" role="tab">Sign in</button>
      <button type="button" class="dialog-tab" data-mode="new" role="tab">Create account</button>
      <button type="button" class="icon-btn dialog-close" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </button>
    </div>
    <label class="field"><span class="label">Username</span>
      <input name="username" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="16" required />
    </label>
    <label class="field"><span class="label">Password</span>
      <input name="password" type="password" autocomplete="current-password" required />
    </label>
    <p class="dialog-error" id="auth-error" role="alert"></p>
    <button class="btn primary" id="auth-go" type="submit">Sign in</button>
  </form>`
document.body.append(dialog)
const form = dialog.querySelector('form')
let mode = 'in'

function setMode(m) {
  mode = m
  dialog.querySelectorAll('.dialog-tab').forEach((t) => t.classList.toggle('on', t.dataset.mode === m))
  form.password.autocomplete = m === 'in' ? 'current-password' : 'new-password'
  document.getElementById('auth-go').textContent = m === 'in' ? 'Sign in' : 'Create account'
  document.getElementById('auth-error').textContent = ''
}
// adding: a second account, signed in alongside the current one.
let adding = false
function openDialog(opts = {}) {
  adding = !!opts.adding
  setMode('in')
  form.reset()
  dialog.hidden = false
  form.username.focus()
}
const closeDialog = () => { dialog.hidden = true }

dialog.addEventListener('click', (e) => {
  if (e.target === dialog || e.target.closest('.dialog-close')) closeDialog()
  const tab = e.target.closest('.dialog-tab')
  if (tab) setMode(tab.dataset.mode)
})
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dialog.hidden) closeDialog() })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const go = document.getElementById('auth-go')
  const err = document.getElementById('auth-error')
  const name = form.username.value.trim()
  const password = form.password.value
  go.disabled = true
  err.textContent = ''
  try {
    if (adding && Account.current()) await Account.addAccount(mode, name, password)
    else if (mode === 'in') await Account.signIn(name, password)
    else await Account.createAccount(name, password)
    closeDialog()
  } catch (x) {
    err.textContent = x.message
  }
  go.disabled = false
})

accountEl.addEventListener('click', async (e) => {
  const menu = document.getElementById('account-menu')
  if (e.target.closest('#sign-in')) openDialog()
  else if (e.target.closest('#account-open')) {
    menu.hidden = !menu.hidden
    e.target.closest('#account-open').setAttribute('aria-expanded', String(!menu.hidden))
  } else if (e.target.closest('a.account-item')) {
    menu.hidden = true
  } else if (e.target.closest('.account-other')) {
    Account.switchTo(e.target.closest('.account-other').dataset.app)
  } else if (e.target.closest('#add-account')) {
    menu.hidden = true
    openDialog({ adding: true })
  } else if (e.target.closest('#sign-out')) {
    menu.hidden = true
    await Account.signOut()
  }
})
document.addEventListener('click', (e) => {
  const menu = document.getElementById('account-menu')
  if (menu && !menu.hidden && !e.target.closest('#account')) menu.hidden = true
})

document.getElementById('version').textContent = 'Version ' + CURRENT_VERSION
startHeartbeat()

route()
