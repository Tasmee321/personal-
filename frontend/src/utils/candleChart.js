// Shared Binance/OKX-style candlestick chart (lightweight-charts) used by Trade + Signals.
//
//   ┌ legend: O H L C  Chg          ┐   ← hovered candle, or the live one when not hovering
//   │         MA(7) MA(25) MA(99) Vol│
//   │  candles + MA lines            │
//   │  ─ ─ ─ last price line         │
//   ├────────────────────────────────┤
//   │  volume bars (up/down tinted)  │
//   └────────────────────────────────┘
//
// One object owns the full candle array so history backfill (candleHistory.js) and live ticks
// (kline / aggTrade) both go through setAll()/update() and every pane stays in sync.

import { createChart, CandlestickSeries, HistogramSeries, LineSeries, LineStyle, CrosshairMode } from 'lightweight-charts';

export const MA_DEFS = [
  { period: 7, color: '#F0B90B' },  // Binance yellow
  { period: 25, color: '#E252A0' }, // pink
  { period: 99, color: '#8B5CF6' }, // purple
];

const FONT = "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif";

function pricePrecision(p) {
  if (!(p > 0)) return 2;
  if (p >= 100) return 2;
  if (p >= 1) return 4;
  if (p >= 0.01) return 5;
  return 6;
}
function fmtNum(v, d) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtVol(v) {
  v = Number(v) || 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
}

/**
 * @param {HTMLElement} container  (will be made position:relative for the legend overlay)
 * @param {{ theme: any, height?: number }} opts
 */
