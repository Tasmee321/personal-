// Progressive candle history for lightweight-charts.
//
// Problem: pages fetched a single small batch (120–200 candles) so the chart ran out of
// history after a few hours, and the first paint waited on that one request while other
// startup traffic competed for the connection.
//
// Approach (like Binance's app):
//   1. small, fast initial fetch → paint immediately, show the last `visibleBars`
//   2. immediately backfill one older chunk in the background (so the first scroll-back is instant)
//   3. whenever the view nears the left edge, fetch the next older chunk (1000 candles) —
//      until at least HISTORY_DAYS are loaded or Binance has nothing older.
// Live ticks keep flowing through target.update(); backfill merges around them using
// target.getData()/setAll() (see candleChart.js), so the current candle is never reset by a
// history load and volume/MA panes stay in sync.

export const HISTORY_DAYS = 7;
const INITIAL_LIMIT = 300;      // fast first paint (~35 KB)
const CHUNK_LIMIT = 1000;       // Binance max per request
const LOAD_MORE_THRESHOLD = 200; // bars from the left edge that trigger the next backfill

export async function fetchKlines(symbol, interval, { limit = 500, endTime, signal } = {}) {
  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));
  if (endTime) url.searchParams.set('endTime', String(endTime));
  const res = await fetch(url.toString(), { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`klines ${res.status}`);
  const raw = await res.json();
  return Array.isArray(raw) ? raw : [];
}

/** Raw Binance kline row → candle. `timeOffsetSec` lets pages shift to PKT (and any artificial delay). */
export function klineToCandle(k, timeOffsetSec = 0) {
  return {
    time: Math.floor(k[0] / 1000) + timeOffsetSec,
    open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]),
    volume: parseFloat(k[5]) || 0,
  };
}

/**
 * @param {object} o
 * @param {{chart: import('lightweight-charts').IChartApi, getData: () => any[], setAll: (c: any[]) => void}} o.target
 *        the object returned by createCandleChart()
 * @param {string} o.symbol   e.g. 'BTCUSDT'
 * @param {string} o.interval e.g. '1m'
 * @param {(k: any[]) => {time:number,open:number,high:number,low:number,close:number,volume?:number}} o.toCandle
 *        raw Binance kline row → chart candle (page applies its own time offset)
 * @param {(candles: any[]) => any[] | void} [o.onInitial]
 *        called with the initial candles BEFORE they are drawn; may return a filtered array to draw instead
 * @param {number} [o.visibleBars=120]  how many bars to show on first paint
 * @param {number} [o.days=HISTORY_DAYS] how far back scrolling can load
 * @returns {() => void} dispose
 */
export function attachHistoryLoader({ target, symbol, interval, toCandle, onInitial, visibleBars = 120, days = HISTORY_DAYS }) {
  const ac = new AbortController();
  const ts = target.chart.timeScale();
  const targetStartMs = Date.now() - days * 86400000;
  let oldestOpenMs = null;
  let intervalMs = 0;      // learned from the initial data — sizes the last chunk so we don't over-fetch past `days`
  let loading = false;
  let exhausted = false;
  let disposed = false;

  const loadOlder = async () => {
    if (loading || exhausted || disposed || oldestOpenMs == null || oldestOpenMs <= targetStartMs) return;
    loading = true;
    try {
      const needed = intervalMs > 0 ? Math.ceil((oldestOpenMs - targetStartMs) / intervalMs) + 5 : CHUNK_LIMIT;
      const limit = Math.max(50, Math.min(CHUNK_LIMIT, needed));
      const raw = await fetchKlines(symbol, interval, { limit, endTime: oldestOpenMs - 1, signal: ac.signal });
      if (disposed) return;
      const older = raw.filter((k) => k[0] < oldestOpenMs);
      if (!older.length) { exhausted = true; return; }
      oldestOpenMs = older[0][0];
      const current = target.getData();
      const firstTime = current.length ? current[0].time : Infinity;
      const prepend = older.map(toCandle).filter((c) => c.time < firstTime);
      if (!prepend.length) { exhausted = true; return; }
      const vr = ts.getVisibleLogicalRange();
      target.setAll([...prepend, ...current]);
      // keep the user's view exactly where it was (logical indices shift by what we prepended)
      if (vr) ts.setVisibleLogicalRange({ from: vr.from + prepend.length, to: vr.to + prepend.length });
      if (raw.length < limit) exhausted = true; // Binance has nothing older
    } catch { /* keep what we have; the next scroll retries */ }
    finally { loading = false; }
  };

  const onRange = (range) => { if (range && range.from < LOAD_MORE_THRESHOLD) loadOlder(); };

  (async () => {
    try {
      const raw = await fetchKlines(symbol, interval, { limit: INITIAL_LIMIT, signal: ac.signal });
      if (disposed || !raw.length) return;
      oldestOpenMs = raw[0][0];
      if (raw.length > 1) intervalMs = raw[1][0] - raw[0][0];
      const candles = raw.map(toCandle);
      const toDraw = (onInitial && onInitial(candles)) || candles;
      target.setAll(toDraw);
      const n = toDraw.length;
      ts.setVisibleLogicalRange({ from: Math.max(0, n - visibleBars), to: n + 3 });
      ts.subscribeVisibleLogicalRangeChange(onRange);
      onRange(ts.getVisibleLogicalRange()); // first background backfill
    } catch { /* WS keeps the chart alive even if REST fails */ }
  })();

  return () => {
    disposed = true;
    ac.abort();
    try { ts.unsubscribeVisibleLogicalRangeChange(onRange); } catch { /* chart already removed */ }
  };
}
