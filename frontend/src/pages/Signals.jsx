import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, X, Settings } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';
const MARKET_DATA_DELAY_MS = 0;
const COINS = ALL_COINS;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function fmtClock(ms) {
  return new Date(ms).toLocaleTimeString('en-US');
}

function fmtUsd(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function glassCard(theme) {
  return {
    backgroundColor: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadowElevated || theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
  };
}

const CoinSelector = ({ theme, coins, livePrices, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return coins;
    return coins.filter((c) => c.short.includes(q) || c.name.toUpperCase().includes(q));
  }, [query, coins]);

  const live = livePrices[selected.symbol];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); setQuery(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
          borderRadius: '14px', border: `1px solid ${theme.cardBorder}`, cursor: 'pointer',
          backgroundColor: theme.card, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
          boxShadow: theme.shadow, width: '100%', boxSizing: 'border-box',
        }}
      >
        <CoinIcon symbol={selected.short} size={28} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: theme.text }}>{selected.pair}</span>
          {live && (
            <span style={{ marginLeft: '10px', fontWeight: 'bold', color: live.change >= 0 ? theme.up : theme.down }}>
              ${fmtUsd(live.price)} <span style={{ fontSize: '12px' }}>({live.change >= 0 ? '+' : ''}{live.change.toFixed(2)}%)</span>
            </span>
          )}
        </div>
        <ChevronDown size={18} color={theme.subtext} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '4px',
          ...glassCard(theme), padding: '8px', maxHeight: '320px', overflowY: 'auto',
        }}>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={14} color={theme.faint} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              autoFocus
              type="text"
              placeholder="Search coin..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 32px', borderRadius: '10px',
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '13px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <X size={14} color={theme.faint} />
              </button>
            )}
          </div>

          {filtered.length === 0 && <p style={{ color: theme.faint, fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>No results</p>}

          {filtered.map((coin) => {
            const cl = livePrices[coin.symbol];
            const isSelected = coin.symbol === selected.symbol;
            return (
              <button
                key={coin.symbol}
                onClick={() => { onSelect(coin); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: isSelected ? theme.primarySoft : 'transparent', boxSizing: 'border-box',
                }}
              >
                <CoinIcon symbol={coin.short} size={24} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.text }}>{coin.short}</span>
                  <span style={{ color: theme.faint, fontSize: '11px', marginLeft: '6px' }}>{coin.name}</span>
                </div>
                {cl && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text }}>${fmtUsd(cl.price)}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: cl.change >= 0 ? theme.up : theme.down }}>
                      {cl.change >= 0 ? '+' : ''}{cl.change.toFixed(2)}%
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Signals = () => {
  const { theme, mode: themeMode } = useTheme();
  const [signalBalance, setSignalBalance] = useState(null);
  const [positions, setPositions] = useState([]);

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [livePrices, setLivePrices] = useState({});

  const [pendingDirection, setPendingDirection] = useState(null);
  const [duration, setDuration] = useState(5);
  const [placing, setPlacing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState('current');
  const [actionError, setActionError] = useState('');
  const [bonusInfo, setBonusInfo] = useState({ bonusSignals: 0, bonusUsedToday: 0, referralWindowOpen: false, referralSignalTime: null, referralDirection: null, referralSymbol: null, referralEndTime: null });
  const [placingBonus, setPlacingBonus] = useState(false);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const priceBufferRef = useRef({});
  const pendingKlinesRef = useRef(null);
  const candleOverridesRef = useRef([]);

  const getEndpoint = (path) => {
    const base = '/api/demo';
    return `${API_URL}${base}${path}`;
  };

  const loadAccount = async () => {
    try {
      const res = await fetch(getEndpoint('/account'), { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSignalBalance(data.signalBalance);
        setPositions(data.positions || []);
      }
    } catch { /* next poll */ }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    const poll = setInterval(loadAccount, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const loadBonusStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/signal-status`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) setBonusInfo({ bonusSignals: data.bonusSignals || 0, bonusUsedToday: data.bonusUsedToday || 0, referralWindowOpen: !!data.referralWindowOpen, referralSignalTime: data.referralSignalTime, referralDirection: data.referralDirection, referralSymbol: data.referralSymbol, referralEndTime: data.referralEndTime });
      } catch { /* silent */ }
    };
    loadBonusStatus();
    const poll = setInterval(loadBonusStatus, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/candle-overrides/active`);
        const data = await res.json();
        if (data.ok) candleOverridesRef.current = data.overrides || [];
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const data = msg.data;
      const ts = data.E || Date.now();
      const buf = priceBufferRef.current[data.s] || (priceBufferRef.current[data.s] = []);
      buf.push({ ts, price: parseFloat(data.c), change: parseFloat(data.P) });
      const keepAfter = ts - (MARKET_DATA_DELAY_MS + 60_000);
      while (buf.length && buf[0].ts < keepAfter) buf.shift();
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const minutes = Math.ceil(MARKET_DATA_DELAY_MS / 60_000) + 5;
    COINS.forEach(async (coin) => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=1m&limit=${minutes}`);
        const raw = await res.json();
        if (cancelled || !Array.isArray(raw) || !raw.length) return;
        const buf = priceBufferRef.current[coin.symbol] || (priceBufferRef.current[coin.symbol] = []);
        const first = parseFloat(raw[0][4]) || parseFloat(raw[0][1]);
        raw.forEach((k) => {
          const close = parseFloat(k[4]);
          buf.push({ ts: k[0], price: close, change: first ? ((close - first) / first) * 100 : 0 });
        });
        buf.sort((a, b) => a.ts - b.ts);
      } catch { /* live buffer fills in */ }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cutoff = now - MARKET_DATA_DELAY_MS;
    setLivePrices((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const coin of COINS) {
        const buf = priceBufferRef.current[coin.symbol];
        if (!buf || !buf.length) continue;
        let latest = null;
        for (let i = buf.length - 1; i >= 0; i--) {
          if (buf[i].ts <= cutoff) { latest = buf[i]; break; }
        }
        if (latest && (!prev[coin.symbol] || prev[coin.symbol].price !== latest.price || prev[coin.symbol].change !== latest.change)) {
          next[coin.symbol] = { price: latest.price, change: latest.change };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [now]);

  useEffect(() => {
    if (!chartContainerRef.current) return undefined;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: theme.subtext },
      grid: { vertLines: { color: theme.cardBorder }, horzLines: { color: theme.cardBorder } },
      width: chartContainerRef.current.clientWidth,
      height: 260,
      timeScale: { timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.up, downColor: theme.down, borderVisible: false,
      wickUpColor: theme.up, wickDownColor: theme.down,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    let ws;
    const pending = [];
    pendingKlinesRef.current = pending;
    const load = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedCoin.symbol}&interval=1m&limit=120`);
        const raw = await res.json();
        if (cancelled || !seriesRef.current) return;
        const cutoffSec = Math.floor((Date.now() - MARKET_DATA_DELAY_MS) / 1000);
        const shiftSec = Math.floor(MARKET_DATA_DELAY_MS / 1000);
        const candles = raw.map((k) => ({
          time: Math.floor(k[0] / 1000) + shiftSec,
          open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
        }));
        seriesRef.current.setData(candles.filter((c) => (c.time - shiftSec) <= cutoffSec));
        candles.filter((c) => (c.time - shiftSec) > cutoffSec).forEach((c) => {
          pending.push({ eventTime: (c.time - shiftSec) * 1000, candle: c });
        });
        chartRef.current?.timeScale().fitContent();
      } catch { /* silent */ }
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedCoin.symbol.toLowerCase()}@kline_1m`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const k = data.k;
        const shiftSec = Math.floor(MARKET_DATA_DELAY_MS / 1000);
        pending.push({
          eventTime: data.E || Date.now(),
          candle: { time: Math.floor(k.t / 1000) + shiftSec, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c) },
        });
      };
    };
    const initial = setTimeout(load, 0);
    return () => { cancelled = true; clearTimeout(initial); if (ws) ws.close(); pendingKlinesRef.current = null; };
  }, [selectedCoin, themeMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pending = pendingKlinesRef.current;
      if (!pending || !seriesRef.current) return;
      const cutoff = Date.now() - MARKET_DATA_DELAY_MS;
      while (pending.length > 0 && pending[0].eventTime <= cutoff) {
        const update = pending.shift();
        const c = { ...update.candle };
        const override = candleOverridesRef.current.find(o => o.symbol === selectedCoin.symbol);
        if (override) {
          const nudge = c.open * (0.001 + Math.random() * 0.003);
          if (override.direction === 'up') {
            c.close = c.open + nudge;
            c.high = Math.max(c.high, c.close);
            c.low = Math.min(c.low, c.open);
          } else {
            c.close = c.open - nudge;
            c.low = Math.min(c.low, c.close);
            c.high = Math.max(c.high, c.open);
          }
        }
        seriesRef.current.update(c);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [selectedCoin]);

  const startPlacing = (direction) => {
    setActionError('');
    if (!signalBalance || signalBalance <= 0) {
      setActionError('Your balance is empty. Transfer funds first.');
      return;
    }
    setPendingDirection(direction);
  };

  const confirmPrediction = async () => {
    setActionError('');
    setPlacing(true);
    try {
      const res = await fetch(getEndpoint('/predict'), {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ pair: selectedCoin.pair, direction: pendingDirection, durationMinutes: duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place prediction.');
      setSignalBalance(data.signalBalance);
      setPositions(data.positions);
      setPendingDirection(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const [cancelConfirm, setCancelConfirm] = useState(null);

  const cancelTrade = async (id, stake) => {
    setCancelConfirm(null);
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setSignalBalance((prev) => prev + stake);
    try {
      const res = await fetch(getEndpoint('/cancel'), { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Cancel failed');
      loadAccount();
    } catch (err) {
      console.error(err);
      setActionError('Could not cancel trade. It may have already settled.');
      loadAccount();
    }
  };

  const currentPositions = useMemo(() => positions.filter((p) => !p.settled), [positions]);
  const historyPositions = useMemo(() => positions.filter((p) => p.settled), [positions]);
  const selectedLive = livePrices[selectedCoin.symbol];
  const stakeAmount = signalBalance ? Math.round(signalBalance * 0.01 * 100) / 100 : 0;

  const settlePreviewDate = new Date(now + duration * 60 * 1000);
  const timeValue = `${String(settlePreviewDate.getHours()).padStart(2, '0')}:${String(settlePreviewDate.getMinutes()).padStart(2, '0')}`;

  const handleTimeChange = (e) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, target.getSeconds(), target.getMilliseconds());
    let diffMins = Math.round((target.getTime() - now) / 60000);
    if (diffMins <= 0) diffMins += 24 * 60;
    setDuration(diffMins);
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0 }}>Signals</h3>
        <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }}><Settings size={20} /></Link>
      </div>

      {/* Coin picker */}
      <div style={{ marginBottom: '14px' }}>
        <CoinSelector theme={theme} coins={COINS} livePrices={livePrices} selected={selectedCoin} onSelect={setSelectedCoin} />
      </div>

      {/* Balance card */}
      <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: theme.subtext, fontSize: '13px' }}>
          Signal Balance
        </span>
        <span style={{ fontWeight: 'bold', color: theme.brand }}>
          {signalBalance === null ? '...' : `${fmtUsd(signalBalance)} USDT`}
        </span>
      </div>

      {signalBalance === 0 && (
        <div style={{ backgroundColor: theme.primarySoft, border: `1px solid ${theme.primary}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px' }}>
          Your Signal balance is empty.{' '}
          <Link to="/assets" style={{ color: theme.primary, fontWeight: 'bold' }}>Transfer funds from Spot</Link> to start trading.
        </div>
      )}

      {/* Chart */}
      <div ref={chartContainerRef} style={{ ...glassCard(theme), marginBottom: '14px', overflow: 'hidden' }} />

      {/* Trade size */}
      <div style={{ ...glassCard(theme), padding: '12px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: theme.subtext, fontSize: '13px' }}>Trade size 1% <span style={{ color: theme.faint, fontSize: '11px' }}>(0.662% Your + platform fee)</span></span>
        <span style={{ fontWeight: 'bold' }}>{fmtUsd(stakeAmount)} USDT</span>
      </div>

      {actionError && (
        <div style={{ color: theme.down, fontSize: '13px', marginBottom: '10px', padding: '8px 12px', backgroundColor: theme.downSoft, borderRadius: '10px' }}>{actionError}</div>
      )}

      {!pendingDirection ? (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <button
              onClick={() => startPlacing('up')}
              style={{
                flex: 1, border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                background: theme.upGradient || theme.up, color: 'white',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              Up (ROE) 80%
            </button>
            <button
              onClick={() => startPlacing('down')}
              style={{
                flex: 1, border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                background: theme.downGradient || theme.down, color: 'white',
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              Down (ROE) 80%
            </button>
          </div>
          <p style={{ color: theme.faint, fontSize: '11px', marginTop: 0, marginBottom: '14px' }}>
            Pick a direction, then choose exact settlement time. Outcomes are not guaranteed.
          </p>

          {bonusInfo.bonusSignals > 0 && (
            <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '24px', border: `1px solid ${theme.up}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.up }}>Referral Bonus Signal</span>
                <span style={{ fontSize: '12px', color: theme.subtext }}>{bonusInfo.bonusSignals} remaining</span>
              </div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px' }}>
                1% profit · {bonusInfo.referralSymbol ? bonusInfo.referralSymbol.replace('USDT','') : '—'} · Available at <b style={{ color: theme.text }}>{bonusInfo.referralSignalTime || '—'}</b>
              </div>
              {bonusInfo.referralWindowOpen && bonusInfo.bonusUsedToday === 0 ? (
                <button
                  disabled={placingBonus}
                  onClick={async () => {
                    setPlacingBonus(true);
                    setActionError('');
                    try {
                      const res = await fetch(`${API_URL}/api/demo/referral-signal`, { method: 'POST', headers: authHeaders() });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setSignalBalance(data.signalBalance);
                      setPositions(data.positions || []);
                      setActionError('');
                    } catch (err) { setActionError(err.message); }
                    finally { setPlacingBonus(false); }
                  }}
                  style={{
                    width: '100%', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.up})`, color: 'white',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)', opacity: placingBonus ? 0.7 : 1,
                  }}
                >
                  {placingBonus ? 'Placing...' : `Place Referral Signal (${fmtUsd(signalBalance ? signalBalance * 0.01 : 0)} USDT)`}
                </button>
              ) : bonusInfo.bonusUsedToday > 0 ? (
                <div style={{ fontSize: '12px', color: theme.faint, padding: '8px 0' }}>Today's bonus signal already used. Next available tomorrow.</div>
              ) : (
                <div style={{ fontSize: '12px', color: theme.faint, padding: '8px 0' }}>Window not open yet. Come back at <b>{bonusInfo.referralSignalTime}</b>.</div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ ...glassCard(theme), border: `1px solid ${pendingDirection === 'up' ? theme.up : theme.down}`, padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold', color: pendingDirection === 'up' ? theme.up : theme.down }}>
              {pendingDirection.toUpperCase()} · {fmtUsd(stakeAmount)} USDT
            </span>
            <button onClick={() => setPendingDirection(null)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>

          <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '8px', display: 'block' }}>Settle Time</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, boxSizing: 'border-box', fontWeight: 'bold', fontSize: '16px' }}
            />
          </div>

          <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '14px' }}>
            Current time: <b style={{ color: theme.text }}>{fmtClock(now)}</b> · Settles at <b style={{ color: theme.text }}>{fmtClock(settlePreviewDate.getTime())}</b>
          </div>

          <button
            onClick={confirmPrediction}
            disabled={placing}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: placing ? 'not-allowed' : 'pointer',
              background: pendingDirection === 'up' ? (theme.upGradient || theme.up) : (theme.downGradient || theme.down),
              color: 'white', opacity: placing ? 0.7 : 1,
              boxShadow: pendingDirection === 'up' ? '0 4px 14px rgba(16,185,129,0.3)' : '0 4px 14px rgba(239,68,68,0.3)',
            }}
          >
            {placing ? 'Placing...' : `Confirm ${pendingDirection.toUpperCase()} — Settles at ${fmtClock(settlePreviewDate.getTime())}`}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${theme.cardBorder}`, marginBottom: '16px' }}>
        {[{ key: 'current', label: 'Current' }, { key: 'history', label: 'History' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '10px', fontSize: '14px', fontWeight: 'bold',
              color: activeTab === t.key ? theme.primary : theme.faint,
              borderBottom: activeTab === t.key ? `2px solid ${theme.primary}` : '2px solid transparent',
            }}
          >
            {t.label}
            {t.key === 'current' && currentPositions.length > 0 && (
              <span style={{ marginLeft: '6px', fontSize: '11px', backgroundColor: theme.primarySoft, color: theme.primary, padding: '2px 6px', borderRadius: '8px' }}>
                {currentPositions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'current' && (
        <div>
          {currentPositions.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>No open positions.</p>}
          {currentPositions.map((p) => {
            const secondsLeft = Math.max(0, Math.ceil((p.settleAt - now) / 1000));
            const coin = COINS.find((c) => c.pair === p.pair);
            return (
              <div key={p.id} style={{ ...glassCard(theme), padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CoinIcon symbol={coin?.short || p.pair.split('/')[0]} size={20} />
                    {p.pair}
                  </span>
                  <span style={{ color: p.direction === 'up' ? theme.up : theme.down, fontWeight: 'bold' }}>{p.direction.toUpperCase()}</span>
                </div>
                <div style={{ color: theme.subtext, fontSize: '12px' }}>Stake: {fmtUsd(p.stake)} USDT · Entry: {fmtUsd(p.entryPrice)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ color: theme.text, fontSize: '13px', fontWeight: '500' }}>
                    {secondsLeft > 0 ? `Settles at ${fmtClock(p.settleAt)}` : 'Settling...'}
                  </div>
                  {secondsLeft > 0 && (
                    <button
                      onClick={() => setCancelConfirm({ id: p.id, stake: p.stake, pair: p.pair })}
                      style={{
                        background: theme.downSoft, color: theme.down, border: 'none', padding: '6px 14px',
                        borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {historyPositions.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>No settled trades yet.</p>}
          {historyPositions.map((p) => {
            const coin = COINS.find((c) => c.pair === p.pair);
            const isCancelled = !!p.cancelled;
            const isTimedOut = !!p.timedOut;
            const statusLabel = isTimedOut ? 'TIMED OUT' : isCancelled ? 'CANCELLED' : (p.won ? 'WIN' : 'LOSS');
            const statusColor = isTimedOut ? '#f59e0b' : isCancelled ? theme.faint : (p.won ? theme.up : theme.down);
            return (
              <div key={p.id} style={{ ...glassCard(theme), padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CoinIcon symbol={coin?.short || p.pair.split('/')[0]} size={20} />
                    {p.pair}
                  </span>
                  <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusLabel}</span>
                </div>
                <div style={{ color: theme.subtext, fontSize: '12px' }}>
                  Stake: {fmtUsd(p.stake)} USDT · Entry: {fmtUsd(p.entryPrice)}
                  {!isCancelled && !isTimedOut && <> → Close: {fmtUsd(p.closePrice)}</>}
                </div>
                {!isCancelled && !isTimedOut && (
                  <div style={{ color: p.won ? theme.up : theme.down, fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
                    {p.profit >= 0 ? '+' : ''}{fmtUsd(p.profit)} USDT
                  </div>
                )}
                {isCancelled && (
                  <div style={{ color: theme.faint, fontSize: '13px', marginTop: '4px' }}>Stake refunded</div>
                )}
                {isTimedOut && (
                  <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>Signal ended by admin · Stake refunded</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cancelConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
          <div style={{ ...glassCard(theme), padding: '24px', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: theme.down }}>Cancel Signal?</div>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 8px' }}>
              Are you sure you want to cancel your <b>{cancelConfirm.pair}</b> signal?
            </p>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 20px' }}>
              Your stake of <b>{fmtUsd(cancelConfirm.stake)} USDT</b> will be refunded. This trade will appear as "Cancelled" in your history.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCancelConfirm(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.card, color: theme.text, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Keep Trade
              </button>
              <button
                onClick={() => cancelTrade(cancelConfirm.id, cancelConfirm.stake)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: theme.downGradient || theme.down, color: 'white', fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Cancel Trade
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Signals;
