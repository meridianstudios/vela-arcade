# Vela Arcade

Every Vela game in one place, playable in the page. Vite, no framework.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
npm run check    # sanity-check the catalogue
```

## How it fits together

- `src/games.js` is the catalogue. The lobby, filters, search and player are all
  driven from it.
- `src/main.js` is the lobby (`/`) and the player (`/play/<slug>`), with a small
  history-API router. `vercel.json` rewrites `/play/*` back to `index.html`.
- `public/games/<slug>/index.html` are the in-house games. Each is one
  self-contained file with no build step, so a game can be dropped in as is.
- `public/games/_shared/bridge.js` is the contract between a game and the
  arcade: `Vela.ready()`, `Vela.score(n)`, `Vela.gameOver(n)`, `Vela.best()`,
  `Vela.onPause(fn)`. Bests live in localStorage under `vela:best:<slug>` on the
  arcade's origin, so the lobby can show them without any server.

## Adding a game

**One we make here:** create `public/games/<slug>/index.html`, load
`<script src="../_shared/bridge.js" data-game="<slug>"></script>`, call the
bridge as the game runs, then add an entry with `kind: 'inhouse'` and
`scores: true` to `src/games.js`. The game must size itself to whatever frame
it is in, from a phone in portrait to a wide desktop.

**One that lives somewhere else** (Wildcard, Onitama, World Cup Sim): add an
entry with `kind: 'embed'` and its URL as `src`. The site must allow framing
(no `X-Frame-Options`, no restrictive `frame-ancestors`). `npm run check`
tests that. External games cannot report scores, so they show no Best.

Set `status: 'soon'` to list a game before it is playable.
