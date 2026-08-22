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
import { hapticTick, hapticTap, hapticCommit, hapticWin, hapticLoss, hapticError } from '../utils/haptics';
import { scaleVolume } from '../utils/volumeDisplay';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { deviceTzOffsetSec, fmtLocalClock, fmtLocalClockShort, deviceTzLabel } from '../utils/localTime';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';
const MARKET_DATA_DELAY_MS = 0;
const COINS = ALL_COINS;

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

// Times shown to the user render in the DEVICE's own timezone (utils/localTime.js): a Cairo user
// sees Cairo time, a Dubai user Dubai time. Only the admin panel (AdminKyc.jsx) stays pinned to PKT.
const fmtClock = fmtLocalClock;
const fmtClockShort = fmtLocalClockShort;

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
  const { t, isRTL } = useLanguage();

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
        <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: theme.text }}>{selected.pair}</span>
          {live && (
            <span style={{ [isRTL ? 'marginRight' : 'marginLeft']: '10px', fontWeight: 'bold', color: live.change >= 0 ? theme.up : theme.down }}>
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
            <Search size={14} color={theme.faint} style={{ position: 'absolute', [isRTL ? 'right' : 'left']: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              autoFocus
              type="text"
              placeholder={t('trade.searchCoin')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: isRTL ? '10px 32px 10px 10px' : '10px 10px 10px 32px', borderRadius: '10px',
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '13px', boxSizing: 'border-box', outline: 'none',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                <X size={14} color={theme.faint} />
              </button>
            )}
          </div>

          {filtered.length === 0 && <p style={{ color: theme.faint, fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>{t('empty.results')}</p>}

          {filtered.map((coin) => {
            const cl = livePrices[coin.symbol];
            const isSelected = coin.symbol === selected.symbol;
            return (
              <button
                key={coin.symbol}
                onClick={() => { onSelect(coin); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
                  backgroundColor: isSelected ? theme.primarySoft : 'transparent', boxSizing: 'border-box',
                }}
              >
                <CoinIcon symbol={coin.short} size={24} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.text }}>{coin.short}</span>
                  <span style={{ color: theme.faint, fontSize: '11px', [isRTL ? 'marginRight' : 'marginLeft']: '6px' }}>{coin.name}</span>
                </div>
                {cl && (
                  <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
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
  const { t, isRTL } = useLanguage();
  const [signalBalance, setSignalBalance] = useState(null);
  const [positions, setPositions] = useState([]);

  // Settlement announcement. The poll below is the only place the app learns a trade closed, and it
  // used to just swap the number in place — the user could easily miss having won or lost. This
  // remembers which settled ids have already been shown so the banner fires exactly once per trade,
  // and only for trades that settled while the user was watching. Purely presentational: it reads
  // the result the server already decided and changes nothing about it.
  const seenSettledRef = useRef(null);
  const [settleFlash, setSettleFlash] = useState(null);
  const announceSettlements = (incoming) => {
    const settledNow = incoming.filter((p) => p.settled && !p.cancelled && !p.timedOut);
    // First load: adopt whatever is already settled without announcing, otherwise opening the page
    // would replay every historical result at once.
    if (seenSettledRef.current === null) {
      seenSettledRef.current = new Set(settledNow.map((p) => p.id));
      return;
    }
    const fresh = settledNow.filter((p) => !seenSettledRef.current.has(p.id));
    if (!fresh.length) return;
    fresh.forEach((p) => seenSettledRef.current.add(p.id));
    // Announce the newest one; if several closed in the same poll, the profits are summed so the
    // figure shown still matches what the balance actually moved by.
    const won = fresh.some((p) => p.won);
    const profit = fresh.reduce((s, p) => s + (p.profit || 0), 0);
    if (won) hapticWin(); else hapticLoss();
    setSettleFlash({ won, profit, count: fresh.length });
  };

  // Auto-dismiss. Kept as an effect rather than a setTimeout at announce time so a result arriving
  // while one is already showing restarts the clock instead of cutting the new one short.
  useEffect(() => {
    if (!settleFlash) return;
    const timer = setTimeout(() => setSettleFlash(null), 5200);
    return () => clearTimeout(timer);
  }, [settleFlash]);

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
        announceSettlements(data.positions || []);
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
    // Shift candle times by the device's UTC offset so the chart x-axis reads in the user's local
    // wall-clock (lightweight-charts renders `time` as if UTC). The override engine subtracts the
    // same offset back out, so the real instant it computes for pending/override logic is unchanged.
    const tzOffsetSec = deviceTzOffsetSec();
    const toCandle = (k) => klineToCandle(k, shiftSec + tzOffsetSec);
    const engine = createOverrideEngine({ symbol: selectedCoin.symbol, tfSec: 60, timeOffsetSec: shiftSec + tzOffsetSec });
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
            candle: { time: Math.floor(k.t / 1000) + shiftSec + tzOffsetSec, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v) || 0 },
          });
        } else if (data.e === 'aggTrade') {
          // Only the latest tick matters — coalesce (BTC can push dozens per second)
          const t = Number(data.T || data.E || Date.now());
          latestTickRef.current = { price: parseFloat(data.p), qty: parseFloat(data.q) || 0, bucketTime: Math.floor(t / 60000) * 60 + shiftSec + tzOffsetSec, eventTime: t };
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
        const shown = candles.filter((c) => (c.time - shiftSec - tzOffsetSec) <= cutoffSec);
        lastRawCandleRef.current = shown.length ? { ...shown[shown.length - 1] } : null;
        candles.filter((c) => (c.time - shiftSec - tzOffsetSec) > cutoffSec).forEach((c) => {
          pending.push({ eventTime: (c.time - shiftSec - tzOffsetSec) * 1000, candle: c });
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
      hapticError();
      setActionError(t('signals.minBalance'));
      return;
    }
    if (!signalBalance || signalBalance <= 0) {
      hapticError();
      setActionError(t('signals.emptyBalanceErr'));
      return;
    }
    hapticTap();
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
    hapticCommit();
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
      if (!res.ok) throw new Error(data.error || t('signals.couldNotPlace'));
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
    hapticTap();
    setCancelConfirm(null);
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setSignalBalance((prev) => prev + stake);
    try {
      const res = await fetch(getEndpoint('/cancel'), { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Cancel failed');
      loadAccount();
    } catch (err) {
      console.error(err);
      hapticError();
      setActionError(t('signals.couldNotCancel'));
      loadAccount();
    }
  };

  const currentPositions = useMemo(() => positions.filter((p) => !p.settled), [positions]);
  const historyPositions = useMemo(() => positions.filter((p) => p.settled), [positions]);
  const selectedLive = livePrices[selectedCoin.symbol];
  const stakeAmount = signalBalance ? Math.round(signalBalance * 0.01 * 100) / 100 : 0;
  const tzLabel = deviceTzLabel();

  // Settle time reads and writes in the DEVICE's own timezone. The picker and every label on this
  // screen agree because both use the phone's local wall-clock. Only the absolute epoch
  // (settleAtTarget) is sent to the server, so which zone the user is in never changes the instant a
  // trade settles — a Cairo user picking "3:40" gets the Cairo-3:40 instant, shown back to them as 3:40.
  const settlePreview = new Date(settleAtTarget);
  const timeValue = `${String(settlePreview.getHours()).padStart(2, '0')}:${String(settlePreview.getMinutes()).padStart(2, '0')}`;

  // Whole minutes only — seconds are zeroed so a trade lines up exactly with the signal time.
  const handleTimeChange = (e) => {
    if (!e.target.value) return;
    const [h, m] = e.target.value.split(':').map(Number);
    const srvNow = serverNow();
    const d = new Date(srvNow);
    d.setHours(h, m, 0, 0);
    let target = d.getTime();
    // Roll to the next day only when the chosen minute is genuinely behind the SERVER clock.
    // Comparing against the device clock here used to push a perfectly valid pick 24 hours out
    // whenever the phone was running a little fast, which silently guaranteed a timeout refund.
    if (target < Math.floor(srvNow / 60000) * 60000) target += 24 * 60 * 60 * 1000;
    setSettleAtTarget(target);
  };

  // ±1 minute steppers. Hitting an exact announced minute through the native time input means
  // opening the OS clock dialog and scrolling, which is where users mis-set the minute and lose;
  // two buttons make the common adjustment one tap. Same whole-minute rule as above — the value is
  // floored to the minute, so stepping can never introduce stray seconds.
  //
  // Deliberately CLAMPS at the next whole minute instead of rolling forward a day the way
  // handleTimeChange does: rolling 24 hours because someone tapped "−" once would be baffling, and
  // a settle time in the past is not a valid pick either way.
  const stepMinutes = (delta) => {
    hapticTick();
    const floorMin = Math.floor(serverNow() / 60000) * 60000 + 60000;
    const next = Math.floor(settleAtTarget / 60000) * 60000 + delta * 60000;
    setSettleAtTarget(Math.max(floorMin, next));
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
      <style>{`@keyframes kynexSlideIn { from { opacity: 0; transform: translateY(-12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes kxResultIn { 0% { opacity: 0; transform: translateY(18px) scale(0.94); } 60% { transform: translateY(-3px) scale(1.02); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes kxResultGlow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }`}</style>

      {/* Settlement result. Sits above the content rather than replacing anything, so a result that
          lands while the user is mid-tap cannot move the button out from under their finger. */}
      {settleFlash && (
        <div
          onClick={() => setSettleFlash(null)}
          style={{
            position: 'fixed', left: '16px', right: '16px', bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            zIndex: 9997, cursor: 'pointer',
            padding: '14px 16px', borderRadius: '16px',
            background: settleFlash.won ? theme.upGradient : theme.downGradient,
            boxShadow: theme.shadowElevated,
            animation: 'kxResultIn 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', animation: 'kxResultGlow 1.4s ease-in-out infinite',
          }}>
            {settleFlash.won ? '🎉' : '💔'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.3px' }}>
              {settleFlash.won ? t('signals.youWon') : t('signals.youLost')}
              {settleFlash.count > 1 && ` · ${t('signals.tradesCount', { count: settleFlash.count })}`}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 600 }}>
              {settleFlash.profit >= 0 ? '+' : '−'}{fmtUsd(Math.abs(settleFlash.profit))} USDT
            </div>
          </div>
          <X size={18} color="rgba(255,255,255,0.85)" style={{ flexShrink: 0 }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0 }}>{t('nav.signals')}</h3>
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
            {t('assets.signalBalance')}
          </span>
          <span style={{ fontWeight: 'bold', color: theme.brand }}>
            {signalBalance === null ? '...' : `${fmtUsd(signalBalance)} USDT`}
          </span>
        </div>
        {/* Today's signals — same limit the server enforces, shown up-front */}
        {bonusInfo.dailySignalLimit != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: theme.subtext }}>
            <span>{t('signals.signalsToday')}</span>
            <span style={{ fontWeight: 600, color: bonusInfo.signalsLeftToday === 0 ? theme.down : theme.text }}>
              {Math.min(bonusInfo.signalsUsedToday || 0, bonusInfo.dailySignalLimit)} / {bonusInfo.dailySignalLimit}
              {bonusInfo.bonusSignals > 0 && bonusInfo.bonusUsedToday < 1 ? t('signals.plusOneBonus') : ''}
              {bonusInfo.signalsLeftToday === 0 ? t('signals.limitReached') : ''}
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
                <span>{t('transfer.tradingVolume')} {done ? t('signals.volComplete') : ''}</span>
                <span style={{ fontWeight: 600, color: done ? theme.up : theme.text }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.inputBg || theme.cardBorder, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: done ? theme.upGradient : theme.brandGradient, width: `${pct}%`, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: '10px', color: theme.faint, marginTop: '4px' }}>
                {showAmounts && <>{fmtUsd(doneAmt)} / {fmtUsd(total)} USDT</>}
                {done
                  ? `${showAmounts ? ' · ' : ''}${t('signals.penaltyFreeTransfers')}`
                  : showAmounts ? t('signals.remainingToUnlock', { amt: fmtUsd(remaining) }) : t('signals.completeVolume')}
              </div>
            </div>
          );
        })()}
      </div>

      {signalBalance === 0 && (
        <div style={{ backgroundColor: theme.primarySoft, border: `1px solid ${theme.primary}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px' }}>
          {t('signals.emptyBalanceMsg')}{' '}
          <Link to="/assets" style={{ color: theme.primary, fontWeight: 'bold' }}>{t('signals.transferFromSpot')}</Link>{t('signals.toStartTrading')}
        </div>
      )}

      {/* Chart */}
      <div style={{ ...glassCard(theme), marginBottom: '14px', overflow: 'hidden' }}>
        <div ref={chartContainerRef} style={{ minHeight: '300px', position: 'relative' }} />
        <div style={{ textAlign: 'right', padding: '4px 12px 6px', fontSize: '10px', color: theme.faint, fontWeight: '600', borderTop: `1px solid ${theme.cardBorder}` }}>{tzLabel}</div>
      </div>

      {/* Trade size */}
      <div style={{ ...glassCard(theme), padding: '12px 16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: theme.subtext, fontSize: '13px' }}>{t('signals.tradeSize')} <span style={{ color: theme.faint, fontSize: '11px' }}>{t('signals.feeNote')}</span></span>
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
              {t('signals.upRoe')}
            </button>
            <button
              onClick={() => startPlacing('down')}
              style={{
                flex: 1, border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                background: theme.downGradient || theme.down, color: 'white',
                boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
              }}
            >
              {t('signals.downRoe')}
            </button>
          </div>
          <p style={{ color: theme.faint, fontSize: '11px', marginTop: 0, marginBottom: '14px' }}>
            {t('signals.pickDirection')}
          </p>

          {bonusInfo.bonusSignals > 0 && (
            <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '24px', border: `1px solid ${theme.up}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.up }}>{t('signals.referralBonus')}</span>
                <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                  <div style={{ fontSize: '12px', color: theme.subtext }}>{t('signals.remaining', { n: bonusInfo.bonusSignals })}</div>
                  {bonusInfo.daysRemaining > 0 && <div style={{ fontSize: '11px', color: theme.faint }}>{bonusInfo.daysRemaining === 1 ? t('signals.expiresInDay') : t('signals.expiresInDays', { n: bonusInfo.daysRemaining })}</div>}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px' }}>
                {t('signals.referralInfo', { sym: bonusInfo.referralSymbol ? bonusInfo.referralSymbol.replace('USDT','') : '—' })} <b style={{ color: theme.text }}>{bonusInfo.referralSignalTime || '—'}</b>
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
                  {placingBonus ? t('signals.placing') : t('signals.placeReferral', { amt: fmtUsd(signalBalance ? signalBalance * 0.01 : 0) })}
                </button>
              ) : bonusInfo.bonusUsedToday > 0 ? (
                <div style={{ fontSize: '12px', color: theme.faint, padding: '8px 0' }}>{t('signals.bonusUsedToday')}</div>
              ) : (
                <div style={{ fontSize: '12px', color: theme.faint, padding: '8px 0' }}>{t('signals.windowNotOpen')} <b>{bonusInfo.referralSignalTime}</b>.</div>
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
            <button onClick={() => setPendingDirection(null)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '13px' }}>{t('common.cancel')}</button>
          </div>

          <label style={{ fontSize: '12px', color: theme.subtext, marginBottom: '8px', display: 'block' }}>{t('signals.settleTime')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <button
              onClick={() => stepMinutes(-1)}
              aria-label={t('signals.oneMinEarlier')}
              style={{
                width: '46px', height: '46px', flexShrink: 0, borderRadius: '12px', cursor: 'pointer',
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '20px', fontWeight: 700, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${followsSignal ? theme.up : theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, boxSizing: 'border-box', fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}
            />
            <button
              onClick={() => stepMinutes(1)}
              aria-label={t('signals.oneMinLater')}
              style={{
                width: '46px', height: '46px', flexShrink: 0, borderRadius: '12px', cursor: 'pointer',
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '20px', fontWeight: 700, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
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
                ? <>{t('signals.followingSignalPre')} <b>{fmtClock(announcedSettleAt)}</b> {t('signals.followingSignalPost')}</>
                : settleAtTarget < announcedSettleAt
                  ? <>{t('signals.signalTimeIs')} <b>{fmtClock(announcedSettleAt)}</b>{t('signals.earlierWarn')}</>
                  : <>{t('signals.signalTimeIs')} <b>{fmtClock(announcedSettleAt)}</b>{t('signals.laterWarn', { close: fmtClock(announcedSettleAt + 60 * 1000) })}</>
              }
            </div>
          )}

          {announcedSettleAt !== null && !followsSignal && (
            <button
              onClick={() => { hapticTick(); setSettleAtTarget(announcedSettleAt); }}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px', marginBottom: '12px', cursor: 'pointer',
                border: `1px solid ${theme.up}`, backgroundColor: 'transparent', color: theme.up,
                fontWeight: 'bold', fontSize: '13px',
              }}
            >
              {t('signals.useSignalTime', { time: fmtClock(announcedSettleAt) })}
            </button>
          )}

          <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '14px' }}>
            {t('signals.currentTime')} <b style={{ color: theme.text }}>{fmtClock(now)}</b> {t('signals.settlesAtSep')} <b style={{ color: theme.text }}>{fmtClock(settleAtTarget)}</b>
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
            {placing ? t('signals.placing') : t('signals.confirmSettles', { dir: pendingDirection.toUpperCase(), time: fmtClock(settleAtTarget) })}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: `1px solid ${theme.cardBorder}`, marginBottom: '16px' }}>
        {[{ key: 'current', label: t('signals.tabCurrent') }, { key: 'history', label: t('common.history') }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '10px', fontSize: '14px', fontWeight: 'bold',
              color: activeTab === tab.key ? theme.primary : theme.faint,
              borderBottom: activeTab === tab.key ? `2px solid ${theme.primary}` : '2px solid transparent',
            }}
          >
            {tab.label}
            {tab.key === 'current' && currentPositions.length > 0 && (
              <span style={{ [isRTL ? 'marginRight' : 'marginLeft']: '6px', fontSize: '11px', backgroundColor: theme.primarySoft, color: theme.primary, padding: '2px 6px', borderRadius: '8px' }}>
                {currentPositions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'current' && (
        <div>
          {currentPositions.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>{t('trade.noOpenPositions')}</p>}
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
                <div style={{ color: theme.subtext, fontSize: '12px' }}>{t('signals.stakeEntry', { stake: fmtUsd(p.stake), entry: fmtUsd(p.entryPrice) })}</div>
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '4px' }}>{t('signals.openedSettles', { opened: fmtClockShort(p.openedAt), settles: fmtClockShort(p.settleAt), tz: tzLabel })}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ color: theme.text, fontSize: '13px', fontWeight: '500' }}>
                    {secondsLeft > 0 ? t('signals.timeLeft', { m: Math.floor(secondsLeft / 60), s: secondsLeft % 60 }) : t('signals.settling')}
                  </div>
                  {secondsLeft > 0 && (
                    <button
                      onClick={() => setCancelConfirm({ id: p.id, stake: p.stake, pair: p.pair })}
                      style={{
                        background: theme.downSoft, color: theme.down, border: 'none', padding: '6px 14px',
                        borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      }}
                    >
                      {t('common.cancel')}
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
                <div style={{ fontSize: '11px', fontWeight: '700', color: theme.subtext, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('signals.perfSummary')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.up }}>{wins}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>{t('signals.wins')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.down }}>{losses}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>{t('signals.losses')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: winRate >= 50 ? theme.up : theme.down }}>{winRate}%</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>{t('signals.winRate')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: totalProfit >= 0 ? theme.up : theme.down }}>{totalProfit >= 0 ? '+' : ''}{fmtUsd(totalProfit)}</div>
                    <div style={{ fontSize: '10px', color: theme.faint }}>{t('signals.totalPnl')}</div>
                  </div>
                </div>
              </div>
            );
          })()}
          {historyPositions.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>{t('signals.noSettled')}</p>}
          {historyPositions.map((p) => {
            const coin = COINS.find((c) => c.pair === p.pair);
            const isCancelled = !!p.cancelled;
            const isTimedOut = !!p.timedOut;
            const statusLabel = isTimedOut ? t('status.timedOut') : isCancelled ? t('status.cancelled') : (p.won ? t('status.win') : t('status.loss'));
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
                  {t('signals.stakeEntry', { stake: fmtUsd(p.stake), entry: fmtUsd(p.entryPrice) })}
                  {!isCancelled && !isTimedOut && <>{t('signals.closeSuffix', { close: fmtUsd(p.closePrice) })}</>}
                </div>
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{fmtClockShort(p.openedAt)} → {fmtClockShort(p.settleAt)} {tzLabel}</span>
                  <span style={{ color: p.direction === 'up' ? theme.up : theme.down, fontWeight: 'bold' }}>
                    · {p.pair.replace('USDT','').replace('/','').replace('USDT','')} {p.direction === 'up' ? t('signals.arrowUp') : t('signals.arrowDown')}
                  </span>
                </div>
                {!isCancelled && !isTimedOut && (
                  <div style={{ color: p.won ? theme.up : theme.down, fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>
                    {p.profit >= 0 ? '+' : ''}{fmtUsd(p.profit)} USDT
                  </div>
                )}
                {isCancelled && (
                  <div style={{ color: theme.faint, fontSize: '13px', marginTop: '4px' }}>{t('signals.stakeRefunded')}</div>
                )}
                {isTimedOut && (
                  <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>{t('signals.settledAfterClose')}</div>
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
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: theme.down }}>{t('signals.cancelSignalTitle')}</div>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 8px' }}>
              {t('signals.cancelConfirmPre')} <b>{cancelConfirm.pair}</b> {t('signals.cancelConfirmPost')}
            </p>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 20px' }}>
              {t('signals.refundPre')} <b>{fmtUsd(cancelConfirm.stake)} USDT</b> {t('signals.refundPost')}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCancelConfirm(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.card, color: theme.text, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                {t('signals.keepTrade')}
              </button>
              <button
                onClick={() => cancelTrade(cancelConfirm.id, cancelConfirm.stake)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: theme.downGradient || theme.down, color: 'white', fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                {t('signals.cancelTrade')}
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
