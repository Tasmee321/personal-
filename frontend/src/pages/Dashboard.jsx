import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeftRight, Headset, Globe, User, TrendingUp, TrendingDown, BarChart3, Eye, EyeOff } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import NotificationBell from '../components/NotificationBell';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';

// Advanced SVG icons for quick actions — realistic, distinct, not generic
// Clean stroke-only icons — consistent weight, no visual clutter
const DepositSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v13"/><path d="M8 12l4 4 4-4"/>
    <path d="M3 19h18"/>
  </svg>
);
const WithdrawSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21V8"/><path d="M8 12l4-4 4 4"/>
    <path d="M3 5h18"/>
  </svg>
);
const InviteSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M19 8v6M16 11h6"/>
  </svg>
);
const DownloadSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
  </svg>
);
const GuideSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const CertSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/><path d="M9 22l3-4 3 4"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <circle cx="12" cy="13" r="0.5" fill="currentColor"/>
  </svg>
);

const QUICK_ACTIONS = [
  { to: '/deposit',           label: 'Deposit',      SvgIcon: DepositSVG,  badgeKey: 'blue'   },
  { to: '/withdraw',          label: 'Withdrawal',   SvgIcon: WithdrawSVG, badgeKey: 'teal'   },
  { to: '/invite',            label: 'Invite',       SvgIcon: InviteSVG,   badgeKey: 'purple' },
  { to: '/download',          label: 'Download',     SvgIcon: DownloadSVG, badgeKey: 'amber'  },
  { to: '/legal/member-guide',label: 'Guide',        SvgIcon: GuideSVG,    badgeKey: 'green'  },
  { to: '/certificates',      label: 'Certificates', SvgIcon: CertSVG,     badgeKey: 'teal'   },
];

