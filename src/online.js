/* Players online, counted through the Realtime Database's REST API: no SDK,
 * just fetch, so it costs the lobby almost nothing to load.
 *
 * Each open, visible tab writes online/<id> = { at: server time, game } once
 * a minute, and again whenever it opens or leaves a game; the id is random and
 * kept per browser, and game is the slug being played, if any. Anyone whose last write is
 * newer than WINDOW_MS counts as online. The database rules only allow reads
 * ordered by time and capped at MAX entries, and only accept the server's own
 * clock as the timestamp.
 *
 * Totals: stats/allTime counts browsers that have ever visited and
 * stats/days/<date> counts browsers seen on that day (US Eastern date). Each
 * browser adds one the first time, remembered in localStorage; the rules only
 * accept a write that is exactly the current value plus one, so two visitors
 * racing just means one retries. The check runs with every heartbeat, not just
 * on load, so a tab left open past midnight counts for the new day and a count
 * that failed gets another go a minute later: anyone online is counted today.
 *
 * Players per game: plays/days/<date>/<slug> and plays/allTime/<slug>, the
 * same plus-one way. A browser counts for a game once it has spent PLAY_MS in
 * it, once a day and once ever, so the lobby can rank the most played games.
 *
 * This lives in the Realtime Database rather than Firestore on purpose: its
 * free tier bills by bandwidth, not per write, so heartbeats never eat into
 * the Firestore quota that online rooms depend on.
 *
 * On localhost it talks to the database emulator (`npm run emulators`).
 */
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const DB = local ? 'http://127.0.0.1:9000' : 'https://vela-arcade-default-rtdb.firebaseio.com'
// The emulator applies database.rules.json to the demo project's default instance.
const NS = local ? '?ns=demo-vela-arcade-default-rtdb' : ''
const BEAT_MS = 60000
const WINDOW_MS = 150000
const MAX = 5000

// localStorage when the browser allows it. Without it, this page load is all
// there is: the id and the counts last until a reload, which gives a new id,
// so the totals and the online count still describe the same browsers.
const store = (() => {
  try { localStorage.setItem('vela:probe', '1'); return localStorage } catch {}
  const memory = new Map()
  return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) }
})()

function myId() {
  const key = 'vela:online-id'
  const have = store.getItem(key)
  if (have && /^[A-Za-z0-9]{20}$/.test(have)) return have
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => abc[b % abc.length]).join('')
  store.setItem(key, id)
  return id
}

const url = (path, query = '') => `${DB}/${path}.json${NS}${query ? (NS ? '&' : '?') + query : ''}`

// Server time minus this device's clock, learned from each heartbeat's reply,
// so the count does not depend on the viewer's clock being right.
let offset = 0
let game = ''

async function beat(id) {
  if (document.hidden) return
  try {
    const res = await fetch(url(`online/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ at: { '.sv': 'timestamp' }, ...(game ? { game } : {}) }),
    })
    if (res.ok) {
      const { at } = await res.json()
      if (typeof at === 'number') offset = at - Date.now()
    }
  } catch {}
}

const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + offset))

async function readNumber(path) {
  const res = await fetch(url(path))
  if (!res.ok) throw new Error(res.status)
  return Number(await res.json()) || 0
}

async function addOne(path) {
  for (let tries = 0; tries < 6; tries++) {
    try {
      const n = await readNumber(path)
      const res = await fetch(url(path), { method: 'PUT', body: JSON.stringify(n + 1) })
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 600))
  }
  return false
}

// Each browser counts once ever and once a day. Once both are done this is
// two storage reads and no network.
let counting = false
async function countVisit() {
  if (counting) return
  counting = true
  try {
    if (!store.getItem('vela:counted') && await addOne('stats/allTime')) store.setItem('vela:counted', '1')
    const day = today()
    if (store.getItem('vela:counted-day') !== day && await addOne(`stats/days/${day}`)) store.setItem('vela:counted-day', day)
  } finally {
    counting = false
  }
}

let started = false
export function startHeartbeat() {
  if (started) return
  started = true
  const id = myId()
  const tick = () => beat(id).then(countVisit)
  tick()
  setInterval(tick, BEAT_MS)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
}

/* The game this tab is playing ('' for none). A change goes out at once, so
 * counts follow players between games without waiting for the next minute. */
export function setGame(slug = '') {
  if (slug === game) return
  game = slug
  if (started) beat(myId())
  countPlay(slug)
}

// A play counts once this browser has been in the game for PLAY_MS, so a quick
// look at a game is not one.
const PLAY_MS = 20000
let playTimer = 0
const readList = (key) => { try { const v = JSON.parse(store.getItem(key) || 'null'); return v && typeof v === 'object' ? v : null } catch { return null } }
function countPlay(slug) {
  clearTimeout(playTimer)
  if (!slug) return
  playTimer = setTimeout(async () => {
    if (game !== slug) return
    const day = today()
    const daily = readList('vela:played-day')
    const todays = daily && daily.day === day && Array.isArray(daily.slugs) ? daily.slugs : []
    if (!todays.includes(slug) && await addOne(`plays/days/${day}/${slug}`)) {
      store.setItem('vela:played-day', JSON.stringify({ day, slugs: [...todays, slug] }))
    }
    const ever = readList('vela:played-ever') || []
    if (Array.isArray(ever) && !ever.includes(slug) && await addOne(`plays/allTime/${slug}`)) {
      store.setItem('vela:played-ever', JSON.stringify([...ever, slug]))
    }
  }, PLAY_MS)
}

/* Resolves to { today, allTime }: players per game by slug, today (US Eastern)
 * and all time. Either is {} if it cannot be reached. */
export async function playCounts() {
  const get = async (path) => {
    try {
      const res = await fetch(url(path))
      const v = res.ok ? await res.json() : null
      return v && typeof v === 'object' ? v : {}
    } catch { return {} }
  }
  const [todayCounts, allTime] = await Promise.all([get(`plays/days/${today()}`), get('plays/allTime')])
  return { today: todayCounts, allTime }
}

/* Resolves to { total, games } (players online, and how many are in each
 * game by slug), or null if it cannot be reached. */
export async function whoIsOnline() {
  const since = Date.now() + offset - WINDOW_MS
  try {
    const res = await fetch(url('online', `orderBy=${encodeURIComponent('"at"')}&startAt=${Math.floor(since)}&limitToLast=${MAX}`))
    if (!res.ok) return null
    const rows = Object.values((await res.json()) || {})
    const games = {}
    for (const r of rows) if (r && typeof r.game === 'string') games[r.game] = (games[r.game] || 0) + 1
    return { total: rows.length, games }
  } catch {
    return null
  }
}

/* Resolves to { today, allTime }; either is null if it cannot be reached. */
export async function visitTotals() {
  const get = (path) => readNumber(path).catch(() => null)
  const [todayCount, allTime] = await Promise.all([get(`stats/days/${today()}`), get('stats/allTime')])
  return { today: todayCount, allTime }
}
