/* Vela Arcade online rooms.
 *
 * Shared by every online game. A room is one Firestore document addressed by a
 * six-character code; knowing the code is what lets you in. Players are
 * anonymous Firebase users with a typed display name: no accounts.
 *
 *   import * as Rooms from '../_shared/rooms.js'
 *
 *   Rooms.available                  false when online play is not configured here
 *   await Rooms.signIn()             -> uid
 *   await Rooms.create({ game, maxSeats, name, state })   -> code
 *   await Rooms.join(code, { game, name })                -> room (throws RoomError)
 *   Rooms.watch(code, (room) => {}, onError?)  -> unsubscribe; room is null only
 *                                    once deleted. Network trouble calls onError
 *                                    (if given) and keeps retrying; it never
 *                                    looks like a closed room.
 *   await Rooms.update(code, (room) => patch | null)      transactional; null aborts
 *   await Rooms.writePrivate(code, data) / Rooms.readPrivate(code)
 *                                    a per-player doc only its owner can read
 *                                    (hidden information, e.g. a fleet layout)
 *   Rooms.heartbeat(code)            -> stop(); keeps room.seen[uid] fresh
 *   Rooms.isAway(room, uid)          true if that player's heartbeat is stale
 *                                    (server time, so device clocks do not matter)
 *   Rooms.inviteUrl(game, code)      a link that opens the game straight into the room
 *   Rooms.codeFromUrl()              the ?room= code this page was opened with, if any
 *   await Rooms.leave(code)          host deletes the room; a guest drops their seat
 *                                    in the lobby, or is marked in room.left mid-game
 *
 * Room document:
 *   { game, code, hostUid, seats: [uid], names: { uid: name }, maxSeats,
 *     phase: 'lobby' | 'play' | 'done', state: {...game-owned},
 *     seen: { uid: server timestamp }, left: { uid: ms } (players who left mid-game),
 *     createdAt, updatedAt }
 *
 * On localhost this talks to the Firebase emulator (`npm run emulators`), so
 * nothing touches a real project while developing.
 *
 * Cost note, learned on Wildcard: every read and write counts against the free
 * tier's daily quota. Watch one document per room, write only on real moves,
 * and keep heartbeats slow.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, deleteDoc,
  onSnapshot, runTransaction, serverTimestamp, updateDoc,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'
import {
  getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'
import { firebaseConfig } from './firebase-config.js'

const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const EMULATOR = { firestore: 8181, auth: 9199 }

export const available = local || !!firebaseConfig

export class RoomError extends Error {}

let db = null
let auth = null
function boot() {
  if (db) return
  if (!available) throw new RoomError('Online play is not set up yet.')
  const app = initializeApp(firebaseConfig || { apiKey: 'demo', projectId: 'demo-vela-arcade', appId: 'demo' }, 'vela-rooms')
  db = getFirestore(app)
  auth = getAuth(app)
  if (local) {
    connectFirestoreEmulator(db, '127.0.0.1', EMULATOR.firestore)
    connectAuthEmulator(auth, `http://127.0.0.1:${EMULATOR.auth}`, { disableWarnings: true })
  }
}

let uidPromise = null
export function signIn() {
  boot()
  if (!uidPromise) {
    uidPromise = new Promise((resolve, reject) => {
      const stop = onAuthStateChanged(auth, (u) => { if (u) { stop(); resolve(u.uid) } }, reject)
      if (!auth.currentUser) signInAnonymously(auth).catch((e) => { uidPromise = null; reject(e) })
    })
  }
  return uidPromise
}
export const uid = () => (auth && auth.currentUser ? auth.currentUser.uid : null)

const roomRef = (code) => doc(db, 'rooms', code)
// No 0/O, 1/I/L: codes get read out loud and typed on phones.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
export const normaliseCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

export async function create({ game, maxSeats = 2, name = 'Player', state = {} }) {
  const me = await signIn()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    const ok = await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef(code))
      if (snap.exists()) return false
      const now = Date.now()
      tx.set(roomRef(code), {
        game, code, hostUid: me, seats: [me], names: { [me]: cleanName(name) }, maxSeats,
        phase: 'lobby', state, seen: { [me]: serverTimestamp() }, createdAt: now, updatedAt: now,
      })
      return true
    })
    if (ok) return code
  }
  throw new RoomError('Could not make a room. Try again.')
}

export async function join(code, { game, name = 'Player' }) {
  const me = await signIn()
  code = normaliseCode(code)
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef(code))
    if (!snap.exists()) throw new RoomError('No room with that code.')
    const room = snap.data()
    if (room.game !== game) throw new RoomError('That code is for a different game.')
    if (room.seats.includes(me)) return room
    if (room.phase !== 'lobby') throw new RoomError('That game has already started.')
    if (room.seats.length >= room.maxSeats) throw new RoomError('That room is full.')
    const seats = [...room.seats, me]
    const names = { ...room.names, [me]: cleanName(name) }
    tx.update(roomRef(code), { seats, names, [`seen.${me}`]: serverTimestamp(), updatedAt: Date.now() })
    return { ...room, seats, names }
  })
}

export function watch(code, cb, onError) {
  boot()
  const ref = roomRef(normaliseCode(code))
  let stop = null
  let closed = false
  let retry = 0
  const listen = () => {
    stop = onSnapshot(ref, (snap) => {
      retry = 0
      cb(snap.exists() ? snap.data({ serverTimestamps: 'estimate' }) : null)
    }, (err) => {
      // A failed listener is finished; reconnect with backoff instead of
      // reporting the room as gone.
      console.warn('room watch interrupted', err)
      if (onError) onError(err)
      if (closed) return
      retry = Math.min(retry + 1, 6)
      setTimeout(() => { if (!closed) listen() }, 500 * 2 ** retry)
    })
  }
  listen()
  return () => { closed = true; if (stop) stop() }
}

/* fn gets the current room and returns a patch to merge, or null to do nothing.
 * Runs in a transaction, so two players acting at once cannot both win: use it
 * for every move, and check whose turn it is inside fn. */
