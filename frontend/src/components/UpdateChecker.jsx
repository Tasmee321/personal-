import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const DISMISSED_KEY = 'kynex_dismissed_version';

// Returns true when running inside an Android WebView (i.e. the KYNEX APK wrapper).
// Android Chrome has "Android" in UA but NOT the "wv" marker — that marker only
// appears in apps that embed a WebView. This lets us distinguish APK users from
// regular browser users even when the APK doesn't inject a version code.
function isAndroidWebView() {
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua) && /\bwv\b|WebView/i.test(ua);
}

// IMPORTANT:
// A web page cannot reliably know the APK version unless the native APK exposes it.
// The new APK can expose window.KYNEX_APP_VERSION_CODE (or window.KynexApp.versionCode).
// If no native version is available AND we are NOT in a WebView, we stay silent
// (browser users should never see APK update prompts).
// If no native version is available AND we ARE in a WebView, the user has an old APK
// that predates version-code injection — we treat it as version 0 so any server
// version triggers the update banner.
function getNativeVersionCode() {
  const candidates = [
    window.KYNEX_APP_VERSION_CODE,
    window.KynexApp?.versionCode,
    window.Android?.getVersionCode?.(),
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export default function UpdateChecker({ onPendingChange }) {
  const { theme } = useTheme();
  const [update, setUpdate] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    onPendingChange?.(visible);
  }, [visible, onPendingChange]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = await res.json();
        const serverCode = Number(data.version_code);
        if (!Number.isFinite(serverCode) || serverCode <= 0) return;

        const installedCode = getNativeVersionCode();

        // Never show an update to a known current/latest APK.
        if (installedCode !== null && serverCode <= installedCode) {
          if (!cancelled) {
            setVisible(false);
            setUpdate(null);
          }
          return;
        }

        // If native version is unavailable:
        // - Browser users: stay silent (they should never see an APK prompt).
        // - Old APK in WebView (no version injection yet): treat as version 0 so
        //   any server release triggers the update banner.
        if (installedCode === null) {
          if (!isAndroidWebView()) return;
          // Fall through — old APK user. serverCode > 0 is already guaranteed above.
        }

        const dismissed = Number(sessionStorage.getItem(DISMISSED_KEY) || 0);
        if (dismissed >= serverCode) return;

        if (!cancelled) {
          setUpdate({
            version_code: serverCode,
            version_name: data.version_name,
            download_url: data.download_url,
            message: data.message,
          });
          setVisible(true);
        }
      } catch {
        // Network failure: leave the app usable.
      }
    };

    check();
    const id = setInterval(check, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleDownload = () => {
    if (!update?.download_url) return;
    setVisible(false);
    window.location.href = update.download_url;
  };

  const handleLater = () => {
    if (update) sessionStorage.setItem(DISMISSED_KEY, String(update.version_code));
    setVisible(false);
  };

  if (!visible || !update) return null;

  return (
    <>
      <div onClick={handleLater} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:10000, paddingBottom:'env(safe-area-inset-bottom, 20px)' }}>
        <div style={{ margin:'0 12px 12px', borderRadius:24, overflow:'hidden', background:theme.card, backdropFilter:theme.cardGlass, WebkitBackdropFilter:theme.cardGlass, border:`1px solid ${theme.cardBorder}`, boxShadow:'0 -4px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ background:'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', padding:'20px 20px 18px', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}><RefreshCw size={22} color="white" /></div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}><span style={{ color:'white', fontWeight:800, fontSize:17 }}>Update Available</span><span style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'2px 8px', fontSize:11, color:'white', fontWeight:700 }}>NEW</span></div>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:500 }}>KYNEX v{update.version_name} is ready</div>
                </div>
              </div>
              <button onClick={handleLater} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15} color="white" /></button>
            </div>
          </div>
          <div style={{ padding:'18px 20px 20px' }}>
            <div style={{ background:theme.primarySoft, borderRadius:12, padding:'12px 14px', marginBottom:18, display:'flex', alignItems:'flex-start', gap:10 }}><Sparkles size={16} color={theme.primary} /><p style={{ margin:0, fontSize:13.5, color:theme.text, lineHeight:1.55 }}>{update.message}</p></div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleLater} style={{ flex:1, padding:'13px 12px', borderRadius:14, border:`1.5px solid ${theme.cardBorder}`, background:'transparent', color:theme.subtext, fontWeight:600, fontSize:14 }}>Later</button>
              <button onClick={handleDownload} style={{ flex:2.2, padding:'13px 12px', borderRadius:14, border:'none', background:'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', color:'white', fontWeight:700, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Download size={16} />Download v{update.version_name}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
