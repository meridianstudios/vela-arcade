/* The update log, newest first. Each release lists the games it added (by
 * slug, so tiles and links come from the catalogue) and plain one-line changes.
 *
 * Versions below 1.0 are pre-release builds. 1.0 is the day the site went
 * public. New versions go on top.
 */
export const UPDATES = [
  {
    version: '1.4',
    date: '2026-10-30',
    games: ['plinko'],
    changes: [
      'The lobby lists the games most people know first.',
    ],
  },
  {
    version: '1.3.4',
    date: '2026-10-30',
    games: [],
    changes: [
      'Rules tab in the top bar: every rulebook in one place.',
      'Players today now counts everyone online, including tabs left open past midnight.',
    ],
  },
  {
    version: '1.3.3',
    date: '2026-10-29',
    games: [],
    changes: [
      'Leaderboards tab in the top bar: the top 10 for every game with a score, in one place.',
      'Leaderboards are moderated. Inappropriate names and scores get removed.',
    ],
  },
  {
    version: '1.3.2',
    date: '2026-10-29',
    games: [],
    changes: [
      'Rules on the game page for Onitama, Dominoes, Chinese Checkers, Nine Men\'s Morris, Spades, Hearts, Yatzy, the casino games and more.',
      'Snakes and Ladders is gone.',
    ],
  },
  {
    version: '1.3.1',
    date: '2026-10-29',
    games: [],
    changes: [
      'New Vela logo.',
    ],
  },
  {
    version: '1.3',
    date: '2026-10-29',
    games: ['spades', 'dominoes', 'nine-mens-morris', 'chinese-checkers'],
    changes: [
      'Accounts: a username and a password, no email. Google sign-in is gone.',
      'Global leaderboards on every game with a score.',
      'Blackjack has online tables for up to 5 players.',
      'Online games no longer report a room as closed while the tab is in the background.',
      'New addresses: arcade.novalabsos.com and play.novalabsos.com.',
    ],
  },
  {
    version: '1.2',
    date: '2026-10-28',
    games: ['roulette', 'slots', 'video-poker', 'mines', 'basketball-manager', 'racing-manager', 'checkers'],
    changes: [
      'Chess: Game Review grades every move from Best to Blunder, with accuracy for both sides.',
      'Optional sign in with Google to keep your bests across devices.',
      'Casino and Manager filters.',
    ],
  },
  {
    version: '1.1',
    date: '2026-10-27',
    games: ['yatzy', 'air-hockey', 'blackjack', 'word-search', 'block-puzzle', 'hearts'],
    changes: [
      'Online page shows players today and players all time.',
    ],
  },
  {
    version: '1.0',
    date: '2026-10-26',
    games: [],
    changes: [
      'Vela Arcade is public.',
      'Online page: how many people are on the site right now.',
      'Word Guess uses green and yellow.',
      'Third-party games can no longer send the page somewhere else.',
    ],
  },
  {
    version: '0.5',
    date: '2026-10-24',
    games: [],
    changes: [
      'This page: every version and what it added.',
      'Updates link in the top bar, and the current version in the footer.',
    ],
  },
  {
    version: '0.4',
    date: '2026-10-24',
    games: [
      'memory-match', 'sliding-puzzle', 'code-breaker', 'hangman', 'road-crossing',
      'typing-test', 'pinball', 'dots-and-boxes', 'ultimate-tic-tac-toe',
      'basket-random', 'soccer-random', 'volley-random', 'boxing-random',
      'basketball-legends', 'football-legends', 'air-hockey-cup', 'cannon-basketball-4',
      '8-ball-pool', 'drift-boss', 'bike-mania', 'highway-racer-3d', 'parking-fury-3d',
      'parking-fury-3d-night-city', 'parking-fury-3d-beach-city', 'parking-fury-3d-bounty-hunter',
      'stack-ball', 'asteroids', 'ballistic', 'gd-spades', 'gd-hearts', 'gd-yatzy', 'gd-dominoes',
    ],
    changes: [
      'Racing filter.',
      'Long player counts on tiles wrap instead of running off the edge.',
    ],
  },
  {
    version: '0.3',
    date: '2026-10-24',
    games: ['basketball-stars', 'football-heads', 'drive-ahead-sports', 'mini-golf-3d', 'trial-xtreme', 'paper-io-2', 'texas-holdem'],
    changes: [
      'The lobby is split into Vela originals and Embedded games.',
      'Embedded games credit the studio that made them on their page.',
    ],
  },
  {
    version: '0.2',
    date: '2026-10-24',
    games: ['chess', 'sea-battle', 'four-in-a-row', 'falling-blocks', 'space-shooter', 'minesweeper', 'word-guess', 'pong'],
    changes: [
      'Online rooms for Chess and Sea Battle. Share the code or the invite link.',
      'Tower Stack gives you 3 lives. A full miss costs one instead of ending the run.',
    ],
  },
  {
    version: '0.1',
    date: '2026-10-24',
    games: ['wildcard', 'onitama', 'world-cup', 'tower-stack', '2048', 'snake', 'brick-breaker'],
    changes: [
      'The lobby: filters, search and your recently played games.',
      'Full screen and reload on every game.',
      'Bests are saved on your device.',
    ],
  },
]

export const CURRENT_VERSION = UPDATES[0].version
