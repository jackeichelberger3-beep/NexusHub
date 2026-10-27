/* ==================================================================
   NEXUS Game Hub — THE GAME LIST
   ==================================================================

   ADDING A GAME IS ONE LINE.

   Simplest possible version:

       1. Put your game in a folder named after the slug:
              games/my-game/index.html

       2. Add one line below:
              addGame('my-game', 'My Game');

   Done. It shows up in the sidebar menu, the rail, the hub grid and
   the standalone player automatically, and it opens in the game view.

   WANT MORE CONTROL? Pass options:

       addGame('my-game', 'My Game', {
         category:    'Arcade',              // folder group in the menu
         icon:        '🚀',                  // emoji shown in the menu
         accent:      '#00f0ff',             // card hover glow
         players:     '2 Players',
         tags:        ['Keyboard', 'Touch'],
         description: 'A short line about the game.',
         path:        'games/my-game/index.html'
       });

   SINGLE FILE GAME? Skip the folder and point straight at the HTML:

       addGame('boss-rush', 'Boss Rush', { path: 'games/boss-rush.html' });

   SOMEWHERE ELSE ON THE WEB? Any URL works too:

       addGame('portal', 'Portal', { path: 'https://example.com/portal/index.html' });

   Order here is the order shown in the menu. Categories are grouped
   automatically from each game's `category`.
================================================================== */

window.NEXUS_GAMES = [];

function addGame(slug, title, options) {
  var o = options || {};
  window.NEXUS_GAMES.push({
    slug: slug,
    title: title,
    category: o.category || 'Games',
    icon: o.icon || '🎮',
    accent: o.accent || '#ff5fc0',
    players: o.players || '1 Player',
    tags: o.tags || [],
    description: o.description || '',
    path: o.path || ('games/' + slug + '/index.html')
  });
}

/* ---------------------------------------------- your games start here */

addGame('memory-match', 'Memory Match', {
  category: 'Puzzle', icon: '🃏', accent: '#ffb020', tags: ['Mouse', 'Touch'],
  description: 'Flip cards to find all eight matching pairs in as few moves as you can manage.'
});

addGame('fileviewer', 'File Viewer', {
  category: 'Service', icon: '🃏', accent: '#ffb020', tags: ['Mouse', 'Touch'],
  description: 'Open any html game.'
});

/* --------------------------------------------------------------------
   Shared loader — merges the list above with games/manifest.json.
   The hub and the standalone player both use it.
-------------------------------------------------------------------- */

window.loadNexusGames = function (manifestPath) {
  var local = (window.NEXUS_GAMES || []).slice();
  if (!manifestPath || !window.fetch) return Promise.resolve(local);

  return fetch(manifestPath, { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('manifest ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var remote = data && Array.isArray(data.games) ? data.games : [];
      var seen = {};
      local.forEach(function (game) { seen[game.slug] = true; });
      return local.concat(remote.filter(function (game) { return !seen[game.slug]; }));
    })
    .catch(function () { return local; });
};
