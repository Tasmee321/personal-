import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyLanguage } from './pages/Settings.jsx'

// Apply saved language (RTL/LTR + lang attribute) before first render.
const savedLang = localStorage.getItem('kynex_language') || 'en';
applyLanguage(savedLang);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
