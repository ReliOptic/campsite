// Unveil Service Worker — offline-first caching for Unity WebGL PWA
const CACHE_NAME = 'unveil-v1';

// Core assets to precache (updated on each build)
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './Build/{{{ LOADER_FILENAME }}}',
  './Build/{{{ DATA_FILENAME }}}',
  './Build/{{{ FRAMEWORK_FILENAME }}}',
  './Build/{{{ CODE_FILENAME }}}'
];

// Install: precache core assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS.filter(function (url) {
        // Skip template placeholders that weren't replaced
        return url.indexOf('{{{') === -1;
      }));
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) { return name !== CACHE_NAME; })
             .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for assets, network-first for API
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // API calls (Supabase): network only, don't cache
  if (url.pathname.startsWith('/functions/') || url.pathname.startsWith('/rest/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Everything else: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request).then(function (response) {
        // Cache successful GET responses
        if (response.ok && event.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
