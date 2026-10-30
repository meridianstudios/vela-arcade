/* Optional accounts: a username and a password, nothing else.
 *
 * Nothing here is ever needed to play. Bests always live in localStorage
 * (bridge.js writes them); an account mirrors them to its public profile at
 * profiles/<username>, pulls them back on another device (the higher wins),
 * and puts them on the global leaderboards at boards/<game>/scores/<uid>.
 *
 * Under the hood it is Firebase email/password auth with a made-up address
 * built from the username, so Firebase keeps usernames unique and no email is
 * ever asked for or sent. The flip side: a forgotten password cannot be reset.
 *
 * The profile is the account's public face: a display name, an avatar (a
 * game's icon on a colour), a featured No. 1 record and a favourite game. The
 * username never changes and shows as @name, so a display name cannot pass
 * for someone else. Leaderboard entries carry a copy of the look, so a board
 * still costs only its own reads. A featured record is checked against the
 * board whenever it is shown, so it disappears when someone takes the top
 * spot and cannot be faked.
 *
 * The Firebase SDK is only downloaded when someone opens the sign-in form,
 * views a leaderboard, or on a later visit by someone who signed in before.
 *
 * Firestore cost: one read when a signed-in visitor opens the site, a write
 * per new best (two with the leaderboard), up to 10 reads per leaderboard
 * shown, and one read per game whose No. 1 is being checked (remembered for a
 * few minutes).
 *
 * On localhost this uses the auth and Firestore emulators (`npm run emulators`).
 */
const SDK = 'https://www.gstatic.com/firebasejs/11.10.0/'
// The same config the games use. A full URL, so Vite's dev server serves the
// public file as it is instead of treating it as a module to transform.
const CONFIG = location.origin + '/games/_shared/firebase-config.js'
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const FLAG = 'vela:signed-in'
const ACCOUNT_KEY = 'vela:account'
const BEST = 'vela:best:'
const MAIL = '@players.invalid'
export const BOARD_SIZE = 10
// Avatar colours. firestore.rules lists the same ones.
export const COLORS = ['#ea5426', '#2d89ef', '#00a300', '#b91d47', '#7e3878', '#e3a21a', '#00aba9', '#5e6066']

let fb = null      // loaded SDK pieces
let loading = null
let user = null    // { uid, name, display, avatar, color, badge, fav, joined, mod }
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

/* ── names ─────────────────────────────────────────────────────── */

// Names show on public leaderboards, so the obvious slurs and swears are out.
// firestore.rules checks display names against the same list.
const BLOCKED = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'bitch', 'whore', 'slut', 'rape', 'nazi', 'hitler', 'penis', 'vagina', 'porn', 'dick', 'cock', 'pussy', 'retard', 'kys']
const flatten = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's')

export function checkName(name) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return '3 to 16 letters, numbers or _'
  if (BLOCKED.some((w) => flatten(name).includes(w))) return 'Pick another username'
  return null
}

export function checkDisplay(v) {
  if (v.length < 2 || v.length > 20 || !/^[A-Za-z0-9_]+([ .-][A-Za-z0-9_]+)*$/.test(v)) return '2 to 20 letters or numbers, single spaces'
  if (BLOCKED.some((w) => flatten(v).includes(w))) return 'Pick another display name'
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
        storage.del(ACCOUNT_KEY)
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
    if (user && user.uid === me.uid && snap.exists()) { user = { ...user, mod: true }; emit() }
  } catch {}
}

const playerRef = () => fb.store.doc(fb.db, 'players', user.uid)
const profileRef = () => fb.store.doc(fb.db, 'profiles', user.name.toLowerCase())
const boardRef = (slug) => fb.store.doc(fb.db, 'boards', slug, 'scores', user.uid)
const now = () => fb.store.serverTimestamp()

// The part of the profile that rides along on leaderboard entries.
const lookOf = (u) => ({ display: u.display, avatar: u.avatar, color: u.color, badge: u.badge })

function setLook(d) {
  user = {
    ...user,
    display: d.display || user.name,
    avatar: d.avatar || '',
    color: COLORS.includes(d.color) ? d.color : COLORS[0],
    badge: d.badge || '',
    fav: d.fav || '',
    joined: d.joined && d.joined.toDate ? d.joined.toDate() : user.joined,
  }
  // Online games (public/games/_shared/rooms.js) seat the account under this name.
  storage.set(ACCOUNT_KEY, JSON.stringify({ name: user.name, display: user.display }))
}

// Accounts made before profiles existed kept their bests in players/<uid>;
// those come across once, when the profile is first made.
async function createProfile() {
  let bests = {}
  try {
    const old = await fb.store.getDoc(playerRef())
    if (old.exists()) bests = old.data().bests || {}
  } catch {}
  const u = fb.a.currentUser
  const joined = u && u.metadata.creationTime ? new Date(u.metadata.creationTime) : new Date()
  const d = {
    uid: user.uid, name: user.name, display: user.name, avatar: '', color: COLORS[0], badge: '', fav: '',
    bests, joined: fb.store.Timestamp.fromDate(joined),
  }
  await fb.store.setDoc(profileRef(), { ...d, updatedAt: now() })
  cloud = bests
  setLook(d)
}

