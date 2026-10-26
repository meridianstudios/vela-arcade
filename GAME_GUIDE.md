# Building a game for Vela Arcade

Read this before writing or changing any game in `public/games/`. The arcade
is meant to grow into a large library, so every game has to look and behave
like part of one product.

## File and contract

- One self-contained file: `public/games/<slug>/index.html`. Inline CSS and JS,
  no build step, no npm, no third-party JS libraries. Extra data (a word list)
  may live beside it as a plain `.js` file in the same folder.
- Load, in `<head>`: `<link rel="stylesheet" href="/fonts/type.css">`
- Load before your game script:
  `<script src="../_shared/bridge.js" data-game="<slug>"></script>`
  - `Vela.ready()` once input works
  - `Vela.score(n)` when the score changes (only games with a score)
  - `Vela.gameOver(n)` when a run ends; returns true on a new best
  - `Vela.best()` the stored best (higher is better)
  - `Vela.onPause(fn)` pause the simulation when `fn(true)` fires
  - `html.vela-embedded` is set when running inside the arcade
- Online games: `import * as Rooms from '../_shared/rooms.js'` from a
  `<script type="module">`. Read the header of that file for the API. On
  localhost it uses the Firebase emulator (`npm run emulators`, ports 8181 and
  9199). Hidden information (a fleet, a hand) goes in `Rooms.writePrivate`,
  never in the room document. Open with `?room=CODE` to join directly
  (`Rooms.codeFromUrl()`), and offer a copyable `Rooms.inviteUrl()`.
  If `Rooms.available` is false, hide or disable the online option with the
  text "Online play is not set up yet." Never let a Firebase error surface raw.

## Layout

- Must work in an iframe of any size, from a phone in portrait (about 375x600)
  to a wide desktop (about 1280x700), and standalone at full window. Size from
  the viewport, handle resize and devicePixelRatio, no page scrollbars.
- Touch and mouse/keyboard are both first-class. Prevent page scroll, pull to
  refresh and double-tap zoom on the play area. Call `window.focus()` on
  pointerdown so keys work after a click inside the arcade.
- Fixed timestep or dt-based motion, so speed is the same at 60Hz and 144Hz.

## Look

Black and orange, Microsoft Metro/Fluent: blocky, flat, crisp.

- Type: `font-family: var(--font)`; big numbers and titles `var(--font-display)`.
  Weights 300/400/600/700 only. Large numbers and titles look right at 300.
  Labels: 600, 11 to 12px, uppercase, letter-spacing about 0.1em. On canvas,
  read the stack with `getComputedStyle(document.documentElement).getPropertyValue('--font')`
  and wait for `document.fonts.ready` before drawing text.
- Colour: background `#000` or `#0b0c0f`; surfaces `#16181c`; hairlines
  `rgba(255,255,255,0.1)`; text `#fff` and `rgba(255,255,255,0.6)`; orange
  `#ea5426`, lighter `#ff7a4d`, darker `#b83f19`. Game pieces use oranges,
  whites and greys. A second colour only where the rules need one (two chess
  sides, two players' discs): use white vs orange, never a new hue.
- Square corners (0 to 2px). Flat fills. 1px lines for structure.
- Never: gradients of any kind, glows, blurred or coloured shadows,
  backdrop-filter, pill shapes, emoji.
- Buttons: flat rectangles, orange fill with white text, or a 1px outline.
- Motion: short and eased, `cubic-bezier(0.1, 0.9, 0.2, 1)`, 150 to 300ms.
  Juice (particles, shake, pops) is welcome; keep it crisp. Respect
  `prefers-reduced-motion`.

## Words on screen

- Name things what they are. No invented brand names, slogans or taglines.
- Start screen: the game's name and one plain line of controls.
- Game over: "Game over" (or "You win" / "You lose" / "Draw"), the score,
  the best, a "Play again" button. "New best" when it is one.
- No filler, no hype, no exclamation marks, no em-dashes.

## Before you call it done

- Re-read the whole file. Check the rules edge cases specific to the game.
- Test in a browser at phone and desktop sizes, embedded and standalone, with
  no console errors.
- Add nothing to `src/games.js`; the arcade maintainer registers games.
