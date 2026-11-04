/* The app's service worker. Registered as /sw.js?b=<build>, so each deploy
 * is a new worker with its own cache; the old cache goes when it takes over.
 *
 * Within a build nothing on this site changes, so its files are served from
 * the cache once fetched: built assets, fonts, icons and the in-house games.
 * Pages go to the network first and fall back to the last copy, so the app
 * still opens offline. Anything from another site (Firebase, embedded games)
 * is left alone.
 */
const CACHE = 'vela-' + (new URL(self.location).searchParams.get('b') || '0')
const SHELL = '/index.html'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
    await self.clients.claim()
  })())
})

const cacheable = (url) =>
  /^\/(assets|fonts|icons|games)\//.test(url.pathname) || url.pathname === '/logo.svg'

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // The site's own pages. A game opening in its frame is a navigation too,
  // but it belongs with the game files below.
  if (req.mode === 'navigate' && req.destination === 'document') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req)
        if (res.ok) (await caches.open(CACHE)).put(SHELL, res.clone())
        return res
      } catch {
        return (await caches.match(SHELL)) || Response.error()
      }
    })())
    return
  }

  if (!cacheable(url) || url.search) return
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const hit = await cache.match(req)
    if (hit) return hit
    const res = await fetch(req)
    if (res.ok && res.type === 'basic') cache.put(req, res.clone())
    return res
  })())
})