function fmtPrice(n) {
  const abs = Math.abs(n);
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtVolume(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

const Dashboard = () => {
  const { theme, iconBadges } = useTheme();
  const navigate = useNavigate();
  const [markets, setMarkets] = useState({});
  const [balance, setBalance] = useState(null);
  const [signalBalance, setSignalBalance] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [positions, setPositions] = useState([]);
  const [futures, setFutures] = useState([]);
  const [hideBalance, setHideBalance] = useState(() => localStorage.getItem('kynex_hide_balance') === '1');
  const [search, setSearch] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());

    ws.onmessage = (event) => {
      const { data } = JSON.parse(event.data);
      if (!data || !data.s) return;
      const symbol = data.s.replace('USDT', '');
      setMarkets((prev) => ({
        ...prev,
        [symbol]: {
          price: parseFloat(data.c),
          change: parseFloat(data.P),
          volume: parseFloat(data.q),
          high: parseFloat(data.h),
          low: parseFloat(data.l),
        },
      }));
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const res = await fetch(`${API_URL}/api/demo/account`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (res.ok) {
          setBalance(data.balance);
          setSignalBalance(data.signalBalance || 0);
          setHoldings(data.holdings || {});
          setPositions(data.positions || []);
          setFutures(data.futures || []);
          if (!data.rewardSummary?.totalDeposited && !localStorage.getItem('kynex_onboarded')) {
            setShowOnboarding(true);
          }
        }
      } catch { /* next poll */ }
    };
    const initial = setTimeout(loadBalance, 0);
    const poll = setInterval(loadBalance, 10000);
    return () => { clearTimeout(initial); clearInterval(poll); };
  }, []);

  const enriched = useMemo(() =>
    ALL_COINS.map((c) => ({ ...c, live: markets[c.short] })),
    [markets],
  );

  const spotValue = useMemo(() => Object.entries(holdings).reduce((sum, [pair, qty]) => {
    const coin = ALL_COINS.find((c) => c.symbol === pair);
    const price = coin ? markets[coin.short]?.price : undefined;
    return sum + (price ? qty * price : 0);
  }, 0), [holdings, markets]);

  const openSignals = useMemo(() => positions.filter((p) => !p.settled), [positions]);
  const openFutures = useMemo(() => futures.filter((p) => !p.closed), [futures]);
  const signalsLocked = openSignals.reduce((s, p) => s + p.stake, 0);
  const futuresLocked = openFutures.reduce((s, p) => s + p.margin, 0);
  const totalBalance = (balance || 0) + (signalBalance || 0) + spotValue + signalsLocked + futuresLocked;

  const hasData = enriched.some((c) => c.live);

  const stats = useMemo(() => {
    const withLive = enriched.filter((c) => c.live);
    const gainers = withLive.filter((c) => c.live.change > 0).length;
    const losers = withLive.filter((c) => c.live.change < 0).length;
    const totalVol = withLive.reduce((sum, c) => sum + (c.live.volume || 0), 0);
    return { gainers, losers, totalVol };
  }, [enriched]);

  const visibleCoins = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return enriched;
    return enriched.filter((c) => c.short.includes(q) || c.name.toUpperCase().includes(q));
  }, [search, enriched]);

  const skeletonBg = theme.cardBorder;
  const Shimmer = ({ w, h, r = 10, mb = 0 }) => (
    <div style={{ width: w, height: h, borderRadius: r, backgroundColor: skeletonBg, marginBottom: mb, animation: 'kynexShimmer 1.4s ease-in-out infinite', flexShrink: 0 }} />
  );

  if (balance === null) {
    return (
      <div style={{ padding: '20px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
        <style>{`@keyframes kynexShimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Shimmer w="80px" h="24px" r={8} />
          <div style={{ display: 'flex', gap: '12px' }}><Shimmer w="22px" h="22px" r={6} /><Shimmer w="22px" h="22px" r={6} /><Shimmer w="22px" h="22px" r={6} /></div>
        </div>
        <div style={{ borderRadius: '18px', backgroundColor: skeletonBg, height: '110px', marginBottom: '18px', animation: 'kynexShimmer 1.4s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ borderRadius: '14px', backgroundColor: skeletonBg, height: '70px', animation: 'kynexShimmer 1.4s ease-in-out infinite' }} />)}
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <Shimmer w="36px" h="36px" r={50} />
            <div style={{ flex: 1 }}>
              <Shimmer w="80px" h="13px" r={6} mb={6} />
              <Shimmer w="120px" h="11px" r={5} />
            </div>
            <Shimmer w="60px" h="13px" r={6} />
          </div>
        ))}
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: theme.brandGradient || 'linear-gradient(135deg, #FBBF24, #F59E0B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${theme.brand}45`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4l7 8-7 8h3l5.5-6.5L16 16h4L13 8l7-4h-4l-5 5.5L6 4H4z" fill="white" />
            </svg>
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '2px',
            background: theme.brandGradient || 'linear-gradient(135deg, #FBBF24, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>KYNEX</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/legal/contact" style={{ color: theme.subtext, display: 'flex' }} title="Contact"><Headset size={19} /></Link>
          <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }} title="Language"><Globe size={19} /></Link>
          <NotificationBell />
          <Link to="/profile" style={{ color: theme.subtext, display: 'flex' }} title="Profile"><User size={20} /></Link>
        </div>
      </div>

      {/* Balance card */}
      <div style={{
        background: theme.brandGradient || `linear-gradient(135deg, ${theme.primarySoft} 0%, ${theme.card} 60%, ${theme.brandSoft} 100%)`,
        padding: '22px 20px', borderRadius: '18px', marginBottom: '18px', border: `1px solid ${theme.cardBorder}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: theme.shadowElevated || theme.shadow,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: 0 }}>Total Balance</p>
            <button onClick={() => { const next = !hideBalance; setHideBalance(next); localStorage.setItem('kynex_hide_balance', next ? '1' : '0'); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: theme.subtext }}>
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <h2 style={{ margin: 0, fontSize: '26px', color: theme.text }}>
            {hideBalance ? '••••••' : (balance === null ? '...' : totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
            <span style={{ fontSize: '14px', color: theme.subtext, marginLeft: '6px' }}>{hideBalance ? '' : 'USDT'}</span>
          </h2>
          {!hideBalance && balance !== null && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: theme.subtext }}>Spot <span style={{ color: theme.text, fontWeight: '600' }}>{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
              {signalBalance > 0 && <span style={{ fontSize: '11px', color: theme.subtext }}>Signal <span style={{ color: theme.text, fontWeight: '600' }}>{signalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>}
              {spotValue > 0 && <span style={{ fontSize: '11px', color: theme.subtext }}>Holdings <span style={{ color: theme.text, fontWeight: '600' }}>{spotValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>}
              {(signalsLocked + futuresLocked) > 0 && <span style={{ fontSize: '11px', color: theme.subtext }}>In trades <span style={{ color: theme.text, fontWeight: '600' }}>{(signalsLocked + futuresLocked).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>}
            </div>
          )}
        </div>
        <Link
          to="/assets"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(255,255,255,0.18)',
            color: 'white', border: '1.5px solid rgba(255,255,255,0.35)',
            padding: '11px 18px', borderRadius: '24px',
            fontWeight: 'bold', fontSize: '13px', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <span style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 70%)',
            borderRadius: '24px', pointerEvents: 'none',
          }} />
          <ArrowLeftRight size={14} style={{ position: 'relative' }} />
          <span style={{ position: 'relative' }}>Transfer</span>
        </Link>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
        {QUICK_ACTIONS.map((action) => {
          const { SvgIcon } = action;
          const badge = iconBadges[action.badgeKey];
          const GRADIENTS = {
            blue:   'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            teal:   'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
            purple: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            amber:  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
            green:  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          };
          const GLOWS = {
            blue:   'rgba(59,130,246,0.45)',
            teal:   'rgba(20,184,166,0.45)',
            purple: 'rgba(139,92,246,0.45)',
            amber:  'rgba(245,158,11,0.45)',
            green:  'rgba(16,185,129,0.45)',
          };
          const grad = GRADIENTS[action.badgeKey] || GRADIENTS.blue;
          const glow = GLOWS[action.badgeKey] || GLOWS.blue;
          return (
            <Link key={action.label} to={action.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '14px 8px',
                borderRadius: '18px',
                background: grad,
                boxShadow: `0 6px 20px ${glow}, 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18)`,
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                minHeight: '76px',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${glow}, 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.22)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${glow}, 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.18)`; }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                }}>
                  <SvgIcon />
                </div>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.3)', letterSpacing: '0.2px' }}>{action.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Market Stats Bar */}
      {hasData && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            flex: 1, padding: '14px 12px', borderRadius: '14px', backgroundColor: theme.card,
            border: `1px solid ${theme.cardBorder}`, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: theme.upSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color={theme.up} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: theme.faint }}>Gainers</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.up }}>{stats.gainers}</div>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '14px 12px', borderRadius: '14px', backgroundColor: theme.card,
            border: `1px solid ${theme.cardBorder}`, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: theme.downSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={16} color={theme.down} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: theme.faint }}>Losers</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.down }}>{stats.losers}</div>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '14px 12px', borderRadius: '14px', backgroundColor: theme.card,
            border: `1px solid ${theme.cardBorder}`, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: theme.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={16} color={theme.primary} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: theme.faint }}>24h Vol</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${fmtVolume(stats.totalVol)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={16} color={theme.faint} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search coins"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, color: theme.text, fontSize: '14px', boxSizing: 'border-box', boxShadow: theme.shadow }}
        />
      </div>

      {/* All Markets */}
      <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '6px 16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadowElevated || theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 6px' }}>
          <h4 style={{ color: theme.subtext, margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>All Markets</h4>
          <Link to="/markets" style={{ fontSize: '12px', color: theme.primary, textDecoration: 'none', fontWeight: '600' }}>View all</Link>
        </div>

        {visibleCoins.length === 0 && <p style={{ color: theme.faint, fontSize: '13px', padding: '12px 0' }}>No coins match "{search}".</p>}

        {visibleCoins.map((coin, i) => (
          <div
            key={coin.symbol}
            onClick={() => navigate('/trade', { state: { pair: coin.pair } })}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CoinIcon symbol={coin.short} size={36} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{coin.short}</div>
                <div style={{ color: theme.faint, fontSize: '12px' }}>{coin.name}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              {coin.live ? (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: coin.live.change >= 0 ? theme.up : theme.down, transition: 'color 0.3s ease' }}>
                    ${fmtPrice(coin.live.price)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                    <span style={{ color: theme.faint, fontSize: '11px' }}>Vol {fmtVolume(coin.live.volume)}</span>
                    <span style={{
                      color: coin.live.change >= 0 ? theme.up : theme.down,
                      fontSize: '12px', backgroundColor: coin.live.change >= 0 ? theme.upSoft : theme.downSoft,
                      padding: '2px 7px', borderRadius: '6px', fontWeight: '600',
                    }}>
                      {coin.live.change >= 0 ? '+' : ''}{coin.live.change.toFixed(2)}%
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ color: theme.faint, fontSize: '13px' }}>Loading...</span>
              )}
            </div>
          </div>
        ))}
      </div>
