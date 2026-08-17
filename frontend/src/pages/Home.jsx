import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, ChevronDown, Headphones, Mail, Search, Wifi, BatteryFull, Signal, ShieldCheck, Globe2, Zap, Lock, Download, Menu, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';

const ADVANTAGES = [
  { icon: ShieldCheck, title: 'Security First', description: 'Built with layered risk controls and account verification, so your funds and your data stay protected.' },
  { icon: Globe2, title: 'Built for Global Traders', description: 'Real-time market data and a trading experience designed to work well for users anywhere, in multiple languages.' },
  { icon: Zap, title: 'Fast Execution', description: "Live pricing straight from the market, so what you see is what you're trading at." },
  { icon: Lock, title: 'Your Account, Your Control', description: 'Passwords are hashed, sign-ins are verified by email, and you can review or close your account at any time.' },
];

const TICKER_SYMBOLS = ALL_COINS.map((c) => c.symbol.toLowerCase());

const NAV_MENUS = {
  Spot: ['Spot Trading', 'Convert'],
  Futures: ['USDT-M Futures', 'Coin-M Futures'],
  'AI Trading': ['AI Signals', 'Auto-Invest'],
};

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ar', label: 'العربية', flag: '🇪🇬' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

const Sparkline = ({ points, color }) => (
  <svg viewBox="0 0 100 34" width="100%" height="34" preserveAspectRatio="none">
    <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();
  const [prices, setPrices] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('kynex_language') || 'en');
  const [heroEmail, setHeroEmail] = useState('');
  const selectedLang = LANGUAGES.find((l) => l.code === language);

  const chooseLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('kynex_language', code);
    setLangOpen(false);
  };

  const promptLogin = () => navigate('/auth', { state: { mode: 'login' } });

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const data = msg?.data;
      if (!data) return;
      setPrices((prev) => ({ ...prev, [data.s]: { price: parseFloat(data.c), change: parseFloat(data.P) } }));
    };
    return () => ws.close();
  }, []);

  const formatPrice = (value) => {
    if (value === undefined) return '...';
    return value < 1 ? value.toFixed(6) : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const tickerRow = TICKER_SYMBOLS.map((s) => s.toUpperCase());
  const loopedTicker = [...tickerRow, ...tickerRow];

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <style>{`
        .kx-navlink { color: ${theme.subtext}; background: none; border: none; cursor: pointer; font-size: 15px; display: flex; align-items: center; gap: 4px; padding: 8px 4px; text-decoration: none; }
        .kx-navlink:hover { color: ${theme.text}; }
        .kx-dropdown { position: relative; }
        .kx-dropdown-menu { position: absolute; top: 38px; left: 0; background-color: ${theme.card}; border: 1px solid ${theme.cardBorder}; border-radius: 8px; min-width: 180px; overflow: hidden; z-index: 50; box-shadow: ${theme.shadow}; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .kx-dropdown-menu a, .kx-dropdown-menu span { display: block; padding: 12px 16px; font-size: 14px; color: ${theme.subtext}; text-decoration: none; cursor: pointer; }
        .kx-dropdown-menu a:hover, .kx-dropdown-menu span:hover { background-color: ${theme.bg}; color: ${theme.text}; }
        .kx-icon-btn { background: none; border: none; color: ${theme.subtext}; cursor: pointer; display: flex; align-items: center; }
        .kx-icon-btn:hover { color: ${theme.brand}; }
        .kx-cta { background: ${theme.brandGradient || theme.brand}; color: #1A1305; border: none; border-radius: 24px; padding: 14px 34px; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 6px 18px rgba(217,119,6,0.3); }
        .kx-cta:hover { opacity: 0.9; }
        .kx-ghost-btn { background: none; border: 1px solid ${theme.cardBorder}; color: ${theme.text}; border-radius: 20px; padding: 8px 18px; font-size: 14px; cursor: pointer; }
        .kx-ghost-btn:hover { border-color: ${theme.brand}; color: ${theme.brand}; }
        .kx-solid-btn { background: ${theme.brandGradient || theme.brand}; border: none; color: #1A1305; border-radius: 20px; padding: 8px 18px; font-size: 14px; font-weight: bold; cursor: pointer; }
        .kx-download-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid ${theme.cardBorder}; color: ${theme.text}; border-radius: 20px; padding: 8px 16px; font-size: 14px; cursor: pointer; text-decoration: none; }
        .kx-download-btn:hover { border-color: ${theme.brand}; color: ${theme.brand}; }
        .kx-ticker-track { display: flex; gap: 40px; white-space: nowrap; animation: kx-scroll 30s linear infinite; }
        @keyframes kx-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .kx-float-card { position: absolute; width: 180px; background-color: ${theme.card}; border: 1px solid ${theme.cardBorder}; border-radius: 12px; padding: 14px; box-shadow: ${theme.shadowElevated || theme.shadow}; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .kx-hamburger { display: none; background: none; border: none; color: ${theme.text}; cursor: pointer; }
        @media (max-width: 900px) {
          .kx-nav-links, .kx-float-card, .kx-nav-right-desktop { display: none !important; }
          .kx-hamburger { display: flex !important; }
        }
        .kx-mobile-overlay { position: fixed; inset: 0; z-index: 999; background-color: rgba(0,0,0,0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        .kx-mobile-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 280px; z-index: 1000; background-color: ${theme.card}; border-left: 1px solid ${theme.cardBorder}; padding: 20px; overflow-y: auto; backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; -webkit-backdrop-filter: ${theme.cardGlass || 'blur(16px)'}; }
        .kx-mobile-drawer a, .kx-mobile-drawer button.kx-mob-link { display: block; width: 100%; text-align: left; padding: 14px 0; font-size: 15px; color: ${theme.text}; text-decoration: none; background: none; border: none; border-bottom: 1px solid ${theme.cardBorder}; cursor: pointer; }
      `}</style>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: `1px solid ${theme.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ color: theme.brand, fontWeight: 'bold', fontSize: '22px' }}>KYNEX</span>
          </Link>

          <div className="kx-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <Link to="/markets" className="kx-navlink">Market</Link>
            {Object.entries(NAV_MENUS).map(([label, items]) => (
              <div key={label} className="kx-dropdown" onMouseEnter={() => setOpenMenu(label)} onMouseLeave={() => setOpenMenu(null)}>
                <button className="kx-navlink">{label} <ChevronDown size={14} /></button>
                {openMenu === label && (
                  <div className="kx-dropdown-menu">
                    {items.map((item) => (<span key={item} onClick={promptLogin}>{item}</span>))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="kx-nav-right-desktop" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <button className="kx-ghost-btn" onClick={() => navigate('/auth', { state: { mode: 'login' } })}>Log In</button>
          <button className="kx-solid-btn" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>Sign Up</button>
          <Link to="/download" className="kx-download-btn"><Download size={15} /> Download</Link>
          <button className="kx-icon-btn" onClick={toggleMode} title="Toggle theme">{mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="kx-icon-btn" onClick={() => navigate('/messages')} title="Messages"><Bell size={18} /></button>
          <button className="kx-icon-btn" onClick={() => navigate('/profile')} title="Profile"><User size={18} /></button>
          <div className="kx-dropdown" onMouseLeave={() => setLangOpen(false)}>
            <button className="kx-navlink" onClick={() => setLangOpen(!langOpen)}>
              {selectedLang.flag} {selectedLang.label} <ChevronDown size={14} />
            </button>
            {langOpen && (
              <div className="kx-dropdown-menu" style={{ right: 0, left: 'auto' }}>
                {LANGUAGES.map((lang) => (<span key={lang.code} onClick={() => chooseLanguage(lang.code)}>{lang.flag} {lang.label}</span>))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="kx-hamburger" onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div className="kx-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="kx-mobile-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: theme.brand, fontWeight: 'bold', fontSize: '20px' }}>KYNEX</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', display: 'flex' }}><X size={22} /></button>
            </div>
            <Link to="/markets" onClick={() => setMobileMenuOpen(false)} className="kx-mob-link">Markets</Link>
            <button className="kx-mob-link" onClick={() => { setMobileMenuOpen(false); promptLogin(); }}>Spot Trading</button>
            <button className="kx-mob-link" onClick={() => { setMobileMenuOpen(false); promptLogin(); }}>Futures</button>
            <button className="kx-mob-link" onClick={() => { setMobileMenuOpen(false); promptLogin(); }}>AI Signals</button>
            <Link to="/download" onClick={() => setMobileMenuOpen(false)} className="kx-mob-link">Download</Link>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', marginBottom: '16px' }}>
              <button className="kx-ghost-btn" style={{ flex: 1 }} onClick={() => { setMobileMenuOpen(false); navigate('/auth', { state: { mode: 'login' } }); }}>Log In</button>
              <button className="kx-solid-btn" style={{ flex: 1 }} onClick={() => { setMobileMenuOpen(false); navigate('/auth', { state: { mode: 'signup' } }); }}>Sign Up</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${theme.cardBorder}` }}>
              <button className="kx-icon-btn" onClick={toggleMode}>{mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
              <div className="kx-dropdown">
                <button className="kx-navlink" onClick={() => setLangOpen(!langOpen)}>
                  {selectedLang.flag} {selectedLang.label} <ChevronDown size={14} />
                </button>
                {langOpen && (
                  <div className="kx-dropdown-menu" style={{ right: 0, left: 'auto', bottom: '36px', top: 'auto' }}>
                    {LANGUAGES.map((lang) => (<span key={lang.code} onClick={() => chooseLanguage(lang.code)}>{lang.flag} {lang.label}</span>))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '90px 20px 60px' }}>
        <h1 style={{ fontSize: '56px', fontWeight: 'bold', margin: '0 0 10px 0' }}>KYNEX</h1>
        <h2 style={{ fontSize: '38px', fontWeight: 'bold', margin: '0 0 20px 0' }}>Digital transaction currency</h2>
        <p style={{ color: theme.brand, fontSize: '18px', marginBottom: '32px' }}>
          A fast, straightforward way to trade digital assets
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="kx-cta" onClick={() => navigate('/auth', { state: { mode: 'signup' } })}>Start Trading</button>
          <Link to="/download" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${theme.cardBorder}`, color: theme.text, borderRadius: '24px', padding: '14px 30px', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none' }}>
            <Download size={18} /> Download App
          </Link>
        </div>

        {/* App preview mockup */}
        <div style={{ position: 'relative', maxWidth: '900px', margin: '80px auto 0' }}>
          <div className="kx-float-card" style={{ left: '0', bottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#627EEA' }} />
              <span style={{ fontSize: '13px' }}>ETH / USD</span>
            </div>
            <Sparkline points="0,25 12,15 24,20 36,8 48,18 60,5 72,22 84,10 100,16" color="#627EEA" />
          </div>

          <div className="kx-float-card" style={{ right: '0', top: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#F7931A' }} />
              <span style={{ fontSize: '13px' }}>BTC / USD</span>
            </div>
            <Sparkline points="0,10 12,20 24,14 36,26 48,12 60,24 72,6 84,18 100,9" color="#F7931A" />
          </div>

          <div style={{
            maxWidth: '340px', margin: '0 auto', borderRadius: '28px', padding: '24px', textAlign: 'left',
            backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
            boxShadow: theme.shadowElevated || theme.shadow,
            backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.faint, fontSize: '12px', marginBottom: '16px' }}>
              <span>9:41</span>
              <div style={{ display: 'flex', gap: '6px' }}><Signal size={14} /> <Wifi size={14} /> <BatteryFull size={14} /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ color: theme.brand, fontWeight: 'bold' }}>KYNEX</span>
              <div style={{ flex: 1, margin: '0 10px', backgroundColor: theme.inputBg || theme.bg, borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.faint, fontSize: '12px' }}>
                <Search size={12} /> Search
              </div>
              <Headphones size={16} color={theme.subtext} style={{ marginRight: '8px' }} />
              <Mail size={16} color={theme.subtext} />
            </div>
            <h3 style={{ fontSize: '22px', margin: '0 0 6px 0', color: theme.text }}>Welcome to join <span style={{ color: theme.brand }}>KYNEX</span></h3>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 18px 0' }}>
              Trade with confidence — track live markets and manage your assets in one place.
            </p>
            <input
              type="text"
              placeholder="Email / Phone number"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate('/auth', { state: { mode: 'signup', prefillEmail: heroEmail } });
              }}
              style={{
                width: '100%', boxSizing: 'border-box',
                backgroundColor: theme.inputBg || theme.bg,
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: '10px', padding: '12px',
                color: theme.text, fontSize: '13px',
                marginBottom: '14px', outline: 'none',
              }}
            />
            <button
              className="kx-cta"
              style={{ width: '100%' }}
              onClick={() => navigate('/auth', { state: { mode: 'signup', prefillEmail: heroEmail } })}
            >
              Sign Up Now →
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '40px 20px 90px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', border: `1px solid ${theme.brand}`, color: theme.brand, borderRadius: '20px', padding: '6px 18px', fontSize: '13px', marginBottom: '20px' }}>
          Trusted Key Advantages
        </span>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 50px 0' }}>Why Choose KYNEX</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          {ADVANTAGES.map(({ icon: Icon, title, description }) => (
            <div key={title} style={{
              backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px',
              padding: '30px 24px', textAlign: 'left', boxShadow: theme.shadow,
              backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', backgroundColor: theme.brandSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px',
              }}>
                <Icon size={24} color={theme.brand} />
              </div>
              <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>{title}</h3>
              <p style={{ color: theme.subtext, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live ticker */}
      <div style={{ borderTop: `1px solid ${theme.cardBorder}`, overflow: 'hidden', padding: '14px 0', backgroundColor: theme.card }}>
        <div className="kx-ticker-track">
          {loopedTicker.map((symbol, idx) => {
            const data = prices[symbol];
            const isUp = data ? data.change >= 0 : true;
            return (
              <span key={`${symbol}-${idx}`} style={{ fontSize: '14px' }}>
                <b>{symbol.replace('USDT', '/USDT')}</b>{' '}
                <span style={{ color: isUp ? theme.up : theme.down }}>
                  {data ? formatPrice(data.price) : '...'} ({data ? `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%` : '...'})
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
