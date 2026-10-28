/* Optional sign-in that keeps bests across devices.
 *
 * Nothing here is ever needed to play. Bests always live in localStorage
 * (bridge.js writes them); signing in with Google just mirrors them to
 * Firestore at players/<uid> and pulls them back on another device, keeping
 * the higher of the two for every game.
 *
 * The Firebase SDK is only downloaded when someone presses Sign in, or on a
 * later visit by someone who signed in before, so everyone else pays nothing.
 *
 * Firestore cost: one read when a signed-in visitor opens the site, and one
 * write per new best.
 *
 * On localhost this uses the auth and Firestore emulators (`npm run emulators`).
 */
const SDK = 'https://www.gstatic.com/firebasejs/11.10.0/'
// The same config the games use. A full URL, so Vite's dev server serves the
// public file as it is instead of treating it as a module to transform.
const CONFIG = location.origin + '/games/_shared/firebase-config.js'
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const FLAG = 'vela:signed-in'
const BEST = 'vela:best:'

let fb = null      // loaded SDK pieces
let user = null    // { uid, name }
let cloud = {}     // bests as stored in Firestore
const listeners = new Set()

const storage = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch {} },
  del(k) { try { localStorage.removeItem(k) } catch {} },
}

function localBests() {
  const out = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(BEST)) out[k.slice(BEST.length)] = Number(localStorage.getItem(k)) || 0
    }
  } catch {}
  return out
}

async function load() {
  if (fb) return fb
  const [{ initializeApp }, auth, store, { firebaseConfig }] = await Promise.all([
    import(/* @vite-ignore */ SDK + 'firebase-app.js'),
    import(/* @vite-ignore */ SDK + 'firebase-auth.js'),
    import(/* @vite-ignore */ SDK + 'firebase-firestore.js'),
    import(/* @vite-ignore */ CONFIG),
  ])
  const app = initializeApp(firebaseConfig || { apiKey: 'demo', projectId: 'demo-vela-arcade', appId: 'demo' }, 'vela-account')
  const a = auth.getAuth(app)
  const db = store.getFirestore(app)
  if (local) {
    auth.connectAuthEmulator(a, 'http://127.0.0.1:9199', { disableWarnings: true })
    store.connectFirestoreEmulator(db, '127.0.0.1', 8181)
  }
  fb = { auth, store, a, db }
  auth.onAuthStateChanged(a, (u) => {
    if (u && !u.isAnonymous) {
      user = { uid: u.uid, name: u.displayName || u.email || 'Player' }
      storage.set(FLAG, '1')
      sync()
    } else {
      user = null
      cloud = {}
      storage.del(FLAG)
    }
    emit()
  })
  return fb
}

const ref = () => fb.store.doc(fb.db, 'players', user.uid)

// Higher wins both ways: the device gets any better cloud best, the cloud gets
// any better device best.
async function sync() {
  try {
    const snap = await fb.store.getDoc(ref())
    cloud = (snap.exists() && snap.data().bests) || {}
    const mine = localBests()
    const up = {}
    for (const [slug, n] of Object.entries(mine)) if (n > (cloud[slug] || 0)) up[slug] = n
    for (const [slug, n] of Object.entries(cloud)) if (n > (mine[slug] || 0)) storage.set(BEST + slug, String(n))
    if (Object.keys(up).length) await save(up)
    emit({ bestsChanged: true })
  } catch (e) {
    console.warn('score sync failed', e)
  }
}

async function save(bests) {
  await fb.store.setDoc(ref(), { bests, updatedAt: fb.store.serverTimestamp() }, { merge: true })
  Object.assign(cloud, bests)
}

// Games report a new best through bridge.js; mirror it while signed in.
window.addEventListener('message', (e) => {
  const d = e.data
  if (e.origin !== location.origin || !d || d.source !== 'vela-game' || d.type !== 'gameover') return
  if (!user || !d.isBest || !(d.best > (cloud[d.game] || 0))) return
  save({ [d.game]: d.best }).catch((err) => console.warn('score save failed', err))
})

function emit(extra = {}) {
  listeners.forEach((fn) => fn({ user, ...extra }))
}

export function onChange(fn) {
  listeners.add(fn)
  fn({ user })
}

export async function signIn() {
  const { auth, a } = await load()
  await auth.signInWithPopup(a, new auth.GoogleAuthProvider())
}

export async function signOut() {
  if (!fb) return
  await fb.auth.signOut(fb.a)
}

// Someone who signed in before gets their session (and a sync) back quietly.
if (storage.get(FLAG)) load().catch(() => {})
