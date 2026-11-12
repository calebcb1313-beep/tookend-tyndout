// Offline shell for the hosted PWA. The Android app loads the same assets from
// file:///android_asset, where service workers are not used.
// Bump CACHE whenever index.html, style.css or adventure.js change.
const CACHE = 'tookend-tyndout-v3';
const SHELL = ['./', './index.html', './style.css', './adventure.js', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
