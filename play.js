/* ------------------------------------------------------------------
   NEXUS Game Hub — standalone player page (play.html)

   Opens a single game full-window. Link to it with a game slug:

       play.html?game=neon-snake

   Handy for GitHub Pages: every game gets a direct, shareable URL.
------------------------------------------------------------------ */
(function () {
  'use strict';

  var CFG = window.NEXUS_CONFIG || {};
  var KEYS = CFG.storageKeys || { settings: 'nexus.settings' };

  var PATHS = {
    back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    maximize: '<path d="M4 9V4h5"/><path d="M20 15v5h-5"/><path d="M15 4h5v5"/><path d="M9 20H4v-5"/>',
    minimize: '<path d="M9 4v5H4"/><path d="M15 20v-5h5"/><path d="M20 9h-5V4"/><path d="M4 15h5v5"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function savedDark() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
      var mode = saved.theme || 'system';
      return mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (err) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  var params = new URLSearchParams(location.search);
  var themeParam = params.get('theme');
  var dark = themeParam ? themeParam === 'dark' : savedDark();
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';

  var frame = document.getElementById('frame');
  var bar = document.getElementById('bar');
  var hubLink = document.getElementById('hubLink');
  hubLink.innerHTML = icon('back');

  var slug = params.get('game');

  window.loadNexusGames(CFG.manifest).then(function (games) {
    var game = null;
    for (var i = 0; i < games.length; i++) if (games[i].slug === slug) game = games[i];

    if (!game) {
      frame.parentNode.removeChild(frame);
      document.body.insertAdjacentHTML('beforeend',
        '<div class="empty-state" style="height:100dvh">' +
          '<h1>Game not found</h1>' +
          '<p>No game in the list matches "' + esc(slug || '') + '". Add it to games.js or check the link.</p>' +
          '<a class="btn-primary" href="index.html">Back to the hub</a>' +
        '</div>');
      bar.remove();
      return;
    }

    document.title = game.title + ' · ' + (CFG.title || 'Game Hub');
    frame.title = game.title;
    frame.src = game.path + (game.path.indexOf('?') > -1 ? '&' : '?') + 'theme=' + (dark ? 'dark' : 'light');

    bar.innerHTML =
      '<div class="game-pill">' +
        '<span class="emoji">' + esc(game.icon || '🎮') + '</span>' +
        '<div class="meta"><h1>' + esc(game.title) + '</h1><p>' + esc(game.category) + '</p></div>' +
      '</div>' +
      '<div class="game-actions">' +
        '<button type="button" class="round-btn" id="fsBtn" title="Full screen" aria-label="Full screen">' + icon('maximize') + '</button>' +
      '</div>';

    document.getElementById('fsBtn').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    });
  });

  document.addEventListener('fullscreenchange', function () {
    var btn = document.getElementById('fsBtn');
    if (btn) btn.innerHTML = icon(document.fullscreenElement ? 'minimize' : 'maximize');
  });
})();
