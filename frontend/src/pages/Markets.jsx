import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search, Star, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { useTheme } from '../ThemeContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';

const COINS = ALL_COINS;
const FAV_KEY = 'kynex_favorites';

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}

const TABS = ['Favorites', 'All', 'Gainers', 'Losers'];

function fmtPrice(n) {
  const abs = Math.abs(n);
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 8;
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Mini sparkline SVG
function Sparkline({ prices, up, theme }) {
  if (!prices || prices.length < 2) {
    return <div style={{ width: 56, height: 32 }} />;
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 56, H = 32, pad = 2;
  const pts = prices.map((p, i) => {
    const x = pad + (i / (prices.length - 1)) * (W - pad * 2);
    const y = pad + ((max - p) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = up ? theme.up : theme.down;
  const fillId = `sf-${up ? 'u' : 'd'}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`${pad},${H} ${pts.join(' ')} ${W - pad},${H}`}
        fill={`url(#${fillId})`}
      />
      {/* Line */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="2.2"
        fill={color}
      />
    </svg>
  );
}

const Markets = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [tickers, setTickers] = useState({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [favorites, setFavorites] = useState(loadFavorites);
  const historyRef = useRef({});   // rolling price history per coin (last 30 points)
  const prevPriceRef = useRef({}); // previous price for direction detection

  const toggleFav = useCallback((symbol) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      const { data } = JSON.parse(event.data);
      if (!data || !data.s) return;
      const symbol = data.s;
      const newPrice = parseFloat(data.c);

      // Rolling price history (last 30 points)
      const prev = historyRef.current[symbol] || [];
      historyRef.current[symbol] = [...prev.slice(-29), newPrice];

      // Price direction
      const prevPrice = prevPriceRef.current[symbol];
      const direction = prevPrice != null
        ? (newPrice > prevPrice ? 'up' : newPrice < prevPrice ? 'down' : null)
        : null;
      prevPriceRef.current[symbol] = newPrice;

      setTickers((prev) => ({
        ...prev,
        [symbol]: {
          price: newPrice,
          change: parseFloat(data.P),
          volume: parseFloat(data.q),
          direction,
          flashKey: (prev[symbol]?.flashKey || 0) + 1,
        },
      }));
    };
    return () => ws.close();
  }, []);

  const rows = useMemo(() => {
    let list = COINS.map((coin) => ({ ...coin, live: tickers[coin.symbol], isFav: favorites.includes(coin.symbol) }));
    const q = search.trim().toUpperCase();
    if (q) list = list.filter((c) => c.short.includes(q) || c.name.toUpperCase().includes(q));
    if (tab === 'Favorites') list = list.filter((c) => c.isFav);
    if (tab === 'Gainers') list = list.filter((c) => c.live && c.live.change > 0);
    if (tab === 'Losers') list = list.filter((c) => c.live && c.live.change < 0);
    return list;
  }, [tickers, search, tab, favorites]);

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Markets</h3>
        <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }}><Settings size={20} /></Link>
      </div>

      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={16} color={theme.faint} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search markets"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, color: theme.text, fontSize: '14px', boxSizing: 'border-box', boxShadow: theme.shadow, outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
            border: `1px solid ${tab === t ? theme.primary : theme.cardBorder}`,
            backgroundColor: tab === t ? theme.primarySoft : theme.card,
            color: tab === t ? theme.primary : theme.subtext,
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'all 0.2s ease',
          }}>
            {t === 'Favorites' && <Star size={13} fill={tab === t ? theme.primary : 'none'} />}
            {t}
            {t === 'Favorites' && favorites.length > 0 && <span style={{ fontSize: '11px', opacity: 0.7 }}>({favorites.length})</span>}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: theme.faint, fontSize: '11px', padding: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ flex: 1 }}>Pair</span>
        <span style={{ width: '60px', textAlign: 'center' }}>7D Chart</span>
        <span style={{ minWidth: '90px', textAlign: 'right' }}>Price / Change</span>
      </div>

      <div style={{
        backgroundColor: theme.card, borderRadius: '16px', padding: '0 14px',
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.shadowElevated || theme.shadow,
        backdropFilter: theme.cardGlass || 'blur(16px)',
        WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
      }}>
        {rows.length === 0 && (
          <p style={{ color: theme.faint, fontSize: '13px', padding: '16px 0' }}>
            {tab === 'Favorites' ? 'No favorites yet — tap ★ on any coin.' : 'No markets match this filter.'}
          </p>
        )}

        {rows.map((coin, i) => {
          const isUp = coin.live ? coin.live.change >= 0 : true;
          const prices = historyRef.current[coin.symbol] || [];
          return (
            <div
              key={coin.symbol}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '11px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/trade', { state: { pair: coin.pair } })}
            >
              {/* Star */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(coin.symbol); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}
              >
                <Star size={15} color={coin.isFav ? '#F59E0B' : theme.faint} fill={coin.isFav ? '#F59E0B' : 'none'} />
              </button>

              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <CoinIcon symbol={coin.short} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>{coin.pair}</div>
                  <div style={{ color: theme.faint, fontSize: '10px' }}>
                    {coin.live ? `Vol ${(coin.live.volume / 1_000_000).toFixed(1)}M` : '—'}
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ flexShrink: 0 }}>
                <Sparkline prices={prices} up={isUp} theme={theme} />
              </div>

              {/* Price + change */}
              <div style={{ textAlign: 'right', minWidth: '88px', flexShrink: 0 }}>
                {/* key trick: remount on each flashKey → restarts flash animation */}
                <div
                  key={`${coin.symbol}-${coin.live?.flashKey || 0}`}
                  style={{
                    fontWeight: 'bold', fontSize: '13px',
                    animation: coin.live?.direction === 'up'
                      ? 'mktFlashUp 0.55s ease-out forwards'
                      : coin.live?.direction === 'down'
                      ? 'mktFlashDown 0.55s ease-out forwards'
                      : 'none',
                    color: theme.text,
                  }}
                >
                  {coin.live ? `$${fmtPrice(coin.live.price)}` : '—'}
                </div>
                {coin.live && (
                  <div style={{
                    fontSize: '11px', marginTop: '2px', padding: '1px 6px', borderRadius: '5px',
                    display: 'inline-block', fontWeight: '600',
                    color: isUp ? theme.up : theme.down,
                    backgroundColor: isUp ? theme.upSoft : theme.downSoft,
                    transition: 'color 0.3s, background-color 0.3s',
                  }}>
                    {coin.live.change >= 0 ? '+' : ''}{coin.live.change.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />

      <style>{`
        @keyframes mktFlashUp {
          0%   { color: ${theme.up}; }
          100% { color: ${theme.text}; }
        }
        @keyframes mktFlashDown {
          0%   { color: ${theme.down}; }
          100% { color: ${theme.text}; }
        }
      `}</style>
    </div>
  );
};

export default Markets;
