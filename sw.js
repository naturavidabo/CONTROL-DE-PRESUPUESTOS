'use strict';
const CACHE_NAME = 'control-presupuesto-b6-1-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=6.1',
  './app.js?v=6.1',
  './manifest.json?v=6.1',
  './version.json',
  './icon-v5.svg',
  './icon-192-v5.png',
  './icon-512-v5.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isFreshAsset = event.request.mode === 'navigate' || /\.(?:html|js|css|json)$/.test(url.pathname);
  event.respondWith((async () => {
    try {
      const request = isFreshAsset ? new Request(event.request, { cache: 'no-store' }) : event.request;
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch (_) {
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      throw _;
    }
  })());
});
