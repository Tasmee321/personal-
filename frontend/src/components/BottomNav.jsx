import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, ArrowLeftRight, Zap, Wallet } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home',    icon: Home,           badgeKey: 'blue' },
  { path: '/markets',   label: 'Markets', icon: LineChart,      badgeKey: 'purple' },
  { path: '/signals',   label: 'Signals', icon: Zap,            badgeKey: 'purple', center: true },
  { path: '/trade',     label: 'Trade',   icon: ArrowLeftRight, badgeKey: 'green' },
  { path: '/assets',    label: 'Assets',  icon: Wallet,         badgeKey: 'amber' },
];

const BottomNav = () => {
  const location = useLocation();
  const { theme, iconBadges } = useTheme();

  return (
    <div data-kynex-bottomnav="1" style={{
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
        const badge = iconBadges[item.badgeKey];
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
              <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold', color: isActive ? iconBadges.purple.fg : theme.faint }}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link key={item.path} to={item.path} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '52px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              backgroundColor: isActive ? badge.bg : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '2px',
              transition: 'background-color 0.15s ease',
            }}>
              <Icon size={20} color={isActive ? badge.fg : theme.faint} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500', color: isActive ? badge.fg : theme.faint }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
