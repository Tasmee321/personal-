import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, ArrowLeftRight, Zap, Wallet } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home',    icon: Home,           color: '#60A5FA', soft: 'rgba(96,165,250,0.15)' },
  { path: '/markets',   label: 'Markets', icon: LineChart,      color: '#A78BFA', soft: 'rgba(167,139,250,0.15)' },
  { path: '/signals',   label: 'Signals', icon: Zap,            color: null,      soft: null, center: true },
  { path: '/trade',     label: 'Trade',   icon: ArrowLeftRight, color: '#34D399', soft: 'rgba(52,211,153,0.15)' },
  { path: '/assets',    label: 'Assets',  icon: Wallet,         color: '#FBBF24', soft: 'rgba(251,191,36,0.15)' },
];

const BottomNav = () => {
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      backgroundColor: theme.navBg,
      backdropFilter: theme.cardGlass || 'blur(18px)',
      WebkitBackdropFilter: theme.cardGlass || 'blur(18px)',
      borderTop: `1px solid ${theme.navBorder}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      // Keep the nav above the iPhone home indicator / Android gesture bar
      padding: '8px 0 calc(14px + env(safe-area-inset-bottom, 0px))',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
    }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.path === '/assets'
          ? ['/assets', '/deposit', '/withdraw', '/transfer', '/transactions'].some((p) => location.pathname.startsWith(p))
          : location.pathname === item.path;

        if (item.center) {
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: isActive
                  ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                  : 'linear-gradient(135deg, #A78BFA, #818CF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(139,92,246,0.5)',
                marginTop: '-18px',
                border: `2px solid ${theme.navBg}`,
              }}>
                <Icon size={22} color="white" />
              </div>
              <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold', color: isActive ? '#A78BFA' : theme.faint }}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '52px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              backgroundColor: isActive ? item.soft : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '2px',
              transition: 'background-color 0.15s ease',
            }}>
              <Icon size={20} color={isActive ? item.color : theme.faint} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500', color: isActive ? item.color : theme.faint }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
