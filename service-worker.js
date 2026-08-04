const CACHE_NAME = 'dogpark-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/404.html',
  '/styles.css',
  '/app.js',
  '/app-logic.js',
  '/config.js',
  '/manifest.webmanifest',
  '/assets/favicon-64.png',
  '/assets/ga-logo-192.png',
  '/assets/ga-logo-512.png',
  '/assets/apple-touch-icon.png'
];

const OWNED_CACHE_PREFIXES = ['dogpark-app-', 'genevieve-dog-parks-'];
const CORE_URLS = new Set(ASSETS_TO_CACHE.map(path => new URL(path, self.location.origin).href));

function isCacheable(response) {
  return response && response.status === 200 && response.type === 'basic';
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          const isTargetedLegacy = OWNED_CACHE_PREFIXES.some(prefix => cache.startsWith(prefix));
          if (cache !== CACHE_NAME && isTargetedLegacy) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.headers.has('range')) return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const exactPage = await cache.match(event.request, { ignoreSearch: true });
        if (exactPage) return exactPage;

        const hasExtension = /\/[^/?]+\.[^/]+$/.test(url.pathname);
        const fallback = await cache.match(hasExtension ? '/404.html' : '/index.html');
        return fallback || Response.error();
      })
    );
    return;
  }

  if (CORE_URLS.has(url.href)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (!isCacheable(networkResponse)) return networkResponse;
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (isCacheable(networkResponse)) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
      }
      return networkResponse;
    }).catch(() => caches.match(event.request).then((cached) => cached || Response.error()))
  );
});
