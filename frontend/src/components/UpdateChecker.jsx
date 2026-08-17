import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, RefreshCw, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';

// Web frontend release version. This is only the fallback for environments
// where the native APK bridge is not available.
const CURRENT_VERSION_CODE = 4;

const VERSION_JSON_URL = 'https://kynex.site/version.json';
const INSTALLED_KEY = 'kynex_installed_version';
const DISMISSED_KEY = 'kynex_dismissed_version';
const SEEN_WHATS_NEW_KEY = 'kynex_seen_whats_new';

// New APKs can expose the installed native version through the JS bridge.
// Old APKs may not expose it; in that case we deliberately return 0 so an
// old installation is offered the latest APK instead of being treated as v4.
async function getInstalledVersionCode() {
  try {
    const bridge = window.KynexBridge;

    if (bridge) {
      if (typeof bridge.getVersionCode === 'function') {
        const value = await Promise.resolve(bridge.getVersionCode());
        const code = parseInt(value, 10);
        if (Number.isFinite(code) && code > 0) return code;
      }

      if (typeof bridge.getLongVersionCode === 'function') {
        const value = await Promise.resolve(bridge.getLongVersionCode());
        const code = parseInt(value, 10);
        if (Number.isFinite(code) && code > 0) return code;
      }
    }
  } catch (_) {
    // Fall through to the web fallback.
  }

  // If this is an older APK/webview without the bridge, don't trust the
  // localStorage value as the installed APK version. localStorage survives
  // APK updates and the old code used to mark a download as "installed"
  // before the APK was actually installed.
  const isAndroid = /Android/i.test(navigator.userAgent || '');
  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;

  if (isAndroid || isStandalone) return 0;
  return CURRENT_VERSION_CODE;
}

export default function UpdateChecker({ onPendingChange }) {
  const { theme } = useTheme();
  const [update, setUpdate] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onPendingChange?.(visible);
  }, [visible, onPendingChange]);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${VERSION_JSON_URL}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = parseInt(data.version_code, 10);
      if (!Number.isFinite(serverVersion)) return;

      const installedVersion = await getInstalledVersionCode();

      // Only compare against the actual/native installed version when it is
      // available. This is what lets old APKs receive the update prompt.
      if (serverVersion <= installedVersion) {
        if (visible) {
          setVisible(false);
          setUpdate(null);
        }
        return;
      }

      // Never let the old "download clicked" localStorage value suppress an
      // update. It was not proof that installation succeeded.
      const dismissed = parseInt(
        sessionStorage.getItem(DISMISSED_KEY) || '0',
        10
      );
      if (dismissed >= serverVersion) return;

      setUpdate({
        version_code: serverVersion,
        version_name: data.version_name || String(serverVersion),
        download_url: data.download_url || 'https://kynex.site/KYNEX.apk',
        message: data.message || 'A new KYNEX update is available.',
      });
      setVisible(true);
    } catch (_) {
      // Network failure is intentionally silent.
    }
  }, [visible]);

  useEffect(() => {
    check();
    const id = setInterval(check, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [check]);

  const handleDownload = () => {
    // Keep this only as a record for other UI; it is NOT used to decide
    // whether an APK is installed.
    if (update?.version_code) {
      localStorage.setItem(INSTALLED_KEY, String(update.version_code));
      localStorage.removeItem(SEEN_WHATS_NEW_KEY);
    }
    setVisible(false);
    window.location.href = update.download_url;
  };

  const handleLater = () => {
    if (update?.version_code) {
      sessionStorage.setItem(DISMISSED_KEY, String(update.version_code));
    }
    setVisible(false);
  };

  if (!visible || !update) return null;

  return (
    <>
      <div onClick={handleLater} style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'uc_fadeIn 0.2s ease',
      }} />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        animation: 'uc_slideUp 0.35s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        <div style={{
          margin: '0 12px 12px',
          borderRadius: 24,
          overflow: 'hidden',
          background: theme.card,
          backdropFilter: theme.cardGlass,
          WebkitBackdropFilter: theme.cardGlass,
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: '0 -4px 40px rgba(0,0,0,0.25)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            padding: '20px 20px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RefreshCw size={22} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
                      Update Available
                    </span>
                    <span style={{
                      background: 'rgba(255,255,255,0.2)', borderRadius: 20,
                      padding: '2px 8px', fontSize: 11, color: 'white', fontWeight: 700,
                    }}>NEW</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>
                    KYNEX v{update.version_name} is ready
                  </div>
                </div>
              </div>
              <button onClick={handleLater} style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <X size={15} color="white" />
              </button>
            </div>
          </div>

          <div style={{ padding: '18px 20px 20px' }}>
            <div style={{
              background: theme.primarySoft, borderRadius: 12,
              padding: '12px 14px', marginBottom: 18,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Sparkles size={16} color={theme.primary} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13.5, color: theme.text, lineHeight: 1.55 }}>
                {update.message}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleLater} style={{
                flex: 1, padding: '13px 12px', borderRadius: 14,
                border: `1.5px solid ${theme.cardBorder}`,
                background: 'transparent', color: theme.subtext,
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                Later
              </button>
              <button onClick={handleDownload} style={{
                flex: 2.2, padding: '13px 12px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 18px rgba(59,130,246,0.4)',
              }}>
                <Download size={16} />
                Download v{update.version_name}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes uc_fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes uc_slideUp { from { transform: translateY(110%) } to { transform: translateY(0) } }
      `}</style>
    </>
  );
}
