/* Optional accounts: a username and a password, nothing else.
 *
 * Nothing here is ever needed to play. Bests always live in localStorage
 * (bridge.js writes them); an account mirrors them to Firestore at
 * players/<uid>, pulls them back on another device (the higher wins), and puts
 * them on the global leaderboards at boards/<game>/scores/<uid>.
 *
 * Under the hood it is Firebase email/password auth with a made-up address
 * built from the username, so Firebase keeps usernames unique and no email is
 * ever asked for or sent. The flip side: a forgotten password cannot be reset.
 *
 * The Firebase SDK is only downloaded when someone opens the sign-in form,
 * views a leaderboard, or on a later visit by someone who signed in before.
 *
 * Firestore cost: one read when a signed-in visitor opens the site, a write
 * per new best (two with the leaderboard), and up to 10 reads per leaderboard
 * shown.
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
const MAIL = '@players.invalid'
export const BOARD_SIZE = 10

let fb = null      // loaded SDK pieces
let loading = null
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

/* ── usernames ─────────────────────────────────────────────────── */

// Names show on public leaderboards, so the obvious slurs and swears are out.
const BLOCKED = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'bitch', 'whore', 'slut', 'rape', 'nazi', 'hitler', 'penis', 'vagina', 'porn', 'dick', 'cock', 'pussy', 'retard', 'kys']

export function checkName(name) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return '3 to 16 letters, numbers or _'
  const flat = name.toLowerCase().replace(/_/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's')
  if (BLOCKED.some((w) => flat.includes(w))) return 'Pick another username'
  return null
}

const emailFor = (name) => name.toLowerCase() + MAIL

/* ── firebase ──────────────────────────────────────────────────── */

function load() {
  if (fb) return Promise.resolve(fb)
  if (loading) return loading
  loading = (async () => {
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
      if (u && u.email && u.email.endsWith(MAIL)) {
        user = { uid: u.uid, name: u.displayName || u.email.slice(0, -MAIL.length) }
        storage.set(FLAG, '1')
        // A brand-new account has no display name for a moment; createAccount
        // syncs once it is set, so leaderboard entries get the right case.
        if (u.displayName) sync()
        checkMod()
      } else {
        // Anything else (an old Google session) is signed out quietly.
        if (u) auth.signOut(a)
        user = null
        cloud = {}
        storage.del(FLAG)
      }
      emit()
    })
    return fb
  })()
  loading.catch(() => { loading = null })
  return loading
}

// Moderator status lives in mods/<uid>, which only an admin can write; the
// rules let an account read its own entry and nothing else.
async function checkMod() {
  const me = user
  try {
    const snap = await fb.store.getDoc(fb.store.doc(fb.db, 'mods', me.uid))
    if (user === me && snap.exists()) { user = { ...user, mod: true }; emit() }
  } catch {}
}

const playerRef = () => fb.store.doc(fb.db, 'players', user.uid)
const boardRef = (slug) => fb.store.doc(fb.db, 'boards', slug, 'scores', user.uid)

