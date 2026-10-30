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
  const me = Account.current()
  const mod = me && me.mod
  list.innerHTML = data.top.map((r, i) => `
    <li class="${r.you ? 'you' : ''}"><span class="rank">${i + 1}</span><span class="who">${esc(r.name)}</span><span class="pts">${fmt(r.score)}</span>${mod && !r.you ? `
      <span class="mod-tools"><button class="mod-btn" data-act="remove" data-slug="${g.slug}" data-id="${esc(r.id)}" data-name="${esc(r.name)}">Remove</button><button class="mod-btn" data-act="ban" data-slug="${g.slug}" data-id="${esc(r.id)}" data-name="${esc(r.name)}">Ban</button></span>` : ''}</li>`).join('')
    + (data.you ? `<li class="you sep"><span class="rank"></span><span class="who">${esc(me.name)}</span><span class="pts">${fmt(data.you.score)}</span></li>` : '')
}

document.addEventListener('click', async (e) => {
  const b = e.target.closest('.mod-btn')
  if (!b) return
  const { act, slug, id, name } = b.dataset
  const ask = act === 'ban'
    ? `Ban ${name}? They are removed from every leaderboard and cannot post again.`
    : `Remove ${name} from this leaderboard?`
  if (!confirm(ask)) return
  b.disabled = true
  try {
    if (act === 'ban') await Account.ban(id, name, boardGames().map((g) => g.slug))
    else await Account.removeEntry(slug, id)
  } catch (err) {
    console.warn('moderation failed', err)
    alert('That did not go through. Try again.')
  }
  refreshBoard()
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

/* ── routing ─────────────────────────────────────────────────── */

function route() {
  const play = location.pathname.match(/^\/play\/([\w-]+)\/?$/)
  if (play) renderPlay(play[1])
  else if (location.pathname === '/' || location.pathname === '/index.html') renderHome()
  else if (location.pathname.replace(/\/$/, '') === '/updates') renderUpdates()
  else if (location.pathname.replace(/\/$/, '') === '/online') renderOnline()
  else if (/^\/leaderboards(\/[\w-]+)?\/?$/.test(location.pathname)) renderLeaderboards(location.pathname.split('/')[2])
  else if (/^\/rules(\/[\w-]+)?\/?$/.test(location.pathname)) renderRules(location.pathname.split('/')[2])
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
      <span class="avatar">${esc((user.name.trim()[0] || 'P').toUpperCase())}</span>
    </button>
    <div class="account-menu" id="account-menu" hidden>
      <span class="label">${esc(user.name)}${user.mod ? ' &middot; Moderator' : ''}</span>
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
  // Redraw on sign-in, sign-out, and when moderator status arrives.
  const who = state.user ? state.user.uid + (state.user.mod ? ':mod' : '') : null
  if (who !== lastUser) { lastUser = who; refreshBoard() }
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
function openDialog() {
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
    if (mode === 'in') await Account.signIn(name, password)
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
