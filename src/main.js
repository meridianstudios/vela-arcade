import './style.css'
import { GAMES, TAGS, bySlug, playable } from './games.js'
import { UPDATES, CURRENT_VERSION } from './updates.js'
import { startHeartbeat, countOnline, visitTotals } from './online.js'

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
      </div>
      <div>
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
  else renderMissing()
  document.querySelectorAll('.nav-link').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === location.pathname.replace(/\/$/, '')))
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

document.getElementById('version').textContent = 'Version ' + CURRENT_VERSION
startHeartbeat()

route()
