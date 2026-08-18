import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => navigate('/dashboard', { replace: true })} style={{ background: theme.primarySoft, border: 'none', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <Link to="/dashboard" replace style={{ textDecoration: 'none', color: theme.brand, fontWeight: 'bold', fontSize: '19px' }}>
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
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              replace
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
          flex: 1, minWidth: 0, width: 0, padding: '28px',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '16px', boxShadow: theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
          overflowX: 'hidden', boxSizing: 'border-box',
        }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .legal-wrapper {
            flex-direction: column !important;
            padding: 16px 12px 80px !important;
            gap: 16px !important;
          }
          .legal-sidebar {
            width: 100% !important;
            display: flex !important;
            overflow-x: auto !important;
            border-radius: 16px !important;
            flex-shrink: 0 !important;
          }
          .legal-sidebar a {
            white-space: nowrap;
            border-left: none !important;
            border-bottom: 3px solid transparent;
            text-align: center;
            padding: 12px 14px !important;
            font-size: 12px !important;
          }
          .legal-content {
            padding: 16px !important;
            width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
            min-height: 60vh !important;
          }
          .legal-content p,
          .legal-content ul,
          .legal-content li {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
        }
      `}</style>

      <div style={{ textAlign: 'center', color: theme.faint, fontSize: '12px', padding: '0 20px 32px' }}>
        Copyright © 2026 KYNEX. All rights reserved.
      </div>
    </div>
  );
};

export default LegalLayout;