// Higher wins both ways: the device gets any better cloud best, the cloud gets
// any better device best.
async function sync() {
  try {
    const snap = await fb.store.getDoc(profileRef())
    if (snap.exists()) {
      cloud = snap.data().bests || {}
      setLook(snap.data())
    } else await createProfile()
    emit()
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
  await fb.store.setDoc(profileRef(), { bests, updatedAt: now() }, { merge: true })
  Object.assign(cloud, bests)
  // Leaderboard entries; one failing (say, a game with no board) never blocks the rest.
  await Promise.all(Object.entries(bests).map(([slug, score]) =>
    fb.store.setDoc(boardRef(slug), { name: user.name, score, at: now(), ...lookOf(user) })
      .catch((e) => console.warn('leaderboard save failed', slug, e))))
  emit({ boardsChanged: Object.keys(bests) })
}

// Games report a new best through bridge.js; mirror it while signed in, once
// the profile it goes into has loaded.
window.addEventListener('message', (e) => {
  const d = e.data
  if (e.origin !== location.origin || !d || d.source !== 'vela-game' || d.type !== 'gameover') return
  if (!user || !user.display || !d.isBest || !(d.best > (cloud[d.game] || 0))) return
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
// Bests saved to the account, by game.
export const savedBests = () => ({ ...cloud })

// Errors come back as short labels for the form, never raw Firebase text.
function message(err) {
  const code = String((err && err.code) || '')
  if (/email-already-in-use/.test(code)) return 'That username is taken'
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'Wrong username or password'
  if (/weak-password/.test(code)) return 'Password needs 6 or more characters'
  if (/too-many-requests/.test(code)) return 'Too many tries. Wait a minute'
  if (/network|unavailable/.test(code)) return 'No connection'
  if (/permission-denied/.test(code)) return 'Not allowed'
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

/* ── settings ──────────────────────────────────────────────────── */

// Saves any of display, avatar, color, badge, fav, then brings this account's
// leaderboard entries up to date. Entries a moderator removed stay removed.
export async function saveProfile(changes) {
  if (!user || !user.display) throw new Error('Not signed in')
  const next = { ...lookOf(user), fav: user.fav, ...changes }
  const bad = checkDisplay(next.display)
  if (bad) throw new Error(bad)
  if (!COLORS.includes(next.color)) next.color = COLORS[0]
  try {
    await fb.store.setDoc(profileRef(), { ...next, updatedAt: now() }, { merge: true })
  } catch (e) { throw new Error(message(e)) }
  setLook(next)
  emit()
  const slugs = Object.keys(cloud)
  await Promise.all(slugs.map((slug) =>
    fb.store.updateDoc(boardRef(slug), { ...lookOf(user), at: now() }).catch(() => {})))
  emit({ boardsChanged: slugs })
}

// Firebase wants the current password again before a password change or a
// deletion.
async function reauth(password) {
  try {
    const cred = fb.auth.EmailAuthProvider.credential(emailFor(user.name), password)
    await fb.auth.reauthenticateWithCredential(fb.a.currentUser, cred)
  } catch (e) {
    const code = String((e && e.code) || '')
    throw new Error(/invalid-credential|wrong-password/.test(code) ? 'Current password is wrong' : message(e))
  }
}

export async function changePassword(current, next) {
  if (!user) throw new Error('Not signed in')
  if (next.length < 6) throw new Error('Password needs 6 or more characters')
  await reauth(current)
  try { await fb.auth.updatePassword(fb.a.currentUser, next) } catch (e) { throw new Error(message(e)) }
}

// Removes the account, its profile and its leaderboard entries. Bests stay on
// this device. The username is free again afterwards.
export async function deleteAccount(password, slugs) {
  if (!user) throw new Error('Not signed in')
  await reauth(password)
  const { store } = fb
  try {
    await Promise.all([...new Set([...slugs, ...Object.keys(cloud)])].map((slug) => store.deleteDoc(boardRef(slug)).catch(() => {})))
    await store.deleteDoc(profileRef()).catch(() => {})
    await store.deleteDoc(playerRef()).catch(() => {})
    await fb.auth.deleteUser(fb.a.currentUser)
  } catch (e) { throw new Error(message(e)) }
}

/* ── public reads ──────────────────────────────────────────────── */

// Read through Firestore's REST API: boards and profiles are public, so
// viewers who never sign in don't download the SDK just to see one.
const REST = local
  ? 'http://127.0.0.1:8181/v1/projects/vela-arcade/databases/(default)/documents'
  : 'https://firestore.googleapis.com/v1/projects/vela-arcade/databases/(default)/documents'
const num = (v) => Number(v && (v.integerValue ?? v.doubleValue)) || 0
const str = (v) => (v && v.stringValue) || ''
const lookFrom = (f) => ({
  display: str(f.display), avatar: str(f.avatar), color: COLORS.includes(str(f.color)) ? str(f.color) : COLORS[0], badge: str(f.badge),
})

async function topOf(slug, limit) {
  const res = await fetch(`${REST}/boards/${encodeURIComponent(slug)}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: 'scores' }],
      orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
      limit,
    } }),
  })
  if (!res.ok) throw new Error(res.status)
  return (await res.json()).filter((r) => r.document).map(({ document: d }) => ({
    id: d.name.split('/').pop(),
    name: str(d.fields.name),
    score: num(d.fields.score),
    ...lookFrom(d.fields),
  }))
}

// Who holds No. 1 on each game, remembered for a few minutes, so badges on a
// page cost one read per game rather than one per name.
const HOLD_MS = 5 * 60000
const held = new Map() // slug -> { id, at }

export async function holders(slugs) {
  const fresh = (s) => held.has(s) && Date.now() - held.get(s).at < HOLD_MS
  const need = [...new Set(slugs)].filter((s) => s && !fresh(s))
  await Promise.all(need.map(async (slug) => {
    try {
      const top = await topOf(slug, 1)
      held.set(slug, { id: top[0] ? top[0].id : '', at: Date.now() })
    } catch {}
  }))
  const out = {}
  for (const s of slugs) out[s] = held.has(s) ? held.get(s).id : ''
  return out
}

/* Top scores for a game, plus your own best if it is not among them (the
 * rules cap queries, so there is no rank count beyond the top).
 * Resolves to { top: [{ id, name, display, avatar, color, badge, score, you }],
 * you: { score } | null }, or null if it cannot be reached. */
export async function leaderboard(slug) {
  try {
    const top = (await topOf(slug, BOARD_SIZE)).map((r) => ({ ...r, you: !!user && r.id === user.uid }))
    held.set(slug, { id: top[0] ? top[0].id : '', at: Date.now() })
    const mine = user && cloud[slug]
    const you = mine && !top.some((r) => r.you) ? { score: mine } : null
    return { top, you }
  } catch (e) {
    console.warn('leaderboard failed', e)
    return null
  }
}

/* A public profile by username. Resolves to the profile, null when there is
 * no such account, or undefined when it cannot be reached. */
export async function profile(name) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) return null
  try {
    const res = await fetch(`${REST}/profiles/${name.toLowerCase()}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(res.status)
    const f = (await res.json()).fields || {}
    const bests = {}
    for (const [slug, v] of Object.entries((f.bests && f.bests.mapValue && f.bests.mapValue.fields) || {})) bests[slug] = num(v)
    return {
      uid: str(f.uid), name: str(f.name), ...lookFrom(f), fav: str(f.fav), bests,
      joined: f.joined && f.joined.timestampValue ? new Date(f.joined.timestampValue) : null,
    }
  } catch (e) {
    console.warn('profile failed', e)
    return undefined
  }
}

/* ── moderation ────────────────────────────────────────────────
   Only work for an account listed in mods/; the rules refuse everyone else. */

export async function removeEntry(slug, uid) {
  if (!user || !user.mod) throw new Error('Not a moderator')
  await fb.store.deleteDoc(fb.store.doc(fb.db, 'boards', slug, 'scores', uid))
}

// Wipes an account's look: the profile goes (it comes back plain on their next
// visit) and its leaderboard entries fall back to the username.
export async function resetProfile(uid, name, slugs) {
  if (!user || !user.mod) throw new Error('Not a moderator')
  const { store, db } = fb
  await store.deleteDoc(store.doc(db, 'profiles', name.toLowerCase()))
  const strip = { display: store.deleteField(), avatar: store.deleteField(), color: store.deleteField(), badge: store.deleteField() }
  await Promise.all(slugs.map((slug) => store.updateDoc(store.doc(db, 'boards', slug, 'scores', uid), strip).catch(() => {})))
}

// Bans an account from posting again, clears it off every board and removes
// its profile.
export async function ban(uid, name, slugs) {
  if (!user || !user.mod) throw new Error('Not a moderator')
  const { store, db } = fb
  await store.setDoc(store.doc(db, 'bans', uid), { name, by: user.uid, at: store.serverTimestamp() })
  await store.deleteDoc(store.doc(db, 'profiles', name.toLowerCase())).catch(() => {})
  await Promise.all(slugs.map((slug) => store.deleteDoc(store.doc(db, 'boards', slug, 'scores', uid)).catch(() => {})))
}

// Someone who signed in before gets their session (and a sync) back quietly.
if (storage.get(FLAG)) load().catch(() => {})
