/* Moving off the old addresses.
 *
 * velaarc.novalabsos.com and velaarcade.novalabsos.com close on MOVE_BY.
 * Until then they carry a banner; from then they send everyone straight on to
 * HOME. Either way a player's saved data comes along: bests, favourites,
 * recent games and game saves live in localStorage, which belongs to one
 * address. HOME opens /move.html from the old address in a hidden frame, and
 * that page hands its storage over. The addresses are the same site
 * (novalabsos.com), so the frame sees the same storage the old page did.
 * Sign-ins cannot move with it; players sign in again.
 */
export const HOME = 'https://arcade.novalabsos.com'
const OLD = ['velaarc.novalabsos.com', 'velaarcade.novalabsos.com']
const MOVE_BY = Date.parse('2026-12-11T05:00:00Z') // midnight, US Eastern
export const CLOSES = 'December 11'

// ?old-host on localhost shows the banner, for testing.
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
export const onOldHost = OLD.includes(location.hostname) || (local && new URLSearchParams(location.search).has('old-host'))

// The same page on HOME, saying where it came from.
export function moveUrl() {
  const u = new URL(location.pathname + location.search, HOME)
  u.searchParams.delete('old-host')
  u.searchParams.set('from', location.hostname)
  return u.href
}

// Links people share should outlive the old addresses.
export const shareOrigin = () => (onOldHost && !local ? HOME : location.origin)

export function startMove() {
  if (!onOldHost) { receive(); return }
  if (Date.now() >= MOVE_BY && !local) { location.replace(moveUrl()); return }
  const bar = document.createElement('div')
  bar.className = 'moving'
  bar.innerHTML = `<span>This address closes on ${CLOSES}. Vela Arcade is moving to <b>arcade.novalabsos.com</b>.</span><a class="moving-go" href="${moveUrl()}">Move now</a>`
  bar.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); location.href = moveUrl() })
  document.body.prepend(bar)
  document.documentElement.classList.add('has-moving')
}

// Things the new address can't use: sign-in records point at sessions that
// stay behind.
const SKIP = new Set(['vela:signed-in', 'vela:account', 'vela:active-app', 'vela:accounts', 'vela:probe'])
const LISTS = new Set(['vela:recent', 'vela:favs', 'vela:played-ever'])
const parse = (s) => { try { return JSON.parse(s) } catch { return null } }

// Adds the old address's data to what is here, keeping the better of each
// best and both sets of favourites; anything else is only filled in if missing.
function merge(data) {
  let changed = 0
  for (const [k, v] of Object.entries(data || {})) {
    if (typeof k !== 'string' || !k.startsWith('vela:') || SKIP.has(k) || typeof v !== 'string') continue
    let have = null
    try { have = localStorage.getItem(k) } catch { return changed }
    let out = have == null ? v : null
    if (k.startsWith('vela:best:')) out = String(Math.max(Number(have) || 0, Number(v) || 0))
    else if (LISTS.has(k)) {
      const a = parse(have), b = parse(v)
      if (Array.isArray(b)) out = JSON.stringify([...new Set([...(Array.isArray(a) ? a : []), ...b])])
    }
    if (out != null && out !== have) {
      try { localStorage.setItem(k, out); changed++ } catch {}
    }
  }
  return changed
}

function receive() {
  const u = new URL(location.href)
  const from = u.searchParams.get('from')
  if (!from) return
  u.searchParams.delete('from')
  history.replaceState(history.state, '', u.pathname + u.search + u.hash)
  if (!OLD.includes(from)) return
  const frame = document.createElement('iframe')
  frame.hidden = true
  frame.title = 'Moving saved games'
  frame.src = `https://${from}/move.html?to=${encodeURIComponent(location.origin)}`
  let timer = 0
  const done = () => { clearTimeout(timer); removeEventListener('message', got); frame.remove() }
  function got(e) {
    if (e.origin !== `https://${from}` || !e.data || e.data.source !== 'vela-move') return
    done()
    // Redraw with the data that just arrived.
    if (merge(e.data.data)) location.reload()
  }
  addEventListener('message', got)
  timer = setTimeout(done, 10000)
  document.body.append(frame)
}
