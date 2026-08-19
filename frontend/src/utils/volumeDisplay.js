// Display-only scaling of the trading-volume requirement.
//
// The backend tracks the real rule (requiredVolume = depositBase × 5, tradedVolume
// accumulates signal stakes). That raw figure (e.g. "36.89 / 1,100 USDT") confuses
// users, so on screen we express the SAME percentage against the user's own Signal
// balance instead: "7.67 / 228.76 USDT". Nothing here changes any business logic —
// pct/complete are identical to what the server enforces.
export function scaleVolume(volumeData, signalBalance) {
  const vd = volumeData || {};
  const required = Number(vd.requiredVolume) || 0;
  const traded = Number(vd.tradedVolume) || 0;
  if (required <= 0) return null;

  const ratio = Math.min(1, traded / required);
  const complete = traded >= required;
  const pct = Math.min(100, ratio * 100);

  // "Total" the user sees: their current Signal balance; if that's 0 (all lost /
  // transferred out) fall back to what they put in, so we never show "0 / 0".
  const bal = Number(signalBalance) || 0;
  const total = bal > 0 ? bal : (Number(vd.depositBase) || 0);
  const done = complete ? total : total * ratio;
  const remaining = Math.max(0, total - done);

  return { pct, complete, total, done, remaining, showAmounts: total > 0 };
}
