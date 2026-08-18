const CACHE_NAME = 'kynex-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function trySetBadge(count) {
  // Try all known badge APIs across browsers/platforms
  const n = count || 1;
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    return navigator.setAppBadge(n).catch(() => {});
  }
  return Promise.resolve();
}

// ── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : '' }; }

  const title = data.title || 'KYNEX Support';
  const badgeCount = data.badgeCount || 1;
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'kynex-chat',
    renotify: true,
    data: { url: '/#kynex-chat-open' },
    vibrate: [200, 100, 200],
  };

  // Run showNotification and setAppBadge in parallel — don't chain them
  e.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      trySetBadge(badgeCount),
    ]).catch(() => {})
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'KYNEX_NOTIF_CLICK' });
          return client.focus();
        }
      }
      return clients.openWindow('/#kynex-chat-open');
    })
  );
});