<BottomNav />

      {showOnboarding && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: theme.card, borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: '480px', border: `1px solid ${theme.cardBorder}`, backdropFilter: theme.cardGlass, animation: 'kynexSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <style>{`@keyframes kynexSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>👋</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.text, marginBottom: '6px' }}>Welcome to KYNEX</div>
              <div style={{ fontSize: '13px', color: theme.subtext }}>Start trading in 3 simple steps</div>
            </div>
            {[
              { icon: '💰', title: 'Deposit Funds', desc: 'Add USDT via TRC20, ERC20 or BEP20', to: '/deposit' },
              { icon: '📊', title: 'Start Trading', desc: 'Trade signals, spot, or futures', to: '/signals' },
              { icon: '🏆', title: 'Invite & Earn', desc: 'Refer friends and earn referral rewards', to: '/invite' },
            ].map((step) => (
              <div key={step.icon} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '14px', backgroundColor: theme.primarySoft, marginBottom: '10px' }}>
                <div style={{ fontSize: '22px', flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{step.title}</div>
                  <div style={{ fontSize: '12px', color: theme.subtext, marginTop: '2px' }}>{step.desc}</div>
                </div>
              </div>
            ))}
            <button onClick={() => { localStorage.setItem('kynex_onboarded', '1'); setShowOnboarding(false); navigate('/deposit'); }} style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 18px rgba(99,102,241,0.4)' }}>
              Make First Deposit
            </button>
            <button onClick={() => { localStorage.setItem('kynex_onboarded', '1'); setShowOnboarding(false); }} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: 'none', background: 'none', color: theme.faint, fontWeight: '600', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
              Explore first
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
