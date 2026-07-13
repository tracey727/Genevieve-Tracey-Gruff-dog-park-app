const CACHE_NAME = "genevieve-github-pages-v2-ga-brand";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./privacy.html",
  "./terms.html",
  "./safety.html",
  "./community.html",
  "./manifest.webmanifest",
  "./assets/ga-logo-192.png",
  "./assets/ga-logo-512.png",
  "./assets/genevieve-roots.png",
  "./assets/genevieve-roots-512.png",
  "./assets/nav-home.svg",
  "./assets/nav-parks.svg",
  "./assets/nav-trip.svg",
  "./assets/nav-alerts.svg",
  "./assets/nav-profile.svg",
  "./assets/nav-more.svg",
  "./assets/tracey-avatar.jpg",
  "./assets/tracey-profile.jpg",
  "./assets/mr-gruff-avatar.jpg",
  "./assets/mr-gruff-profile.jpg",
  "./assets/park.svg",
  "./assets/beach.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return Response.error();
      });
    })
  );
});
