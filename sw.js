// Service worker : l'app entière marche hors ligne.
const VERSION = 'newme-v3';
const CORE = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/favicon-64.png', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/preact-htm.js',
  'js/app.js', 'js/db.js', 'js/sync.js', 'js/engine.js', 'js/ui.js', 'js/nav.js', 'js/nutrition.js', 'js/reminders.js', 'js/ai.js',
  'js/data/program.js', 'js/data/foods.js', 'js/data/meals.js', 'js/data/quotes.js',
  'js/screens/today.js', 'js/screens/training.js', 'js/screens/food.js', 'js/screens/track.js', 'js/screens/motivation.js', 'js/screens/settings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Jamais de cache pour Supabase, Claude, Open Food Facts
  if (/supabase\.co|anthropic\.com|openfoodfacts\.org/.test(url.hostname)) return;
  // Polices et librairies externes : cache d'abord, puis réseau
  if (url.origin !== location.origin) {
    e.respondWith(caches.open(VERSION + '-ext').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // Fichiers de l'app : réseau d'abord (mises à jour), cache si hors ligne
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
