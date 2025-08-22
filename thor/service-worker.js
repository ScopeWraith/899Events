const CACHE_NAME = 'thor-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/conductor.html',
  // Add other important files here if needed, like CSS or specific JS files
  // Note: The icon and manifest are usually cached automatically by the browser.
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});