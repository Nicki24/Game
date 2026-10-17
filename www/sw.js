// Éclipsia — service worker : rend le jeu jouable hors ligne
const CACHE = 'eclipsia-v2';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/util.js', './js/data.js', './js/sprites.js', './js/audio.js', './js/world.js', './js/items.js',
  './js/fx.js', './js/combat.js', './js/render.js', './js/input.js', './js/ui.js', './js/game.js',
  './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), cache en secours
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
