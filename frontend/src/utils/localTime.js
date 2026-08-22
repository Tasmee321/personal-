// Device-local time helpers for USER-FACING displays.
//
// The whole app stores and sends times as absolute epoch-ms instants (e.g. a signal's
// settleAt is an epoch that goes to the server as `settleAtRequested`). The timezone is
// therefore ONLY a display concern — rendering the same instant in a different zone never
// changes when a signal fires or settles, only how the clock reads to the user.
//
// User-facing screens use these helpers so every user sees times in their OWN phone's
// timezone (Cairo user → Cairo time, Dubai user → Dubai time). The admin panel
// (AdminKyc.jsx) deliberately does NOT use these — it stays pinned to PKT (Asia/Karachi)
// because the operator is in Pakistan and the server schedules every window in PKT.

// Device UTC offset in seconds (east of UTC positive). getTimezoneOffset() returns minutes
// BEHIND UTC, so it is negated. Used to shift lightweight-charts candle times (which the
// library renders as if UTC) so the chart x-axis reads in the user's local wall-clock —
// exactly how the old fixed +5h shift made the axis read in PKT. The override engine
// subtracts the same offset back out, so the real instant it computes is unaffected.
export function deviceTzOffsetSec() {
  return -new Date().getTimezoneOffset() * 60;
}

// Local HH:MM:SS (with seconds) — mirrors the old fmtClock, minus the forced PKT zone.
export function fmtLocalClock(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Local HH:MM — mirrors the old fmtClockShort.
export function fmtLocalClockShort(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Local date + time for transaction detail rows (mirrors the old en-GB/Karachi format,
// minus the forced zone; uses the device locale too).
export function fmtLocalDateTime(ms) {
  return new Date(ms).toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// Short label for the device timezone, shown where "PKT" used to be hardcoded so the user
// knows the clock is in their local zone. Prefers the platform's short name (e.g. "PKT",
// "GMT+2", "EDT"); falls back to a computed "GMT±H" if the platform doesn't provide one.
export function deviceTzLabel() {
  try {
    const parts = new Intl.DateTimeFormat([], { timeZoneName: 'short' }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName');
    if (tz && tz.value) return tz.value;
  } catch { /* fall through */ }
  const offMin = -new Date().getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const h = Math.floor(Math.abs(offMin) / 60);
  const m = Math.abs(offMin) % 60;
  return `GMT${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}