export function createCandleChart(container, { theme, height = 300 }) {
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  const chart = createChart(container, {
    width: container.clientWidth,
    height,
    layout: { background: { color: 'transparent' }, textColor: theme.subtext, fontSize: 10, fontFamily: FONT },
    grid: { vertLines: { color: theme.cardBorder, style: LineStyle.Solid }, horzLines: { color: theme.cardBorder, style: LineStyle.Solid } },
    rightPriceScale: { borderColor: theme.cardBorder, scaleMargins: { top: 0.08, bottom: 0.24 } },
    timeScale: { borderColor: theme.cardBorder, timeVisible: true, secondsVisible: false, rightOffset: 6, barSpacing: 7, minBarSpacing: 0.5 },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: theme.faint, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.subtext },
      horzLine: { color: theme.faint, width: 1, style: LineStyle.Dashed, labelBackgroundColor: theme.subtext },
    },
    // vertTouchDrag off so the page can still scroll when a finger lands on the chart (like Binance app)
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    localization: { locale: 'en-US' },
  });

  const candles = chart.addSeries(CandlestickSeries, {
    upColor: theme.up, downColor: theme.down, borderVisible: false,
    wickUpColor: theme.up, wickDownColor: theme.down,
    priceLineVisible: true, priceLineWidth: 1, priceLineStyle: LineStyle.Dashed, lastValueVisible: true,
  });
  const volume = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' }, priceScaleId: 'vol',
    priceLineVisible: false, lastValueVisible: false,
  });
  volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false });
  const mas = MA_DEFS.map((d) => chart.addSeries(LineSeries, {
    color: d.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
  }));

  const upVol = `${theme.up}59`;
  const downVol = `${theme.down}59`;
  const volBar = (c) => ({ time: c.time, value: Number(c.volume) || 0, color: c.close >= c.open ? upVol : downVol });

  // ── data ────────────────────────────────────────────────────────────────
  let data = [];          // full candle array (asc by time)
  let precision = 2;
  const lastMa = MA_DEFS.map(() => null);

  const applyPrecision = (p) => {
    const next = pricePrecision(p);
    if (next === precision) return;
    precision = next;
    candles.applyOptions({ priceFormat: { type: 'price', precision, minMove: Number((10 ** -precision).toFixed(precision)) } });
  };

  const maAt = (i, period) => {
    if (i + 1 < period) return null;
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += data[j].close;
    return s / period;
  };

  function setAll(arr) {
    data = arr.slice();
    if (data.length) applyPrecision(data[data.length - 1].close);
    candles.setData(data);
    volume.setData(data.map(volBar));
    mas.forEach((s, mi) => {
      const p = MA_DEFS[mi].period;
      const pts = [];
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i].close;
        if (i >= p) sum -= data[i - p].close;
        if (i >= p - 1) pts.push({ time: data[i].time, value: sum / p });
      }
      s.setData(pts);
      lastMa[mi] = pts.length ? pts[pts.length - 1].value : null;
    });
    renderLegend();
  }

  function update(c) {
    const last = data[data.length - 1];
    if (last && c.time === last.time) {
      if (c.volume === undefined) c = { ...c, volume: last.volume }; // a tick without volume keeps the candle's volume
      data[data.length - 1] = c;
    } else if (!last || c.time > last.time) data.push(c);
    else return; // older than what we have — ignore
    candles.update(c);
    volume.update(volBar(c));
    const i = data.length - 1;
    mas.forEach((s, mi) => {
      const v = maAt(i, MA_DEFS[mi].period);
      if (v != null) { s.update({ time: c.time, value: v }); lastMa[mi] = v; }
    });
    if (!hovered) renderLegend();
  }

  // ── legend ──────────────────────────────────────────────────────────────
  const legend = document.createElement('div');
  Object.assign(legend.style, {
    position: 'absolute', top: '6px', left: '8px', right: '60px', zIndex: '3', pointerEvents: 'none',
    fontSize: '10px', lineHeight: '15px', fontFamily: FONT, color: theme.subtext,
    display: 'flex', flexDirection: 'column', gap: '1px', whiteSpace: 'nowrap', overflow: 'hidden',
  });
  const row1 = document.createElement('div');
  const row2 = document.createElement('div');
  row1.style.display = row2.style.display = 'flex';
  row1.style.gap = row2.style.gap = '8px';
  row1.style.flexWrap = row2.style.flexWrap = 'wrap';
  legend.append(row1, row2);
  container.appendChild(legend);

  const cell = (label, value, color) => {
    const span = document.createElement('span');
    span.textContent = `${label} `;
    const b = document.createElement('b');
    b.textContent = value;
    b.style.fontWeight = '600';
    if (color) b.style.color = color;
    span.appendChild(b);
    return span;
  };

  let hovered = null; // { c, vol, ma: [] } while the crosshair is over a candle
  function renderLegend() {
    row1.replaceChildren();
    row2.replaceChildren();
    const c = hovered ? hovered.c : data[data.length - 1];
    if (!c) return;
    const dirColor = c.close >= c.open ? theme.up : theme.down;
    const chg = c.open ? ((c.close - c.open) / c.open) * 100 : 0;
    row1.append(
      cell('O', fmtNum(c.open, precision), dirColor),
      cell('H', fmtNum(c.high, precision), dirColor),
      cell('L', fmtNum(c.low, precision), dirColor),
      cell('C', fmtNum(c.close, precision), dirColor),
      cell('', `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, dirColor),
    );
    const maVals = hovered ? hovered.ma : lastMa;
    MA_DEFS.forEach((d, i) => { if (maVals[i] != null) row2.append(cell(`MA(${d.period})`, fmtNum(maVals[i], precision), d.color)); });
    const vol = hovered ? hovered.vol : c.volume;
    if (vol != null) row2.append(cell('Vol', fmtVol(vol), theme.text));
  }

  chart.subscribeCrosshairMove((param) => {
    const c = param && param.time && param.point ? param.seriesData.get(candles) : null;
    if (!c) { if (hovered) { hovered = null; renderLegend(); } return; }
    hovered = {
      c,
      vol: param.seriesData.get(volume)?.value,
      ma: mas.map((s) => param.seriesData.get(s)?.value ?? null),
    };
    renderLegend();
  });

  return {
    chart,
    series: candles,          // main candlestick series (kept for existing callers)
    setAll,
    update,
    getData: () => data,
    resize: (w) => chart.applyOptions({ width: w }),
    remove: () => { try { legend.remove(); } catch { /* ignore */ } chart.remove(); },
  };
}
