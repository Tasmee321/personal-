import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyLanguage } from './utils/language'

// Apply saved language (RTL/LTR + lang attribute) before first render.
const savedLang = localStorage.getItem('kynex_language') || 'en';
applyLanguage(savedLang);

// Register service worker for caching + push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
