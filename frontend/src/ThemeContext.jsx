import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, lightIconBadges, darkIconBadges } from './theme';

const MODE_KEY = 'kynex_theme_mode';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || 'light');

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
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
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, pointerEvents: 'none',
        height: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        background: `linear-gradient(to bottom, ${theme.bg} 40%, transparent)`,
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
