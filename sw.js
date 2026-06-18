const CACHE = 'mundial2026-v5';
const ASSETS = ['./index.html','./mundial2026.html','./mundial2026_api.html','./manifest.json','./icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Solo manejamos GET
  if (req.method !== 'GET') return;

  // CRÍTICO: Si es de otro origen (corsproxy.io, allorigins.win, football-data.org),
  // dejamos que el navegador maneje la request directamente sin interceptar.
  // Esto evita romper el body de la respuesta al clonarla.
  if (url.origin !== self.location.origin) return;

  // Para assets del mismo origen, usamos cache-first
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // Clonamos ANTES de devolver, no después
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
