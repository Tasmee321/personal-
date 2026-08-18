import { useEffect, useState } from 'react';
import { useTheme } from '../ThemeContext';

// Slim fixed banner: shows while the device is offline, and "Back online" for 2s on reconnect.
// On a trading app, stale prices/balances shown as if live are dangerous — this makes it obvious.
export default function OfflineBanner() {
  const { theme } = useTheme();
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    let t;
    const goOffline = () => { setOffline(true); setJustBack(false); };
    const goOnline = () => {
      setOffline(false);
      setJustBack(true);
      clearTimeout(t);
      t = setTimeout(() => setJustBack(false), 2000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); clearTimeout(t); };
  }, []);

  if (!offline && !justBack) return null;
  const bg = offline ? '#DC2626' : '#059669';
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99998,
      padding: 'calc(6px + env(safe-area-inset-top, 0px)) 12px 6px',
      textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#fff',
      backgroundColor: bg, boxShadow: theme.shadow,
      animation: 'kynexBannerIn 0.25s ease-out',
    }}>
      {offline ? '⚠ You are offline — prices and balances may be out of date' : '✓ Back online'}
      <style>{`@keyframes kynexBannerIn { from { transform: translateY(-100%) } to { transform: translateY(0) } }`}</style>
    </div>
  );
}
