const CACHE_NAME = 'kynex-v3';
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

// ── Firebase background messages (Android / desktop Chrome) ─────────────────
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyBnMfAj2nDLEQuGzWIKkDB7XdtsfriEhAA",
    authDomain: "kynex-dc586.firebaseapp.com",
    projectId: "kynex-dc586",
    storageBucket: "kynex-dc586.firebasestorage.app",
    messagingSenderId: "1035708677203",
    appId: "1:1035708677203:web:de3dbb1aaf4c1aee1bdaa6",
  });
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'KYNEX';
    const body  = payload.notification?.body  || payload.data?.body  || '';
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'kynex-fcm',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/#kynex-chat-open' },
    });
    trySetBadge(1);
    notifyClients({ type: 'KYNEX_BADGE', count: 1 });
  });
} catch (e) { /* Firebase not available (iOS) — Web Push handles it */ }

// ── Helpers ───────────────────────────────────────────────────────────────────
function trySetBadge(count) {
  const n = count || 1;
  try {
    if ('setAppBadge' in navigator) return navigator.setAppBadge(n).catch(() => {});
    if ('setAppBadge' in self.navigator) return self.navigator.setAppBadge(n).catch(() => {});
  } catch (e) { /* not supported */ }
  return Promise.resolve();
}

function notifyClients(msg) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    wins.forEach((w) => w.postMessage(msg));
  }).catch(() => {});
}

// ── Web Push (iOS PWA + all browsers via VAPID) ─────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data ? e.data.text() : '' }; }

  // Skip if this looks like an FCM message (Firebase SDK handles those)
  if (data.from || data.collapse_key || data.fcmMessageId) return;

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

  e.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      trySetBadge(badgeCount),
      notifyClients({ type: 'KYNEX_BADGE', count: badgeCount }),
    ]).catch(() => {})
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  try {
    if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
  } catch (ex) { /* not supported */ }
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'KYNEX_NOTIF_CLICK' });
          return client.focus();
        }
      }
      return self.clients.openWindow('/#kynex-chat-open');
    })
  );
});
