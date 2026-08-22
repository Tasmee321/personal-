import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, LogOut, Headphones, ChevronRight, Palette, Globe, Shield } from 'lucide-react';
import { logout } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';

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
  const { lang, setLang, t, LANGUAGES } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const chooseLanguage = (code) => {
    setLang(code); // context persists + applies dir/lang
    setLangOpen(false);
  };

  const selectedLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

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
        <span style={{ fontWeight: 'bold', fontSize: '17px', letterSpacing: '0.3px' }}>{t('settings.title')}</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Appearance */}
        <div style={{ ...glassCard(theme), padding: '4px 18px', marginBottom: '16px' }}>
          {row(
            <Palette size={17} color="white" />,
            t('settings.appearance'),
            null,
            null,
            false,
          )}
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px' }}>
            {[{ m: 'light', Icon: Sun, label: t('settings.light') }, { m: 'dark', Icon: Moon, label: t('settings.dark') }].map(({ m, Icon, label }) => (
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
            t('settings.language'),
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: theme.subtext, fontSize: '13px' }}>{selectedLang.flag} {selectedLang.label}</span>
              <ChevronRight size={16} color={theme.faint} style={{ transform: langOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>,
            () => setLangOpen(!langOpen),
            false,
          )}
          {langOpen && (
            <div style={{ paddingBottom: '12px' }}>
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => chooseLanguage(l.code)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '10px',
                  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                  backgroundColor: lang === l.code ? (theme.primarySoft) : 'transparent',
                  color: lang === l.code ? theme.primary : theme.text,
                  fontWeight: lang === l.code ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}>
                  <span style={{ fontSize: '18px' }}>{l.flag}</span><span>{l.label}</span>
                </button>
              ))}
              <div style={{ fontSize: '11px', color: theme.faint, padding: '6px 12px 0', lineHeight: 1.5 }}>
                {t('settings.langNote')}
              </div>
            </div>
          )}

          <Link to="/security" style={{ textDecoration: 'none', color: theme.text }}>
            {row(
              <Shield size={17} color="white" />,
              t('settings.security'),
              <ChevronRight size={16} color={theme.faint} />,
              null,
              true,
            )}
          </Link>

          <Link to="/legal/contact" style={{ textDecoration: 'none', color: theme.text }}>
            {row(
              <Headphones size={17} color="white" />,
              t('settings.support'),
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
          <LogOut size={16} /> {t('common.logout')}
        </button>
      </div>
    </div>
  );
};

export default Settings;
