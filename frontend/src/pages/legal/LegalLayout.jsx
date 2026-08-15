import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';

const navItems = [
  { path: 'contact', label: 'Contact Us' },
  { path: 'member-guide', label: 'Member Guide' },
  { path: 'about', label: 'About Us' },
  { path: 'user-agreement', label: 'User Agreement' },
  { path: 'privacy', label: 'Privacy Policy' },
  { path: 'disclaimer', label: 'Risk Disclosure' },
];

const LegalLayout = () => {
  const { theme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '16px 24px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: theme.brand, fontWeight: 'bold', fontSize: '20px' }}>
          KYNEX
        </Link>
      </div>

      <div className="legal-wrapper" style={{
        display: 'flex', alignItems: 'flex-start',
        maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px', gap: '32px',
      }}>
        {/* Sidebar */}
        <div className="legal-sidebar" style={{
          width: '220px', flexShrink: 0,
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'block', padding: '14px 18px', fontSize: '14px', textDecoration: 'none',
                color: isActive ? theme.brand : theme.subtext,
                backgroundColor: isActive ? theme.brandSoft : 'transparent',
                borderLeft: isActive ? `3px solid ${theme.brand}` : '3px solid transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Content */}
        <div className="legal-content" style={{
          flex: 1, minWidth: 0, padding: '28px',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '16px', boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .legal-wrapper { flex-direction: column !important; }
          .legal-sidebar {
            width: 100% !important;
            display: flex !important;
            overflow-x: auto !important;
            border-radius: 12px !important;
          }
          .legal-sidebar a {
            white-space: nowrap;
            border-left: none !important;
            border-bottom: 3px solid transparent;
            text-align: center;
            padding: 12px 16px !important;
            font-size: 13px !important;
          }
          .legal-content { padding: 20px !important; }
        }
      `}</style>

      <div style={{ textAlign: 'center', color: theme.faint, fontSize: '12px', padding: '0 20px 32px' }}>
        Copyright © 2026 KYNEX. All rights reserved.
      </div>
    </div>
  );
};

export default LegalLayout;
