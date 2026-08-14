import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Users, UserPlus, TrendingUp, Share2, ChevronDown, ChevronUp, X } from 'lucide-react';
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

/* ── Detail Drawer ── */
function DetailDrawer({ open, onClose, title, items, emptyText, theme }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...glassCard(theme),
          width: '100%', maxWidth: '520px', maxHeight: '70vh',
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
          borderTopLeftRadius: '22px', borderTopRightRadius: '22px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, flexShrink: 0,
        }}>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subtext, display: 'flex', padding: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ overflowY: 'auto', padding: '4px 20px 20px' }}>
          {items.length === 0 ? (
            <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>{emptyText}</p>
          ) : (
            items.map((item, i) => (
              <div key={item.uid || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: theme.primarySoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 'bold', color: theme.primary, flexShrink: 0,
                  }}>
                    {item.initials || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>UID {item.uid}</div>
                    {item.sub && <div style={{ color: theme.faint, fontSize: '11px', marginTop: '2px' }}>{item.sub}</div>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {item.badge && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                      backgroundColor: item.badgeBg, color: item.badgeColor,
                    }}>{item.badge}</span>
                  )}
                  <div style={{ color: theme.faint, fontSize: '11px', marginTop: '4px' }}>{item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
const Invite = () => {
  const { theme, iconBadges } = useTheme();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [drawer, setDrawer] = useState(null); // null | 'team' | 'level1' | 'topup'

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

  /* Build drawer content from summary.invites */
  const allMembers = summary ? summary.invites.map((inv) => ({
    uid: inv.uid,
    initials: String(inv.uid).slice(-2),
    sub: `Joined ${new Date(inv.joinedAt).toLocaleDateString()}`,
    date: new Date(inv.joinedAt).toLocaleDateString(),
    badge: 'Member',
    badgeBg: iconBadges?.purple?.bg || '#ede9fe',
    badgeColor: iconBadges?.purple?.fg || '#7c3aed',
  })) : [];

  /* topUpUsers from API — currently 0 hardcoded in backend, show empty drawer */
  const topupMembers = summary ? summary.invites
    .filter((inv) => inv.hasDeposit)  /* backend can add this flag later */
    .map((inv) => ({
      uid: inv.uid,
      initials: String(inv.uid).slice(-2),
      sub: `Deposited`,
      date: new Date(inv.joinedAt).toLocaleDateString(),
      badge: 'Top Up',
      badgeBg: iconBadges?.green?.bg || '#dcfce7',
      badgeColor: iconBadges?.green?.fg || '#16a34a',
    })) : [];

  const drawerConfig = {
    team: {
      title: `Team Members (${summary?.teamMembers || 0})`,
      items: allMembers,
      emptyText: 'No team members yet. Share your invite link to grow your team.',
    },
    level1: {
      title: `Level 1 Members (${summary?.levelOneCount || 0})`,
      items: allMembers, /* level 1 = direct invites = same list */
      emptyText: 'No level 1 members yet.',
    },
    topup: {
      title: `Top Up Users (${summary?.topUpUsers || 0})`,
      items: topupMembers,
      emptyText: 'No top-up users yet. Members who make their first deposit will appear here.',
    },
  };

  const stats = summary ? [
    { key: 'team', label: 'Team Members', value: summary.teamMembers, Icon: Users, badge: iconBadges.purple },
    { key: 'level1', label: 'Level 1 Count', value: summary.levelOneCount, Icon: UserPlus, badge: iconBadges.blue },
    { key: 'topup', label: 'Top Up Users', value: summary.topUpUsers, Icon: TrendingUp, badge: iconBadges.green },
  ] : [];

  const activeDrawer = drawer ? drawerConfig[drawer] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
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

            {/* Stats — each card is clickable, opens detail drawer */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {stats.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setDrawer(s.key)}
                  style={{
                    flex: 1, padding: '16px 10px', textAlign: 'center',
                    ...glassCard(theme),
                    cursor: 'pointer', border: `1px solid ${theme.cardBorder}`,
                    background: theme.card, transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', backgroundColor: s.badge.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
                  }}>
                    <s.Icon size={17} color={s.badge.fg} />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px', color: theme.text }}>{s.value}</div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>{s.label}</div>
                  <div style={{ color: theme.primary, fontSize: '10px', marginTop: '4px', fontWeight: '600' }}>View details →</div>
                </button>
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

      {/* Detail Drawer */}
      {activeDrawer && (
        <DetailDrawer
          open={!!drawer}
          onClose={() => setDrawer(null)}
          title={activeDrawer.title}
          items={activeDrawer.items}
          emptyText={activeDrawer.emptyText}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Invite;
