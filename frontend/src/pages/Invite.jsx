import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Users, UserPlus, TrendingUp, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';

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

function CopyRow({ label, value, theme }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ color: theme.subtext, fontSize: '12px', marginBottom: '6px' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px',
        ...glassCard(theme),
      }}>
        <span style={{ flex: 1, fontSize: '14px', wordBreak: 'break-all' }}>{value}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? theme.up : theme.primary, display: 'flex', flexShrink: 0 }}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );
}

const Invite = () => {
  const { theme, iconBadges } = useTheme();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invite/summary`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load invite details.');
        setSummary(data);
      } catch (err) {
        setError(err.message);
      }
    };
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const invitationLink = summary ? `${window.location.origin}/auth?ref=${summary.inviteCode}` : '';

  const shareLink = async () => {
    const text = `Join KYNEX — trade crypto with me! Use my code: ${summary?.inviteCode}\n${invitationLink}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Join KYNEX', text, url: invitationLink }); } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const stats = summary ? [
    { label: 'Team Members', value: summary.teamMembers, Icon: Users, badge: iconBadges.purple },
    { label: 'Level 1 Count', value: summary.levelOneCount, Icon: UserPlus, badge: iconBadges.blue },
    { label: 'Top Up Users', value: summary.topUpUsers, Icon: TrendingUp, badge: iconBadges.green },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
      }}>
        <Link to="/profile" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Invite Friends</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
        {error && (
          <div style={{ color: theme.down, fontSize: '13px', marginBottom: '16px', padding: '10px 14px', backgroundColor: theme.downSoft, borderRadius: '10px' }}>{error}</div>
        )}

        {summary && (
          <>
            {/* UID card */}
            <div style={{
              ...glassCard(theme),
              background: theme.brandGradient || `linear-gradient(135deg, ${theme.primarySoft} 0%, ${theme.brandSoft} 100%)`,
              padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: theme.subtext, fontSize: '12px', marginBottom: '4px' }}>My UID</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{summary.uid}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: theme.subtext, fontSize: '12px', marginBottom: '4px' }}>Referrer UID</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{summary.referrerUid || '--'}</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {stats.map((s) => (
                <div key={s.label} style={{
                  flex: 1, padding: '16px 10px', textAlign: 'center', ...glassCard(theme),
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', backgroundColor: s.badge.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
                  }}>
                    <s.Icon size={17} color={s.badge.fg} />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>{s.value}</div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Invite code + link */}
            <CopyRow label="My Invitation Code" value={summary.inviteCode} theme={theme} />
            <CopyRow label="Invitation Link" value={invitationLink} theme={theme} />

            {/* Share button */}
            <button
              onClick={shareLink}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 'bold', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 18px rgba(59,130,246,0.3)', marginBottom: '16px',
              }}
            >
              <Share2 size={16} /> Share Invite Link
            </button>

            {/* Invite log toggle */}
            <button
              onClick={() => setShowLog(!showLog)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
                color: theme.subtext, fontWeight: '600', fontSize: '13px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px',
                backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
              }}
            >
              <span>Invite Log ({summary.invites.length})</span>
              {showLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showLog && (
              <div style={{ ...glassCard(theme), padding: '4px 16px' }}>
                {summary.invites.length === 0 && (
                  <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                    No one has joined with your code yet. Share your link to start building your team.
                  </p>
                )}
                {summary.invites.map((inv, i) => (
                  <div key={inv.uid} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0',
                    borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', backgroundColor: theme.primarySoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: theme.primary,
                      }}>
                        U
                      </div>
                      <span style={{ fontWeight: '500', fontSize: '14px' }}>UID {inv.uid}</span>
                    </div>
                    <span style={{ color: theme.faint, fontSize: '12px' }}>{new Date(inv.joinedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: theme.faint, fontSize: '12px', marginTop: '16px', lineHeight: '1.6', textAlign: 'center' }}>
              Share your invitation code or link — anyone who signs up with it is added to your team automatically.
              You earn <b style={{ color: theme.brand }}>6%</b> referral reward on their first deposit.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Invite;
