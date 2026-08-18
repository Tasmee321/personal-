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

// Apply the admin candle-override bias to a candle. Same magnitudes as before
// (bias 0.03–0.07%, oscillation ±0.06%) but stable per candle and smoothly varying within it.
// `nowMs` drives a gentle sinusoidal wobble so the candle still looks alive.
export function applyOverrideDrift(c, override, nowMs = Date.now()) {
  if (!override || !c) return c;
  const r1 = candleRand(c.time);
  const r2 = candleRand(c.time + 7);
  const r3 = candleRand(c.time + 13);
  const biasFactor = 0.0003 + r1 * 0.0004;                     // 0.03–0.07% per candle
  const phase = ((nowMs / 1000) % 60) / 60 * Math.PI * 2;      // one slow cycle per minute
  const wobble = 0.55 + 0.45 * Math.sin(phase + r3 * Math.PI * 2);
  const noise = (r2 - 0.45) * c.open * 0.0006 * wobble;         // ≤ ±0.06%
  const drift = override.direction === 'up' ? biasFactor * c.open : -biasFactor * c.open;
  const out = { ...c, close: +(c.close + drift + noise).toFixed(8) };
  if (override.direction === 'up') {
    out.high = Math.max(out.high, out.close, out.open + out.open * 0.0002);
    out.low = Math.min(out.low, out.open - out.open * 0.0001);
  } else {
    out.low = Math.min(out.low, out.close, out.open - out.open * 0.0002);
    out.high = Math.max(out.high, out.open + out.open * 0.0001);
  }
  return out;
}

// Merge a trade tick (price at tradeTimeMs) into the current candle.
// Returns the candle to draw, or null if the tick belongs to an older bucket (ignore).
// `bucketTime` = start of the tick's candle in the chart's time base (seconds, incl. offsets).
export function mergeTradeTick(lastCandle, price, bucketTime) {
  if (!Number.isFinite(price)) return null;
  if (!lastCandle || bucketTime > lastCandle.time) {
    // First tick of a new candle — open at the tick price until the kline stream confirms
    return { time: bucketTime, open: price, high: price, low: price, close: price };
  }
  if (bucketTime < lastCandle.time) return null;
  return {
    ...lastCandle,
    close: price,
    high: Math.max(lastCandle.high, price),
    low: Math.min(lastCandle.low, price),
  };
}
