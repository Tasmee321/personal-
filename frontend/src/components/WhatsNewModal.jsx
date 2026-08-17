import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X, Star } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const VERSION_JSON_URL = 'https://kynex.site/version.json';
const SEEN_WHATS_NEW_KEY = 'kynex_seen_whats_new'; // stores version_code user has already seen

export default function WhatsNewModal() {
  const { theme } = useTheme();
  const [modal, setModal]   = useState(null); // { version_code, version_name, features, tagline }
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${VERSION_JSON_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const { version_code, version_name, features, tagline } = data;

        // Only show if this version has features to show
        if (!features || features.length === 0) return;

        // Only show if user hasn't seen this version's What's New yet
        const seen = parseInt(localStorage.getItem(SEEN_WHATS_NEW_KEY) || '0', 10);
        if (seen >= version_code) return;

        setModal({ version_code, version_name, features, tagline });
        setVisible(true);
      } catch { /* silent */ }
    };

    // Small delay so app renders first, then modal slides in
    const t = setTimeout(check, 800);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    if (!modal) return;
    localStorage.setItem(SEEN_WHATS_NEW_KEY, String(modal.version_code));
    setAnimOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible || !modal) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: animOut ? 'wn_fadeOut 0.3s ease forwards' : 'wn_fadeIn 0.25s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        animation: animOut ? 'wn_slideDown 0.3s ease forwards' : 'wn_slideUp 0.4s cubic-bezier(0.34,1.3,0.64,1)',
      }}>
        <div style={{
          margin: '0 10px 10px',
          borderRadius: 28,
          overflow: 'hidden',
          background: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: '0 -8px 60px rgba(0,0,0,0.3)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Header gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 60%, #06B6D4 100%)',
            padding: '22px 20px 20px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {/* Decorative circles */}
            <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 1,
              }}
            >
              <X size={15} color="white" />
            </button>

            {/* Icon + title */}
            <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star size={24} color="white" fill="white" />
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ color:'white', fontWeight:800, fontSize:18, letterSpacing:-0.4 }}>
                    What's New
                  </span>
                  <span style={{
                    background:'rgba(255,255,255,0.22)', borderRadius:20,
                    padding:'2px 9px', fontSize:11, color:'white', fontWeight:700,
                  }}>
                    v{modal.version_name}
                  </span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.78)', fontSize:13, fontWeight:500 }}>
                  {modal.tagline || 'Your app is now up to date'}
                </div>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flexGrow: 1,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 0.8,
              color: theme.subtext, textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              New in this update
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {modal.features.map((feat, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: theme.primarySoft || 'rgba(99,102,241,0.08)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  border: `1px solid ${theme.cardBorder}`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 15 }}>{feat.icon || '✦'}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: theme.text, marginBottom: 2 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: theme.subtext, lineHeight: 1.5 }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '12px 20px 16px', flexShrink: 0 }}>
            <button
              onClick={handleClose}
              style={{
                width: '100%', padding: '15px 12px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
            >
              <Sparkles size={17} />
              Let's Go!
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wn_fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes wn_fadeOut   { from { opacity:1 } to { opacity:0 } }
        @keyframes wn_slideUp   { from { transform:translateY(110%) } to { transform:translateY(0) } }
        @keyframes wn_slideDown { from { transform:translateY(0) } to { transform:translateY(110%) } }
      `}</style>
    </>
  );
}