// Higher wins both ways: the device gets any better cloud best, the cloud gets
// any better device best.
async function sync() {
  try {
    const snap = await fb.store.getDoc(playerRef())
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
  await fb.store.setDoc(playerRef(), { bests, updatedAt: fb.store.serverTimestamp() }, { merge: true })
  Object.assign(cloud, bests)
  // Leaderboard entries; one failing (say, a game with no board) never blocks the rest.
  await Promise.all(Object.entries(bests).map(([slug, score]) =>
    fb.store.setDoc(boardRef(slug), { name: user.name, score, at: fb.store.serverTimestamp() })
      .catch((e) => console.warn('leaderboard save failed', slug, e))))
  emit({ boardsChanged: Object.keys(bests) })
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

/* ── public ────────────────────────────────────────────────────── */

export function onChange(fn) {
  listeners.add(fn)
  fn({ user })
}

export const current = () => user

// Errors come back as short labels for the form, never raw Firebase text.
function message(err) {
  const code = String((err && err.code) || '')
  if (/email-already-in-use/.test(code)) return 'That username is taken'
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'Wrong username or password'
  if (/weak-password/.test(code)) return 'Password needs 6 or more characters'
  if (/too-many-requests/.test(code)) return 'Too many tries. Wait a minute'
  if (/network/.test(code)) return 'No connection'
  return 'Something went wrong. Try again'
}

export async function signIn(name, password) {
  const bad = /^[A-Za-z0-9_]{3,16}$/.test(name) ? null : 'Wrong username or password'
  if (bad) throw new Error(bad)
  try {
    const { auth, a } = await load()
    await auth.signInWithEmailAndPassword(a, emailFor(name), password)
  } catch (e) { throw new Error(message(e)) }
}

export async function createAccount(name, password) {
  const bad = checkName(name) || (password.length < 6 ? 'Password needs 6 or more characters' : null)
  if (bad) throw new Error(bad)
  try {
    const { auth, a } = await load()
    const cred = await auth.createUserWithEmailAndPassword(a, emailFor(name), password)
    await auth.updateProfile(cred.user, { displayName: name })
    user = { uid: cred.user.uid, name }
    emit()
    sync()
  } catch (e) { throw new Error(message(e)) }
}

export async function signOut() {
  if (!fb) return
  await fb.auth.signOut(fb.a)
}

/* Top scores for a game, plus your own best if it is not among them (the
 * rules cap queries, so there is no rank count beyond the top).
 * Resolves to { top: [{ name, score, you }], you: { score } | null },
 * or null if it cannot be reached. */
// Read through Firestore's REST API: boards are public, so viewers who never
// sign in don't download the SDK just to see one.
const REST = local
  ? 'http://127.0.0.1:8181/v1/projects/vela-arcade/databases/(default)/documents'
  : 'https://firestore.googleapis.com/v1/projects/vela-arcade/databases/(default)/documents'

export async function leaderboard(slug) {
  try {
    const res = await fetch(`${REST}/boards/${encodeURIComponent(slug)}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: {
        from: [{ collectionId: 'scores' }],
        orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
        limit: BOARD_SIZE,
      } }),
    })
    if (!res.ok) throw new Error(res.status)
    const num = (v) => Number(v && (v.integerValue ?? v.doubleValue)) || 0
    const top = (await res.json()).filter((r) => r.document).map(({ document: d }) => ({
      id: d.name.split('/').pop(),
      name: (d.fields.name && d.fields.name.stringValue) || '',
      score: num(d.fields.score),
      you: !!user && d.name.endsWith('/' + user.uid),
    }))
    const mine = user && cloud[slug]
    const you = mine && !top.some((r) => r.you) ? { score: mine } : null
    return { top, you }
  } catch (e) {
    console.warn('leaderboard failed', e)
    return null
  }
}

/* ── moderation ────────────────────────────────────────────────
   Only work for an account listed in mods/; the rules refuse everyone else. */

export async function removeEntry(slug, uid) {
  if (!user || !user.mod) throw new Error('Not a moderator')
  await fb.store.deleteDoc(fb.store.doc(fb.db, 'boards', slug, 'scores', uid))
}

// Bans an account from posting again and clears it off every board.
export async function ban(uid, name, slugs) {
  if (!user || !user.mod) throw new Error('Not a moderator')
  await fb.store.setDoc(fb.store.doc(fb.db, 'bans', uid), { name, by: user.uid, at: fb.store.serverTimestamp() })
  await Promise.all(slugs.map((slug) => fb.store.deleteDoc(fb.store.doc(fb.db, 'boards', slug, 'scores', uid)).catch(() => {})))
}

// Someone who signed in before gets their session (and a sync) back quietly.
if (storage.get(FLAG)) load().catch(() => {})
