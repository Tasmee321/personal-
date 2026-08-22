import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Users, UserPlus, TrendingUp,
  Share2, ChevronDown, ChevronUp, X, Star, Lock, CheckCircle,
} from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { API_URL } from '../config';

function glassCard(theme, extra = {}) {
  return {
    backgroundColor: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadowElevated || theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
    ...extra,
  };
}

function fmt2(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', ...glassCard(theme) }}>
        <span style={{ flex: 1, fontSize: '14px', wordBreak: 'break-all' }}>{value}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? theme.up : theme.primary, display: 'flex', flexShrink: 0 }}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
    </div>
  );
}

/* ── Member Row ── */
function MemberRow({ item, i, theme }) {
  const { t } = useLanguage();
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', backgroundColor: theme.primarySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 'bold', color: theme.primary, flexShrink: 0,
        }}>
          {String(item.uid).slice(-2)}
        </div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{t('invite.uidLabel', { uid: item.uid })}</div>
          <div style={{ color: theme.faint, fontSize: '11px', marginTop: '1px' }}>
            {t('invite.joined', { date: new Date(item.joinedAt).toLocaleDateString() })}
            {item.memberLevel > 0 && ` · Lv${item.memberLevel}`}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {item.isQualified !== undefined && (
          <span style={{
            fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
            backgroundColor: item.isQualified ? theme.upSoft : theme.downSoft,
            color: item.isQualified ? theme.up : theme.down,
          }}>
            {item.isQualified ? t('invite.qualified') : t('invite.unqualified')}
          </span>
        )}
        {item.totalDeposited !== undefined && (
          <div style={{ color: theme.faint, fontSize: '11px', marginTop: '3px' }}>
            {t('invite.deposited', { amt: fmt2(item.totalDeposited) })}
          </div>
        )}
        {item.balance !== undefined && (
          <div style={{ color: theme.faint, fontSize: '11px' }}>
            {t('invite.balance', { amt: fmt2(item.balance) })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Requirement Card ── */
function ReqCard({ req, levelInfo, qualifiedTeamCount, currentLevel, theme }) {
  const { t } = useLanguage();
  const qdCount = levelInfo?.qualifiedDirectCount || 0;
  const qdDeposit = levelInfo?.qualifiedTeamDeposit || 0;
  const qtCount = qualifiedTeamCount || 0;
  const dlCounts = levelInfo?.directLevelCounts || {};

  const directOk = qdCount >= req.direct;
  const depositOk = req.teamDeposit === 0 || qtCount >= req.teamDeposit;

  const subLevelRows = Object.entries(req.directLevels || {}).map(([lvl, need]) => {
    const have = dlCounts[Number(lvl)] || 0;
    const ok = have >= need;
    return { lvl, need, have, ok };
  });

  // ALL conditions must be met for "achieved" badge — not just server-tracked currentLevel
  const allConditionsMet = directOk && depositOk && subLevelRows.every(r => r.ok);
  const achieved = currentLevel >= req.level && allConditionsMet;
  const isNext = !achieved && currentLevel === req.level - 1;

  return (
    <div style={{
      ...glassCard(theme, { padding: '14px 16px', marginBottom: '10px' }),
      border: achieved
        ? `1px solid ${theme.up}`
        : isNext
          ? `1px solid ${theme.primary}`
          : `1px solid ${theme.cardBorder}`,
      opacity: achieved ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: achieved ? theme.upSoft : isNext ? theme.primarySoft : theme.inputBg,
          }}>
            {achieved ? <CheckCircle size={15} color={theme.up} /> : isNext ? <Star size={15} color={theme.primary} /> : <Lock size={15} color={theme.faint} />}
          </div>
          <span style={{ fontWeight: '700', fontSize: '14px' }}>{t('invite.level', { n: req.level })}</span>
          {isNext && <span style={{ fontSize: '10px', fontWeight: '700', color: theme.primary, backgroundColor: theme.primarySoft, padding: '2px 7px', borderRadius: '10px' }}>{t('invite.next')}</span>}
          {achieved && <span style={{ fontSize: '10px', fontWeight: '700', color: theme.up, backgroundColor: theme.upSoft, padding: '2px 7px', borderRadius: '10px' }}>{t('invite.achieved')}</span>}
        </div>
      </div>

      {/* Direct qualified */}
      <ReqRow label={t('invite.qualifiedDirect')} have={qdCount} need={req.direct} ok={directOk} theme={theme} />

      {/* Team members required */}
      {req.teamDeposit > 0 && (
        <ReqRow label={t('invite.teamMembers')} have={qtCount} need={req.teamDeposit} ok={depositOk} prefix="" theme={theme} />
      )}

      {/* Sub-level requirements */}
      {subLevelRows.map(({ lvl, need, have, ok }) => (
        <ReqRow key={lvl} label={t('invite.directLvMembers', { lvl })} have={have} need={need} ok={ok} theme={theme} />
      ))}
    </div>
  );
}

function ReqRow({ label, have, need, ok, prefix = '', theme }) {
  const pct = need > 0 ? Math.min(100, (have / need) * 100) : 100;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
        <span style={{ color: theme.subtext }}>{label}</span>
        <span style={{ fontWeight: '600', color: ok ? theme.up : theme.text }}>
          {prefix}{have.toLocaleString()} / {prefix}{need.toLocaleString()}
        </span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: theme.inputBg, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '3px', backgroundColor: ok ? theme.up : theme.primary, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

/* ── Bottom Sheet Drawer ── */
function Drawer({ open, onClose, title, children, theme }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...glassCard(theme, { width: '100%', maxWidth: '520px', maxHeight: '78vh', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: '22px', borderTopRightRadius: '22px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, flexShrink: 0 }}>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subtext, display: 'flex', padding: 0 }}><X size={20} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Main ── */
const Invite = () => {
  const { theme, iconBadges } = useTheme();
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [drawer, setDrawer] = useState(null); // null | 'team' | 'topup' | 'level' | 'reqs'
  const [levelDrawerN, setLevelDrawerN] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/invite/summary`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t('invite.couldNotLoad'));
        setSummary(data);
      } catch (err) {
        setError(err.message);
      }
    };
    setTimeout(load, 0);
  }, []);

  const invitationLink = summary ? `${window.location.origin}/auth?ref=${summary.inviteCode}` : '';

  const shareLink = async () => {
    const text = t('invite.shareText', { code: summary?.inviteCode, link: invitationLink });
    if (navigator.share) {
      try { await navigator.share({ title: t('invite.shareTitle'), text, url: invitationLink }); } catch { }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const openLevel = (n) => { setLevelDrawerN(n); setDrawer('level'); };

  /* Level rows — from levelRequirements, show achieved + next unlocked levels */
  const levelReqs = summary?.levelRequirements || [];
  const currentLevel = summary?.currentLevel || 0;

  /* Level N drawer members = qualifiedDirect who have memberLevel >= N */
  const levelMembers = (n) => {
    if (!summary) return [];
    if (n === 1) return summary.qualifiedDirectList || [];
    return (summary.directByLevel?.[n]) || [];
  };

  const statCards = summary ? [
    {
      key: 'team', label: t('invite.teamMembers'), value: summary.teamMembers,
      Icon: Users, badge: iconBadges.purple,
      hint: t('invite.allDirectInvites'),
    },
    {
      key: 'topup', label: t('invite.topUpUsers'), value: summary.topUpUsers,
      Icon: TrendingUp, badge: iconBadges.green,
      hint: t('invite.madeADeposit'),
    },
    {
      key: 'reqs', label: t('invite.myLevel'), value: currentLevel,
      Icon: Star, badge: iconBadges.amber,
      hint: t('invite.tapForProgress'),
    },
  ] : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass }}>
        <Link to="/profile" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{t('invite.title')}</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto', paddingBottom: '40px' }}>
        {error && <div style={{ color: theme.down, fontSize: '13px', marginBottom: '16px', padding: '10px 14px', backgroundColor: theme.downSoft, borderRadius: '10px' }}>{error}</div>}

        {!summary && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
            <style>{`@keyframes kynexSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `3px solid ${theme.cardBorder}`,
              borderTop: `3px solid ${theme.primary}`,
              animation: 'kynexSpin 0.8s linear infinite',
            }} />
          </div>
        )}

        {summary && (
          <>
            {/* UID card */}
            <div style={{ ...glassCard(theme, { background: theme.brandGradient || `linear-gradient(135deg, ${theme.primarySoft} 0%, ${theme.brandSoft} 100%)`, color: '#1A1305', padding: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) }}>
              <div>
                <div style={{ color: 'rgba(26,19,5,0.72)', fontSize: '12px', marginBottom: '4px' }}>{t('invite.myUid')}</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1A1305' }}>{summary.uid}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'rgba(26,19,5,0.72)', fontSize: '12px', marginBottom: '4px' }}>{t('invite.referrerUid')}</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1A1305' }}>{summary.referrerUid || '--'}</div>
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {statCards.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setDrawer(s.key)}
                  style={{ flex: 1, padding: '16px 10px', textAlign: 'center', ...glassCard(theme), cursor: 'pointer', background: theme.card }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: s.badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <s.Icon size={17} color={s.badge.fg} />
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '2px', color: theme.text }}>{s.value}</div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>{s.label}</div>
                  <div style={{ color: theme.primary, fontSize: '10px', marginTop: '3px', fontWeight: '600' }}>View →</div>
                </button>
              ))}
            </div>

            {/* Level tabs — qualified direct counts per level */}
            {levelReqs.length > 0 && (
              <div style={{ ...glassCard(theme, { padding: '14px 16px', marginBottom: '20px' }) }}>
                <div style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>{t('invite.levelBreakdown')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {levelReqs.map((req) => {
                    const membersForLevel = levelMembers(req.level);
                    const count = membersForLevel.length;
                    const achieved = currentLevel >= req.level;
                    const isNext = currentLevel === req.level - 1;
                    return (
                      <button
                        key={req.level}
                        onClick={() => openLevel(req.level)}
                        style={{
                          padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                          border: achieved ? `1px solid ${theme.up}` : isNext ? `1px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
                          backgroundColor: achieved ? theme.upSoft : isNext ? theme.primarySoft : theme.inputBg,
                          color: achieved ? theme.up : isNext ? theme.primary : theme.faint,
                          display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        {achieved && <CheckCircle size={12} />}
                        Lv{req.level}
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '8px',
                          backgroundColor: achieved ? theme.up : isNext ? theme.primary : `${theme.faint}33`,
                          color: achieved || isNext ? 'white' : theme.subtext,
                        }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: theme.faint }}>
                  {t('invite.levelBreakdownHint')}
                </div>
              </div>
            )}

            {/* Invite code + link */}
            <CopyRow label={t('invite.myInviteCode')} value={summary.inviteCode} theme={theme} />
            <CopyRow label={t('invite.invitationLink')} value={invitationLink} theme={theme} />

            {/* Share */}
            <button
              onClick={shareLink}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 18px rgba(59,130,246,0.3)', marginBottom: '16px' }}
            >
              <Share2 size={16} /> {t('invite.shareInviteLink')}
            </button>

            {/* Invite log toggle */}
            <button
              onClick={() => setShowLog(!showLog)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, color: theme.subtext, fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass }}
            >
              <span>{t('invite.inviteLog', { n: summary.invites?.length || 0 })}</span>
              {showLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showLog && (
              <div style={{ ...glassCard(theme, { padding: '4px 16px' }) }}>
                {(summary.invites || []).length === 0
                  ? <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>{t('invite.noOneJoined')}</p>
                  : (summary.invites || []).map((inv, i) => <MemberRow key={inv.uid} item={inv} i={i} theme={theme} />)
                }
              </div>
            )}

            <p style={{ color: theme.faint, fontSize: '12px', marginTop: '16px', lineHeight: '1.6', textAlign: 'center' }}>
              {t('invite.referralRewardPre')} <b style={{ color: theme.brand }}>6%</b> {t('invite.referralRewardPost')}
            </p>
          </>
        )}
      </div>

      {/* ── Team Members Drawer ── */}
      <Drawer open={drawer === 'team'} onClose={() => setDrawer(null)} title={t('invite.teamMembersTitle', { n: summary?.teamMembers || 0 })} theme={theme}>
        {(summary?.invites || []).length === 0
          ? <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>{t('invite.noTeamMembers')}</p>
          : (summary?.invites || []).map((item, i) => <MemberRow key={item.uid} item={item} i={i} theme={theme} />)
        }
      </Drawer>

      {/* ── Top Up Drawer ── */}
      <Drawer open={drawer === 'topup'} onClose={() => setDrawer(null)} title={t('invite.topUpUsersTitle', { n: summary?.topUpUsers || 0 })} theme={theme}>
        {(summary?.topUpList || []).length === 0
          ? <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>{t('invite.noTopUp')}</p>
          : (summary?.topUpList || []).map((item, i) => <MemberRow key={item.uid} item={item} i={i} theme={theme} />)
        }
      </Drawer>

      {/* ── Level Requirements Drawer ── */}
      <Drawer open={drawer === 'reqs'} onClose={() => setDrawer(null)} title={t('invite.myLevelProgress', { n: currentLevel })} theme={theme}>
        <div style={{ paddingTop: '8px' }}>
          {(summary?.levelRequirements || []).map((req) => (
            <ReqCard
              key={req.level}
              req={req}
              levelInfo={summary?.levelInfo}
              qualifiedTeamCount={summary?.qualifiedTeamCount || 0}
              currentLevel={currentLevel}
              theme={theme}
            />
          ))}
        </div>
      </Drawer>

      {/* ── Level N Members Drawer ── */}
      <Drawer
        open={drawer === 'level'}
        onClose={() => { setDrawer(null); setLevelDrawerN(null); }}
        title={t('invite.levelMembersTitle', { n: levelDrawerN, count: levelDrawerN ? levelMembers(levelDrawerN).length : 0 })}
        theme={theme}
      >
        {/* Requirement summary for this level */}
        {levelDrawerN && summary?.levelRequirements && (() => {
          const req = summary.levelRequirements.find(r => r.level === levelDrawerN);
          if (!req) return null;
          return (
            <div style={{ ...glassCard(theme, { padding: '12px 14px', marginBottom: '14px', marginTop: '8px', backgroundColor: theme.inputBg }) }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subtext, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('invite.levelRequirements', { n: levelDrawerN })}</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: theme.faint }}>{t('invite.qualifiedDirect')}</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>{req.direct}</div>
                </div>
                {req.teamDeposit > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>{t('invite.teamMembers')}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>{req.teamDeposit.toLocaleString()}</div>
                  </div>
                )}
                {Object.entries(req.directLevels || {}).map(([lvl, cnt]) => (
                  <div key={lvl}>
                    <div style={{ fontSize: '11px', color: theme.faint }}>{t('invite.lvDirects', { lvl })}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>{cnt}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {levelDrawerN && levelMembers(levelDrawerN).length === 0
          ? <p style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              {t('invite.noQualifiedMembers', { n: levelDrawerN })}
            </p>
          : (levelDrawerN ? levelMembers(levelDrawerN) : []).map((item, i) => <MemberRow key={item.uid} item={item} i={i} theme={theme} />)
        }
      </Drawer>
    </div>
  );
};

export default Invite;
