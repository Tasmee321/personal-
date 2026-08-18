import { useTheme } from '../ThemeContext';
import { PTR_THRESHOLD, PTR_MAX_PULL } from '../utils/usePullToRefresh';

// Visual indicator for usePullToRefresh (../utils/usePullToRefresh.js)
export default function PullIndicator({ pull, refreshing }) {
  const { theme } = useTheme();
  const visible = pull > 4 || refreshing;
  if (!visible) return null;
  const progress = Math.min(1, pull / PTR_THRESHOLD);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1500, pointerEvents: 'none',
      display: 'flex', justifyContent: 'center',
      transform: `translateY(${Math.min(pull, PTR_MAX_PULL) - 46}px)`,
      transition: refreshing ? 'transform 0.2s ease' : 'none',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadowElevated,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: refreshing ? 1 : 0.4 + progress * 0.6,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
            animation: refreshing ? 'kynexSpin 0.8s linear infinite' : 'none',
          }}>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
        <style>{`@keyframes kynexSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
