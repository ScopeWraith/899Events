const CACHE_NAME = 'thor-tracker-cache-v4'; // Incremented version to force update
const STATIC_ASSETS = [
  './',
  './conductor.html',
  './thor_tracker.jpeg',
  './manifest.json'
];

// 1. Install the service worker and cache the static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching offline page');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME)
                  .map(cache => {
                    console.log('[Service Worker] Clearing old cache:', cache);
                    return caches.delete(cache);
                  })
      );
    })
  );
  self.clients.claim();
});

// 3. Intercept fetch requests
self.addEventListener('fetch', event => {
  // We only want to handle navigation requests (i.e., opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the network request fails (e.g., offline),
        // serve the main conductor.html page from the cache.
        console.log('[Service Worker] Fetch failed; returning offline page.');
        return caches.match('./conductor.html');
      })
    );
  }
  // For other requests (images, etc.), you can add other strategies,
  // but for now, we'll let them pass through to the network.
});