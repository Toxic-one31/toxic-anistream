const CACHE_NAME = "toxic-anistream-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo.png",
  "/favicon.png",
  "/footer.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && url.pathname.startsWith("/api")) return;

  // Network-first for navigation and API
  if (request.mode === "navigate" || url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
    )
  );
});
