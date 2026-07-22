const CACHE_NAME = 'fateverse-v1';
const BASE = self.location.pathname.replace(/sw\.js$/, '');
const APP_SHELL = [
  BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}favicon.svg`,
  `${BASE}data/daily-guidance.json`, `${BASE}data/zodiac.json`, `${BASE}data/western-zodiac.json`,
  `${BASE}data/numerology.json`, `${BASE}data/name-dictionary.json`,
  `${BASE}data/fortune-sticks/sixty-jiazi.json`, `${BASE}data/fortune-sticks/guanyin-100.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('huggingface') || event.request.url.includes('mlc.ai')) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(`${BASE}index.html`))));
});
