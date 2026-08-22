import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { applyLanguage, detectDeviceLang } from './utils/language'
import { installAuthFetchGuard } from './utils/auth'

// Auto-logout + redirect to /auth when the API rejects our token (expired / invalid).
installAuthFetchGuard();

// Apply the language before first render so <html dir/lang> is correct with no flash.
// No saved choice → open in the phone's language (English if unsupported).
const savedLang = localStorage.getItem('kynex_language') || detectDeviceLang();
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
