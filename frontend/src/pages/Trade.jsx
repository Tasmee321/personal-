import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { AlertTriangle, ChevronDown, Search, X, Settings } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';
const LEVERAGE_OPTIONS = [1, 5, 10, 20, 50];
const COINS = ALL_COINS;
const TIMEFRAMES = [
  { label: '1m', interval: '1m' },
  { label: '5m', interval: '5m' },
  { label: '15m', interval: '15m' },
  { label: '1H', interval: '1h' },
  { label: '4H', interval: '4h' },
  { label: '1D', interval: '1d' },
];

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function fmt(n, digits = 2) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function toCandle(k) {
  return { time: Math.floor(k[0] / 1000), open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) };
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

const RiskWarningModal = ({ theme, onAccept, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  }}>
    <div style={{
      ...glassCard(theme),
      maxWidth: '380px', width: '100%', padding: '28px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF6B35 0%, #FF4444 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
        boxShadow: '0 8px 24px rgba(255,68,68,0.3)',
      }}>
        <AlertTriangle size={28} color="white" />
      </div>
      <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700, color: theme.text }}>
        Risk Notice
      </h3>
      <p style={{ color: theme.down, fontSize: '13px', lineHeight: 1.6, margin: '0 0 8px', fontWeight: 'bold' }}>
        You may lose your assets. KYNEX is not responsible for any losses incurred from trading.
      </p>
      <p style={{ color: theme.subtext, fontSize: '13px', lineHeight: 1.6, margin: '0 0 8px' }}>
        Trading outside of admin-approved signals carries a 20% risk fee that is automatically deducted from your balance.
      </p>
      <p style={{ color: theme.subtext, fontSize: '13px', lineHeight: 1.6, margin: '0 0 22px' }}>
        By proceeding, you acknowledge you are trading at your own risk and accept full responsibility for any outcomes.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '14px', borderRadius: '12px',
          border: `1px solid ${theme.cardBorder}`,
          backgroundColor: 'transparent', color: theme.subtext,
          fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button onClick={onAccept} style={{
          flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
          background: theme.primaryGradient || theme.primary,
          color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(36,104,242,0.35)',
        }}>
          I Understand
        </button>
      </div>
    </div>
  </div>
);

const CoinPicker = ({ theme, coins, livePrices, selected, onSelect }) => {
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
    return coins.filter((c) => c.short.includes(q) || c.name.toUpperCase().includes(q) || c.pair.includes(q));
  }, [query, coins]);

  const live = livePrices[selected.symbol];

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: '12px' }}>
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
              ${fmt(live.price)} <span style={{ fontSize: '12px' }}>({live.change >= 0 ? '+' : ''}{live.change.toFixed(2)}%)</span>
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
                  backgroundColor: isSelected ? theme.primarySoft : 'transparent',
                  boxSizing: 'border-box',
                }}
              >
                <CoinIcon symbol={coin.short} size={24} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.text }}>{coin.short}</span>
                  <span style={{ color: theme.faint, fontSize: '11px', marginLeft: '6px' }}>{coin.name}</span>
                </div>
                {cl && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text }}>${fmt(cl.price)}</div>
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

