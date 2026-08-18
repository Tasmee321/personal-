import { useEffect, useRef, useState, useCallback } from 'react';

export const PTR_THRESHOLD = 70;   // px of (damped) pull needed to trigger
export const PTR_MAX_PULL = 110;   // visual cap

// Touch-only pull-to-refresh for pages that scroll the window.
// Passive listeners: native scrolling is never blocked; we only *observe* a downward drag that
// starts at the very top of the page. Returns { pull, refreshing } for the indicator.
export function usePullToRefresh(onRefresh, { enabled = true } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);
  const cbRef = useRef(onRefresh);
  useEffect(() => { cbRef.current = onRefresh; }, [onRefresh]);

  const finish = useCallback(async () => {
    setRefreshing(true);
    setPull(PTR_THRESHOLD * 0.7);
    const started = Date.now();
    try { await cbRef.current?.(); } catch { /* page's own error handling */ }
    const wait = Math.max(0, 500 - (Date.now() - started)); // keep spinner visible briefly
    setTimeout(() => { setRefreshing(false); setPull(0); }, wait);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('ontouchstart' in window)) return;
    const onStart = (e) => {
      if (refreshing) return;
      if ((window.scrollY || document.documentElement.scrollTop || 0) > 0) { startY.current = null; return; }
      startY.current = e.touches[0].clientY;
      active.current = false;
    };
    const onMove = (e) => {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { if (active.current) { active.current = false; setPull(0); } return; }
      if ((window.scrollY || 0) > 0) return; // user is scrolling content, not pulling
      active.current = true;
      setPull(Math.min(PTR_MAX_PULL, dy * 0.5));
    };
    const onEnd = () => {
      if (startY.current == null) return;
      startY.current = null;
      if (!active.current) return;
      active.current = false;
      setPull((p) => {
        if (p >= PTR_THRESHOLD && !refreshing) { finish(); return p; }
        return 0;
      });
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, refreshing, finish]);

  return { pull, refreshing };
}
