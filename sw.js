const CACHE_NAME = 'f3f-manager-static-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  // On ne met pas en cache les requêtes vers l'extérieur (API Gemini, GitHub, etc.)
  if (!e.request.url.startsWith(self.location.origin)) {
    return; // Laisse le navigateur gérer les requêtes externes normalement
  }

  e.respondWith(
    caches.match(e.request).then(response => {
      // Stratégie "Cache First" pour nos assets statiques
      return response || fetch(e.request);
    })
  );
});