const Trade = () => {
  const { theme, mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [tab, setTab] = useState('spot');
  const [selectedCoin, setSelectedCoin] = useState(() => COINS.find((c) => c.pair === location.state?.pair) || COINS[0]);
  const [livePrices, setLivePrices] = useState({});
  const [timeframe, setTimeframe] = useState('1m');

  const [balance, setBalance] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [futures, setFutures] = useState([]);

  const [buyAmount, setBuyAmount] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [margin, setMargin] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candleOverridesRef = useRef([]);

  const loadAccount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/demo/account`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setHoldings(data.holdings || {});
        setFutures(data.futures || []);
      }
    } catch { /* next poll */ }
  }, []);

  useEffect(() => {
    const poll = setInterval(loadAccount, 5000);
    const initial = setTimeout(loadAccount, 0);
    return () => { clearInterval(poll); clearTimeout(initial); };
  }, [loadAccount]);

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      const { data } = JSON.parse(event.data);
      if (!data || !data.s) return;
      setLivePrices((prev) => ({ ...prev, [data.s]: { price: parseFloat(data.c), change: parseFloat(data.P) } }));
    };
    return () => ws.close();
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
    if (!chartContainerRef.current) return undefined;
    let cancelled = false;
    let ws = null;
    let animFrameId = null;
    let pendingUpdate = null; // buffer latest tick, drain on rAF

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: theme.subtext,
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      },
      grid: {
        vertLines: { color: theme.cardBorder, style: 1 },
        horzLines: { color: theme.cardBorder, style: 1 },
      },
      width: container.clientWidth,
      height: 280,
      timeScale: {
        timeVisible: true,
        secondsVisible: true, // show seconds so live movement is visible
        borderColor: theme.cardBorder,
        rightOffset: 5,
        barSpacing: 8,
      },
      rightPriceScale: {
        borderColor: theme.cardBorder,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: theme.primary, labelBackgroundColor: theme.primary },
        horzLine: { color: theme.primary, labelBackgroundColor: theme.primary },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.up,
      downColor: theme.down,
      borderVisible: false,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    // Resize observer — more reliable than window resize for mobile
    const ro = new ResizeObserver(() => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    // rAF-based drain: apply pending WS tick at 60fps, never block
    const drainLoop = () => {
      if (pendingUpdate && seriesRef.current) {
        seriesRef.current.update(pendingUpdate);
        pendingUpdate = null;
      }
      animFrameId = requestAnimationFrame(drainLoop);
    };
    animFrameId = requestAnimationFrame(drainLoop);

    const connectWs = () => {
      if (ws) { try { ws.close(); } catch (_) {} }
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedCoin.symbol.toLowerCase()}@kline_${timeframe}`);
      ws.onmessage = (event) => {
        if (cancelled || !seriesRef.current) return;
        const { k } = JSON.parse(event.data);
        const c = {
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        };
        const override = candleOverridesRef.current.find(o => o.symbol === selectedCoin.symbol);
        if (override) {
          const biasFactor = 0.0003 + Math.random() * 0.0004;
          const noise = (Math.random() - 0.45) * c.open * 0.0006;
          const drift = override.direction === 'up' ? biasFactor * c.open : -biasFactor * c.open;
          c.close = +(c.close + drift + noise).toFixed(8);
          if (override.direction === 'up') {
            c.high = Math.max(c.high, c.close, c.open + c.open * 0.0002);
            c.low = Math.min(c.low, c.open - c.open * 0.0001);
          } else {
            c.low = Math.min(c.low, c.close, c.open - c.open * 0.0002);
            c.high = Math.max(c.high, c.open + c.open * 0.0001);
          }
        }
        pendingUpdate = c; // buffer — rAF drains it
      };
      ws.onerror = () => {
        // auto-reconnect after 2s on error
        if (!cancelled) setTimeout(connectWs, 2000);
      };
      ws.onclose = () => {
        if (!cancelled) setTimeout(connectWs, 2000);
      };
    };

    // Kick off: fetch history and WS in parallel
    const load = async () => {
      // Start WS immediately — don't wait for REST
      connectWs();
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${selectedCoin.symbol}&interval=${timeframe}&limit=200`,
          { cache: 'no-store' }
        );
        const raw = await res.json();
        if (cancelled || !seriesRef.current || !Array.isArray(raw)) return;
        seriesRef.current.setData(raw.map(toCandle));
        chartRef.current?.timeScale().fitContent();
      } catch { /* WS keeps it live even if REST fails */ }
    };
    load();

    return () => {
      cancelled = true;
      ro.disconnect();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (ws) { try { ws.close(); } catch (_) {} }
      try { chart.remove(); } catch (_) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [theme, selectedCoin, timeframe]);

  const runAction = async (url, body) => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}${url}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      if (data.balance !== undefined) setBalance(data.balance);
      if (data.holdings) setHoldings(data.holdings);
      if (data.futures) setFutures(data.futures);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleBuy = async () => {
    const amt = Number(buyAmount);
    if (!amt || amt <= 0) return setError('Enter an amount greater than 0.');
    const ok = await runAction('/api/demo/spot/buy', { pair: selectedCoin.pair, usdtAmount: amt });
    if (ok) setBuyAmount('');
  };

  const handleSell = async () => {
    const qty = Number(sellQty);
    if (!qty || qty <= 0) return setError('Enter a quantity greater than 0.');
    const ok = await runAction('/api/demo/spot/sell', { pair: selectedCoin.pair, quantity: qty });
    if (ok) setSellQty('');
  };

  const openFutures = async (direction) => {
    const m = Number(margin);
    if (!m || m <= 0) return setError('Enter a margin amount greater than 0.');
    const ok = await runAction('/api/demo/futures/open', { pair: selectedCoin.pair, direction, margin: m, leverage });
    if (ok) setMargin('');
  };

  const closeFutures = (positionId) => runAction('/api/demo/futures/close', { positionId });

  const heldQty = holdings[selectedCoin.pair] || 0;
  const selectedLive = livePrices[selectedCoin.symbol];
  const openFuturesPositions = useMemo(() => futures.filter((p) => !p.closed), [futures]);
  const closedFuturesPositions = useMemo(() => futures.filter((p) => p.closed), [futures]);

  if (!riskAccepted) {
    return (
      <div style={{ padding: '16px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
        <RiskWarningModal
          theme={theme}
          onAccept={() => setRiskAccepted(true)}
          onCancel={() => navigate('/dashboard')}
        />
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0 }}>Trade</h3>
        <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }}><Settings size={20} /></Link>
      </div>

      {/* Coin picker */}
      <CoinPicker theme={theme} coins={COINS} livePrices={livePrices} selected={selectedCoin} onSelect={setSelectedCoin} />

      {/* Chart */}
      <div style={{ ...glassCard(theme), marginBottom: '14px', overflow: 'hidden' }}>
        <div ref={chartContainerRef} style={{ borderRadius: '16px 16px 0 0', minHeight: '260px', width: '100%', position: 'relative' }} />
        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderTop: `1px solid ${theme.cardBorder}` }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.interval}
              onClick={() => setTimeframe(tf.interval)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: timeframe === tf.interval ? '700' : '600',
                backgroundColor: timeframe === tf.interval ? theme.primarySoft : 'transparent',
                color: timeframe === tf.interval ? theme.primary : theme.faint,
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spot / Futures tabs */}
      <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: `1px solid ${theme.cardBorder}` }}>
        <button onClick={() => setTab('spot')} style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', backgroundColor: tab === 'spot' ? theme.primarySoft : theme.card, color: tab === 'spot' ? theme.primary : theme.subtext }}>
          Spot
        </button>
        <button onClick={() => setTab('futures')} style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', backgroundColor: tab === 'futures' ? theme.primarySoft : theme.card, color: tab === 'futures' ? theme.primary : theme.subtext }}>
          Futures
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.subtext, fontSize: '12px', marginBottom: '12px' }}>
        <span>Available: <b style={{ color: theme.text }}>{balance === null ? '...' : fmt(balance)} USDT</b></span>
        <span>Holdings: <b style={{ color: theme.text }}>{fmt(heldQty, 6)} {selectedCoin.short}</b></span>
      </div>

      {error && (
        <div style={{ color: theme.down, fontSize: '13px', marginBottom: '12px', padding: '10px', backgroundColor: theme.downSoft, borderRadius: '8px' }}>{error}</div>
      )}

      {tab === 'spot' ? (
        <div style={{ ...glassCard(theme), padding: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px', display: 'block' }}>Spend (USDT)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" min="0" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="0.00"
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box' }} />
              <button onClick={handleBuy} disabled={busy} style={{ padding: '0 20px', borderRadius: '10px', border: 'none', background: theme.upGradient || theme.up, color: 'white', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: '0 4px 12px rgba(0,200,83,0.25)' }}>
                Buy {selectedCoin.short}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px', display: 'block' }}>Sell ({selectedCoin.short})</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" min="0" value={sellQty} onChange={(e) => setSellQty(e.target.value)} placeholder="0.000000"
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box' }} />
              <button onClick={handleSell} disabled={busy} style={{ padding: '0 20px', borderRadius: '10px', border: 'none', background: theme.downGradient || theme.down, color: 'white', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: '0 4px 12px rgba(255,68,68,0.25)' }}>
                Sell {selectedCoin.short}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...glassCard(theme), padding: '16px', marginBottom: '16px' }}>
            <div style={{ color: theme.subtext, fontSize: '12px', marginBottom: '8px' }}>Leverage</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {LEVERAGE_OPTIONS.map((lv) => (
                <button key={lv} onClick={() => setLeverage(lv)} style={{
                  flex: '1 1 50px', padding: '9px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
                  border: `1px solid ${leverage === lv ? theme.primary : theme.cardBorder}`,
                  backgroundColor: leverage === lv ? theme.primarySoft : 'transparent',
                  color: leverage === lv ? theme.primary : theme.subtext,
                }}>
                  {lv}x
                </button>
              ))}
            </div>

            <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px', display: 'block' }}>Margin (USDT)</label>
            <input type="number" min="0" value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="0.00"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', marginBottom: '14px' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => openFutures('long')} disabled={busy} style={{ flex: 1, background: theme.upGradient || theme.up, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: '0 4px 12px rgba(0,200,83,0.25)' }}>
                Long
              </button>
              <button onClick={() => openFutures('short')} disabled={busy} style={{ flex: 1, background: theme.downGradient || theme.down, color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: '0 4px 12px rgba(255,68,68,0.25)' }}>
                Short
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: theme.subtext }}>Open Positions</div>
          {openFuturesPositions.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>No open positions.</p>}
          {openFuturesPositions.map((p) => {
            const coin = COINS.find((c) => c.pair === p.pair);
            const live = coin ? livePrices[coin.symbol] : null;
            const floatingPnl = live ? p.margin * p.leverage * ((live.price - p.entryPrice) / p.entryPrice) * (p.direction === 'long' ? 1 : -1) : null;
            return (
              <div key={p.id} style={{ ...glassCard(theme), padding: '14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CoinIcon symbol={p.pair.split('/')[0]} size={20} />
                    {p.pair} · {p.leverage}x
                  </span>
                  <span style={{ color: p.direction === 'long' ? theme.up : theme.down, fontWeight: 'bold' }}>{p.direction.toUpperCase()}</span>
                </div>
                <div style={{ color: theme.subtext, fontSize: '12px', marginBottom: '8px' }}>Margin: {fmt(p.margin)} USDT · Entry: {fmt(p.entryPrice)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: floatingPnl === null ? theme.faint : floatingPnl >= 0 ? theme.up : theme.down }}>
                    {floatingPnl === null ? 'Switch to this pair for live PnL' : `${floatingPnl >= 0 ? '+' : ''}${fmt(floatingPnl)} USDT`}
                  </span>
                  <button onClick={() => closeFutures(p.id)} disabled={busy} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.bg, color: theme.text, fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                    Close
                  </button>
                </div>
              </div>
            );
          })}

          {closedFuturesPositions.length > 0 && (
            <>
              <div style={{ margin: '18px 0 8px', fontSize: '13px', fontWeight: 'bold', color: theme.subtext }}>History</div>
              {closedFuturesPositions.map((p) => (
                <div key={p.id} style={{ ...glassCard(theme), padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CoinIcon symbol={p.pair.split('/')[0]} size={18} />
                      {p.pair} · {p.leverage}x {p.direction.toUpperCase()}
                    </span>
                    <span style={{ color: p.pnl >= 0 ? theme.up : theme.down, fontWeight: 'bold' }}>{p.pnl >= 0 ? '+' : ''}{fmt(p.pnl)} USDT</span>
                  </div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>Entry {fmt(p.entryPrice)} → Close {fmt(p.closePrice)}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Trade;
