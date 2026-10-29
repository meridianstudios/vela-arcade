/* Rules for games people may not know, shown under About on the game page.
 * Keyed by slug; each game is a list of short sections. Keep every line
 * true to how the game here actually plays, not to some other house rule.
 */
export const RULES = {
  onitama: [
    { h: 'Setup', items: [
      'A 5 by 5 board. Each side has a master in the middle of its back row and four students.',
      'Five move cards are dealt: two to each player and one to the side.',
    ] },
    { h: 'Your turn', items: [
      'Pick one of your two cards and move one of your pieces to a square that card shows, seen from your side.',
      'Moving onto an opponent piece captures it. You can never land on your own piece.',
      'The card you used goes to the side, and your opponent will take it next. You take the card that was there.',
    ] },
    { h: 'Winning', items: [
      'Capture the other master, or move your master onto the square the other master started on.',
    ] },
  ],

  dominoes: [
    { h: 'Setup', items: [
      'A double-six set of 28 tiles. In the Draw game, 2 players get 7 tiles each and 3 or 4 players get 5. In the Block game everyone gets 7.',
      'The highest double leads the first round. If nobody has a double, the heaviest tile leads. After that the round winner leads with any tile.',
    ] },
    { h: 'Playing', items: [
      'Play a tile with a matching number onto either open end of the line.',
      'Draw game: if you cannot play, draw from the boneyard until you can. Block game: you pass instead.',
    ] },
    { h: 'Scoring', items: [
      'Play your last tile to win the round and score every pip left in the other hands.',
      'If nobody can play, the lowest hand wins and scores the other hands\' pips. A tie for lowest scores nothing.',
      'First to 100 (or 150) wins.',
    ] },
  ],

  'chinese-checkers': [
    { h: 'Goal', items: [
      'Move all 10 of your marbles into the point of the star opposite your own. The first to fill it wins.',
    ] },
    { h: 'Moving', items: [
      'Move one marble to a neighbouring empty hole, or jump over a single marble of any colour into the empty hole behind it.',
      'Jumps can chain: keep jumping in any direction as long as each jump is legal.',
      'Nothing is ever captured. A marble that has reached your target point cannot leave it.',
      'With no legal move, you pass.',
    ] },
  ],

  'nine-mens-morris': [
    { h: 'Placing', items: [
      'Each player has nine pieces. Take turns placing them on empty points; orange goes first.',
    ] },
    { h: 'Moving', items: [
      'Once all pieces are placed, move a piece along a line to a neighbouring empty point.',
      'A player down to three pieces may fly: move any piece to any empty point.',
    ] },
    { h: 'Mills', items: [
      'Three of your pieces in a row along a line is a mill. Forming one lets you remove an opponent piece.',
      'You must take a piece that is not in a mill, unless every one of them is.',
    ] },
    { h: 'Ending', items: [
      'A player with two pieces, or with no legal move, loses.',
      'The same position three times, or 50 moves each without a capture, is a draw.',
    ] },
  ],

  spades: [
    { h: 'Teams and bidding', items: [
      'You and North play against West and East. Each player bids how many tricks they expect to win, from Nil (none) to 13.',
      'A side\'s two bids are added together as its target.',
    ] },
    { h: 'Play', items: [
      'Follow the suit that was led if you can. Spades are trumps and beat every other suit.',
      'Spades cannot be led until one has been played, unless you hold only spades.',
    ] },
    { h: 'Scoring', items: [
      'Make your target: 10 points per trick bid, plus 1 for each extra trick (a bag).',
      'Miss it: lose 10 points per trick bid. Every 10 bags costs 100 points.',
      'Nil scores 100 if that player takes no tricks, or loses 100 if they take any. Blind Nil, bid before seeing your cards, is worth 200.',
      'First side to 500 (or 250) wins.',
    ] },
  ],

  hearts: [
    { h: 'Passing', items: [
      'Each hand you pass three cards: left, then right, then across, then no pass, and repeat.',
    ] },
    { h: 'Play', items: [
      'The 2 of clubs leads the first trick. Follow suit if you can; the highest card of the suit led wins the trick.',
      'No points can be played on the first trick unless you have nothing else.',
      'Hearts cannot be led until one has been played, unless you hold only hearts.',
    ] },
    { h: 'Scoring', items: [
      'Each heart you take is 1 point and the queen of spades is 13. Points are bad.',
      'Take all 26 points to shoot the moon: everyone else gets 26 instead.',
      'The game ends when someone reaches 100. Lowest score wins.',
    ] },
  ],

  yatzy: [
    { h: 'A turn', items: [
      'Roll five dice up to three times. Between rolls, hold any dice you want to keep.',
      'Then score the roll in one empty box. Every box must be filled once, even with a zero.',
    ] },
    { h: 'Boxes', items: [
      'Ones to Sixes: the total of that number. 63 or more across them earns a 35 point bonus.',
      'Three and Four of a Kind: the total of all five dice.',
      'Full House 25, Small Straight (four in a row) 30, Large Straight (five in a row) 40.',
      'Yatzy (five the same) 50. Chance: the total of all five dice.',
    ] },
    { h: 'Extra Yatzys', items: [
      'Each extra Yatzy after scoring 50 is worth 100 more, and counts as a joker for the box you put it in.',
    ] },
  ],

  'video-poker': [
    { h: 'A hand', items: [
      'Bet 1 to 5 credits and deal five cards. Hold the ones you want, then draw once to replace the rest.',
      'Your final hand pays by the table above the cards. Betting 5 credits makes a royal flush pay 4000.',
    ] },
    { h: 'The two games', items: [
      'Jacks or Better: a pair of jacks or higher is the lowest paying hand.',
      'Deuces Wild: every 2 counts as any card. Three of a kind is the lowest paying hand.',
    ] },
  ],

  mines: [
    { h: 'A round', items: [
      'Choose a bet and how many mines (1 to 24) hide in the 25 tiles.',
      'Turn tiles over one at a time. Every safe tile raises your multiplier.',
      'Cash out whenever you like to win your bet times the multiplier. Hit a mine and you lose the bet.',
      'More mines means a bigger jump in the multiplier for each safe tile.',
    ] },
  ],

  roulette: [
    { h: 'The wheel', items: [
      'European roulette: 37 pockets, 1 to 36 plus a single 0. Bet on the table, then spin.',
    ] },
    { h: 'Bets and payouts', items: [
      'One number pays 35 to 1. Two numbers (split) 17 to 1. A row of three (street) 11 to 1.',
      'Four in a square (corner) 8 to 1. Two rows (six line) 5 to 1.',
      'A dozen or a column pays 2 to 1.',
      'Red or black, odd or even, 1 to 18 or 19 to 36 pay 1 to 1. These lose when 0 comes up.',
    ] },
  ],

  blackjack: [
    { h: 'Goal', items: [
      'Get closer to 21 than the dealer without going over. Number cards count their number, faces count 10, aces count 1 or 11.',
    ] },
    { h: 'Your options', items: [
      'Hit to take a card, stand to stop. Double to double your bet and take exactly one more card.',
      'Split a pair into two hands, up to three hands. Split aces get one card each.',
      'Insurance is offered when the dealer shows an ace and pays 2 to 1 if the dealer has blackjack.',
    ] },
    { h: 'The dealer', items: [
      'The dealer draws to 17 and stands on every 17.',
      'A blackjack (an ace and a ten-value card) pays 3 to 2. A tie returns your bet.',
    ] },
  ],

  checkers: [
    { h: 'Moving', items: [
      'Pieces move one square diagonally forward onto dark squares.',
      'Jump an opponent piece diagonally to capture it. Captures are compulsory, and a chain of jumps must be finished.',
    ] },
    { h: 'Kings', items: [
      'A piece that reaches the far row becomes a king, and its move ends there.',
      'Kings move and capture both forward and backward.',
    ] },
    { h: 'Ending', items: [
      'A player with no pieces or no legal move loses.',
      'The same position three times, or 40 moves each without a capture or a regular piece moving, is a draw.',
    ] },
  ],

  'ultimate-tic-tac-toe': [
    { h: 'The board', items: [
      'Nine small tic-tac-toe boards arranged in a big 3 by 3 grid.',
    ] },
    { h: 'Where you play', items: [
      'The square you pick inside a small board sends your opponent to the matching small board on the big grid.',
      'If that board is already won or full, they may play anywhere.',
    ] },
    { h: 'Winning', items: [
      'Three in a row on a small board claims it. Claim three small boards in a row on the big grid to win.',
    ] },
  ],

  'dots-and-boxes': [
    { h: 'Play', items: [
      'Take turns drawing a line between two neighbouring dots.',
      'Draw the fourth side of a box to claim it, and then draw again.',
      'When every line is drawn, the most boxes wins.',
    ] },
  ],

  'code-breaker': [
    { h: 'Goal', items: [
      'Find the hidden code of symbols in as few guesses as you can.',
    ] },
    { h: 'Clues', items: [
      'After each guess you are told how many symbols are the right symbol in the right place, and how many are in the code but in the wrong place.',
      'Clues do not say which symbols they refer to.',
    ] },
    { h: 'Modes', items: [
      'Normal: 4 symbols from 6, no repeats, 10 guesses. Hard: 5 symbols from 8, repeats allowed, 12 guesses.',
    ] },
  ],

  minesweeper: [
    { h: 'Goal', items: [
      'Open every square that does not hide a mine. The first square you open is always safe.',
    ] },
    { h: 'Clues', items: [
      'A number shows how many of the eight squares around it hide mines.',
      'Flag squares you are sure hide mines. Tap a number whose mines are all flagged to open the rest around it.',
    ] },
  ],
}
