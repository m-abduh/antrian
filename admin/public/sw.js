const CACHE = 'antriin-admin-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/'])),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const { title, body, url } = event.data.json();

    event.waitUntil(
      self.registration.showNotification(title || 'Tunggu.id Admin', {
        body: body || '',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        vibrate: [200, 100, 200],
        data: { url: url || '/' },
      }),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification('Tunggu.id Admin', {
        body: event.data.text(),
        icon: '/icons/icon-192.svg',
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
