/* The catalogue. Adding a game to the arcade means adding one entry here.
 *
 *   kind: 'inhouse'   lives in public/games/<slug>/index.html, served from this
 *                     site, and reports scores through public/games/_shared/bridge.js
 *   kind: 'embed'     any other site we frame; `src` is its URL. The site must
 *                     not send X-Frame-Options or a frame-ancestors CSP that
 *                     blocks us. It cannot talk to the bridge, so no scores.
 *   status: 'soon'    listed but not playable yet
 *   via, by           set on third-party games: `via` is the network it comes
 *                     from (e.g. 'GameDistribution'), `by` the developer. These
 *                     list under "Embedded games"; everything else is a Vela original.
 *
 * Name a game what it is. `description` is the rules, plainly; it shows on the
 * game's page, not on the tile.
 *
 * `art` is a 64x64 SVG body drawn in currentColor. Cut-outs that should show
 * the tile behind them use style="fill:var(--tile)".
 * `bestLabel` replaces "Best" on the tile when the number means something else.
 * `tags` drive the filter tabs; keep them to the ones in TAGS below.
 */

export const ALL_TAGS = ['Solo', 'Multiplayer', 'Puzzle', 'Action', 'Strategy', 'Cards', 'Casino', 'Manager', 'Sports', 'Racing']

// GameDistribution only serves its games on domains registered to a publisher
// account; anywhere else they show a "not available here" screen. Turn this on
// once the site's domains are registered there.
export const SHOW_GAMEDISTRIBUTION = false

