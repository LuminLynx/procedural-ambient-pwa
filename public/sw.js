const CACHE = 'ambient-v3'; // Increment version to force cache update
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

// Network timeout for stale-while-revalidate
const NETWORK_TIMEOUT = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS.map(a => new Request(a, {cache: 'reload'})));
      self.skipWaiting();
    } catch (error) {
      console.error('SW install failed:', error);
    }
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      self.clients.claim();
    } catch (error) {
      console.error('SW activate failed:', error);
    }
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // Use network-first strategy for HTML to avoid stale UI
  if (e.request.destination === 'document') {
    e.respondWith((async () => {
      try {
        const networkResponse = await Promise.race([
          fetch(e.request),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT)
          )
        ]);
        
        // Update cache with fresh response
        const cache = await caches.open(CACHE);
        cache.put(e.request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        // Fallback to cache if network fails
        const cached = await caches.match(e.request);
        if (cached) return cached;
        
        // If no cache, return offline page
        return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      }
    })());
  } else {
    // Use cache-first for other resources
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(e.request);
      if (cached) return cached;
      
      try {
        const res = await fetch(e.request);
        // Only cache successful responses
        if (res.status === 200) {
          cache.put(e.request, res.clone());
        }
        return res;
      } catch (error) {
        return cached || new Response('Offline', { status: 503 });
      }
    })());
  }
});
