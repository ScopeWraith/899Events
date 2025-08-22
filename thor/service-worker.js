const CACHE_NAME = 'thor-tracker-cache-v3'; // Incremented version to force update
const urlsToCache = [
  './',
  './conductor.html'
  // The manifest and icon are typically handled by the browser's install process,
  // but caching the main files is most important.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache and caching files.');
        return cache.addAll(urlsToCache);
      })
  );
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME)
                  .map(cache => caches.delete(cache))
      );
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch it from the network
        return fetch(event.request);
      }
    )
  );
});