export const CATALOGUE = [
  {
    slug: 'wildcard',
    title: 'Wildcard',
    description:
      'Match the top card by colour or number. First to empty their hand wins. One player hosts a room and shares the code. The host sets house rules before dealing: stacking, 7-0, jump-in, draw until playable.',
    kind: 'embed',
    src: 'https://wildcard-mu.vercel.app',
    tags: ['Multiplayer', 'Cards'],
    players: '2 to 8 players',
    controls: 'Tap a card to play it. Tap the deck to draw.',
    art: `<g fill="currentColor">
      <rect x="13" y="16" width="22" height="32" transform="rotate(-12 24 32)" opacity=".45"/>
      <rect x="29" y="14" width="22" height="32" transform="rotate(10 40 30)"/>
      <rect x="35" y="22" width="10" height="16" transform="rotate(10 40 30)" style="fill:var(--tile)"/>
    </g>`,
  },
  {
    slug: 'chess',
    title: 'Chess',
    description:
      'Standard chess with every rule: castling, en passant, promotion, and draws by stalemate, repetition, the fifty-move rule or insufficient material. Play the computer at five levels, pass and play on one device, or play a friend online with a room code and optional clocks.',
    kind: 'inhouse',
    src: '/games/chess/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 or 2 players, online',
    controls: 'Drag a piece, or click it and then click a square.',
    art: `<g fill="currentColor">
      <rect x="18" y="12" width="6" height="7"/><rect x="29" y="12" width="6" height="7"/><rect x="40" y="12" width="6" height="7"/>
      <rect x="18" y="19" width="28" height="6"/>
      <rect x="22" y="25" width="20" height="17"/>
      <rect x="18" y="42" width="28" height="5"/>
      <rect x="14" y="47" width="36" height="6"/>
    </g>`,
  },
  {
    slug: 'sea-battle',
    title: 'Sea Battle',
    description:
      'Place five ships on a 10 by 10 grid, then take turns firing at your opponent\'s hidden grid. A hit is marked orange; a ship sinks when every square of it is hit. Sink the whole fleet to win. Play the computer at three levels, or a friend online with a room code.',
    kind: 'inhouse',
    src: '/games/sea-battle/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 or 2 players, online',
    controls: 'Drag ships to place them, R or tap to rotate. Tap a square on the target grid to fire.',
    art: `<g fill="currentColor">
      <rect x="10" y="10" width="44" height="1" opacity=".35"/><rect x="10" y="21" width="44" height="1" opacity=".35"/><rect x="10" y="32" width="44" height="1" opacity=".35"/>
      <rect x="10" y="10" width="1" height="23" opacity=".35"/><rect x="21" y="10" width="1" height="23" opacity=".35"/><rect x="32" y="10" width="1" height="23" opacity=".35"/><rect x="43" y="10" width="1" height="23" opacity=".35"/><rect x="54" y="10" width="1" height="23" opacity=".35"/>
      <rect x="22" y="22" width="10" height="10"/>
      <path d="M8 42 H56 L50 52 H14 Z"/>
      <rect x="26" y="36" width="12" height="6"/>
    </g>`,
  },
  {
    slug: 'four-in-a-row',
    title: 'Four in a Row',
    description:
      'Take turns dropping discs into a 7 by 6 grid. The first to line up four of their own in a row, column or diagonal wins; a full grid is a draw. Play the computer at four levels or pass and play on one device.',
    kind: 'inhouse',
    src: '/games/four-in-a-row/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 or 2 players',
    controls: 'Click or tap a column, or press 1 to 7. U to undo.',
    art: `<g fill="currentColor">
      <rect x="10" y="10" width="9" height="9" opacity=".2"/><rect x="21" y="10" width="9" height="9" opacity=".2"/><rect x="32" y="10" width="9" height="9" opacity=".2"/><rect x="43" y="10" width="9" height="9"/>
      <rect x="10" y="21" width="9" height="9" opacity=".2"/><rect x="21" y="21" width="9" height="9" opacity=".2"/><rect x="32" y="21" width="9" height="9"/><rect x="43" y="21" width="9" height="9" opacity=".45"/>
      <rect x="10" y="32" width="9" height="9" opacity=".2"/><rect x="21" y="32" width="9" height="9"/><rect x="32" y="32" width="9" height="9" opacity=".45"/><rect x="43" y="32" width="9" height="9" opacity=".45"/>
      <rect x="10" y="43" width="9" height="9"/><rect x="21" y="43" width="9" height="9" opacity=".45"/><rect x="32" y="43" width="9" height="9" opacity=".45"/><rect x="43" y="43" width="9" height="9"/>
    </g>`,
  },
  {
    slug: 'falling-blocks',
    title: 'Falling Blocks',
    description:
      'Move and rotate the falling pieces to fill complete rows. Full rows clear and score points; clearing several at once scores more. Every 10 lines the level goes up and pieces fall faster. The run ends when a new piece has no room to appear.',
    kind: 'inhouse',
    src: '/games/falling-blocks/index.html',
    tags: ['Solo', 'Puzzle', 'Action'],
    players: '1 player',
    controls: 'Arrows move, Down soft drop, Space hard drop, Up or X rotate, Z rotate back, C hold, P pause. Touch: tap rotates, drag moves, swipe down drops.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="14" y="12" width="9" height="9"/><rect x="23" y="12" width="9" height="9"/><rect x="32" y="12" width="9" height="9"/><rect x="23" y="21" width="9" height="9"/>
      <rect x="14" y="43" width="9" height="9" opacity=".55"/><rect x="23" y="43" width="9" height="9" opacity=".55"/><rect x="32" y="43" width="9" height="9" opacity=".55"/><rect x="41" y="43" width="9" height="9" opacity=".55"/>
      <rect x="41" y="34" width="9" height="9" opacity=".55"/>
    </g>`,
  },
  {
    slug: 'space-shooter',
    title: 'Space Shooter',
    description:
      'Shoot the advancing rows of enemies before they reach the bottom. They speed up as their numbers drop and fire back. Shields wear away as they take hits. Every fifth wave is a boss. Extra life at 1,500 points.',
    kind: 'inhouse',
    src: '/games/space-shooter/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Arrows or A and D to move, Space to fire (hold to keep firing), P to pause. Touch: drag to move, fires while touching.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="20" y="12" width="4" height="4"/><rect x="40" y="12" width="4" height="4"/>
      <rect x="24" y="16" width="16" height="4"/>
      <rect x="20" y="20" width="24" height="4"/>
      <rect x="16" y="24" width="8" height="4"/><rect x="28" y="24" width="8" height="4"/><rect x="40" y="24" width="8" height="4"/>
      <rect x="12" y="28" width="40" height="4"/>
      <rect x="12" y="32" width="4" height="4"/><rect x="20" y="32" width="24" height="4"/><rect x="48" y="32" width="4" height="4"/>
      <rect x="20" y="36" width="8" height="4"/><rect x="36" y="36" width="8" height="4"/>
      <rect x="29" y="46" width="6" height="8" opacity=".55"/>
    </g>`,
  },
  {
    slug: 'minesweeper',
    title: 'Minesweeper',
    description:
      'Reveal every square that is not a mine. A number shows how many mines touch that square. Flag the squares you think hide mines. The first square you open is always safe. Beginner, Intermediate, Expert or a custom board.',
    kind: 'inhouse',
    src: '/games/minesweeper/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Click to reveal, right click to flag, click a number to open around it. Touch: tap to reveal, hold to flag.',
    art: `<g fill="currentColor">
      <rect x="12" y="12" width="12" height="12" opacity=".35"/><rect x="26" y="12" width="12" height="12" opacity=".35"/><rect x="40" y="12" width="12" height="12" opacity=".35"/>
      <rect x="12" y="26" width="12" height="12" opacity=".35"/><rect x="40" y="26" width="12" height="12" opacity=".35"/>
      <rect x="12" y="40" width="12" height="12" opacity=".35"/><rect x="26" y="40" width="12" height="12" opacity=".35"/><rect x="40" y="40" width="12" height="12" opacity=".35"/>
      <rect x="28" y="28" width="8" height="8"/><rect x="31" y="25" width="2" height="14"/><rect x="25" y="31" width="14" height="2"/>
    </g>`,
  },
  {
    slug: 'word-guess',
    title: 'Word Guess',
    description:
      'Guess the five-letter word in six tries. After each guess, green means the letter is in the right place, yellow means it is in the word but somewhere else, grey means it is not in the word. One daily word that is the same for everyone, plus unlimited practice.',
    kind: 'inhouse',
    src: '/games/word-guess/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Type or tap letters, Enter to guess, Backspace to delete.',
    scores: true,
    bestLabel: 'Best streak',
    art: `<g fill="currentColor">
      <rect x="8" y="16" width="9" height="9"/><rect x="19.5" y="16" width="9" height="9" opacity=".35"/><rect x="31" y="16" width="9" height="9"/><rect x="42.5" y="16" width="9" height="9" opacity=".35"/>
      <rect x="8" y="28" width="9" height="9"/><rect x="19.5" y="28" width="9" height="9"/><rect x="31" y="28" width="9" height="9"/><rect x="42.5" y="28" width="9" height="9"/>
      <rect x="8" y="40" width="9" height="9" opacity=".2"/><rect x="19.5" y="40" width="9" height="9" opacity=".2"/><rect x="31" y="40" width="9" height="9" opacity=".2"/><rect x="42.5" y="40" width="9" height="9" opacity=".2"/>
    </g>`,
  },
  {
    slug: 'tower-stack',
    title: 'Tower Stack',
    description:
      'Drop each block onto the tower. Any part that hangs over the edge is cut off. Three perfect drops in a row widen the block again. The run ends when you miss the tower.',
    kind: 'inhouse',
    src: '/games/tower-stack/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Click, tap or press Space to drop.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="14" y="42" width="36" height="8" opacity=".4"/>
      <rect x="17" y="32" width="32" height="8" opacity=".65"/>
      <rect x="20" y="22" width="26" height="8"/>
      <rect x="25" y="10" width="26" height="8" opacity=".85"/>
    </g>`,
  },
  {
    slug: '2048',
    title: '2048',
    description:
      'Slide all tiles in one direction. Two tiles with the same number merge into one. A new tile appears after each move. The run ends when no move is possible.',
    kind: 'inhouse',
    src: '/games/2048/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Arrow keys, WASD, or swipe. U to undo one move. N for a new game.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="12" y="12" width="18" height="18" opacity=".35"/>
      <rect x="34" y="12" width="18" height="18" opacity=".6"/>
      <rect x="12" y="34" width="18" height="18" opacity=".6"/>
      <rect x="34" y="34" width="18" height="18"/>
    </g>`,
  },
  {
    slug: 'snake',
    title: 'Snake',
    description:
      'Eat food to grow. Speed increases as you get longer. Every fifth food is a bonus worth 50 that disappears after 5 seconds. Hitting a wall or yourself ends the run.',
    kind: 'inhouse',
    src: '/games/snake/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Arrow keys or WASD. Swipe or use the pad on touch. Space or P to pause.',
    scores: true,
    art: `<g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter">
      <path d="M14 46 H34 V30 H20 V16 H44"/>
    </g>
    <rect x="45" y="40" width="9" height="9" fill="currentColor" opacity=".5"/>`,
  },
  {
    slug: 'brick-breaker',
    title: 'Brick Breaker',
    description:
      'Clear the breakable bricks to finish a level. Some bricks take two or three hits; grey bricks never break. Power-ups: W widens the paddle, M splits the ball into three, S slows it down. Eight levels, then they repeat faster.',
    kind: 'inhouse',
    src: '/games/brick-breaker/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Mouse, drag, or arrow keys to steer. Click, tap or Space to launch.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="10" y="12" width="13" height="7"/><rect x="25.5" y="12" width="13" height="7" opacity=".55"/><rect x="41" y="12" width="13" height="7"/>
      <rect x="10" y="21" width="13" height="7" opacity=".55"/><rect x="41" y="21" width="13" height="7" opacity=".55"/>
      <rect x="30" y="35" width="6" height="6"/>
      <rect x="22" y="48" width="20" height="5"/>
    </g>`,
  },
  {
    slug: 'pong',
    title: 'Pong',
    description:
      'Return the ball past your opponent. The ball speeds up with every hit, and where it meets your paddle sets its angle. Play the computer on Easy, Normal or Hard, or two players on one device. First to 7 or 11.',
    kind: 'inhouse',
    src: '/games/pong/index.html',
    tags: ['Solo', 'Multiplayer', 'Action', 'Sports'],
    players: '1 or 2 players',
    controls: 'One player: mouse, drag, W and S, or arrows. Two players: W and S against the arrows; on touch each player drags on their own side.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor">
      <rect x="10" y="18" width="5" height="18"/>
      <rect x="49" y="28" width="5" height="18"/>
      <rect x="30" y="30" width="5" height="5"/>
      <rect x="31.5" y="10" width="1" height="44" opacity=".35"/>
    </g>`,
  },
  {
    slug: 'onitama',
    title: 'Onitama',
    description:
      'Each player has five pieces and two move cards. Move with one of your cards, then it goes to your opponent. Win by taking the other master or moving your master onto their start square. Create a room and share the code to play online.',
    kind: 'embed',
    src: 'https://onitama.novalabsos.com',
    tags: ['Multiplayer', 'Strategy'],
    players: '2 players',
    controls: 'Pick a card, then a piece, then a square.',
    art: `<g fill="currentColor">
      <rect x="8" y="16" width="48" height="6"/>
      <rect x="16" y="28" width="32" height="4"/>
      <rect x="20" y="22" width="5" height="32"/>
      <rect x="39" y="22" width="5" height="32"/>
      <rect x="30" y="22" width="4" height="6"/>
    </g>`,
  },
  {
    slug: 'world-cup',
    title: 'World Cup Simulator',
    description:
      'Two modes: predict a 48-team World Cup with friends on one device, or manage a national team across many tournaments.',
    kind: 'embed',
    src: 'https://worldcup.novalabsos.com',
    tags: ['Sports', 'Manager', 'Strategy', 'Multiplayer'],
    players: '1 player or pass-and-play',
    controls: 'Mouse or touch.',
    art: `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">
      <circle cx="32" cy="32" r="23"/>
      <path d="M32 22 V12 M41 29 l9.2 -5.3 M37.6 40 l6 8.2 M26.4 40 l-6 8.2 M23 29 l-9.2 -5.3"/>
    </g>
    <polygon points="32,21.5 41.2,28.2 37.7,39 26.3,39 22.8,28.2" fill="currentColor"/>`,
  },

  {
    slug: 'memory-match',
    title: 'Memory Match',
    description:
      'Turn over two cards at a time to find matching pairs. Clear the board in as few moves as you can. In pass and play, finding a pair gives you another turn, and the most pairs wins. 4 x 4, 4 x 6 or 6 x 6.',
    kind: 'inhouse',
    src: '/games/memory-match/index.html',
    tags: ['Solo', 'Multiplayer', 'Puzzle'],
    players: '1 player or pass-and-play',
    controls: 'Tap or click a card. Arrow keys and Enter also work.',
    art: `<g fill="currentColor">
      <rect x="8" y="12" width="22" height="32" transform="rotate(-8 19 28)" opacity=".45"/>
      <rect x="32" y="18" width="22" height="32" transform="rotate(6 43 34)"/>
      <polygon points="43,26 50,38 36,38" transform="rotate(6 43 34)" style="fill:var(--tile)"/>
    </g>`,
  },
  {
    slug: 'sliding-puzzle',
    title: 'Sliding Puzzle',
    description:
      'Slide the numbered tiles into order using the one empty space. Tap a tile in line with the gap to slide the whole run. 3 x 3, 4 x 4 or 5 x 5, and every shuffle can be solved.',
    kind: 'inhouse',
    src: '/games/sliding-puzzle/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Tap a tile or swipe. Arrow keys or WASD move a tile into the gap.',
    art: `<g fill="currentColor">
      <rect x="10" y="10" width="13" height="13"/><rect x="25.5" y="10" width="13" height="13"/><rect x="41" y="10" width="13" height="13"/>
      <rect x="10" y="25.5" width="13" height="13"/><rect x="25.5" y="25.5" width="13" height="13" opacity=".55"/><rect x="41" y="25.5" width="13" height="13"/>
      <rect x="10" y="41" width="13" height="13"/><rect x="25.5" y="41" width="13" height="13"/>
    </g>`,
  },
  {
    slug: 'code-breaker',
    title: 'Code Breaker',
    description:
      'Work out the hidden code. After each guess you see how many symbols are in the right place and how many are in the code but in the wrong place. Normal: 4 symbols from 6, no repeats, 10 guesses. Hard: 5 from 8, repeats allowed, 12 guesses. Or set a code yourself and watch the computer break it.',
    kind: 'inhouse',
    src: '/games/code-breaker/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Number keys pick a symbol, Enter guesses, Backspace deletes. Or tap the palette.',
    art: `<g fill="currentColor">
      <circle cx="13" cy="20" r="6"/><polygon points="27,14 34,26 20,26"/><rect x="38" y="14" width="12" height="12" opacity=".55"/>
      <rect x="54" y="14" width="5" height="5"/><rect x="54" y="21" width="5" height="5" opacity=".45"/>
      <circle cx="13" cy="42" r="6" opacity=".55"/><polygon points="27,36 34,48 20,48" opacity=".55"/><rect x="38" y="36" width="12" height="12"/>
      <rect x="54" y="36" width="5" height="5"/><rect x="54" y="43" width="5" height="5"/>
    </g>`,
  },
  {
    slug: 'hangman',
    title: 'Hangman',
    description:
      'Guess the word one letter at a time before the figure is drawn. Six wrong letters and you lose. Each word comes with its category. Keep winning to build a streak.',
    kind: 'inhouse',
    src: '/games/hangman/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Type letters, or tap the keyboard on screen.',
    scores: true,
    bestLabel: 'Best streak',
    art: `<g fill="none" stroke="currentColor" stroke-width="3.5">
      <path d="M10 56 H34 M18 56 V8 H44 V16" opacity=".55"/>
      <circle cx="44" cy="22" r="6"/>
      <path d="M44 28 V42 M44 32 L36 38 M44 32 L52 38 M44 42 L38 52 M44 42 L50 52"/>
    </g>`,
  },
  {
    slug: 'road-crossing',
    title: 'Road Crossing',
    description:
      'Hop forward across an endless run of roads, rivers and railway lines. Dodge the traffic, ride the logs across water and wait out the trains. The screen keeps moving, so stand still too long and it catches you. Your score is the furthest row you reach.',
    kind: 'inhouse',
    src: '/games/road-crossing/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Arrows or WASD. Touch: tap to hop forward, swipe to hop any way.',
    scores: true,
    art: `<g fill="currentColor">
      <rect x="4" y="10" width="56" height="12" opacity=".3"/>
      <rect x="8" y="12" width="16" height="8"/><rect x="38" y="12" width="10" height="8" opacity=".7"/>
      <rect x="4" y="30" width="56" height="12" opacity=".3"/>
      <rect x="20" y="32" width="24" height="8" opacity=".55"/>
      <rect x="27" y="48" width="10" height="10"/>
    </g>`,
  },
  {
    slug: 'typing-test',
    title: 'Typing Test',
    description:
      'Type the words as fast and as accurately as you can for 15, 30 or 60 seconds. Mistakes show as you type. You get net and raw words per minute, accuracy and a chart of your speed. Turn on punctuation and numbers for a harder test.',
    kind: 'inhouse',
    src: '/games/typing-test/index.html',
    tags: ['Solo'],
    players: '1 player',
    controls: 'Start typing to begin. Tab or Esc restarts.',
    scores: true,
    bestLabel: 'Best WPM',
    art: `<g fill="currentColor">
      <rect x="6" y="18" width="52" height="30" opacity=".3"/>
      <rect x="10" y="22" width="7" height="6"/><rect x="19" y="22" width="7" height="6"/><rect x="28" y="22" width="7" height="6"/><rect x="37" y="22" width="7" height="6"/><rect x="46" y="22" width="8" height="6"/>
      <rect x="10" y="30" width="7" height="6"/><rect x="19" y="30" width="7" height="6"/><rect x="28" y="30" width="7" height="6" opacity=".55"/><rect x="37" y="30" width="7" height="6"/><rect x="46" y="30" width="8" height="6"/>
      <rect x="18" y="38" width="28" height="6"/>
    </g>`,
  },
  {
    slug: 'pinball',
    title: 'Pinball',
    description:
      'One full table: plunger, two flippers, pop bumpers, slingshots, a drop target bank, a ramp and an orbit. Complete the top lanes or the targets to raise the multiplier. Three ramp shots start multiball. Three balls.',
    kind: 'inhouse',
    src: '/games/pinball/index.html',
    tags: ['Solo', 'Action'],
    players: '1 player',
    controls: 'Space or Down to launch. Z and M (or Left and Right) for the flippers. Touch: hold lower right to launch, tap left or right half to flip.',
    scores: true,
    art: `<g fill="currentColor">
      <circle cx="22" cy="18" r="6"/><circle cx="38" cy="14" r="6" opacity=".55"/><circle cx="34" cy="28" r="6"/>
      <rect x="10" y="46" width="18" height="5" transform="rotate(25 10 48)"/>
      <rect x="36" y="46" width="18" height="5" transform="rotate(-25 54 48)"/>
      <circle cx="30" cy="40" r="3.5"/>
    </g>`,
  },
  {
    slug: 'dots-and-boxes',
    title: 'Dots and Boxes',
    description:
      'Take turns drawing a line between two dots. Close the fourth side of a box to claim it and move again. Most boxes wins. Play the computer on Easy, Normal or Hard, or pass and play. 3 x 3, 4 x 4 or 5 x 5 boxes.',
    kind: 'inhouse',
    src: '/games/dots-and-boxes/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 player or pass-and-play',
    controls: 'Tap or click a line. Arrows and Enter also work, U undoes.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor">
      <rect x="12" y="12" width="40" height="3" opacity=".45"/><rect x="12" y="12" width="3" height="40" opacity=".45"/>
      <rect x="32" y="32" width="20" height="20"/>
      <rect x="12" y="30.5" width="20" height="3" opacity=".45"/>
      <rect x="10" y="10" width="6" height="6"/><rect x="29" y="10" width="6" height="6"/><rect x="48" y="10" width="6" height="6"/>
      <rect x="10" y="29" width="6" height="6"/><rect x="29" y="29" width="6" height="6"/><rect x="48" y="29" width="6" height="6"/>
      <rect x="10" y="48" width="6" height="6"/><rect x="29" y="48" width="6" height="6"/><rect x="48" y="48" width="6" height="6"/>
    </g>`,
  },
  {
    slug: 'ultimate-tic-tac-toe',
    title: 'Ultimate Tic-Tac-Toe',
    description:
      'Nine games of tic-tac-toe inside one big one. The square you play in sends your opponent to the matching small board. Win a small board to claim it, and win three in a row on the big board to win the game. Play the computer or pass and play.',
    kind: 'inhouse',
    src: '/games/ultimate-tic-tac-toe/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 player or pass-and-play',
    controls: 'Tap or click a square. Arrows and Enter, or number keys 1 to 9.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor">
      <rect x="25" y="8" width="2" height="48" opacity=".45"/><rect x="37" y="8" width="2" height="48" opacity=".45"/>
      <rect x="8" y="25" width="48" height="2" opacity=".45"/><rect x="8" y="37" width="48" height="2" opacity=".45"/>
      <path d="M11 11 L21 21 M21 11 L11 21" stroke="currentColor" stroke-width="3"/>
      <circle cx="32" cy="32" r="4.5" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M43 43 L53 53 M53 43 L43 53" stroke="currentColor" stroke-width="3"/>
      <rect x="40" y="8" width="16" height="16" opacity=".55"/>
    </g>`,
  },
  {
    slug: 'air-hockey',
    title: 'Air Hockey',
    description:
      'Knock the puck into the other goal and guard your own. The puck takes the speed of your mallet and keeps most of it off the walls. Play the computer on Easy, Normal or Hard, or two players on one device. First to 7.',
    kind: 'inhouse',
    src: '/games/air-hockey/index.html',
    tags: ['Solo', 'Multiplayer', 'Action', 'Sports'],
    players: '1 or 2 players',
    controls: 'One player: mouse, drag, W A S D or arrows. Two players: W A S D against the arrows; on touch each player drags in their own half.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor"><rect x="31.5" y="8" width="1" height="48" opacity=".35"/><rect x="6" y="24" width="2" height="16" opacity=".35"/><rect x="56" y="24" width="2" height="16" opacity=".35"/><circle cx="18" cy="32" r="9"/><circle cx="18" cy="32" r="4" style="fill:var(--tile)"/><circle cx="46" cy="22" r="9" opacity=".45"/><circle cx="36" cy="39" r="5"/></g>`,
  },
  {
    slug: 'blackjack',
    title: 'Blackjack',
    description:
      "Beat the dealer's hand without going over 21, playing from a six-deck shoe with a bankroll that carries over between visits. The dealer stands on soft 17 and blackjack pays 3 to 2. Double on any first two cards, split pairs up to three hands, and take insurance when the dealer shows an ace. Play solo, or online at a table of up to five against one dealer.",
    kind: 'inhouse',
    src: '/games/blackjack/index.html',
    tags: ['Solo', 'Multiplayer', 'Cards', 'Casino'],
    players: '1 to 5 players, online',
    controls: 'Tap chips to bet, then Deal. H hit, S stand, D double, P split. 1 to 4 add chips, Enter deals.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor">
      <rect x="12" y="14" width="24" height="34" transform="rotate(-10 24 31)" opacity=".45"/>
      <rect x="28" y="16" width="24" height="34" transform="rotate(8 40 33)"/>
      <path d="M40 24C44 29 48 31 48 35C48 38 46 40 43.5 40C42 40 41 39.3 40.5 38.4L41.5 43H38.5L39.5 38.4C39 39.3 38 40 36.5 40C34 40 32 38 32 35C32 31 36 29 40 24Z" transform="rotate(8 40 33)" style="fill:var(--tile)"/>
    </g>`,
  },
  {
    slug: 'block-puzzle',
    title: 'Block Puzzle',
    description:
      'Drag pieces from a tray of three onto a 10 by 10 grid. A full row or column clears; clearing several at once scores more, and clearing again within three placements builds a streak multiplier. A new set of three comes once all are placed, and the run ends when none of the remaining pieces fit.',
    kind: 'inhouse',
    src: '/games/block-puzzle/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Drag a piece onto the grid. Keys: 1 to 3 pick a piece, arrows move it, Enter places.',
    scores: true,
    art: `<g fill="currentColor"><rect x="32" y="8" width="10" height="10"/><rect x="44" y="8" width="10" height="10"/><rect x="44" y="20" width="10" height="10"/><rect x="8" y="32" width="10" height="10" opacity=".55"/><rect x="20" y="32" width="10" height="10" opacity=".55"/><rect x="32" y="32" width="10" height="10" opacity=".18"/><rect x="44" y="32" width="10" height="10" opacity=".18"/><rect x="8" y="44" width="10" height="10" opacity=".55"/><rect x="20" y="44" width="10" height="10" opacity=".55"/><rect x="32" y="44" width="10" height="10" opacity=".55"/><rect x="44" y="44" width="10" height="10" opacity=".18"/></g>`,
  },
  {
    slug: 'hearts',
    title: 'Hearts',
    description:
      'Classic Hearts against three computer players. Pass three cards each hand, follow suit, and avoid taking hearts and the queen of spades, or take every point to shoot the moon. The game ends when someone reaches 100 and the lowest score wins.',
    kind: 'inhouse',
    src: '/games/hearts/index.html',
    tags: ['Solo', 'Cards', 'Strategy'],
    players: '1 player',
    controls: 'Tap or click a card to play it. Arrow keys and Enter also work.',
    art: `<g fill="currentColor"><rect x="12" y="16" width="24" height="34" transform="rotate(-12 24 33)" opacity=".45"/><rect x="28" y="12" width="24" height="34" transform="rotate(8 40 29)"/><path transform="rotate(8 40 29) translate(32.8 22.4) scale(.16)" d="M50 92C46 87 5 61 5 32 5 17 16 7 29 7 39 7 46 13 50 21 54 13 61 7 71 7 84 7 95 17 95 32 95 61 54 87 50 92Z" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'word-search',
    title: 'Word Search',
    description:
      'Find every word from the themed list hidden in the letter grid. Small 8 by 8 puzzles run across and down only, Medium 11 by 11 adds diagonals, and Large 14 by 14 hides words in all eight directions, backwards included. One daily puzzle that is the same for everyone, plus random puzzles from 23 themes with a best time for each size.',
    kind: 'inhouse',
    src: '/games/word-search/index.html',
    tags: ['Solo', 'Puzzle'],
    players: '1 player',
    controls: 'Drag across a word, or tap its first and last letters. Keys: arrows to move, Enter to mark each end.',
    art: `<g fill="currentColor"><rect x="6" y="7" width="52" height="10"/><rect x="14.62" y="33" width="46.77" height="10" transform="rotate(45 38 38)" opacity=".6"/><rect x="9" y="9" width="6" height="6" style="fill:var(--tile)"/><rect x="22" y="9" width="6" height="6" style="fill:var(--tile)"/><rect x="35" y="9" width="6" height="6" style="fill:var(--tile)"/><rect x="48" y="9" width="6" height="6" style="fill:var(--tile)"/><rect x="9" y="22" width="6" height="6" opacity=".45"/><rect x="22" y="22" width="6" height="6" style="fill:var(--tile)"/><rect x="35" y="22" width="6" height="6" opacity=".45"/><rect x="48" y="22" width="6" height="6" opacity=".45"/><rect x="9" y="35" width="6" height="6" opacity=".45"/><rect x="22" y="35" width="6" height="6" opacity=".45"/><rect x="35" y="35" width="6" height="6" style="fill:var(--tile)"/><rect x="48" y="35" width="6" height="6" opacity=".45"/><rect x="9" y="48" width="6" height="6" opacity=".45"/><rect x="22" y="48" width="6" height="6" opacity=".45"/><rect x="35" y="48" width="6" height="6" opacity=".45"/><rect x="48" y="48" width="6" height="6" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'yatzy',
    title: 'Yatzy',
    description:
      'Roll five dice up to three times a turn, holding the ones you want, then score the roll in one of 13 boxes. 63 or more in the upper section earns a 35 bonus, and every extra Yatzy is worth 100 with the joker rule. Play solo for a high score or against the computer, each on its own card.',
    kind: 'inhouse',
    src: '/games/yatzy/index.html',
    tags: ['Solo', 'Strategy'],
    players: '1 player',
    controls: 'Tap dice to hold, tap Roll, tap a box to score. Keys: 1 to 5 hold, Space rolls, arrows and Enter score.',
    scores: true,
    bestLabel: 'Best solo score',
    art: `<g fill="currentColor"><g transform="rotate(-12 22 23)" opacity=".45"><rect x="10" y="11" width="24" height="24"/></g><rect x="26" y="26" width="28" height="28"/><rect x="30" y="30" width="5" height="5" style="fill:var(--tile)"/><rect x="45" y="30" width="5" height="5" style="fill:var(--tile)"/><rect x="37.5" y="37.5" width="5" height="5" style="fill:var(--tile)"/><rect x="30" y="45" width="5" height="5" style="fill:var(--tile)"/><rect x="45" y="45" width="5" height="5" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'basketball-manager',
    title: 'Basketball Manager',
    description:
      'Run a pro basketball team in a fictional 30-team league for as many seasons as you last. Set the starting five and minutes, trade with computer teams under salary cap rules, draft scouted prospects, re-sign your players and bid on free agents, then sim 82-game seasons and best-of-seven playoffs with a box score for every game. Win and keep the books healthy, or the owner fires you.',
    kind: 'inhouse',
    src: '/games/basketball-manager/index.html',
    tags: ['Solo', 'Manager', 'Sports'],
    players: '1 player',
    controls: 'Tap tabs, rows and buttons to manage. Sim buttons play games. Space runs the main sim button.',
    scores: true,
    bestLabel: 'Most titles',
    art: `<g fill="currentColor"><circle cx="27" cy="27" r="17"/><rect x="25.5" y="10" width="3" height="34" style="fill:var(--tile)"/><rect x="10" y="25.5" width="34" height="3" style="fill:var(--tile)"/><path d="M15 15 Q23 27 15 39 L18 39 Q26 27 18 15 Z" style="fill:var(--tile)"/><path d="M39 15 Q31 27 39 39 L36 39 Q28 27 36 15 Z" style="fill:var(--tile)"/><rect x="36" y="46" width="6" height="8" opacity=".45"/><rect x="45" y="40" width="6" height="14" opacity=".7"/><rect x="54" y="32" width="6" height="22"/></g>`,
  },
  {
    slug: 'checkers',
    title: 'Checkers',
    description:
      'American checkers on an 8 by 8 board. Captures are compulsory and multi-jumps must be finished; a man reaching the far row becomes a king and can move and capture both ways. A player with no legal move loses, and 40 moves each without a capture or a man moving, or the same position three times, is a draw. Play the computer on Easy, Normal or Hard, pass and play on one device, or play a friend online with a room code.',
    kind: 'inhouse',
    src: '/games/checkers/index.html',
    tags: ['Strategy', 'Multiplayer', 'Solo'],
    players: '1 or 2 players, online',
    controls: 'Drag a piece, or click it and then click a square. U to undo, F to flip the board.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor"><circle cx="32" cy="39" r="20" opacity=".45"/><circle cx="32" cy="31" r="20"/><circle cx="32" cy="31" r="13" style="fill:var(--tile)"/><circle cx="32" cy="31" r="10"/></g>`,
  },
  {
    slug: 'mines',
    title: 'Mines',
    description:
      'Pick how many mines hide in a 5 x 5 grid, place a bet, then turn tiles over one at a time. Every gem raises the multiplier and you can cash out whenever you like, but a mine loses the bet. Your bankroll carries over between visits.',
    kind: 'inhouse',
    src: '/games/mines/index.html',
    tags: ['Casino', 'Solo'],
    players: '1 player',
    controls: 'Tap tiles to reveal. Space bets and cashes out, R picks a random tile.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><rect x="10" y="10" width="13" height="13" opacity=".35"/><rect x="25.5" y="10" width="13" height="13" opacity=".35"/><rect x="41" y="10" width="13" height="13"/><rect x="10" y="25.5" width="13" height="13"/><rect x="25.5" y="25.5" width="13" height="13" opacity=".35"/><rect x="41" y="25.5" width="13" height="13" opacity=".35"/><rect x="10" y="41" width="13" height="13" opacity=".35"/><rect x="25.5" y="41" width="13" height="13"/><rect x="41" y="41" width="13" height="13" opacity=".35"/><path d="M44.4 13.5H50.6L52 16.3L47.5 21.5L43 16.3Z" style="fill:var(--tile)"/><path d="M13.4 29H19.6L21 31.8L16.5 37L12 31.8Z" style="fill:var(--tile)"/><path d="M28.9 44.5H35.1L36.5 47.3L32 52.5L27.5 47.3Z" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'racing-manager',
    title: 'Racing Manager',
    description:
      "Run one of ten single-seater teams across as many seasons as you like: develop aero, engine, chassis and reliability under a budget cap, upgrade staff and sign drivers who develop and age. Each of the 16 rounds has qualifying and a live lap-by-lap race where you choose tyres, pit stops and driver mode through safety cars and rain. Points decide the drivers' and constructors' titles, and the rules change between seasons.",
    kind: 'inhouse',
    src: '/games/racing-manager/index.html',
    tags: ['Solo', 'Manager', 'Racing'],
    players: '1 player',
    controls: 'Tap or click to manage the team. In a race, set tyres, pit calls and driver mode; Space pauses.',
    scores: true,
    bestLabel: 'Most titles',
    art: `<g fill="currentColor"><rect x="14" y="8" width="36" height="5"/><rect x="29" y="13" width="6" height="13"/><rect x="12" y="16" width="9" height="13"/><rect x="43" y="16" width="9" height="13"/><rect x="23" y="25" width="18" height="24"/><rect x="28.5" y="29" width="7" height="9" style="fill:var(--tile)"/><rect x="11" y="37" width="10" height="15"/><rect x="43" y="37" width="10" height="15"/><rect x="17" y="52" width="30" height="5" opacity=".55"/></g>`,
  },
  {
    slug: 'roulette',
    title: 'Roulette',
    description:
      'European single-zero roulette with a full betting table and a bankroll that carries over between visits. Bet straight, split, street, corner, six line, dozens, columns and the even-money spots at the standard payouts from 35 to 1 down to 1 to 1. Undo, clear, rebet and double, then watch the ball settle into its pocket.',
    kind: 'inhouse',
    src: '/games/roulette/index.html',
    tags: ['Solo', 'Casino'],
    players: '1 player',
    controls: 'Pick a chip, tap the table to bet (lines and corners for splits, streets and corners), then Spin. Keys: 1 to 5 chips, Z undo, C clear, R rebet, D double, Space spins or skips.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="18" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(45 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(90 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(135 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(180 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(225 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(270 32 32)" style="fill:var(--tile)"/><rect x="31" y="6" width="2" height="8" transform="rotate(315 32 32)" style="fill:var(--tile)"/><circle cx="32" cy="32" r="11" opacity=".45"/><rect x="29" y="29" width="6" height="6"/><circle cx="43" cy="21" r="3"/></g>`,
  },
  {
    slug: 'slots',
    title: 'Slots',
    description:
      'A five-reel, three-row video slot with 20 fixed lines and a bankroll that carries over between visits. Three or more scatters anywhere start 10 free spins with every win tripled, and they can retrigger. Spin once or auto-spin 10, 25 or 50 times; the paytable shows every payout and line, for a 96.2% return.',
    kind: 'inhouse',
    src: '/games/slots/index.html',
    tags: ['Solo', 'Casino'],
    players: '1 player',
    controls: 'Space or Spin to spin, again to stop the reels. Up and down change the bet. P shows the paytable.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor">
      <rect x="8" y="14" width="48" height="36"/>
      <rect x="12" y="19" width="12" height="26" style="fill:var(--tile)"/><rect x="26" y="19" width="12" height="26" style="fill:var(--tile)"/><rect x="40" y="19" width="12" height="26" style="fill:var(--tile)"/>
      <path d="M14 26H22V29L18.5 38H15.5L19 29H14Z"/><path d="M28 26H36V29L32.5 38H29.5L33 29H28Z"/><path d="M42 26H50V29L46.5 38H43.5L47 29H42Z"/>
      <rect x="8" y="53" width="48" height="3" opacity=".45"/>
    </g>`,
  },
  {
    slug: 'video-poker',
    title: 'Video Poker',
    description:
      'Machine-style draw poker with two games: Jacks or Better on the full-pay 9/6 table and full-pay Deuces Wild. Bet 1 to 5 credits, hold the cards you want and draw once, with a royal flush paying 4000 at five credits. A hint marks the hold with the best expected return, and the bankroll carries over between visits.',
    kind: 'inhouse',
    src: '/games/video-poker/index.html',
    tags: ['Solo', 'Cards', 'Casino'],
    players: '1 player',
    controls: 'Tap cards to hold, then Draw. Keys: 1 to 5 hold, Enter deals and draws, B bet one, M bet max, H hint, G switch game.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><rect x="5" y="8" width="43" height="8" opacity=".35"/><rect x="49" y="8" width="10" height="8"/><rect x="5" y="22" width="10" height="22"/><rect x="16" y="22" width="10" height="22"/><rect x="27" y="22" width="10" height="22" opacity=".45"/><rect x="38" y="22" width="10" height="22"/><rect x="49" y="22" width="10" height="22" opacity=".45"/><rect x="5" y="48" width="10" height="5"/><rect x="16" y="48" width="10" height="5"/><rect x="38" y="48" width="10" height="5"/></g>`,
  },
  {
    slug: 'chinese-checkers',
    title: 'Chinese Checkers',
    description:
      'The six-pointed star board with 10 marbles to a point, for 2, 3, 4 or 6 players. Step to a neighbouring hole or chain jumps over single marbles of any colour, and the first to fill the opposite point wins. Any seat can be a computer player or another person passing the device.',
    kind: 'inhouse',
    src: '/games/chinese-checkers/index.html',
    tags: ['Strategy', 'Solo', 'Multiplayer'],
    players: '1 to 6 players',
    controls: 'Tap or click a marble to see where it can go, then tap a hole. Esc to deselect.',
    art: `<g fill="currentColor"><path d="M32 6L39.5 19H54.5L47 32L54.5 45H39.5L32 58L24.5 45H9.5L17 32L9.5 19H24.5Z" opacity=".45"/><circle cx="32" cy="50" r="4.5"/><circle cx="27" cy="41.5" r="4.5"/><circle cx="37" cy="41.5" r="4.5"/><circle cx="32" cy="16" r="4.5"/><circle cx="32" cy="16" r="2" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'dominoes',
    title: 'Dominoes',
    description:
      'Double-six dominoes against one to three computer players, or pass and play for two on one device. Match a tile to an open end of the line: in the Draw game you take from the boneyard when you cannot play, in the Block game you pass. Going out scores every pip left in the other hands, a blocked round goes to the lowest hand, and the first to 100 or 150 wins.',
    kind: 'inhouse',
    src: '/games/dominoes/index.html',
    tags: ['Solo', 'Multiplayer', 'Strategy'],
    players: '1 or 2 players',
    controls: 'Tap a tile to play it, then tap an end if it fits both. Arrows and Enter also work, D draws, P passes.',
    art: `<g fill="currentColor"><rect x="6" y="30" width="40" height="20" opacity=".45"/><rect x="25" y="33" width="2" height="14" style="fill:var(--tile)"/><circle cx="15.5" cy="40" r="2.8" style="fill:var(--tile)"/><rect x="29" y="5" width="30" height="54" style="fill:var(--tile)"/><rect x="32" y="8" width="24" height="48"/><rect x="35" y="31" width="18" height="2" style="fill:var(--tile)"/><circle cx="38.5" cy="14.5" r="2.8" style="fill:var(--tile)"/><circle cx="49.5" cy="25.5" r="2.8" style="fill:var(--tile)"/><circle cx="38.5" cy="38.5" r="2.8" style="fill:var(--tile)"/><circle cx="44" cy="44" r="2.8" style="fill:var(--tile)"/><circle cx="49.5" cy="49.5" r="2.8" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'nine-mens-morris',
    title: "Nine Men's Morris",
    description:
      'The mill game on the three-square board: place nine pieces each, then move them along the lines, and every three in a row takes an opposing piece. A player down to three pieces may jump anywhere, two pieces left or no legal move loses, and the same position three times or 50 moves each without a capture is a draw. Play the computer on Easy, Normal or Hard, pass and play on one device, or play a friend online with a room code.',
    kind: 'inhouse',
    src: '/games/nine-mens-morris/index.html',
    tags: ['Strategy', 'Multiplayer', 'Solo'],
    players: '1 or 2 players, online',
    controls: 'Click or tap a point to place. Drag a piece, or click it and then a point. U to undo.',
    scores: true,
    bestLabel: 'Best Hard streak',
    art: `<g fill="currentColor"><g opacity=".45"><rect x="6" y="6" width="52" height="3"/><rect x="6" y="55" width="52" height="3"/><rect x="6" y="6" width="3" height="52"/><rect x="55" y="6" width="3" height="52"/><rect x="16" y="16" width="32" height="3"/><rect x="16" y="45" width="32" height="3"/><rect x="16" y="16" width="3" height="32"/><rect x="45" y="16" width="3" height="32"/><rect x="26" y="26" width="12" height="3"/><rect x="26" y="35" width="12" height="3"/><rect x="26" y="26" width="3" height="12"/><rect x="35" y="26" width="3" height="12"/><rect x="6" y="30.5" width="20" height="3"/><rect x="38" y="30.5" width="20" height="3"/><rect x="30.5" y="6" width="3" height="20"/><rect x="30.5" y="38" width="3" height="20"/></g><circle cx="7.5" cy="7.5" r="6.5"/><circle cx="32" cy="7.5" r="6.5"/><circle cx="56.5" cy="7.5" r="6.5"/><circle cx="17.5" cy="46.5" r="6"/><circle cx="17.5" cy="46.5" r="2.6" style="fill:var(--tile)"/><circle cx="46.5" cy="32" r="6"/><circle cx="46.5" cy="32" r="2.6" style="fill:var(--tile)"/></g>`,
  },

  {
    slug: 'spades',
    title: 'Spades',
    description:
      'Classic partnership Spades: you and North against West and East. Bid your tricks, including nil and an optional blind nil, follow suit and use spades as trumps. Every ten bags costs 100, and the first side to 500 or 250 wins.',
    kind: 'inhouse',
    src: '/games/spades/index.html',
    tags: ['Solo', 'Cards', 'Strategy'],
    players: '1 player',
    controls: 'Tap or click a bid, then a card to play it. Arrow keys and Enter also work.',
    art: `<g fill="currentColor"><rect x="28" y="16" width="24" height="34" transform="rotate(12 40 33)" opacity=".45"/><rect x="12" y="12" width="24" height="34" transform="rotate(-8 24 29)"/><path transform="rotate(-8 24 29) translate(16 21) scale(.16)" d="M50 5C57 17 94 39 94 62 94 76 84 84 72 84 63 84 56 79 53 73 54 82 58 89 66 95H34C42 89 46 82 47 73 44 79 37 84 28 84 16 84 6 76 6 62 6 39 43 17 50 5Z" style="fill:var(--tile)"/></g>`,
  },
  {
    slug: 'plinko',
    title: 'Plinko',
    description:
      'Drop balls through a triangle of pegs into slots that pay a multiple of the bet, biggest at the edges. Choose 8 to 16 rows and low, medium or high risk, and drop as many balls at once as you like. Your bankroll carries over between visits.',
    kind: 'inhouse',
    src: '/games/plinko/index.html',
    tags: ['Casino', 'Solo'],
    players: '1 player',
    controls: 'Space or Drop releases a ball. Tap a slot to see its odds.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><circle cx="32" cy="12" r="2.5" opacity=".45"/><circle cx="25" cy="21" r="2.5" opacity=".45"/><circle cx="39" cy="21" r="2.5" opacity=".45"/><circle cx="18" cy="30" r="2.5" opacity=".45"/><circle cx="32" cy="30" r="2.5" opacity=".45"/><circle cx="46" cy="30" r="2.5" opacity=".45"/><circle cx="11" cy="39" r="2.5" opacity=".45"/><circle cx="25" cy="39" r="2.5" opacity=".45"/><circle cx="39" cy="39" r="2.5" opacity=".45"/><circle cx="53" cy="39" r="2.5" opacity=".45"/><circle cx="32" cy="21" r="4.5"/><rect x="1" y="47" width="11" height="10"/><rect x="14" y="47" width="11" height="10" opacity=".65"/><rect x="27" y="47" width="10" height="10" opacity=".35"/><rect x="39" y="47" width="11" height="10" opacity=".65"/><rect x="52" y="47" width="11" height="10"/></g>`,
  },
  {
    slug: 'crash',
    title: 'Crash',
    description:
      'Bet before the round starts, then watch the multiplier climb from 1.00x until it crashes at a random point. Cash out any time before the crash to win your bet times the multiplier, or set an auto cash out target. Rounds run back to back with a 1% house edge, and your bankroll carries over between visits.',
    kind: 'inhouse',
    src: '/games/crash/index.html',
    tags: ['Casino', 'Solo'],
    players: '1 player',
    controls: 'Tap Bet, then Cash out before the crash. Space bets and cashes out.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><rect x="10" y="10" width="3" height="44" opacity=".35"/><rect x="10" y="51" width="44" height="3" opacity=".35"/><path d="M13 51Q36 49 47 17V51Z" opacity=".3"/><path d="M13 51Q36 49 47 17" fill="none" stroke="currentColor" stroke-width="5"/><rect x="42" y="10" width="12" height="12"/></g>`,
  },
  {
    slug: 'holdem',
    title: "Texas Hold'em",
    description:
      "No-limit Texas Hold'em at a six-seat table with blinds of 10 and 20. Play solo against five computer players, each with its own style, with a bankroll that carries over between visits, or open an online table for 2 to 6 friends with a room code and fill the empty seats with bots. Side pots, split pots and the showdown follow the full rules, and online chips are separate from your bankroll.",
    kind: 'inhouse',
    src: '/games/holdem/index.html',
    tags: ['Solo', 'Multiplayer', 'Cards', 'Casino'],
    players: '1 player, or 2 to 6 online',
    controls: 'Tap Fold, Check or Call, and Raise; size a raise with the slider or Min, 1/2 pot, Pot and All in. Keys: F fold, C check or call, R raise, arrow keys set the raise, A all in.',
    scores: true,
    bestLabel: 'Best bankroll',
    art: `<g fill="currentColor"><rect x="9" y="12" width="24" height="34" transform="rotate(-12 21 29)" opacity=".45"/><rect x="23" y="9" width="24" height="34" transform="rotate(7 35 26)"/><path transform="rotate(7 35 26) translate(28 17) scale(.14)" d="M50 5C64 24 94 40 94 62C94 76 83 84 71 84C63 84 57 80 53 74C54 82 58 89 65 95H35C42 89 46 82 47 74C43 80 37 84 29 84C17 84 6 76 6 62C6 40 36 24 50 5Z" style="fill:var(--tile)"/><circle cx="45" cy="47" r="14" style="fill:var(--tile)"/><circle cx="45" cy="47" r="11"/><circle cx="45" cy="47" r="7" style="fill:var(--tile)"/><circle cx="45" cy="47" r="4"/></g>`,
  },
  /* ── Embedded games: third-party, via GameDistribution ─────── */
  {
    slug: 'basketball-stars',
    title: 'Basketball Stars',
    via: 'GameDistribution',
    by: 'MadPuffers',
    description:
      'One on one basketball. Score dunks and three-pointers, steal and block, and fill the super shot bar for a dunk that cannot miss. Play a tournament against the computer, or against a friend on one keyboard.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/516d6908fbc848bdb89e65a58a43a7dc/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'WASD or arrows to move, X or L to shoot and steal, S to block. Two players: WASD with B, arrows with L.',
    art: `<circle cx="26" cy="38" r="16" fill="currentColor"/>
    <path d="M10 38 H42 M26 22 V54 M15 26 Q23 38 15 50 M37 26 Q29 38 37 50" fill="none" style="stroke:var(--tile)" stroke-width="2.4"/>
    <rect x="52" y="6" width="3" height="18" fill="currentColor"/>
    <rect x="40" y="18" width="12" height="3" fill="currentColor"/>`,
  },
  {
    slug: 'football-heads',
    title: 'Football Heads',
    via: 'GameDistribution',
    description:
      'One on one football with big-headed players. Score more goals than your opponent before time runs out, using the power-ups that drop during the match. Win matches to climb the divisions.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/e28358852075425e9d70f65e90a9c34f/',
    tags: ['Sports', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys to move and jump, the kick buttons to shoot.',
    art: `<g fill="currentColor">
      <circle cx="25" cy="28" r="15"/>
      <rect x="29" y="23" width="5" height="5" style="fill:var(--tile)"/>
      <circle cx="46" cy="46" r="8" opacity=".55"/>
      <rect x="8" y="56" width="48" height="2" opacity=".45"/>
    </g>`,
  },
  {
    slug: 'drive-ahead-sports',
    title: 'Drive Ahead Sports',
    via: 'GameDistribution',
    description:
      'Pixel cars play football. Drive into the ball and knock it into the other goal before your opponent does.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/3fa215490c4a43e18bb21c0f52a35a1c/',
    tags: ['Sports', 'Action'],
    players: '1 player',
    controls: 'Click or tap to drive.',
    art: `<g fill="currentColor">
      <rect x="8" y="36" width="36" height="10"/>
      <rect x="16" y="27" width="18" height="10"/>
      <circle cx="17" cy="47" r="6" style="fill:var(--tile)"/><circle cx="17" cy="47" r="4"/>
      <circle cx="36" cy="47" r="6" style="fill:var(--tile)"/><circle cx="36" cy="47" r="4"/>
      <circle cx="50" cy="20" r="7"/>
    </g>`,
  },
  {
    slug: 'mini-golf-3d',
    title: 'Mini Golf 3D',
    via: 'GameDistribution',
    description:
      'A 51-hole mini golf course on an island. Sink the ball in as few strokes as you can, using rails, ramps, spinning rotors and wormholes.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/fe757bb6f2674590844c1ec2181c2b78/',
    tags: ['Sports', 'Solo'],
    players: '1 player',
    controls: 'Press the ball, pull back and let go to putt. Drag anywhere else to move the camera.',
    art: `<g fill="currentColor">
      <rect x="34" y="10" width="3" height="37"/>
      <polygon points="37,10 52,16 37,22"/>
      <ellipse cx="35.5" cy="48" rx="11" ry="3.5" opacity=".45"/>
      <circle cx="15" cy="44" r="5"/>
    </g>`,
  },
  {
    slug: 'trial-xtreme',
    title: 'Trial Xtreme',
    via: 'GameDistribution',
    description:
      'Ride a trials motorbike over jumps, pipes and rocks. Collect stars on each of the 30 tracks to unlock the next one.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/04425491014a4c64a7578f725ba51415/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    art: `<g fill="none" stroke="currentColor" stroke-width="4">
      <circle cx="16" cy="42" r="9"/><circle cx="48" cy="42" r="9"/>
      <path d="M16 42 L28 28 H40 L48 42 M28 28 L24 20 H17 M40 28 L44 17 H51"/>
    </g>
    <rect x="26" y="30" width="14" height="9" fill="currentColor"/>`,
  },
  {
    slug: 'paper-io-2',
    title: 'Paper.io 2',
    via: 'GameDistribution',
    description:
      'Claim ground by leaving your area and looping back to it. Your trail is exposed while you are outside your colour, and anyone who crosses it knocks you out. Most ground wins.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/5f0b3c36e5204917a1d23e8685a7015e/',
    tags: ['Action', 'Solo'],
    players: '1 player',
    controls: 'Mouse, arrow keys or WASD.',
    art: `<g fill="currentColor">
      <path d="M8 12 H36 V30 H56 V54 H22 V38 H8 Z" opacity=".45"/>
      <path d="M45 30 V8 H22 V12" fill="none" stroke="currentColor" stroke-width="3"/>
      <rect x="40" y="30" width="10" height="10"/>
    </g>`,
  },
  {
    slug: 'texas-holdem',
    title: "Texas Hold'em Poker",
    via: 'GameDistribution',
    description:
      "Texas Hold'em against computer players. Bet, bluff and fold to build your stack. Pick the difficulty and table rules before you sit down.",
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/a3a72cf8d87b4c2187dfa84046da9ddf/',
    tags: ['Cards', 'Solo'],
    players: '1 player',
    controls: 'Click or tap.',
    art: `<circle cx="32" cy="32" r="21" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="29" y="11" width="6" height="7"/><rect x="29" y="46" width="6" height="7"/>
      <rect x="11" y="29" width="7" height="6"/><rect x="46" y="29" width="7" height="6"/>
    </g>
    <circle cx="32" cy="32" r="10" fill="none" style="stroke:var(--tile)" stroke-width="2.4"/>`,
  },
  {
    slug: 'basket-random',
    title: 'Basket Random',
    via: 'GameDistribution',
    description:
      'Two on two basketball where each side has one button. The court, the players and the ball change every point. Score more than the other side.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/bf1268dccb5d43e7970bb3edaa54afc8/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'Player 1: W. Player 2: Up arrow. Tap on phones.',
    art: `<circle cx="26" cy="38" r="17" fill="currentColor"/>
    <path d="M9 38 H43 M26 21 V55 M14 26 Q22 38 14 50 M38 26 Q30 38 38 50" fill="none" style="stroke:var(--tile)" stroke-width="2.4"/>
    <rect x="40" y="6" width="18" height="18" fill="currentColor"/>
    <g style="fill:var(--tile)"><rect x="43" y="9" width="3.5" height="3.5"/><rect x="47.25" y="13.25" width="3.5" height="3.5"/><rect x="51.5" y="17.5" width="3.5" height="3.5"/></g>`,
  },
  {
    slug: 'soccer-random',
    title: 'Soccer Random',
    via: 'GameDistribution',
    description:
      'Two on two football where each side has one button. The pitch, the players and the ball change every goal. First to five goals wins.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/308d826f20034d7b972f25258c8d0a44/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'Player 1: W. Player 2: Up arrow. Tap on phones.',
    art: `<circle cx="26" cy="38" r="17" fill="currentColor"/>
    <polygon points="26,30 33.6,35.5 30.7,44.5 21.3,44.5 18.4,35.5" style="fill:var(--tile)"/>
    <rect x="40" y="6" width="18" height="18" fill="currentColor"/>
    <g style="fill:var(--tile)"><rect x="43" y="9" width="3.5" height="3.5"/><rect x="47.25" y="13.25" width="3.5" height="3.5"/><rect x="51.5" y="17.5" width="3.5" height="3.5"/></g>`,
  },
  {
    slug: 'volley-random',
    title: 'Volley Random',
    via: 'GameDistribution',
    description:
      'Two on two volleyball with ragdoll players and one button each. The court, the players and the ball change every point.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/b6f03bdc505e4d78a17379a5a83e206b/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'Player 1: W. Player 2: Up arrow. Tap on phones.',
    art: `<circle cx="26" cy="38" r="17" fill="currentColor"/>
    <path d="M26 21 Q20 34 26 38 Q34 42 42 36 M26 38 Q22 48 14 50" fill="none" style="stroke:var(--tile)" stroke-width="2.4"/>
    <rect x="40" y="6" width="18" height="18" fill="currentColor"/>
    <g style="fill:var(--tile)"><rect x="43" y="9" width="3.5" height="3.5"/><rect x="47.25" y="13.25" width="3.5" height="3.5"/><rect x="51.5" y="17.5" width="3.5" height="3.5"/></g>`,
  },
  {
    slug: 'boxing-random',
    title: 'Boxing Random',
    via: 'GameDistribution',
    description:
      'Boxing with one button each. Land punches to the head to score; every round changes the rules, from long arms to an icy ring. First to five wins.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/e8c02771085e4c8b9de3deda5e087e0e/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'Player 1: W. Player 2: Up arrow. Tap on phones.',
    art: `<g fill="currentColor">
      <rect x="12" y="24" width="26" height="24"/>
      <rect x="8" y="30" width="8" height="12"/>
      <rect x="16" y="48" width="18" height="8" opacity=".55"/>
    </g>
    <rect x="40" y="6" width="18" height="18" fill="currentColor"/>
    <g style="fill:var(--tile)"><rect x="43" y="9" width="3.5" height="3.5"/><rect x="47.25" y="13.25" width="3.5" height="3.5"/><rect x="51.5" y="17.5" width="3.5" height="3.5"/></g>`,
  },
  {
    slug: 'basketball-legends',
    title: 'Basketball Legends',
    via: 'GameDistribution',
    description:
      'One on one basketball. Play a tournament against the computer or quick matches against a friend on one keyboard. Dunk, block and slap the ball away.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/3dbd133d0cd9468bafdf2c9812290f4b/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    controls: 'Player 1: WASD to move and jump, X, Z and V to slap, throw and dunk. Player 2: arrows, K and L.',
    art: `<g fill="currentColor">
      <rect x="40" y="8" width="16" height="12"/>
      <rect x="44" y="11" width="8" height="6" style="fill:var(--tile)"/>
      <rect x="32" y="22" width="16" height="3"/>
      <path d="M33 25 L36 36 H44 L47 25" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="18" cy="44" r="10"/>
    </g>`,
  },
  {
    slug: 'football-legends',
    title: 'Football Legends',
    via: 'GameDistribution',
    description:
      'One on one football. Pick a team and play a tournament against the computer, or play with or against a friend.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/ecd138ae69cf4e92b5f5cdd328b6b62e/',
    tags: ['Sports', 'Multiplayer'],
    players: '1 or 2 players',
    art: `<path d="M8 50 V16 H56 V50" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M14 22 H50 M14 30 H50 M14 38 H50" stroke="currentColor" stroke-width="1" opacity=".4"/>
    <circle cx="32" cy="44" r="8" fill="currentColor"/>`,
  },
  {
    slug: 'air-hockey-cup',
    title: 'Air Hockey Cup',
    via: 'GameDistribution',
    description:
      'Table hockey with flicked tokens. Shoot your tokens to knock the puck into the goal, climb the league and spend winnings on upgrades.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/d34995cabda84fc6ba06bc4eef55a539/',
    tags: ['Sports', 'Solo'],
    players: '1 player',
    art: `<g fill="currentColor">
      <rect x="22" y="6" width="20" height="4"/>
      <circle cx="18" cy="40" r="8" opacity=".55"/><circle cx="46" cy="40" r="8" opacity=".55"/>
      <circle cx="32" cy="24" r="6"/>
      <rect x="22" y="54" width="20" height="4"/>
    </g>`,
  },
  {
    slug: 'cannon-basketball-4',
    title: 'Cannon Basketball 4',
    via: 'GameDistribution',
    description:
      'Fire basketballs from a cannon into the hoop. Each level blocks the shot with walls and obstacles, so you have to find the angle that gets it in.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/4910b9f4ac5847ca9762dde4ae8f9baf/',
    tags: ['Puzzle', 'Sports', 'Solo'],
    players: '1 player',
    art: `<g fill="currentColor">
      <rect x="8" y="34" width="26" height="12" transform="rotate(-30 14 44)"/>
      <circle cx="16" cy="48" r="7"/>
      <circle cx="16" cy="48" r="3" style="fill:var(--tile)"/>
      <rect x="44" y="16" width="14" height="3"/>
      <circle cx="40" cy="30" r="5"/>
    </g>`,
  },
  {
    slug: '8-ball-pool',
    title: '8 Ball Pool',
    via: 'GameDistribution',
    by: 'Arkadium',
    description:
      '8-ball pool against the computer, with two game modes: single matches, or a run of harder levels.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/d02120780e594158ab61869028223cf1/',
    tags: ['Sports', 'Solo'],
    players: '1 player',
    art: `<circle cx="32" cy="32" r="20" fill="currentColor"/>
    <circle cx="32" cy="32" r="10" style="fill:var(--tile)"/>
    <circle cx="32" cy="28" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="32" cy="35.5" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  {
    slug: 'drift-boss',
    title: 'Drift Boss',
    via: 'GameDistribution',
    description:
      'Your car drives itself along a zigzag track floating in the air. Time each drift round the corners so you never go off the edge.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/0a8b51e5eaee42e7b4db83ca00afc92e/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Click, tap or hold to drift.',
    art: `<path d="M6 54 L22 38 L34 46 L58 22" fill="none" stroke="currentColor" stroke-width="7" opacity=".35"/>
    <rect x="26" y="34" width="12" height="18" transform="rotate(45 32 43)" fill="currentColor"/>`,
  },
  {
    slug: 'bike-mania',
    title: 'Bike Mania',
    via: 'GameDistribution',
    description:
      'Ride a bike over ramps, gaps and obstacles to the end of each course without falling off.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/0dc3797cb689457dabd46316417a7ac1/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys.',
    art: `<g fill="none" stroke="currentColor" stroke-width="3.5">
      <circle cx="15" cy="44" r="9"/><circle cx="49" cy="44" r="9"/>
      <path d="M15 44 L26 30 H40 L49 44 M26 30 L32 44 L40 30 M40 30 L43 22"/>
    </g>
    <circle cx="31" cy="16" r="5" fill="currentColor"/>`,
  },
  {
    slug: 'highway-racer-3d',
    title: 'Highway Racer 3D',
    via: 'GameDistribution',
    description:
      'Weave through highway traffic at speed. The closer you pass other cars, the more you score.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/324dda64aa2f48af9037e2c582bbfa3e/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Left and right arrows.',
    art: `<g fill="currentColor">
      <rect x="10" y="4" width="3" height="56" opacity=".45"/><rect x="51" y="4" width="3" height="56" opacity=".45"/>
      <rect x="30.5" y="6" width="3" height="10" opacity=".45"/><rect x="30.5" y="26" width="3" height="10" opacity=".45"/><rect x="30.5" y="46" width="3" height="10" opacity=".45"/>
      <rect x="38" y="30" width="10" height="18"/>
      <rect x="17" y="10" width="10" height="16" opacity=".55"/>
    </g>`,
  },
  {
    slug: 'parking-fury-3d',
    title: 'Parking Fury 3D',
    via: 'GameDistribution',
    description:
      'Drive through a busy city, take cars and park them where the job says, without crashing or getting caught by the police.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/5287e4c6339b4c98882a3201bf265fe4/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys to drive.',
    art: `<rect x="14" y="8" width="36" height="48" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="24" y="16" width="6" height="32"/>
      <path d="M30 16 H36 A8 8 0 0 1 36 32 H30 V27 H35 A3 3 0 0 0 35 21 H30 Z"/>
    </g>`,
  },
  {
    slug: 'parking-fury-3d-night-city',
    title: 'Parking Fury 3D: Night City',
    via: 'GameDistribution',
    description:
      'Missions across a big city at night: taxi runs, ambulance trips and parking jobs. Follow the arrow on the mini-map to each destination.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/13d99dac275842e1a64a13332962fbd1/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys to drive, Ctrl to get in and out of cars.',
    art: `<rect x="14" y="8" width="36" height="48" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="24" y="16" width="6" height="32"/>
      <path d="M30 16 H36 A8 8 0 0 1 36 32 H30 V27 H35 A3 3 0 0 0 35 21 H30 Z"/>
    </g>`,
  },
  {
    slug: 'parking-fury-3d-beach-city',
    title: 'Parking Fury 3D: Beach City',
    via: 'GameDistribution',
    description:
      'Narrow beach town streets, tight parking spots and cars to take, with the police on the lookout.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/a0307d115a204901aa768ff1ca4145e6/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys to drive.',
    art: `<rect x="14" y="8" width="36" height="48" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="24" y="16" width="6" height="32"/>
      <path d="M30 16 H36 A8 8 0 0 1 36 32 H30 V27 H35 A3 3 0 0 0 35 21 H30 Z"/>
    </g>`,
  },
  {
    slug: 'parking-fury-3d-bounty-hunter',
    title: 'Parking Fury 3D: Bounty Hunter',
    via: 'GameDistribution',
    description:
      'Deliver expensive cars to customers through two-way traffic. They will not accept a single scratch.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/94e431161cba47ba9cdee2e8bf0482ed/',
    tags: ['Racing', 'Solo'],
    players: '1 player',
    controls: 'Arrow keys to drive, Ctrl to get in and out of cars.',
    art: `<rect x="14" y="8" width="36" height="48" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="24" y="16" width="6" height="32"/>
      <path d="M30 16 H36 A8 8 0 0 1 36 32 H30 V27 H35 A3 3 0 0 0 35 21 H30 Z"/>
    </g>`,
  },
  {
    slug: 'stack-ball',
    title: 'Stack Ball',
    via: 'GameDistribution',
    description:
      'Smash your way down a spinning tower of rings. Break through the normal rings, and let go before you hit a black one.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/a81fd206711b48489fddfa7fd4aab621/',
    tags: ['Action', 'Solo'],
    players: '1 player',
    controls: 'Click or tap and hold to smash.',
    art: `<g fill="currentColor">
      <circle cx="32" cy="12" r="6"/>
      <rect x="12" y="22" width="40" height="7"/>
      <rect x="12" y="33" width="40" height="7" opacity=".7"/>
      <rect x="12" y="44" width="40" height="7" opacity=".45"/>
      <rect x="40" y="22" width="12" height="7" style="fill:var(--tile)"/>
    </g>`,
  },
  {
    slug: 'asteroids',
    title: 'Asteroids',
    via: 'GameDistribution',
    by: 'Atari',
    description:
      'The arcade classic. Rotate, thrust and shoot to break up asteroids and flying saucers without getting hit.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/52e833fa4f2545428cee62a2163025ef/',
    tags: ['Action', 'Solo'],
    players: '1 player',
    controls: 'Keyboard.',
    art: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="miter">
      <polygon points="20,48 28,24 36,48 28,42"/>
      <polygon points="40,8 52,10 58,20 52,30 42,28 36,18"/>
      <polygon points="46,40 54,42 56,50 48,54 42,48"/>
    </g>
    <rect x="27" y="14" width="2.5" height="5" fill="currentColor"/>`,
  },
  {
    slug: 'ballistic',
    title: 'Ballistic',
    via: 'GameDistribution',
    by: 'Arkadium',
    description:
      'Aim and fire a stream of balls at numbered tiles. Each hit takes one off the number, the tiles move down every turn, and the game ends when one reaches the bottom.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/49d3da651367407cb1d4b9cd988fea2f/',
    tags: ['Puzzle', 'Solo'],
    players: '1 player',
    controls: 'Drag to aim, let go to fire.',
    art: `<g fill="currentColor">
      <rect x="8" y="8" width="14" height="14"/><rect x="25" y="8" width="14" height="14" opacity=".55"/><rect x="42" y="8" width="14" height="14"/>
      <rect x="25" y="25" width="14" height="14"/>
      <circle cx="32" cy="54" r="4"/>
    </g>
    <path d="M32 50 L44 30" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>`,
  },
  {
    slug: 'gd-spades',
    title: 'Spades',
    via: 'GameDistribution',
    description:
      'Spades with a computer partner against two computer opponents. Bid how many tricks you will take, with blind nil for the bold.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/fc6b4e70a4ab447cb9a0769565ea36d7/',
    tags: ['Cards', 'Solo'],
    players: '1 player',
    art: `<path d="M32 9 C26 19 12 25 12 36 C12 43 18 47 24 45 C27 44 29 42 30 40 L28 54 H36 L34 40 C35 42 37 44 40 45 C46 47 52 43 52 36 C52 25 38 19 32 9 Z" fill="currentColor"/>`,
  },
  {
    slug: 'gd-hearts',
    title: 'Hearts',
    via: 'GameDistribution',
    description:
      'Hearts against three computer players. Avoid taking hearts and the queen of spades. The game ends when someone reaches 100 points, and the lowest score wins.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/fec9c0500a0f4bda8021c1da4fcfe1e7/',
    tags: ['Cards', 'Solo'],
    players: '1 player',
    art: `<path d="M32 52 C20 43 10 34 10 24 C10 17 15 12 21 12 C26 12 29 15 32 19 C35 15 38 12 43 12 C49 12 54 17 54 24 C54 34 44 43 32 52 Z" fill="currentColor"/>`,
  },
  {
    slug: 'gd-yatzy',
    title: 'Yatzy',
    via: 'GameDistribution',
    description:
      'Roll five dice up to three times a turn, then score them in one of the combinations on the card. Fill the card with a higher total than your opponent.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/5e3180c29b074f4195f69bf4ad1bc0ff/',
    tags: ['Strategy', 'Solo'],
    players: '1 player',
    art: `<g fill="currentColor">
      <rect x="8" y="14" width="24" height="24" transform="rotate(-10 20 26)"/>
      <rect x="32" y="28" width="24" height="24" transform="rotate(8 44 40)" opacity=".7"/>
    </g>
    <g style="fill:var(--tile)">
      <circle cx="14.5" cy="21" r="2.4"/><circle cx="20" cy="26" r="2.4"/><circle cx="25.5" cy="31" r="2.4"/>
      <circle cx="39" cy="34" r="2.4"/><circle cx="49" cy="35.5" r="2.4"/><circle cx="38" cy="44" r="2.4"/><circle cx="48" cy="45.5" r="2.4"/>
    </g>`,
  },
  {
    slug: 'gd-dominoes',
    title: 'Dominoes',
    via: 'GameDistribution',
    description:
      'Draw or block dominoes against the computer. Match the open ends, draw when you cannot move, and reach 100 points to win.',
    kind: 'embed',
    src: 'https://html5.gamedistribution.com/570a3374c51447859a3c6f693c77179d/',
    tags: ['Strategy', 'Solo'],
    players: '1 player',
    art: `<rect x="21" y="6" width="22" height="52" fill="currentColor"/>
    <g style="fill:var(--tile)">
      <rect x="24" y="31" width="16" height="2"/>
      <circle cx="27" cy="13" r="2.6"/><circle cx="32" cy="19" r="2.6"/><circle cx="37" cy="25" r="2.6"/>
      <circle cx="27" cy="40" r="2.6"/><circle cx="37" cy="40" r="2.6"/><circle cx="27" cy="50" r="2.6"/><circle cx="37" cy="50" r="2.6"/>
    </g>`,
  },
]

/* Lobby order: the games most people already know first, the ones they will
 * have to learn last. A game missing from this list goes to the end. */
export const ORDER = [
  'chess', 'blackjack', 'wildcard', 'falling-blocks', 'snake', '2048', 'minesweeper',
  'four-in-a-row', 'checkers', 'sea-battle', 'word-guess', 'holdem', 'pong',
  'block-puzzle', 'slots', 'roulette', 'plinko', 'mines', 'crash', 'hangman',
  'yatzy', 'brick-breaker', 'space-shooter', 'memory-match', 'pinball',
  'air-hockey', 'dominoes', 'spades', 'hearts', 'road-crossing', 'word-search',
  'tower-stack', 'typing-test', 'sliding-puzzle', 'video-poker', 'dots-and-boxes',
  'chinese-checkers', 'code-breaker', 'world-cup', 'basketball-manager',
  'racing-manager', 'ultimate-tic-tac-toe', 'nine-mens-morris', 'onitama',
]
const rank = (g) => { const i = ORDER.indexOf(g.slug); return i < 0 ? ORDER.length : i }

export const GAMES = CATALOGUE
  .filter((g) => SHOW_GAMEDISTRIBUTION || g.via !== 'GameDistribution')
  .sort((a, b) => rank(a) - rank(b))
// Filters with nothing behind them are left out.
export const TAGS = ALL_TAGS.filter((t) => GAMES.some((g) => g.tags.includes(t)))

export const playable = (g) => g.status !== 'soon'
export const bySlug = (slug) => GAMES.find((g) => g.slug === slug)
