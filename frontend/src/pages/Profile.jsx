import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Users, Settings as SettingsIcon, Mail, Headphones, LogOut, BadgeCheck, ShieldAlert, Clock, Copy, Check, ChevronRight, Wallet } from 'lucide-react';
import { getToken, logout } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';

const MENU = [
  { to: '/security', label: 'Security', icon: ShieldCheck, badgeKey: 'blue' },
  { to: '/invite', label: 'Invites & Referrals', icon: Users, badgeKey: 'purple' },
  { to: '/assets', label: 'My Assets', icon: Wallet, badgeKey: 'green' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, badgeKey: 'amber' },
  { to: '/messages', label: 'Messages', icon: Mail, badgeKey: 'teal' },
  { to: '/legal/contact', label: 'Support', icon: Headphones, badgeKey: 'pink' },
];

function glassCard(theme) {
  return {
    backgroundColor: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadowElevated || theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
  };
}

const Profile = () => {
  const { theme, iconBadges } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/account/profile`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (res.ok) setProfile(data);
      } catch { /* stays loading */ }
    };
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const copyUid = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const kycBadge = (status) => {
    if (status === 'certified') return { label: 'Certified', color: theme.up, bg: theme.upSoft, Icon: BadgeCheck };
    if (status === 'pending') return { label: 'Pending', color: theme.brand, bg: theme.brandSoft, Icon: Clock };
    return { label: 'Not Verified', color: theme.faint, bg: theme.primarySoft, Icon: ShieldAlert };
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
      }}>
        <Link to="/dashboard" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Profile</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {!profile && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: theme.cardBorder, margin: '0 auto 12px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '120px', height: '16px', borderRadius: '8px', backgroundColor: theme.cardBorder, margin: '0 auto 8px' }} />
            <div style={{ width: '80px', height: '12px', borderRadius: '6px', backgroundColor: theme.cardBorder, margin: '0 auto' }} />
          </div>
        )}

        {profile && (
          <>
            {/* Avatar + Info card */}
            <div style={{ ...glassCard(theme), padding: '24px 20px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%', margin: '0 auto 14px',
                background: theme.primaryGradient || theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 'bold', color: 'white',
                boxShadow: '0 6px 20px rgba(59,130,246,0.3)',
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{profile.name}</span>
                <span style={{
                  fontSize: '11px', fontWeight: 'bold', color: theme.brand,
                  background: theme.brandSoft, padding: '3px 10px', borderRadius: '10px',
                }}>
                  LV{profile.level}
                </span>
              </div>

              <div style={{ color: theme.subtext, fontSize: '13px', marginBottom: '12px' }}>{profile.email}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={copyUid}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px',
                    border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
                    color: theme.subtext, fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  UID: {profile.uid}
                  {copied ? <Check size={12} color={theme.up} /> : <Copy size={12} />}
                </button>

                {(() => {
                  const badge = kycBadge(profile.kycStatus);
                  return (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold',
                      color: badge.color, backgroundColor: badge.bg, padding: '5px 10px', borderRadius: '10px',
                    }}>
                      <badge.Icon size={12} /> {badge.label}
                    </span>
                  );
                })()}
              </div>

              {profile.createdAt && (
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '10px' }}>
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Menu */}
            <div style={{ ...glassCard(theme), overflow: 'hidden', marginBottom: '20px' }}>
              {MENU.map((item, i) => {
                const Icon = item.icon;
                const badge = iconBadges[item.badgeKey];
                return (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', textDecoration: 'none', color: theme.text,
                    borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', backgroundColor: badge?.bg || theme.primarySoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={17} color={badge?.fg || theme.primary} />
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                    <ChevronRight size={16} color={theme.faint} />
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: theme.downGradient || theme.down, color: 'white', fontWeight: 'bold', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
