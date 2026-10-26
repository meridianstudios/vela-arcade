/* Players online, counted through the Realtime Database's REST API: no SDK,
 * just fetch, so it costs the lobby almost nothing to load.
 *
 * Each open, visible tab writes online/<id> = { at: server time } once a
 * minute; the id is random and kept per browser. Anyone whose last write is
 * newer than WINDOW_MS counts as online. The database rules only allow reads
 * ordered by time and capped at MAX entries, and only accept the server's own
 * clock as the timestamp.
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

function myId() {
  const key = 'vela:online-id'
  try {
    const have = localStorage.getItem(key)
    if (have && /^[A-Za-z0-9]{20}$/.test(have)) return have
  } catch {}
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => abc[b % abc.length]).join('')
  try { localStorage.setItem(key, id) } catch {}
  return id
}

const url = (path, query = '') => `${DB}/${path}.json${NS}${query ? (NS ? '&' : '?') + query : ''}`

// Server time minus this device's clock, learned from each heartbeat's reply,
// so the count does not depend on the viewer's clock being right.
let offset = 0

async function beat(id) {
  if (document.hidden) return
  try {
    const res = await fetch(url(`online/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ at: { '.sv': 'timestamp' } }),
    })
    if (res.ok) {
      const { at } = await res.json()
      if (typeof at === 'number') offset = at - Date.now()
    }
  } catch {}
}

let started = false
export function startHeartbeat() {
  if (started) return
  started = true
  const id = myId()
  beat(id)
  setInterval(() => beat(id), BEAT_MS)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) beat(id) })
}

/* Resolves to the number of players online, or null if it cannot be reached. */
export async function countOnline() {
  const since = Date.now() + offset - WINDOW_MS
  try {
    const res = await fetch(url('online', `orderBy=${encodeURIComponent('"at"')}&startAt=${Math.floor(since)}&limitToLast=${MAX}`))
    if (!res.ok) return null
    const data = await res.json()
    return data ? Object.keys(data).length : 0
  } catch {
    return null
  }
}
