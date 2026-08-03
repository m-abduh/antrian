const CACHE = 'tunggu-admin-v2';
const STATIC_CACHE = 'tunggu-admin-static-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function isNavigationalRequest(request) {
  return request.mode === 'navigate' || (request.destination === 'document');
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

function isOkResponse(response) {
  return response && response.ok;
}

function isRedirectResponse(response) {
  return response && response.type === 'opaqueredirect' || (response && response.status >= 300 && response.status < 400);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isSameOrigin(url)) return;
  if (request.method !== 'GET') return;

  // Static assets: cache-first with network fallback
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!isOkResponse(response) || isRedirectResponse(response)) return response;
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      }),
    );
    return;
  }

  // Navigations (HTML): network-first, fall back to cache only when offline
  if (isNavigationalRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isOkResponse(response) && !isRedirectResponse(response)) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error())),
    );
    return;
  }

  // Everything else (API, auth endpoints): never cache, always network
  return;
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const { title, body, url } = event.data.json();

    event.waitUntil(
      self.registration.showNotification(title || 'Tunggu.id Admin', {
        body: body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: url || '/' },
      }),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification('Tunggu.id Admin', {
        body: event.data.text(),
        icon: '/icons/icon-192.png',
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    }),
  );
});
