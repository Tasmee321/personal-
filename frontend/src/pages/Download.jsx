import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, TrendingUp, Shield, Globe, Smartphone, RefreshCw, Wifi, HardDrive, Download as DownloadIcon, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CoinIcon } from '../components/CoinIcons';
import { useTheme } from '../ThemeContext';
import { isAuthenticated } from '../utils/auth';

const FloatingCoin = ({ symbol, size, top, left, right, bottom, delay, duration }) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex: 1,
    animation: `coinFloat ${duration || '6s'} ease-in-out ${delay || '0s'} infinite`,
    opacity: 0.55, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
  }}>
    <CoinIcon symbol={symbol} size={size} />
  </div>
);

const Download = () => {
  const { theme, mode, iconBadges } = useTheme();
  const navigate = useNavigate();
  const appleBg = mode === 'dark' ? 'linear-gradient(135deg, #F8FAFC, #CBD5E1)' : 'linear-gradient(135deg, #555, #222)';
  const appleFg = mode === 'dark' ? '#0F172A' : 'white';
  const appleShadow = mode === 'dark' ? '0 4px 16px rgba(255,255,255,0.12)' : '0 4px 16px rgba(0,0,0,0.3)';
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [apkInfo, setApkInfo] = useState({
    version_name: '2.0.0',
    download_url: 'https://www.kynex.site/KYNEX.apk',
  });

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data.download_url) setApkInfo(data);
      })
      .catch(() => {});
  }, []);

  const features = [
    { icon: <Zap size={28} />, badge: iconBadges.amber, title: 'Lightning-fast transactions', desc: 'The KYNEX matching engine enables up to 100,000 transactions per second' },
    { icon: <TrendingUp size={28} />, badge: iconBadges.purple, title: 'Turn costs into investments', desc: 'Access the most popular crypto perpetual future contracts, as well as spot crypto' },
    { icon: <Shield size={28} />, badge: iconBadges.green, title: 'Security you can trust', desc: 'Your assets are protected with industry-leading encryption and multi-layer security' },
    { icon: <Globe size={28} />, badge: iconBadges.blue, title: 'Trade anytime, anywhere', desc: 'Our platform is available 24/7 across all devices with real-time market data' },
  ];

  const appBenefits = [
    { icon: <RefreshCw size={18} />, title: 'Always Up-to-Date', desc: 'App updates automatically with the platform — no manual updates needed' },
    { icon: <Wifi size={18} />, title: 'Live Web Technology', desc: 'Built as a smart web app that loads the latest version every time you open it' },
    { icon: <HardDrive size={18} />, title: 'Lightweight (~3 MB)', desc: 'Small because the app is a smart launcher — all features load from our secure servers' },
    { icon: <Smartphone size={18} />, title: 'Native App Feel', desc: 'Fullscreen experience with no browser bar — looks and feels like a native app' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <style>{`
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(5deg); }
          75% { transform: translateY(8px) rotate(-3deg); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @media (max-width: 520px) {
          .dl-feature-grid { grid-template-columns: 1fr !important; }
          .dl-platform-grid { grid-template-columns: 1fr !important; }
          .dl-benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        position: 'relative', zIndex: 10,
      }}>
        <Link to={isAuthenticated() ? '/dashboard' : '/'} style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.3px', color: theme.brand }}>KYNEX</span>
      </div>

      {/* Hero Section */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '60px 20px 50px', textAlign: 'center',
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.card} 50%, ${theme.bg} 100%)`,
        minHeight: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(${theme.cardBorder} 1px, transparent 1px), linear-gradient(90deg, ${theme.cardBorder} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          animation: 'gridPulse 8s ease-in-out infinite',
        }} />

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.1 }} preserveAspectRatio="none" viewBox="0 0 400 500">
          <line x1="100" y1="0" x2="300" y2="500" stroke={theme.text} strokeWidth="0.5" />
          <line x1="300" y1="0" x2="100" y2="500" stroke={theme.text} strokeWidth="0.5" />
          <line x1="0" y1="150" x2="400" y2="150" stroke={theme.text} strokeWidth="0.5" />
          <line x1="0" y1="350" x2="400" y2="350" stroke={theme.text} strokeWidth="0.5" />
          <rect x="120" y="80" width="160" height="160" stroke={theme.text} strokeWidth="0.5" fill="none" transform="rotate(45, 200, 160)" />
        </svg>

        {[
          { top: '15%', left: '30%', delay: '0s' },
          { top: '25%', right: '25%', delay: '1.5s' },
          { top: '60%', left: '20%', delay: '3s' },
          { top: '70%', right: '15%', delay: '0.8s' },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', top: s.top, left: s.left, right: s.right,
            width: 4, height: 4, backgroundColor: theme.faint,
            transform: 'rotate(45deg)', zIndex: 1,
            animation: `sparkle 3s ease-in-out ${s.delay} infinite`,
          }} />
        ))}

        <FloatingCoin symbol="BTC" size={48} top="18%" left="8%" delay="0s" duration="7s" />
        <FloatingCoin symbol="ETH" size={40} top="30%" right="10%" delay="1s" duration="5.5s" />
        <FloatingCoin symbol="USDT" size={36} bottom="25%" right="8%" delay="2s" duration="6.5s" />
        <FloatingCoin symbol="SOL" size={32} bottom="30%" left="12%" delay="0.5s" duration="8s" />
        <FloatingCoin symbol="BNB" size={28} top="12%" right="22%" delay="1.5s" duration="5s" />
        <FloatingCoin symbol="LTC" size={30} bottom="15%" left="28%" delay="3s" duration="7.5s" />

        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: theme.primaryGradient || theme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 22, color: 'white', letterSpacing: 1,
          marginBottom: 24, position: 'relative', zIndex: 2,
          boxShadow: `0 8px 32px rgba(59,130,246,0.4)`,
        }}>
          K
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px', position: 'relative', zIndex: 2 }}>
          Get KYNEX App
        </h1>
        <p style={{ color: theme.subtext, fontSize: '14px', margin: '0 0 36px', position: 'relative', zIndex: 2, maxWidth: 360 }}>
          Trade crypto on the go with our fast, secure & always up-to-date application
        </p>
      </div>

      {/* Platform Download Cards */}
      <div style={{ padding: '0 20px 40px', maxWidth: '600px', margin: '-30px auto 0' }}>
        <div className="dl-platform-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 3 }}>

          {/* Android Card */}
          <div style={{
            padding: '24px 20px', borderRadius: '16px',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated || theme.shadow,
            backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #3DDC84, #2DA65A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, boxShadow: '0 4px 16px rgba(61,220,132,0.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M17.523 2.237a.625.625 0 0 0-.803.368L15.482 6H8.518L7.28 2.605a.625.625 0 1 0-1.17.435L7.24 6H4.625a.625.625 0 0 0 0 1.25h.838L7.1 17.563A2.625 2.625 0 0 0 9.69 19.75h4.62a2.625 2.625 0 0 0 2.59-2.188L18.537 7.25h.838a.625.625 0 0 0 0-1.25H16.76l1.13-2.96a.625.625 0 0 0-.368-.803z"/></svg>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Android</h3>
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: theme.faint }}>APK Download</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '11px', color: theme.up, fontWeight: 600,
              backgroundColor: theme.upSoft, padding: '3px 10px', borderRadius: 20,
              marginBottom: 14,
            }}>
              <CheckCircle size={12} /> v{apkInfo.version_name}
            </div>
            <button
              onClick={() => {
                window.location.href = apkInfo.download_url;
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px', border: 'none', width: '100%',
                background: 'linear-gradient(135deg, #3DDC84, #2DA65A)',
                color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(61,220,132,0.3)',
              }}
            >
              <DownloadIcon size={16} /> Download
            </button>
          </div>

          {/* iOS Card */}
          <div style={{
            padding: '24px 20px', borderRadius: '16px',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated || theme.shadow,
            backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: appleBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, boxShadow: appleShadow,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={appleFg}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>iPhone</h3>
            <p style={{ margin: '0 0 6px', fontSize: '11px', color: theme.faint }}>Add to Home Screen</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '11px', color: theme.primary, fontWeight: 600,
              backgroundColor: theme.primarySoft, padding: '3px 10px', borderRadius: 20,
              marginBottom: 14,
            }}>
              <Smartphone size={12} /> No download needed
            </div>
            <button
              onClick={() => setShowIosGuide(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px', border: 'none', width: '100%',
                background: appleBg,
                color: appleFg, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                boxShadow: appleShadow,
              }}
            >
              View Guide
            </button>
          </div>
        </div>

        {/* Why Small Size Info */}
        <div style={{
          marginTop: 20, padding: '18px 20px', borderRadius: '14px',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <RefreshCw size={16} style={{ color: theme.brand }} />
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Why is the app only 3 MB?</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '12px', color: theme.subtext, lineHeight: 1.7 }}>
            KYNEX is a <strong style={{ color: theme.text }}>smart web application</strong> — the app acts as a secure launcher that connects directly to our servers. All features, data, and updates load in real-time from the cloud.
          </p>
          <div className="dl-benefits-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {appBenefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  backgroundColor: theme.primarySoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: theme.primary,
                }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: '11px', color: theme.subtext, lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <div style={{
            width: 130, height: 130, backgroundColor: 'white', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: theme.shadowElevated || theme.shadow,
            marginBottom: 10,
          }}>
            <QRCodeSVG
              value={apkInfo.download_url}
              size={100}
              bgColor="white"
              fgColor="#111827"
              level="M"
              imageSettings={{
                src: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%233B82F6"/><text x="20" y="27" text-anchor="middle" fill="white" font-size="22" font-weight="900">K</text></svg>'),
                width: 24,
                height: 24,
                excavate: true,
              }}
            />
          </div>
          <p style={{ color: theme.faint, fontSize: '12px', margin: 0 }}>
            Scan to open KYNEX on your phone
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.cardBorder}, transparent)` }} />

      {/* Features Section */}
      <div style={{ padding: '50px 20px 60px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="dl-feature-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', gap: '12px',
              padding: '20px', borderRadius: '16px',
              backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
              boxShadow: theme.shadow,
              backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                backgroundColor: f.badge.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: f.badge.fg,
              }}>
                {f.icon}
              </div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>{f.title}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: theme.subtext, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/auth')}
          style={{
            display: 'block', width: '100%', marginTop: 40,
            padding: '16px', borderRadius: '12px', border: 'none',
            background: theme.primaryGradient || theme.primary,
            color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(59,130,246,0.35)',
          }}
        >
          Open Web App
        </button>
        <p style={{ textAlign: 'center', color: theme.faint, fontSize: '12px', marginTop: 12, marginBottom: 0 }}>
          No install needed — works on any device with a browser
        </p>
      </div>

      {/* iOS Guide Modal */}
      {showIosGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: theme.card, borderRadius: '20px', border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            maxWidth: '400px', width: '100%', padding: '28px 24px', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: theme.text }}>Install on iPhone</h3>
              <button onClick={() => setShowIosGuide(false)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '22px', padding: 0, lineHeight: 1 }}>×</button>
            </div>

            <p style={{ color: theme.subtext, fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
              KYNEX works as a full-screen app on iPhone — no App Store needed. Just follow these steps:
            </p>

            {[
              { step: 1, title: 'Open in Safari', desc: 'Open kynex.site in Safari browser (not Chrome or other browsers).', icon: <Globe size={16} /> },
              { step: 2, title: 'Tap the Share button', desc: 'Tap the Share icon (square with arrow pointing up) at the bottom of Safari.', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> },
              { step: 3, title: 'Add to Home Screen', desc: 'Scroll down in the share menu and tap "Add to Home Screen".', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
              { step: 4, title: 'Confirm & Add', desc: 'Keep the name "KYNEX" and tap "Add" in the top right corner.', icon: <CheckCircle size={16} /> },
              { step: 5, title: 'Done!', desc: 'KYNEX icon appears on your home screen. Open it for a full-screen app experience.', icon: <Smartphone size={16} /> },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: theme.primaryGradient || theme.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text, marginBottom: '2px' }}>
                    <span style={{ color: theme.faint, marginRight: 6, fontSize: '12px' }}>Step {s.step}</span>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.subtext, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}

            <button onClick={() => setShowIosGuide(false)} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: theme.primaryGradient || theme.primary,
              color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              marginTop: '8px', boxShadow: '0 6px 18px rgba(59,130,246,0.3)',
            }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Download;
