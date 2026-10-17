// Éclipsia — utilitaires partagés
'use strict';
window.G = window.G || {};

G.util = (() => {
  // Générateur pseudo-aléatoire déterministe (mulberry32)
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const choice = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  const chance = (p) => Math.random() < p;
  const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const uid = (() => { let n = 1; return () => n++; })();

  function weighted(entries) {
    // entries: [[valeur, poids], ...]
    const total = entries.reduce((s, e) => s + e[1], 0);
    let r = Math.random() * total;
    for (const [v, w] of entries) { if ((r -= w) <= 0) return v; }
    return entries[entries.length - 1][0];
  }

  function fmt(n) {
    n = Math.floor(n);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { rng, clamp, lerp, dist, dist2, rand, randInt, choice, chance, angleTo, uid, weighted, fmt, esc };
})();
