import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, LogOut, Headphones, ChevronRight, Palette, Globe, Shield } from 'lucide-react';
import { logout } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { LANGUAGES, applyLanguage } from '../utils/language';

export { applyLanguage };

function glassCard(theme) {
  return {
    backgroundColor: theme.card,
    borderRadius: '18px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadowElevated || theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
  };
}

const Settings = () => {
  const { theme, mode, setMode } = useTheme();
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('kynex_language');
    if (saved) return saved;
    const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
    const match = LANGUAGES.find(l => l.code === browserLang);
    const detected = match ? match.code : 'en';
    localStorage.setItem('kynex_language', detected);
    return detected;
  });
  const [langOpen, setLangOpen] = useState(false);

  const chooseLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('kynex_language', code);
    applyLanguage(code);
    setLangOpen(false);
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);

  const row = (icon, label, right, onClick, borderTop) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 0',
        borderTop: borderTop ? `1px solid ${theme.cardBorder}` : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: theme.primaryGradient || theme.primarySoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{label}</span>
      {right}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Glass header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)',
        WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
      }}>
        <Link to="/profile" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.3px' }}>Settings</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Appearance */}
        <div style={{ ...glassCard(theme), padding: '4px 18px', marginBottom: '16px' }}>
          {row(
            <Palette size={17} color="white" />,
            'Appearance',
            null,
            null,
            false,
          )}
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px' }}>
            {[{ m: 'light', Icon: Sun, label: 'Light' }, { m: 'dark', Icon: Moon, label: 'Dark' }].map(({ m, Icon, label }) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                border: mode === m ? 'none' : `1px solid ${theme.cardBorder}`,
                background: mode === m ? (theme.primaryGradient || theme.primarySoft) : 'transparent',
                color: mode === m ? 'white' : theme.subtext,
                boxShadow: mode === m ? '0 4px 14px rgba(36,104,242,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language + Security + Support */}
        <div style={{ ...glassCard(theme), padding: '4px 18px', marginBottom: '16px' }}>
          {row(
            <Globe size={17} color="white" />,
            'Language',
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: theme.subtext, fontSize: '13px' }}>{selectedLang.flag} {selectedLang.label}</span>
              <ChevronRight size={16} color={theme.faint} style={{ transform: langOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>,
            () => setLangOpen(!langOpen),
            false,
          )}
          {langOpen && (
            <div style={{ paddingBottom: '12px' }}>
              {LANGUAGES.map((lang) => (
                <button key={lang.code} onClick={() => chooseLanguage(lang.code)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '10px',
                  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                  backgroundColor: language === lang.code ? (theme.primarySoft) : 'transparent',
                  color: language === lang.code ? theme.primary : theme.text,
                  fontWeight: language === lang.code ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}>
                  <span style={{ fontSize: '18px' }}>{lang.flag}</span><span>{lang.label}</span>
                </button>
              ))}
              <div style={{ fontSize: '11px', color: theme.faint, padding: '6px 12px 0', lineHeight: 1.5 }}>
                Applies to the login &amp; sign-up screens and text direction. Full in-app translation is coming soon.
              </div>
            </div>
          )}

          <Link to="/security" style={{ textDecoration: 'none', color: theme.text }}>
            {row(
              <Shield size={17} color="white" />,
              'Security',
              <ChevronRight size={16} color={theme.faint} />,
              null,
              true,
            )}
          </Link>

          <Link to="/legal/contact" style={{ textDecoration: 'none', color: theme.text }}>
            {row(
              <Headphones size={17} color="white" />,
              'Support',
              <ChevronRight size={16} color={theme.faint} />,
              null,
              true,
            )}
          </Link>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); window.location.href = '/'; }}
          style={{
            width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
            background: theme.brandGradient || theme.brand,
            color: 'white', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '14px', boxShadow: '0 4px 14px rgba(217,119,6,0.3)',
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
