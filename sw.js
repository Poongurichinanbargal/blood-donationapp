const CACHE_NAME = 'pn-bdc-clean-v3-20261001';
const APP_SHELL = [
  './', './index.html',
  './style.css?v=20261001-pnbdc-clean-v3',
  './app.js?v=20261001-pnbdc-clean-v2',
  './pn-bot.js', './manifest.json',
  './icons/poongurichi-logo.jpeg', './icons/icon-192.png',
  './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const shell = request.mode === 'navigate' ||
                request.destination === 'style' ||
                request.destination === 'script' ||
                request.destination === 'manifest';

  if (shell) {
    event.respondWith(
      fetch(request, {cache: 'no-store'})
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, copy));
      }
      return response;
    }))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
