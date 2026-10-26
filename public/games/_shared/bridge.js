/* Vela Arcade bridge
 *
 * Every in-house game loads this one file. It is the whole contract between a
 * game and the arcade around it:
 *
 *   Vela.ready()        call once the game can take input
 *   Vela.score(n)       call whenever the score changes (cheap, call freely)
 *   Vela.gameOver(n)    call when a run ends; records a best and tells the arcade
 *   Vela.best()         this game's best score on this device (0 if none)
 *   Vela.embedded       true when running inside the arcade's player frame
 *   Vela.onPause(fn)    fn(paused) fires when the arcade hides or shows the game
 *
 * Games stay fully playable on their own: outside the arcade the messages go
 * nowhere and the best score still lands in localStorage. In-house games are
 * served from the arcade's own origin, so the arcade reads the same storage.
 */
(function () {
  const script = document.currentScript;
  const slug = (script && script.dataset.game) || location.pathname.split('/').filter(Boolean).pop() || 'game';
  const key = 'vela:best:' + slug;
  const embedded = window.parent !== window;
  const pauseHandlers = [];

  function post(type, data) {
    if (!embedded) return;
    try {
      window.parent.postMessage(Object.assign({ source: 'vela-game', game: slug, type }, data), location.origin);
    } catch (_) {}
  }

  function readBest() {
    try { return Number(localStorage.getItem(key)) || 0; } catch (_) { return 0; }
  }

  function setPaused(paused) {
    pauseHandlers.forEach((fn) => { try { fn(paused); } catch (e) { console.error(e); } });
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.source !== 'vela-arcade') return;
    if (e.data.type === 'pause') setPaused(true);
    if (e.data.type === 'resume') setPaused(false);
  });
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));

  if (embedded) document.documentElement.classList.add('vela-embedded');

  window.Vela = {
    slug,
    embedded,
    ready() { post('ready'); },
    score(n) { post('score', { score: n }); },
    gameOver(n) {
      const prev = readBest();
      const isBest = n > prev;
      if (isBest) { try { localStorage.setItem(key, String(n)); } catch (_) {} }
      post('gameover', { score: n, best: Math.max(n, prev), isBest });
      return isBest;
    },
    best: readBest,
    onPause(fn) { pauseHandlers.push(fn); },
  };
})();
