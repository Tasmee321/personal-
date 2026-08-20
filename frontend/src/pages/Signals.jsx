import React, { useEffect, useMemo, useRef, useState } from 'react';
import PullIndicator from '../components/PullToRefresh';
import { usePullToRefresh } from '../utils/usePullToRefresh';
import { buildChartStreamUrl, mergeTradeTick, createOverrideEngine } from '../utils/liveCandles';
import { noteServerTime, serverNow } from '../utils/serverClock';
import { attachHistoryLoader, klineToCandle } from '../utils/candleHistory';
import { createCandleChart } from '../utils/candleChart';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, X, Settings } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { getToken } from '../utils/auth';
import { scaleVolume } from '../utils/volumeDisplay';
import { useTheme } from '../ThemeContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';
const MARKET_DATA_DELAY_MS = 0;
const COINS = ALL_COINS;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

const PKT_OFFSET_SEC = 5 * 60 * 60;
function fmtClock(ms) {
  return new Date(ms).toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtClockShort(ms) {
  return new Date(ms).toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' });
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
  // Absolute settle instant (epoch ms), always snapped to :00 seconds. Kept as a timestamp — not a
  // duration — so the click's seconds never leak into settleAt. Two users who pick the same minute
  // now send the exact same settle time, which is what makes their result identical.
  const [settleAtTarget, setSettleAtTarget] = useState(() => Math.ceil((Date.now() + 5 * 60 * 1000) / 60000) * 60000);
  const [placing, setPlacing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState('current');
  const [actionError, setActionError] = useState('');
  const [bonusInfo, setBonusInfo] = useState({ bonusSignals: 0, daysRemaining: 0, bonusUsedToday: 0, referralWindowOpen: false, referralSignalTime: null, referralDirection: null, referralSymbol: null, referralEndTime: null, signalActive: false, signalSettleAt: null });
  const [placingBonus, setPlacingBonus] = useState(false);

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null); // createCandleChart() api

  const priceBufferRef = useRef({});
  const pendingKlinesRef = useRef(null);
  const lastRawCandleRef = useRef(null);   // last real (kline/tick-merged) candle for the selected coin
  const latestTickRef = useRef(null);      // coalesced latest aggTrade tick
  const candleOverridesRef = useRef([]);   // scheduled + active + recent overrides (all symbols)
  const overrideEngineRef = useRef(null);  // createOverrideEngine() for the selected coin

  const getEndpoint = (path) => {
    const base = '/api/real';
    return `${API_URL}${base}${path}`;
  };

  const loadAccount = async () => {
    try {
      const res = await fetch(getEndpoint('/account'), { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSignalBalance(data.signalBalance);
        setPositions(data.positions || []);
        if (data.volumeData) setVolumeData(data.volumeData);
      }
    } catch { /* next poll */ }
  };
  const [volumeData, setVolumeData] = useState(null);

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    const poll = setInterval(loadAccount, 5000);
    return () => clearInterval(poll);
  }, []);
  const { pull: ptrPull, refreshing: ptrRefreshing } = usePullToRefresh(loadAccount);

  useEffect(() => {
    const loadBonusStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/signal-status`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) setBonusInfo({ bonusSignals: data.bonusSignals || 0, daysRemaining: data.daysRemaining || 0, bonusUsedToday: data.bonusUsedToday || 0, referralWindowOpen: !!data.referralWindowOpen, referralSignalTime: data.referralSignalTime, referralDirection: data.referralDirection, referralSymbol: data.referralSymbol, referralEndTime: data.referralEndTime, dailySignalLimit: data.dailySignalLimit ?? null, signalsUsedToday: data.signalsUsedToday ?? null, signalsLeftToday: data.signalsLeftToday ?? null, signalActive: !!data.signalActive, signalSettleAt: data.signalSettleAt || null, signalSymbol: data.signalSymbol || null });
      } catch { /* silent */ }
    };
    loadBonusStatus();
    const poll = setInterval(loadBonusStatus, 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    // Server clock, not the device clock: every signal deadline is compared against it, so a device
    // running fast or slow must not change what the user is allowed to do or what they are shown.
    const tick = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const t0 = Date.now();
        const res = await fetch(`${API_URL}/api/candle-overrides/active`);
        const data = await res.json();
        if (!data.ok) return;
        noteServerTime(data.serverTime, Date.now() - t0);
        candleOverridesRef.current = data.overrides || [];
        // An override that already started (or ended recently) arrived after history was drawn →
        // re-shape the remembered raw candles so the chart tells the same story as live viewers saw.
        const eng = overrideEngineRef.current;
        const api = chartRef.current;
        if (eng && api && eng.needsReplay(candleOverridesRef.current, serverNow())) {
          const first = eng.firstRawTime();
          const prefix = api.getData().filter((c) => c.time < first);
          api.setAll([...prefix, ...eng.replay(candleOverridesRef.current, serverNow())]);
        }
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      let msg; try { msg = JSON.parse(event.data); } catch { return; }
      const data = msg?.data;
      if (!data || !data.s) return;
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
    // Seed the price buffer for every coin — but only AFTER the main chart has had a chance to
    // paint. Firing 21 Binance requests at mount competed with the chart's own history request
    // and made the first (BTC/ETH) load feel slow. The ticker WS fills prices within ~1s anyway.
    const timer = setTimeout(() => {
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
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
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
    const container = chartContainerRef.current;
    // Shared Binance/OKX-style chart: candles + MA(7/25/99) + volume pane + OHLC legend
    const api = createCandleChart(container, { theme, height: 300 });
    chartRef.current = api;
    const ro = new ResizeObserver(() => { if (chartRef.current) chartRef.current.resize(container.clientWidth); });
    ro.observe(container);
    return () => {
      ro.disconnect();
      api.remove();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!chartRef.current) return undefined; // chart effect above runs first; guard anyway
    let cancelled = false;
    let ws;
    const pending = [];
    pendingKlinesRef.current = pending;
    lastRawCandleRef.current = null;
    latestTickRef.current = null;
    const shiftSec = Math.floor(MARKET_DATA_DELAY_MS / 1000);
    const toCandle = (k) => klineToCandle(k, shiftSec + PKT_OFFSET_SEC);
    const engine = createOverrideEngine({ symbol: selectedCoin.symbol, tfSec: 60, timeOffsetSec: shiftSec + PKT_OFFSET_SEC });
    overrideEngineRef.current = engine;

    // Combined stream: kline_1m (source of truth every ~2s) + aggTrade (every trade → fluid candle).
    // Auto-reconnects so the chart never silently freezes on a dropped connection.
    let reconnectTimer = null;
    const connectWs = () => {
      if (cancelled) return;
      if (ws) { try { ws.close(); } catch { /* ignore */ } }
      ws = new WebSocket(buildChartStreamUrl(selectedCoin.symbol, '1m'));
      ws.onmessage = (event) => {
        let msg; try { msg = JSON.parse(event.data); } catch { return; }
        const data = msg?.data;
        if (!data) return;
        if (data.e === 'kline' && data.k) {
          const k = data.k;
          pending.push({
            eventTime: data.E || Date.now(),
            candle: { time: Math.floor(k.t / 1000) + shiftSec + PKT_OFFSET_SEC, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v) || 0 },
          });
        } else if (data.e === 'aggTrade') {
          // Only the latest tick matters — coalesce (BTC can push dozens per second)
          const t = Number(data.T || data.E || Date.now());
          latestTickRef.current = { price: parseFloat(data.p), qty: parseFloat(data.q) || 0, bucketTime: Math.floor(t / 60000) * 60 + shiftSec + PKT_OFFSET_SEC, eventTime: t };
        }
      };
      const scheduleReconnect = () => { if (!cancelled && !reconnectTimer) reconnectTimer = setTimeout(() => { reconnectTimer = null; connectWs(); }, 2000); };
      ws.onerror = scheduleReconnect;
      ws.onclose = scheduleReconnect;
    };

    // WS first (don't wait on REST), then progressive history: small fast first paint,
    // then backfills older candles up to HISTORY_DAYS as the user scrolls back.
    connectWs();
    const disposeHistory = attachHistoryLoader({
      target: chartRef.current, symbol: selectedCoin.symbol, interval: '1m', toCandle,
      onInitial: (candles) => {
        const cutoffSec = Math.floor((Date.now() - MARKET_DATA_DELAY_MS) / 1000);
        const shown = candles.filter((c) => (c.time - shiftSec - PKT_OFFSET_SEC) <= cutoffSec);
        lastRawCandleRef.current = shown.length ? { ...shown[shown.length - 1] } : null;
        candles.filter((c) => (c.time - shiftSec - PKT_OFFSET_SEC) > cutoffSec).forEach((c) => {
          pending.push({ eventTime: (c.time - shiftSec - PKT_OFFSET_SEC) * 1000, candle: c });
        });
        // Shape recent history with any admin override (exact window, same model as live)
        return engine.seedHistory(shown, candleOverridesRef.current, serverNow());
      },
    });

    return () => {
      cancelled = true;
      disposeHistory();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.onerror = null; ws.close(); }
      pendingKlinesRef.current = null;
      if (overrideEngineRef.current === engine) overrideEngineRef.current = null;
    };
  }, [selectedCoin, themeMode]);

  useEffect(() => {
    let lastIdleRedraw = 0;
    const interval = setInterval(() => {
      const pending = pendingKlinesRef.current;
      const engine = overrideEngineRef.current;
      if (!pending || !chartRef.current || !engine) return;
      const cutoff = Date.now() - MARKET_DATA_DELAY_MS;
      let toDraw = null;
      // 1) kline updates (authoritative OHLC) — keep the raw candle so ticks merge into real data
      // (with no artificial delay, don't gate on the client clock — phone clocks are often behind
      // Binance server time, which would hold back live updates)
      const noDelay = MARKET_DATA_DELAY_MS === 0;
      while (pending.length > 0 && (noDelay || pending[0].eventTime <= cutoff)) {
        const update = pending.shift();
        lastRawCandleRef.current = { ...update.candle };
        toDraw = lastRawCandleRef.current;
      }
      // 2) latest trade tick — moves the current candle between kline pushes (fluid, like Binance)
      const tick = latestTickRef.current;
      if (tick && (noDelay || tick.eventTime <= cutoff)) {
        latestTickRef.current = null;
        const merged = mergeTradeTick(lastRawCandleRef.current, tick.price, tick.bucketTime, tick.qty);
        if (merged) { lastRawCandleRef.current = merged; toDraw = merged; }
      }
      const nowSrv = serverNow();
      if (!toDraw) {
        // No new data — but an admin override (or its fade-out) is animating: keep the candle alive
        const last = lastRawCandleRef.current;
        if (!last || !engine.animating(candleOverridesRef.current, nowSrv)) return;
        if (Date.now() - lastIdleRedraw < 250) return;
        lastIdleRedraw = Date.now();
        toDraw = last;
      }
      // Admin override: realistic, exact-to-the-second display model (see liveCandles.js)
      chartRef.current.update(engine.display(toDraw, candleOverridesRef.current, nowSrv));
    }, 80);
    return () => clearInterval(interval);
  }, [selectedCoin]);

  const startPlacing = (direction) => {
    setActionError('');
    if (signalBalance < 200) {
      setActionError('Minimum $200 signal balance required to trade.');
      return;
    }
    if (!signalBalance || signalBalance <= 0) {
      setActionError('Your balance is empty. Transfer funds first.');
      return;
    }
    // Default the settle time to the signal time from the broadcast. Matching that minute is what
    // counts as following the signal, so it must be the default — not a 5-minute guess.
    const announced = bonusInfo.signalSettleAt;
    const srvNow = serverNow();
    setSettleAtTarget(announced && announced > srvNow
      ? announced
      : Math.ceil((srvNow + 5 * 60 * 1000) / 60000) * 60000);
    setPendingDirection(direction);
  };

  const confirmPrediction = async () => {
    setActionError('');
    setPlacing(true);
    try {
      const res = await fetch(getEndpoint('/predict'), {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          pair: selectedCoin.pair,
          direction: pendingDirection,
          // Absolute settle instant — the server matches this against the announced signal time.
          settleAtRequested: settleAtTarget,
          // Kept for older server builds / as a fallback.
          durationMinutes: Math.max(1, Math.round((settleAtTarget - serverNow()) / 60000)),
        }),
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

  // Everything below reads and writes the settle time in PKT (UTC+5), which is what every label in
  // this screen and every broadcast says. Reading the epoch shifted by +5h with getUTC* fields gives
  // PKT regardless of the device's own timezone — the old code used local getHours()/setHours(), so
  // a user outside Pakistan picked a completely different instant than the one displayed.
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktParts = (ms) => new Date(ms + PKT_OFFSET_MS);
  const settlePreviewPkt = pktParts(settleAtTarget);
  const timeValue = `${String(settlePreviewPkt.getUTCHours()).padStart(2, '0')}:${String(settlePreviewPkt.getUTCMinutes()).padStart(2, '0')}`;

  // Whole minutes only — seconds are zeroed so a trade lines up exactly with the signal time.
  const handleTimeChange = (e) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    const srvNow = serverNow();
    const p = pktParts(srvNow);
    let target = Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate(), h, m, 0, 0) - PKT_OFFSET_MS;
    // Roll to the next PKT day only when the chosen minute is genuinely behind the SERVER clock.
    // Comparing against the device clock here used to push a perfectly valid pick 24 hours out
    // whenever the phone was running a little fast, which silently guaranteed a timeout refund.
    if (target < Math.floor(srvNow / 60000) * 60000) target += 24 * 60 * 60 * 1000;
    setSettleAtTarget(target);
  };

  // The signal time announced in the broadcast (server-provided). Matching this minute is what
  // makes a trade count as following the signal.
  // signalActive must be part of this test: the server rejects a prediction outright when the
  // session is not active, so showing the green "following signal" state then would promise a win
  // for a trade that cannot even be placed.
  const announcedSettleAt = bonusInfo.signalActive && bonusInfo.signalSettleAt && bonusInfo.signalSettleAt > now ? bonusInfo.signalSettleAt : null;
  // Must mirror the server's rule exactly (see /api/real/predict): the announced COIN and the
  // announced MINUTE, compared as whole minutes with no tolerance window. A ±60s window used to
  // show the green "following" banner for the minute before the announced one, and omitting the
  // coin check showed it for altcoins the server force-loses.
  const followsSignal = announcedSettleAt !== null
    && (!bonusInfo.signalSymbol || selectedCoin.symbol === bonusInfo.signalSymbol)
    && Math.floor(settleAtTarget / 60000) === Math.floor(announcedSettleAt / 60000);

  return (
    <div style={{ padding: '16px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
      <PullIndicator pull={ptrPull} refreshing={ptrRefreshing} />
      <style>{`@keyframes kynexSlideIn { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0 }}>Signals</h3>
        <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }}><Settings size={20} /></Link>
      </div>

      {/* Coin picker */}
      <div style={{ marginBottom: '14px' }}>
        <CoinSelector theme={theme} coins={COINS} livePrices={livePrices} selected={selectedCoin} onSelect={setSelectedCoin} />
      </div>

      {/* Balance card */}
      <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: theme.subtext, fontSize: '13px' }}>
            Signal Balance
          </span>
          <span style={{ fontWeight: 'bold', color: theme.brand }}>
            {signalBalance === null ? '...' : `${fmtUsd(signalBalance)} USDT`}
          </span>
        </div>
        {/* Today's signals — same limit the server enforces, shown up-front */}
        {bonusInfo.dailySignalLimit != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: theme.subtext }}>
            <span>Signals today</span>
            <span style={{ fontWeight: 600, color: bonusInfo.signalsLeftToday === 0 ? theme.down : theme.text }}>
              {Math.min(bonusInfo.signalsUsedToday || 0, bonusInfo.dailySignalLimit)} / {bonusInfo.dailySignalLimit}
              {bonusInfo.bonusSignals > 0 && bonusInfo.bonusUsedToday < 1 ? ' + 1 bonus' : ''}
              {bonusInfo.signalsLeftToday === 0 ? ' · limit reached' : ''}
            </span>
          </div>
        )}
        {/* Trading-volume progress (backend rule: 5× of everything transferred into Signal; unlocks penalty-free
            Signal → Spot). Shown scaled to the user's own Signal balance — the raw 5× figure never appears on screen. */}
        {(() => {
          const v = scaleVolume(volumeData, signalBalance);
          if (!v) return null;
          const { pct, complete: done, total, done: doneAmt, remaining, showAmounts } = v;
          return (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.subtext, marginBottom: '4px' }}>
                <span>Trading volume {done ? '✓ complete' : ''}</span>
                <span style={{ fontWeight: 600, color: done ? theme.up : theme.text }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.inputBg || theme.cardBorder, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: done ? theme.upGradient : theme.brandGradient, width: `${pct}%`, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: '10px', color: theme.faint, marginTop: '4px' }}>
                {showAmounts && <>{fmtUsd(doneAmt)} / {fmtUsd(total)} USDT</>}
                {done
                  ? `${showAmounts ? ' · ' : ''}Signal → Spot transfers are penalty-free`
                  : showAmounts ? ` · ${fmtUsd(remaining)} USDT remaining to unlock penalty-free transfer` : 'Complete trading volume to unlock penalty-free transfer'}
              </div>
            </div>
          );
        })()}
      </div>

      {signalBalance === 0 && (
        <div style={{ backgroundColor: theme.primarySoft, border: `1px solid ${theme.primary}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px' }}>
          Your Signal balance is empty.{' '}
          <Link to="/assets" style={{ color: theme.primary, fontWeight: 'bold' }}>Transfer funds from Spot</Link> to start trading.
        </div>
      )}

      {/* Chart */}
      <div style={{ ...glassCard(theme), marginBottom: '14px', overflow: 'hidden' }}>
        <div ref={chartContainerRef} style={{ minHeight: '300px', position: 'relative' }} />
        <div style={{ textAlign: 'right', padding: '4px 12px 6px', fontSize: '10px', color: theme.faint, fontWeight: '600', borderTop: `1px solid ${theme.cardBorder}` }}>PKT (UTC+5)</div>
      </div>

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
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: theme.subtext }}>{bonusInfo.bonusSignals} remaining</div>
                  {bonusInfo.daysRemaining > 0 && <div style={{ fontSize: '11px', color: theme.faint }}>Expires in {bonusInfo.daysRemaining} day{bonusInfo.daysRemaining !== 1 ? 's' : ''}</div>}
                </div>
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
                      const res = await fetch(`${API_URL}/api/real/referral-signal`, { method: 'POST', headers: authHeaders() });
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
              style={{ padding: '10px 14px', borderRadius: '10px', border: `1px solid ${followsSignal ? theme.up : theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, boxSizing: 'border-box', fontWeight: 'bold', fontSize: '16px' }}
            />
          </div>

          {/* A trade only follows the signal when its settle time is the announced signal minute. */}
          {announcedSettleAt !== null && (
            <div style={{
              fontSize: '12px', lineHeight: 1.5, padding: '10px 12px', borderRadius: '10px', marginBottom: '12px',
              backgroundColor: followsSignal ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
              border: `1px solid ${followsSignal ? theme.up : theme.down}`,
              color: followsSignal ? theme.up : theme.down,
            }}>
              {followsSignal
                ? <>✅ Signal time <b>{fmtClock(announcedSettleAt)}</b> — you are following this signal.</>
                : settleAtTarget < announcedSettleAt
                  ? <>⚠️ Signal time is <b>{fmtClock(announcedSettleAt)}</b>. Your time is earlier — this does not follow the signal.</>
                  : <>⚠️ Signal time is <b>{fmtClock(announcedSettleAt)}</b>. A later time does not follow the signal — the session closes at {fmtClock(announcedSettleAt + 60 * 1000)} and your stake is refunded.</>
              }
            </div>
          )}

          {announcedSettleAt !== null && !followsSignal && (
            <button
              onClick={() => setSettleAtTarget(announcedSettleAt)}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px', marginBottom: '12px', cursor: 'pointer',
                border: `1px solid ${theme.up}`, backgroundColor: 'transparent', color: theme.up,
                fontWeight: 'bold', fontSize: '13px',
              }}
            >
              Use signal time {fmtClock(announcedSettleAt)}
            </button>
          )}

          <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '14px' }}>
            Current time: <b style={{ color: theme.text }}>{fmtClock(now)}</b> · Settles at <b style={{ color: theme.text }}>{fmtClock(settleAtTarget)}</b>
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
            {placing ? 'Placing...' : `Confirm ${pendingDirection.toUpperCase()} — Settles at ${fmtClock(settleAtTarget)}`}
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
          {currentPositions.map((p, idx) => {
            const secondsLeft = Math.max(0, Math.ceil((p.settleAt - now) / 1000));
            const coin = COINS.find((c) => c.pair === p.pair);
            const isNew = idx === 0 && (Date.now() - p.openedAt) < 3000;
            return (
              <div key={p.id} style={{ ...glassCard(theme), padding: '14px', marginBottom: '10px', animation: isNew ? 'kynexSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CoinIcon symbol={coin?.short || p.pair.split('/')[0]} size={20} />
                    {p.pair}
                  </span>
                  <span style={{ color: p.direction === 'up' ? theme.up : theme.down, fontWeight: 'bold' }}>{p.direction.toUpperCase()}</span>
                </div>
                <div style={{ color: theme.subtext, fontSize: '12px' }}>Stake: {fmtUsd(p.stake)} USDT · Entry: {fmtUsd(p.entryPrice)}</div>
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '4px' }}>Opened: {fmtClockShort(p.openedAt)} PKT · Settles: {fmtClockShort(p.settleAt)} PKT</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ color: theme.text, fontSize: '13px', fontWeight: '500' }}>
                    {secondsLeft > 0 ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s left` : 'Settling...'}
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
          {historyPositions.length > 0 && (() => {
            const settled = historyPositions.filter(p => !p.cancelled && !p.timedOut);
            const wins = settled.filter(p => p.won).length;
            const losses = settled.filter(p => !p.won).length;
            const totalProfit = settled.reduce((s, p) => s + (p.profit || 0), 0);
            const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;
            return (
              <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: theme.subtext, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance Summary</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.up }}>{wins}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>Wins</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.down }}>{losses}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>Losses</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: winRate >= 50 ? theme.up : theme.down }}>{winRate}%</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>Win Rate</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: totalProfit >= 0 ? theme.up : theme.down }}>{totalProfit >= 0 ? '+' : ''}{fmtUsd(totalProfit)}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>Total P&L</div>
                  </div>
                </div>
              </div>
            );
          })()}
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
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{fmtClockShort(p.openedAt)} → {fmtClockShort(p.settleAt)} PKT</span>
                  <span style={{ color: p.direction === 'up' ? theme.up : theme.down, fontWeight: 'bold' }}>
                    · {p.pair.replace('USDT','').replace('/','').replace('USDT','')} {p.direction === 'up' ? '▲ UP' : '▼ DOWN'}
                  </span>
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
                  <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>Settled after the signal closed · Stake refunded</div>
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
