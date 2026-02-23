// SonicFlow Service Worker — PWA support
const CACHE_NAME = 'sonicflow-v2';
const PRECACHE = [
    './static/css/style.css',
    './static/js/player.js',
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap'
];

// Install: precache static assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API/HTML, cache-first for static assets
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Skip non-GET and YouTube API calls
    if (e.request.method !== 'GET') return;
    if (url.hostname.includes('googleapis.com')) return;
    if (url.hostname.includes('youtube.com')) return;

    // Cache-first for static assets (css, js, fonts, images)
    if (url.pathname.match(/\.(css|js|woff2?|png|jpg|svg|ico)$/)) {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return resp;
            }))
        );
        return;
    }

    // Network-first for everything else
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
