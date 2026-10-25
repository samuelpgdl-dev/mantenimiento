const CACHE_NAME = 'canauto-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './favicon-96x96.png',
    './favicon.svg',
    './favicon.ico',
    './apple-touch-icon.png',
    './site.webmanifest'
];

// 1. Instalación: Descarga y guarda los recursos en la nueva caché 'canauto-v2'
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activación: Elimina cachés antiguas (como 'canauto-v1') inmediatamente
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Estrategia de red/caché (Network First para HTML fresco)
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