export async function update(code, fn) {
  await signIn()
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef(code))
    if (!snap.exists()) throw new RoomError('That room has closed.')
    const patch = fn(snap.data())
    if (!patch) return null
    tx.update(roomRef(code), { ...patch, updatedAt: Date.now() })
    return patch
  })
}

const privateRef = (code, who) => doc(db, 'rooms', code, 'private', who)
export async function writePrivate(code, data) {
  const me = await signIn()
  await setDoc(privateRef(code, me), data)
}
export async function readPrivate(code) {
  const me = await signIn()
  const snap = await getDoc(privateRef(code, me))
  return snap.exists() ? snap.data() : null
}

const BEAT_MS = 20000
export function heartbeat(code) {
  let stopped = false
  const beat = async () => {
    if (stopped) return
    try {
      // A plain write, not a transaction, so a heartbeat never contends with a
      // move. The rules reject it if this player is not seated.
      const me = await signIn()
      await updateDoc(roomRef(code), { [`seen.${me}`]: serverTimestamp() })
    } catch (_) {}
  }
  beat()
  const id = setInterval(beat, BEAT_MS)
  const onVis = () => { if (!document.hidden) beat() }
  document.addEventListener('visibilitychange', onVis)
  return () => { stopped = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
}
// Compared against the freshest heartbeat in the room rather than this
// device's clock: every value is server time, so a phone whose clock is off
// cannot make a present player look gone.
const ms = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : Number(v) || 0)
export function isAway(room, who) {
  if (!room.seen || !room.seen[who]) return true
  const latest = Math.max(...Object.values(room.seen).map(ms))
  return latest - ms(room.seen[who]) > BEAT_MS * 3
}

export function inviteUrl(game, code) {
  // Inside the arcade, the link should open the arcade's player, not the bare game.
  const base = window.parent !== window ? `${location.origin}/play/${game}` : `${location.origin}${location.pathname}`
  return `${base}?room=${code}`
}
export function codeFromUrl() {
  const c = new URLSearchParams(location.search).get('room')
  return c ? normaliseCode(c) : null
}

export async function leave(code) {
  const me = await signIn()
  try {
    const snap = await getDoc(roomRef(code))
    if (!snap.exists()) return
    if (snap.data().hostUid === me) await deleteDoc(roomRef(code))
    else await update(code, (room) => {
      if (!room.seats.includes(me)) return null
      // In the lobby the seat frees up; mid-game the seat stays so the game's
      // state still lines up, and the room records that this player left.
      return room.phase === 'lobby'
        ? { seats: room.seats.filter((s) => s !== me) }
        : { [`left.${me}`]: Date.now() }
    })
  } catch (_) {}
}

function cleanName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20) || 'Player'
}
