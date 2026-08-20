import { useTheme } from '../ThemeContext';

// Shared skeleton loader. Before this, only the Dashboard showed a loading placeholder; every other
// screen rendered its empty shell first (zeros, blank lists) and then snapped to real data, which
// reads as "my balance is 0" for a beat. A skeleton says "loading" instead of lying.
//
// One keyframe, injected once per mount. Matches the Dashboard's existing kynexShimmer so the whole
// app pulses at the same rhythm. Honours prefers-reduced-motion through the global CSS rule in
// index.css, which collapses the animation for users who asked for less movement.

export function Shimmer({ w = '100%', h = 16, r = 10, mb = 0, style = {} }) {
  const { theme } = useTheme();
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0,
      backgroundColor: theme.cardBorder,
      animation: 'kynexShimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

// A stack of card-shaped skeletons — the common "list is loading" case (transactions, positions,
// markets). `rows` cards of `height`, spaced like the real lists on those pages.
export function SkeletonList({ rows = 4, height = 68, gap = 12 }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <style>{`@keyframes kynexShimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height, borderRadius: 14, backgroundColor: theme.cardBorder,
          animation: 'kynexShimmer 1.4s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

// Empty state — an icon, a headline and an optional action, centred. Replaces the bare one-line
// "No transactions" text so an empty screen looks intentional rather than broken or still-loading.
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  const { theme } = useTheme();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '40px 24px', gap: '8px',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 30, marginBottom: 4,
        backgroundColor: theme.inputBg || theme.cardBorder,
      }}>{icon}</div>
      <div style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ color: theme.subtext, fontSize: 13, maxWidth: 260, lineHeight: 1.5 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export default Shimmer;
