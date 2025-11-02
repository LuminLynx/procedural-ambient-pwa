const CACHE = 'ambient-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/audio/engine.ts',
  '/src/styles.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(a => new Request(a, {cache: 'reload'})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try {
      const res = await fetch(e.request);
      cache.put(e.request, res.clone());
      return res;
    } catch {
      return cached || new Response('Offline', { status: 200 });
    }
  })());
});
