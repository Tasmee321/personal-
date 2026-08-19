// Server-synced clock. Phone clocks are often seconds off; admin candle overrides must start at
// exactly startsAt (server time), so every poll of /api/candle-overrides/active reports the
// server time and we keep the offset from the lowest-latency sample.
let offsetMs = 0;
let bestRtt = Infinity;
let samples = 0;

export function noteServerTime(serverTimeMs, rttMs = 0) {
  if (!Number.isFinite(serverTimeMs)) return;
  const est = serverTimeMs + rttMs / 2 - Date.now();
  samples += 1;
  // prefer the sample with the smallest round-trip; slowly re-open the gate so drift is tracked
  if (rttMs <= bestRtt || samples % 20 === 0) { bestRtt = rttMs; offsetMs = est; }
}

export function serverNow() { return Date.now() + offsetMs; }
export function clockOffsetMs() { return offsetMs; }
