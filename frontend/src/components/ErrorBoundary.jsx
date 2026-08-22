import React from 'react';
import { t } from '../i18n';

// Catches any unhandled render error so the user sees a recoverable screen instead of a
// blank white page (which, on a financial app, reads as "my money is gone").
// Kept theme-independent (inline colors that work on both light and dark) because the
// ThemeProvider itself may be what crashed. Language is read straight from localStorage and
// resolved with the pure t(lang,key) helper (no context) for the same crash-safety reason —
// the LanguageProvider may also be what crashed. English is always the fallback.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[KYNEX] Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isDark = (() => {
      try {
        const saved = localStorage.getItem('kynex_theme_mode');
        if (saved) return saved === 'dark';
        return false; // app defaults to light
      } catch { return false; }
    })();

    const lang = (() => {
      try { return localStorage.getItem('kynex_language') || 'en'; } catch { return 'en'; }
    })();
    const isRTL = lang === 'ar';

    const bg = isDark ? '#080C18' : '#F0F2F8';
    const card = isDark ? '#111827' : '#FFFFFF';
    const text = isDark ? '#F1F5F9' : '#0F172A';
    const sub = isDark ? '#94A3B8' : '#475569';
    const border = isDark ? '#1F2937' : '#E2E8F0';

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', color: text, fontSize: '20px' }}>{t(lang, 'error.title')}</h2>
          <p style={{ margin: '0 0 20px', color: sub, fontSize: '14px', lineHeight: 1.5 }}>
            {t(lang, 'error.desc')}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={this.handleReload} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              {t(lang, 'error.reload')}
            </button>
            <button onClick={this.handleHome} style={{ padding: '10px 18px', borderRadius: '10px', border: `1px solid ${border}`, background: 'transparent', color: text, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              {t(lang, 'error.home')}
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: '18px', textAlign: 'left', fontSize: '11px', color: '#EF4444', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '160px', overflow: 'auto' }}>
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
