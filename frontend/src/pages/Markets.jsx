import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

const Markets = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [tickers, setTickers] = useState({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [favorites, setFavorites] = useState(loadFavorites);

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
      setTickers((prev) => ({
        ...prev,
        [data.s]: { price: parseFloat(data.c), change: parseFloat(data.P), volume: parseFloat(data.q) },
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
          style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, color: theme.text, fontSize: '14px', boxSizing: 'border-box', boxShadow: theme.shadow }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
              border: `1px solid ${tab === t ? theme.primary : theme.cardBorder}`,
              backgroundColor: tab === t ? theme.primarySoft : theme.card,
              color: tab === t ? theme.primary : theme.subtext,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            {t === 'Favorites' && <Star size={13} fill={tab === t ? theme.primary : 'none'} />}
            {t}
            {t === 'Favorites' && favorites.length > 0 && <span style={{ fontSize: '11px', opacity: 0.7 }}>({favorites.length})</span>}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '4px 16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadowElevated || theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.faint, fontSize: '11px', padding: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Pair</span>
          <span>Price / 24h Change</span>
        </div>

        {rows.length === 0 && (
          <p style={{ color: theme.faint, fontSize: '13px', padding: '12px 0' }}>
            {tab === 'Favorites' ? 'No favorites yet — tap the star on any coin to add it.' : 'No markets match this filter.'}
          </p>
        )}

        {rows.map((coin, i) => (
          <div key={coin.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
              onClick={() => navigate('/trade', { state: { pair: coin.pair } })}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(coin.symbol); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0 }}
              >
                <Star size={16} color={coin.isFav ? '#F59E0B' : theme.faint} fill={coin.isFav ? '#F59E0B' : 'none'} />
              </button>
              <CoinIcon symbol={coin.short} size={32} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{coin.pair}</div>
                <div style={{ color: theme.faint, fontSize: '11px' }}>
                  Vol {coin.live ? `${(coin.live.volume / 1_000_000).toFixed(1)}M` : '...'}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{coin.live ? `$${fmtPrice(coin.live.price)}` : 'Loading...'}</div>
              {coin.live && (
                <div
                  style={{
                    fontSize: '12px', marginTop: '2px', padding: '2px 7px', borderRadius: '6px', display: 'inline-block', fontWeight: '600',
                    color: coin.live.change >= 0 ? theme.up : theme.down,
                    backgroundColor: coin.live.change >= 0 ? theme.upSoft : theme.downSoft,
                  }}
                >
                  {coin.live.change >= 0 ? '+' : ''}{coin.live.change.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Markets;
