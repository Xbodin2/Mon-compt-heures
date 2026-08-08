/* Stratégie : réseau en priorité, cache seulement en repli hors-ligne.
   Ainsi chaque nouveau déploiement est pris en compte immédiatement dès
   que le téléphone est en ligne, sans jamais servir une version périmée. */
const CACHE_NAME = 'compt-heures-v2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((resp) => {
      if(resp && resp.status === 200){
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(()=>{});
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});
