import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, ArrowLeftRight, Radio, Wallet } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const BottomNav = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/markets', label: 'Markets', icon: LineChart },
    { path: '/trade', label: 'Trade', icon: ArrowLeftRight },
    { path: '/signals', label: 'Signals', icon: Radio },
    { path: '/assets', label: 'Assets', icon: Wallet },
  ];

  return (
    <div style={{ ...styles.navContainer, backgroundColor: theme.navBg, backdropFilter: theme.cardGlass || 'blur(18px)', WebkitBackdropFilter: theme.cardGlass || 'blur(18px)', borderTop: `1px solid ${theme.navBorder}` }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{ ...styles.navItem, color: isActive ? theme.primary : theme.faint }}>
            <div style={{ ...styles.iconWrap, backgroundColor: isActive ? theme.primarySoft : 'transparent' }}>
              <Icon size={19} color={isActive ? theme.primary : theme.faint} />
            </div>
            <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive ? 'bold' : 'normal' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 0 12px',
    boxShadow: '0 -4px 16px rgba(30,41,82,0.05)',
    zIndex: 1000,
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
  },
  iconWrap: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px',
    transition: 'background-color 0.15s ease',
  },
};

export default BottomNav;
