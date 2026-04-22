const CACHE_NAME = 'taxometro-v1.0.0';
const urlsToCache = [
  '/taxometro/',
  '/taxometro/index.html',
  '/taxometro/manifest.json',
  '/taxometro/icons/icon-72x72.png',
  '/taxometro/icons/icon-96x96.png',
  '/taxometro/icons/icon-128x128.png',
  '/taxometro/icons/icon-144x144.png',
  '/taxometro/icons/icon-152x152.png',
  '/taxometro/icons/icon-192x192.png',
  '/taxometro/icons/icon-384x384.png',
  '/taxometro/icons/icon-512x512.png'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  // Ignorar requisições de API e analytics
  if (event.request.url.includes('api.anthropic.com') ||
      event.request.url.includes('google-analytics.com') ||
      event.request.url.includes('googletagmanager.com') ||
      event.request.url.includes('doubleclick.net') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Não cachear respostas que não são OK
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
          return response;
        }).catch(() => {
          // Fallback offline
          if (event.request.mode === 'navigate') {
            return caches.match('/taxometro/index.html');
          }
        });
      })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/taxometro/icons/icon-192x192.png',
    badge: '/taxometro/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver agora',
        icon: '/taxometro/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/taxometro/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Taxômetro', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/taxometro/')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/taxometro/')
    );
  }
});
