import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, lightIconBadges, darkIconBadges } from './theme';

const MODE_KEY = 'kynex_theme_mode';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'light');

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    const bg = (mode === 'dark' ? darkTheme : lightTheme).bg;
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.documentElement.classList.toggle('kynex-dark', mode === 'dark');
    // Keep the browser / Android status-bar colour in sync with the theme (the notch area on
    // iOS shows the page background through the translucent status bar, so bg alone covers it)
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
    meta.setAttribute('content', bg);
  }, [mode]);

  const value = {
    mode,
    setMode,
    toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    theme: mode === 'dark' ? darkTheme : lightTheme,
    iconBadges: mode === 'dark' ? darkIconBadges : lightIconBadges,
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Solid status-bar / notch backdrop in the theme background — exactly the safe-area height,
          no gradient, so scrolled content is simply hidden under it and nothing looks "faded". */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, pointerEvents: 'none',
        height: 'env(safe-area-inset-top, 0px)',
        backgroundColor: theme.bg,
      }} />
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider intentionally
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
