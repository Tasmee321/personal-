import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { API_URL } from './config';
import { getToken as getAuthToken } from './utils/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBnMfAj2nDLEQuGzWIKkDB7XdtsfriEhAA",
  authDomain: "kynex-dc586.firebaseapp.com",
  projectId: "kynex-dc586",
  storageBucket: "kynex-dc586.firebasestorage.app",
  messagingSenderId: "1035708677203",
  appId: "1:1035708677203:web:de3dbb1aaf4c1aee1bdaa6",
};

const VAPID_KEY = "BCCepZ29B1Q5v-jg0R6tIErojF8CCYC03wduLPL5rFqUuZnwjSoi0pdThA7jZ22nj4C6WYCqPd_PFmryVRnvxjs";

let app;
let messaging;

function getFirebaseMessaging() {
  if (!app) app = initializeApp(firebaseConfig);
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

// Call this once after login — registers FCM token with the server
export async function registerFcmToken() {
  try {
    // Store API_URL so native onPageFinished injection can use it
    try { localStorage.setItem('kynex_api_url', API_URL); } catch (_) {}

    // APK: use native FCM token via KynexBridge (WebView has no service worker)
    if (window.KynexBridge) {
      let fcmToken = '';
      try { fcmToken = window.KynexBridge.getFcmToken(); } catch (_) {}
      if (!fcmToken) fcmToken = window.KYNEX_FCM_TOKEN || '';
      if (!fcmToken) return;

      const stored = localStorage.getItem('kynex_fcm_token');
      if (stored === fcmToken) return;

      const authToken = getAuthToken();
      if (!authToken) return;

      const res = await fetch(`${API_URL}/api/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: fcmToken }),
      });

      if (res.ok) localStorage.setItem('kynex_fcm_token', fcmToken);
      return;
    }

    // Browser / PWA: use web FCM SDK
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission !== 'granted') return;

    const swReg = await navigator.serviceWorker.ready;
    const msg   = getFirebaseMessaging();

    const fcmToken = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!fcmToken) return;

    // Avoid re-registering the same token
    const stored = localStorage.getItem('kynex_fcm_token');
    if (stored === fcmToken) return;

    const res = await fetch(`${API_URL}/api/fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });

    if (res.ok) localStorage.setItem('kynex_fcm_token', fcmToken);
  } catch (e) {
    // Silent — FCM is best-effort
    console.warn('FCM register failed:', e.message);
  }
}

// Optional: handle foreground messages (when app is open)
export function onForegroundMessage(callback) {
  try {
    if (window.KynexBridge) return () => {};
    const msg = getFirebaseMessaging();
    return onMessage(msg, callback);
  } catch {
    return () => {};
  }
}
