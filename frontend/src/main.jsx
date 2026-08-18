import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyLanguage } from './utils/language'

// Apply saved language (RTL/LTR + lang attribute) before first render.
const savedLang = localStorage.getItem('kynex_language') || 'en';
applyLanguage(savedLang);

// Register both service workers:
// sw.js           → caching + Web Push (VAPID)
// firebase-messaging-sw.js → FCM background notifications (Android)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
