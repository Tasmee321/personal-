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
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    tag:      'kynex-fcm',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: '/#kynex-chat-open' },
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(self.location.origin) && 'focus' in w) {
          w.postMessage({ type: 'KYNEX_NOTIF_CLICK' });
          return w.focus();
        }
      }
      return clients.openWindow('/#kynex-chat-open');
    })
  );
});
