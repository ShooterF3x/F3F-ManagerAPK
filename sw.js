const CACHE_NAME = 'f3f-snapshot-v1'; // On ne change JAMAIS ce nom
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', e => {
  // On a supprimé skipWaiting() ici pour ne pas forcer la mise à jour
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  // On garde le nettoyage de sécurité
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      // CACHE FIRST : Si c'est dans le téléphone, on ne demande rien à internet.
      return response || fetch(e.request);
    })
  );
});
