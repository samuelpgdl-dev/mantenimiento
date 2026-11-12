const CACHE_NAME = 'canauto-v5';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './favicon-96x96.png',
    './favicon.svg',
    './favicon.ico',
    './apple-touch-icon.png',
    './site.webmanifest'
];

// 1. Instalación: Descarga y guarda los recursos en la nueva caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activación: Elimina cachés antiguas (como 'canauto-v4') inmediatamente
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

// 3. Estrategia de red/caché (Network First sin caché HTTP para HTML fresco)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // No interceptar métodos de escritura ni llamadas a Supabase / mapas
    if (
        event.request.method !== 'GET' ||
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('openstreetmap.org')
    ) {
        return;
    }

    // Navegación / index.html: pide siempre versión fresca a GitHub y actualiza la copia offline
    if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html')) {
        event.respondWith(
            fetch(event.request.url, { cache: 'no-cache' })
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Resto de recursos estáticos (iconos, manifest, etc.)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
