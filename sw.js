// Service worker : tout est mis en cache pour marcher hors ligne.
// Change VERSION à chaque mise à jour pour forcer le rafraîchissement.
const VERSION = 'newme-v3';
const FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/data.js',
  './js/store.js',
  './js/util.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './rappels.ics',
  './rappels-ordi.ics',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour avoir les mises à jour), cache si hors ligne.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const fromCache = () => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Erreur serveur (ex. 503 GitHub) : on garde la version en cache plutôt qu'une page d'erreur.
        if (!res.ok) return fromCache().then((r) => r || res);
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => fromCache().then((r) => r || Response.error()))
  );
});
