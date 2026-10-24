/* ------------------------------------------------------------------
   NEXUS Game Hub — standalone application
   Plain JavaScript, no build step, no dependencies.
------------------------------------------------------------------ */
(function () {
  'use strict';

  var CFG = window.NEXUS_CONFIG || {};
  var DEFAULTS = CFG.defaults || {};
  var ACCENTS = CFG.accents || { pink: { label: 'Pink', css: '#ff5fc0' } };
  var SCALES = CFG.scales || { comfortable: 1 };
  var KEYS = CFG.storageKeys || { settings: 'nexus.settings', recent: 'nexus.recent' };

  var shell = document.getElementById('shell');
  var railEl = document.getElementById('rail');
  var panelWrap = document.getElementById('panelWrap');
  var panelEl = document.getElementById('panel');
  var stageEl = document.getElementById('stage');
  var scrim = document.getElementById('scrim');
  var menuToggle = document.getElementById('menuToggle');

  var MOBILE_QUERY = '(max-width: 1023px)';

  var state = {
    settings: loadJSON(KEYS.settings, DEFAULTS),
    recent: loadList(KEYS.recent),
    games: [],
    loaded: false,
    query: '',
    collapsed: {},
    sidebarOpen: false,
    panelBuilt: false,
    isMobile: window.matchMedia(MOBILE_QUERY).matches,
    route: 'home',
    slug: null,
    nonce: 0,
    stageSig: '',
    dark: false
  };

  /* ------------------------------------------------------------- icons */

  var PATHS = {
    spark: '<path d="M12 2.8l2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.3M12 19.1v2.3M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M2.6 12h2.3M19.1 12h2.3M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    reload: '<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 3.6V9H15"/>',
    external: '<path d="M14 3h7v7"/><path d="M21 3l-9.5 9.5"/><path d="M18.5 14v5.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5V7a1.5 1.5 0 0 1 1.5-1.5H10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.2 2"/>',
    chevDown: '<path d="m6 9.5 6 6 6-6"/>',
    chevRight: '<path d="m9.5 6 6 6-6 6"/>',
    play: '<path d="M8 5.4v13.2l10.5-6.6z"/>',
    maximize: '<path d="M4 9V4h5"/><path d="M20 15v5h-5"/><path d="M15 4h5v5"/><path d="M9 20H4v-5"/>',
    minimize: '<path d="M9 4v5H4"/><path d="M15 20v-5h5"/><path d="M20 9h-5V4"/><path d="M4 15h5v5"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
    moon: '<path d="M20 14.6A8.6 8.6 0 0 1 9.4 4 8.6 8.6 0 1 0 20 14.6Z"/>',
    monitor: '<rect x="2.6" y="4" width="18.8" height="13" rx="2"/><path d="M8 20.6h8"/>',
    panelLeft: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9.5 4v16"/>',
    panelRight: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M14.5 4v16"/>',
    gauge: '<path d="M3.8 18a9.2 9.2 0 1 1 16.4 0"/><path d="m12 14.2 4.2-4.2"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.6" cy="15" r="1.1" fill="currentColor" stroke="none"/>'
  };

  function icon(name, extra) {
    return '<svg class="ico' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
  }

  /* ------------------------------------------------------------- utils */

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function loadJSON(key, fallback) {
    try {
      var raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (!raw) return JSON.parse(JSON.stringify(fallback));
      return Object.assign({}, fallback, raw);
    } catch (err) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function loadList(key) {
    try {
      var raw = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (err) {
      return [];
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* private mode */ }
  }

  /* ------------------------------------------------------ data helpers */

  function findGame(slug) {
    for (var i = 0; i < state.games.length; i++) if (state.games[i].slug === slug) return state.games[i];
    return null;
  }

  function categories() {
    var order = [], map = {};
    state.games.forEach(function (game) {
      var key = game.category || 'Other';
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(game);
    });
    return order.map(function (key) { return { category: key, items: map[key] }; });
  }

  /* ------------------------------------------------------------ theme */

  function applySettings() {
    var s = state.settings;
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.dark = s.theme === 'dark' || (s.theme === 'system' && prefersDark);

    document.documentElement.dataset.theme = state.dark ? 'dark' : 'light';
    document.documentElement.dataset.motion = s.reduceMotion ? 'off' : 'on';
    document.documentElement.style.setProperty('--brand', (ACCENTS[s.accent] || ACCENTS.pink).css);
    document.documentElement.style.setProperty('--ui-scale', String(SCALES[s.scale] || 1));
    shell.dataset.side = state.isMobile ? 'left' : s.side;
  }

  function persist() {
    saveJSON(KEYS.settings, state.settings);
    applySettings();
    renderRail();
    if (state.panelBuilt) fillColumns();
    if (state.route === 'settings') renderSettings();
    else syncFrameTheme();
  }

  function syncFrameTheme() {
    var frame = document.getElementById('gameFrame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'theme', theme: state.dark ? 'dark' : 'light' }, '*');
    }
  }

  /* -------------------------------------------------- sidebar + circle */

  function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    render();
  }

  function sidebarDefault() {
    state.sidebarOpen = !state.isMobile && state.route !== 'game';
  }

  function renderSidebar() {
    var open = state.sidebarOpen;
    panelWrap.hidden = !open;
    panelWrap.classList.toggle('is-open', state.isMobile && open);
    scrim.hidden = !(state.isMobile && open);

    menuToggle.innerHTML = icon(open ? 'close' : 'spark');
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) {
      if (!state.panelBuilt) renderPanel();
      else fillColumns();
    }
    renderRail();
  }

  function renderRail() {
    var html = '<a class="rail-btn' + (state.route === 'home' ? ' is-on' : '') + '" href="#/" title="Hub" aria-label="Hub">' + icon('home') + '</a>';

    if (state.games.length) {
      html += '<span class="rail-rule"></span>';
      state.games.forEach(function (game) {
        var on = state.route === 'game' && state.slug === game.slug;
        html += '<a class="rail-btn' + (on ? ' is-on' : '') + '" href="#/game/' + encodeURIComponent(game.slug) + '"' +
          ' title="' + esc(game.title) + '" aria-label="' + esc(game.title) + '">' + esc(game.icon || '🎮') + '</a>';
      });
    }

    html += '<span class="rail-spacer"></span>';
    html += '<a class="rail-btn' + (state.route === 'settings' ? ' is-on' : '') + '" href="#/settings" title="Settings" aria-label="Settings">' + icon('gear') + '</a>';
    railEl.innerHTML = html;
  }

  /* --------------------------------------------------------- menu panel */

  function renderPanel() {
    state.panelBuilt = true;
    panelEl.innerHTML =
      '<div class="panel-head">' + icon('spark', 'brand') + '<h2>Menu</h2></div>' +
      '<div class="panel-search"><label>' + icon('search') +
        '<input id="gameSearch" type="search" placeholder="Search games" aria-label="Search games" value="' + esc(state.query) + '">' +
      '</label></div>' +
      '<div class="panel-cols"><div class="col" id="colMenu"></div><div class="col" id="colSide"></div></div>';

    var input = document.getElementById('gameSearch');
    input.addEventListener('input', function () { state.query = input.value; fillColumns(); });
    fillColumns();
  }

  function groupLabel(text, ic) {
    return '<p class="group-label">' + (ic ? icon(ic, 'sm') : '') + esc(text) + '</p>';
  }

  function rowLink(href, label, ic, on) {
    return '<a class="row' + (on ? ' is-on' : '') + '" href="' + href + '">' + icon(ic) +
      '<span class="lbl">' + esc(label) + '</span></a>';
  }

  function gameRow(game) {
    var on = state.route === 'game' && state.slug === game.slug;
    return '<a class="row' + (on ? ' is-on' : '') + '" href="#/game/' + encodeURIComponent(game.slug) + '">' +
      '<span class="emoji">' + esc(game.icon || '🎮') + '</span>' +
      '<span class="lbl">' + esc(game.title) + '</span></a>';
  }

  function fillColumns() {
    var colMenu = document.getElementById('colMenu');
    var colSide = document.getElementById('colSide');
    if (!colMenu || !colSide) return;

    var needle = state.query.trim().toLowerCase();
    var menu = groupLabel('Library') + rowLink('#/', 'All Games', 'grid', state.route === 'home');
    menu += groupLabel('Folders (' + categories().length + ')');

    if (needle) {
      var hits = state.games.filter(function (game) {
        return (game.title + ' ' + game.category + ' ' + (game.description || '')).toLowerCase().indexOf(needle) > -1;
      });
      menu += hits.length ? hits.map(gameRow).join('') : '<p class="empty">No games match that.</p>';
    } else {
      categories().forEach(function (group) {
        var open = !state.collapsed[group.category];
        menu += '<button type="button" class="row' + (open ? ' is-on' : '') + '" data-cat="' + esc(group.category) + '">' +
          icon(open ? 'chevDown' : 'chevRight') +
          '<span class="lbl">' + esc(group.category) + '</span>' +
          '<span class="count">' + group.items.length + '</span></button>';
        if (open) menu += '<div class="sub">' + group.items.map(gameRow).join('') + '</div>';
      });
    }
    colMenu.innerHTML = menu;

    var recents = state.recent.map(findGame).filter(Boolean);
    var side = groupLabel('Recent', 'clock');
    side += recents.length ? recents.map(gameRow).join('') : '<p class="empty">Nothing played yet.</p>';
    side += groupLabel('Preferences', 'gear');
    side += rowLink('#/settings', 'Settings', 'gear', state.route === 'settings');
    side += '<p class="empty">' + state.games.length + ' games installed</p>';
    colSide.innerHTML = side;
  }

  panelEl.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-cat]');
    if (!toggle) return;
    var key = toggle.dataset.cat;
    state.collapsed[key] = !state.collapsed[key];
    fillColumns();
  });

  /* -------------------------------------------------------- stage: home */

  function card(game) {
    var tags = [game.players].concat(game.tags || []).filter(Boolean);
    return '<a class="card" style="--glow:' + esc(game.accent || '#ff5fc0') + '" href="#/game/' + encodeURIComponent(game.slug) + '">' +
      '<div class="card-top">' +
        '<span class="card-icon">' + esc(game.icon || '🎮') + '</span>' +
        '<div class="card-title"><h3>' + esc(game.title) + '</h3><p>' + esc(game.category) + '</p></div>' +
        '<span class="card-play">' + icon('play') + '</span>' +
      '</div>' +
      (state.settings.showDescriptions && game.description ? '<p class="card-desc">' + esc(game.description) + '</p>' : '') +
      (tags.length ? '<div class="tags">' + tags.map(function (tag) { return '<span class="tag">' + esc(tag) + '</span>'; }).join('') + '</div>' : '') +
      '</a>';
  }

  function block(title, items, ic, count) {
    return '<section class="block"><div class="block-head"><h2>' + (ic ? icon(ic, 'sm') + ' ' : '') + esc(title) + '</h2>' +
      '<span class="block-count">' + (count == null ? items.length : count) + ' games</span></div>' +
      '<div class="cards">' + items.map(card).join('') + '</div></section>';
  }

  function renderHome() {
    var html = '<div class="scroll"><div class="wrap">';
    html += '<section class="hero"><div class="hero-glow"></div><div class="hero-inner">' +
      '<p class="eyebrow">' + icon('spark', 'brand sm') + esc(state.games.length) + ' games installed</p>' +
      '<h1>Your arcade, one click from the menu.</h1>' +
      '<p class="lede">Tap the circle in the corner to open the menu, then pick a title — it takes over the whole screen. Add a new game in one line and it appears in the menu.</p>' +
      '<div class="hero-actions">' +
        (state.games[0] ? '<a class="btn-primary" href="#/game/' + encodeURIComponent(state.games[0].slug) + '">' + icon('play') + 'Jump into ' + esc(state.games[0].title) + '</a>' : '') +
        '<a class="btn-ghost" href="#/settings">' + icon('gear') + 'Settings</a>' +
      '</div></div></section>';

    if (!state.games.length) {
      html += '<div class="empty-state"><h1>No games loaded yet</h1><p>Add a game to <strong>games.js</strong> with one line, then refresh.</p></div>';
    } else {
      var recents = state.recent.map(findGame).filter(Boolean);
      if (recents.length) html += block('Recently played', recents, 'clock');
      categories().forEach(function (group) { html += block(group.category, group.items); });
    }

    html += '</div></div>';
    stageEl.innerHTML = html;
  }

  /* -------------------------------------------------------- stage: game */

  function renderGame() {
    var game = findGame(state.slug);
    if (!game) {
      stageEl.innerHTML = '<div class="empty-state"><h1>That game isn\'t in the list</h1>' +
        '<p>Nothing in games.js matches this link. Add it there or pick another title from the menu.</p>' +
        '<a class="btn-primary" href="#/">' + icon('back') + 'Back to the hub</a></div>';
      return;
    }

    var theme = state.dark ? 'dark' : 'light';
    var separator = game.path.indexOf('?') > -1 ? '&' : '?';

    stageEl.innerHTML =
      '<div class="game" id="gameBox">' +
        '<iframe id="gameFrame" title="' + esc(game.title) + '"' +
          ' src="' + esc(game.path + separator + 'theme=' + theme + '&v=' + state.nonce) + '"' +
          ' allow="fullscreen; autoplay"></iframe>' +
        '<div class="game-bar">' +
          '<div class="game-pill">' +
            '<span class="emoji">' + esc(game.icon || '🎮') + '</span>' +
            '<div class="meta"><h1>' + esc(game.title) + '</h1><p>' + esc(game.category) + '</p></div>' +
          '</div>' +
          '<div class="game-actions">' +
            '<button type="button" class="round-btn" data-reload title="Restart" aria-label="Restart game">' + icon('reload') + '</button>' +
            '<button type="button" class="round-btn" data-fullscreen title="Full screen" aria-label="Full screen">' + icon('maximize') + '</button>' +
            '<a class="round-btn hide-sm" href="play.html?game=' + encodeURIComponent(game.slug) + '" target="_blank" rel="noreferrer" title="Open the standalone player" aria-label="Open the standalone player">' + icon('external') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    addRecent(game.slug);
  }

  function addRecent(slug) {
    var next = [slug].concat(state.recent.filter(function (item) { return item !== slug; })).slice(0, 3);
    if (next.join('|') === state.recent.join('|')) return;
    state.recent = next;
    saveJSON(KEYS.recent, next);
    if (state.panelBuilt) fillColumns();
  }

  function toggleFullscreen() {
    var box = document.getElementById('gameBox');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box && box.requestFullscreen) box.requestFullscreen();
  }

  /* ---------------------------------------------------- stage: settings */

  function segmented(name, value, options) {
    return '<div class="segmented">' + options.map(function (option) {
      return '<button type="button" class="seg-btn' + (option[0] === value ? ' is-on' : '') + '" data-set="' + name + '" data-value="' + option[0] + '">' +
        icon(option[2], 'sm') + esc(option[1]) + '</button>';
    }).join('') + '</div>';
  }

  function toggleRow(name, label, hint, checked) {
    return '<button type="button" class="row-toggle" role="switch" aria-checked="' + checked + '" data-toggle="' + name + '">' +
      '<span class="row-toggle-text"><span class="row-toggle-label">' + esc(label) + '</span>' +
      '<span class="row-toggle-hint">' + esc(hint) + '</span></span>' +
      '<span class="switch' + (checked ? ' is-on' : '') + '"><span class="knob"></span></span></button>';
  }

  function renderSettings() {
    var s = state.settings;
    var swatches = Object.keys(ACCENTS).map(function (key) {
      return '<button type="button" class="swatch' + (s.accent === key ? ' is-on' : '') + '" data-set="accent" data-value="' + key + '">' +
        '<i style="background:' + esc(ACCENTS[key].css) + '"></i>' + esc(ACCENTS[key].label) + '</button>';
    }).join('');

    stageEl.innerHTML =
      '<div class="scroll"><div class="wrap">' +
        '<div class="page-head"><div><h1>Settings</h1>' +
          '<p>Everything here is saved in this browser and applied the moment you switch it.</p></div>' +
          '<button type="button" class="btn-ghost" data-reset>' + icon('reload') + 'Reset defaults</button>' +
        '</div>' +

        '<h2 class="section-title">Appearance</h2>' +
        segmented('theme', s.theme, [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']]) +
        '<div class="panel-group" style="margin-top:12px">' +
          '<p class="group-title">' + icon('palette', 'sm brand') + 'Accent colour</p>' +
          '<div class="swatches">' + swatches + '</div>' +
        '</div>' +

        '<h2 class="section-title">Interface</h2>' +
        segmented('scale', s.scale, [['compact', 'Compact', 'gauge'], ['comfortable', 'Default', 'gauge'], ['large', 'Large', 'gauge']]) +
        segmented('side', s.side, [['left', 'Left', 'panelLeft'], ['right', 'Right', 'panelRight']]) +
        toggleRow('showDescriptions', 'Game descriptions', 'Show the summary text on every hub card.', s.showDescriptions) +
        toggleRow('reduceMotion', 'Reduce motion', 'Turn off hover lifts and transitions.', s.reduceMotion) +
      '</div></div>';
  }

  stageEl.addEventListener('click', function (event) {
    var setter = event.target.closest('[data-set]');
    if (setter) {
      state.settings[setter.dataset.set] = setter.dataset.value;
      persist();
      return;
    }

    var toggler = event.target.closest('[data-toggle]');
    if (toggler) {
      var key = toggler.dataset.toggle;
      state.settings[key] = !state.settings[key];
      persist();
      return;
    }

    if (event.target.closest('[data-reset]')) {
      state.settings = JSON.parse(JSON.stringify(DEFAULTS));
      persist();
      return;
    }

    if (event.target.closest('[data-fullscreen]')) {
      toggleFullscreen();
      return;
    }

    if (event.target.closest('[data-reload]')) {
      var frame = document.getElementById('gameFrame');
      if (frame) frame.src = frame.src;
    }
  });

  /* ------------------------------------------------------------ router */

  function parseRoute() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (hash.indexOf('game/') === 0) {
      state.route = 'game';
      state.slug = decodeURIComponent(hash.slice(5));
      return;
    }
    if (hash === 'settings') {
      state.route = 'settings';
      state.slug = null;
      return;
    }
    state.route = 'home';
    state.slug = null;
  }

  function renderStage() {
    if (state.route === 'game') {
      if (!state.loaded) {
        stageEl.innerHTML = '<div class="empty-state"><p>Loading game…</p></div>';
        return;
      }
      renderGame();
      return;
    }
    if (state.route === 'settings') { renderSettings(); return; }
    renderHome();
  }

  function render() {
    applySettings();
    renderSidebar();

    var signature = [state.route, state.slug, state.nonce, state.games.length, state.loaded].join('|');
    if (signature !== state.stageSig) {
      state.stageSig = signature;
      renderStage();
    }
  }

  /* -------------------------------------------------------------- boot */

  menuToggle.addEventListener('click', toggleSidebar);
  scrim.addEventListener('click', function () {
    state.sidebarOpen = false;
    render();
  });

  window.addEventListener('hashchange', function () {
    parseRoute();
    state.nonce = 0;
    sidebarDefault();
    render();
  });

  var mq = window.matchMedia(MOBILE_QUERY);
  var onBreakpoint = function (event) {
    state.isMobile = event.matches;
    state.sidebarOpen = false;
    render();
  };
  if (mq.addEventListener) mq.addEventListener('change', onBreakpoint);
  else mq.addListener(onBreakpoint);

  var colorMq = window.matchMedia('(prefers-color-scheme: dark)');
  var onColorScheme = function () { if (state.settings.theme === 'system') persist(); };
  if (colorMq.addEventListener) colorMq.addEventListener('change', onColorScheme);
  else colorMq.addListener(onColorScheme);

  document.addEventListener('fullscreenchange', function () {
    var btn = document.querySelector('[data-fullscreen]');
    if (btn) {
      btn.innerHTML = icon(document.fullscreenElement ? 'minimize' : 'maximize');
      btn.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Full screen');
    }
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.sidebarOpen) {
      state.sidebarOpen = false;
      render();
    }
  });

  parseRoute();
  sidebarDefault();
  applySettings();
  render();

  window.loadNexusGames(CFG.manifest).then(function (list) {
    state.games = list;
    state.loaded = true;
    render();
  });
})();
