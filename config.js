/* ------------------------------------------------------------------
   NEXUS Game Hub — configuration (look & feel only)

   Looking for the game list?            ->  games.js
   Want to add a game in one line?       ->  games.js
------------------------------------------------------------------ */

window.NEXUS_CONFIG = {
  title: 'NEXUS',

  /* Optional manifest listing games. Entries in games.js always win;
     anything only in the manifest is merged in afterwards. */
  manifest: 'games/manifest.json',

  storageKeys: {
    settings: 'nexus.settings',
    recent: 'nexus.recent'
  },

  defaults: {
    theme: 'system',          /* light | dark | system */
    accent: 'pink',           /* key from `accents` below */
    scale: 'comfortable',     /* key from `scales` below */
    side: 'left',             /* left | right  (desktop) */
    showDescriptions: true,
    reduceMotion: false
  },

  accents: {
    pink: { label: 'Neon Pink', css: '#ff5fc0' },
    cyan: { label: 'Ion Cyan', css: '#00f0ff' },
    violet: { label: 'Ultraviolet', css: '#7c5cff' },
    lime: { label: 'Reactor Lime', css: '#34d399' }
  },

  scales: { compact: 0.94, comfortable: 1, large: 1.08 }
};
