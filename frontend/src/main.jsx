import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyLanguage } from './utils/language'
import { installAuthFetchGuard } from './utils/auth'

// Auto-logout + redirect to /auth when the API rejects our token (expired / invalid).
installAuthFetchGuard();

// Apply saved language (RTL/LTR + lang attribute) before first render.
const savedLang = localStorage.getItem('kynex_language') || 'en';
applyLanguage(savedLang);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
