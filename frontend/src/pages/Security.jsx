import React, { useEffect, useState, useCallback } from 'react';
import { registerBiometric, clearBiometric } from '../components/AppLock';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, ChevronRight, Shield, Mail, Smartphone, Key, Lock, AlertTriangle, Ban } from 'lucide-react';

import { getToken, logout } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import { API_URL } from '../config';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

/* ── shared input style helper ── */
function inputStyle(theme) {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: `1px solid ${theme.cardBorder}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };
}

/* ── shared button style helpers ── */
function primaryBtnStyle(theme) {
  return {
    padding: '11px 22px',
    borderRadius: '12px',
    border: 'none',
    background: theme.primaryGradient,
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59,130,246,0.25)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };
}

function dangerBtnStyle(theme) {
  return {
    padding: '11px 22px',
    borderRadius: '12px',
    border: 'none',
    background: theme.downGradient,
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };
}

/* ── icon mapping for each security row ── */
const ROW_ICONS = {
  identity: Shield,
  email: Mail,
  google: Smartphone,
  password: Key,
  fund: Lock,
  whitelist: AlertTriangle,
  close: Ban,
};

function RowIcon({ name, color, theme }) {
  const Icon = ROW_ICONS[name] || Shield;
  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: color || theme.primarySoft,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} style={{ color: theme.text, opacity: 0.85 }} />
    </div>
  );
}

function Row({ label, value, onClick, danger, theme, icon, isRTL }) {
  return (
    <button onClick={onClick} style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px 6px',
      background: 'none',
      border: 'none',
      cursor: onClick ? 'pointer' : 'default',
      textAlign: isRTL ? 'right' : 'left',
      transition: 'background 0.15s ease',
    }}>
      {icon && <RowIcon name={icon} color={danger ? theme.downSoft : undefined} theme={theme} />}
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: danger ? theme.down : theme.text }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.subtext, fontSize: '13px', fontWeight: 500 }}>
        {value}
        {onClick && <ChevronRight size={16} style={{ opacity: 0.5 }} />}
      </span>
    </button>
  );
}

function Panel({ children, theme }) {
  return (
    <div style={{
      backgroundColor: theme.card,
      backdropFilter: theme.cardGlass,
      WebkitBackdropFilter: theme.cardGlass,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '14px',
      padding: '18px',
      margin: '4px 6px 14px',
      animation: 'panelSlideIn 0.3s ease',
    }}>
      <style>{`
        @keyframes panelSlideIn {
          from { opacity: 0; transform: translateY(-8px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 600px; }
        }
      `}</style>
      {children}
    </div>
  );
}

/* ── divider between rows ── */
function Divider({ theme }) {
  return <div style={{ height: '1px', background: theme.cardBorder, margin: '0 6px' }} />;
}

const Security = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const kycLabel = (s) => ({ not_started: t('status.notVerified'), pending: t('status.pending'), certified: t('status.certified'), rejected: t('status.rejected') }[s] || t('status.notVerified'));
  const [security, setSecurity] = useState(null);
  const [open, setOpen] = useState(null);
  const [appLock, setAppLock] = useState(() => localStorage.getItem('kynex_app_lock') === 'true');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/account/security`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setSecurity(data);
    } catch {
      // stays on previous state
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggle = (panel) => { setOpen(open === panel ? null : panel); setMsg(''); };

  const [lockBusy, setLockBusy] = useState(false);

  const toggleAppLock = useCallback(async () => {
    if (lockBusy) return;

    if (appLock) {
      // ── Turn OFF ──
      try { window.KynexBridge?.setAppLock('false'); } catch (_) {}
      clearBiometric();
      // reset first-load flag so next session starts clean
      localStorage.removeItem('kynex_lock_first_load');
      setAppLock(false);
      setMsg(t('security.appLockDisabled'));
      return;
    }

    // ── Turn ON ──
    if (window.KynexBridge) {
      try { window.KynexBridge.setAppLock('true'); } catch (_) {}
      localStorage.setItem('kynex_app_lock', 'true');
      setAppLock(true);
      setMsg(t('security.appLockEnabledAndroid'));
      return;
    }

    // PWA / browser: use WebAuthn (Face ID / fingerprint / device PIN)
    if (!window.PublicKeyCredential) {
      setMsg(t('security.biometricNotSupported'));
      return;
    }
    setLockBusy(true);
    setMsg('');
    try {
      await registerBiometric();
      setAppLock(true);
      setMsg(t('security.appLockEnabledPwa'));
    } catch (err) {
      const m = err?.name === 'NotAllowedError'
        ? t('security.permissionDenied')
        : err?.message || t('security.couldNotRegister');
      setMsg(m);
    } finally {
      setLockBusy(false);
    }
  }, [appLock, lockBusy]);

  /* security level helpers */
  const levelColor = security
    ? security.securityLevel === 'High' ? theme.up
      : security.securityLevel === 'Medium' ? theme.brand
      : theme.down
    : theme.faint;

  const levelGradient = security
    ? security.securityLevel === 'High' ? theme.upGradient
      : security.securityLevel === 'Medium' ? theme.brandGradient
      : theme.downGradient
    : 'transparent';

  const levelWidth = security
    ? security.securityLevel === 'High' ? '100%'
      : security.securityLevel === 'Medium' ? '65%'
      : '30%'
    : '0%';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>

      {/* ── Header bar (glass) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`,
        backgroundColor: theme.card,
        backdropFilter: theme.cardGlass,
        WebkitBackdropFilter: theme.cardGlass,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <Link to="/profile" style={{
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          backgroundColor: theme.primarySoft,
          transition: 'background 0.15s ease',
        }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} style={{ color: theme.primary }} />
          <span style={{ fontWeight: 700, fontSize: '17px' }}>{t('security.title')}</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
        {security && (
          <>
            {/* ── Security Level Bar ── */}
            <div style={{
              backgroundColor: theme.card,
              backdropFilter: theme.cardGlass,
              WebkitBackdropFilter: theme.cardGlass,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '18px',
              padding: '18px 20px',
              marginBottom: '16px',
              boxShadow: theme.shadow,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ color: theme.subtext, fontWeight: 600 }}>{t('security.securityLevel')}</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: levelColor,
                  padding: '3px 10px',
                  borderRadius: '8px',
                  backgroundColor: security.securityLevel === 'High' ? theme.upSoft
                    : security.securityLevel === 'Medium' ? theme.brandSoft
                    : theme.downSoft,
                }}>
                  {({ High: t('security.levelHigh'), Medium: t('security.levelMedium'), Low: t('security.levelLow') })[security.securityLevel] || security.securityLevel}
                </span>
              </div>
              <div style={{
                height: '6px',
                borderRadius: '3px',
                backgroundColor: theme.cardBorder,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: levelWidth,
                  background: levelGradient,
                  borderRadius: '3px',
                  boxShadow: `0 0 12px ${levelColor}44`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* ── Main glass card ── */}
            <div style={{
              backgroundColor: theme.card,
              backdropFilter: theme.cardGlass,
              WebkitBackdropFilter: theme.cardGlass,
              borderRadius: '18px',
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: theme.shadowElevated,
              padding: '4px 14px',
            }}>

              {/* Identity Verification */}
              <Row icon="identity" label={t('security.identityVerification')} value={kycLabel(security.kycStatus)} onClick={() => navigate('/verification')} theme={theme} isRTL={isRTL} />

              <Divider theme={theme} />

              {/* Email */}
              <Row icon="email" label={t('security.emailLabel')} value={security.email} onClick={() => toggle('email')} theme={theme} isRTL={isRTL} />
              {open === 'email' && <EmailPanel theme={theme} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Google 2FA */}
              <Row icon="google" label={t('security.googleVerification')} value={security.twoFactorEnabled ? t('security.linked') : t('security.notLinked')} onClick={() => toggle('2fa')} theme={theme} isRTL={isRTL} />
              {open === '2fa' && <TwoFactorPanel theme={theme} enabled={security.twoFactorEnabled} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Login Password */}
              <Row icon="password" label={t('security.loginPassword')} value={t('security.change')} onClick={() => toggle('password')} theme={theme} isRTL={isRTL} />
              {open === 'password' && <PasswordPanel theme={theme} onDone={() => { setOpen(null); load(); logout(); navigate('/auth'); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Fund Password */}
              <Row
                icon="fund"
                label={t('security.fundPassword')}
                value={security.fundPasswordSet ? t('security.set') : t('security.notSet')}
                onClick={security.fundPasswordSet ? () => toggle('fund-change') : () => toggle('fund')}
                theme={theme}
                isRTL={isRTL}
              />
              {open === 'fund' && !security.fundPasswordSet && (
                <FundPasswordPanel theme={theme} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />
              )}
              {open === 'fund-change' && security.fundPasswordSet && (
                <ChangeFundPasswordPanel theme={theme} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />
              )}

              <Divider theme={theme} />

              {/* Withdrawal Whitelist */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 6px',
              }}>
                <RowIcon name="whitelist" theme={theme} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{t('security.withdrawalWhitelist')}</div>
                  <div style={{ fontSize: '11px', color: theme.faint, marginTop: '2px' }}>{t('security.whitelistDesc')}</div>
                </div>
                <WhitelistToggle theme={theme} enabled={security.withdrawalWhitelistEnabled} onDone={load} />
              </div>

              <Divider theme={theme} />

              {/* App Lock */}
              <Divider theme={theme} />
              <div style={{ padding: '14px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RowIcon name="identity" theme={theme} color={theme.primarySoft} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{t('security.appLock')}</div>
                    <div style={{ fontSize: '11px', color: theme.faint, marginTop: '2px' }}>
                      {window.KynexBridge
                        ? t('security.appLockAndroid')
                        : t('security.appLockPwa')}
                    </div>
                  </div>
                  <div
                    onClick={lockBusy ? undefined : toggleAppLock}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      cursor: lockBusy ? 'not-allowed' : 'pointer',
                      background: appLock ? theme.primaryGradient : theme.cardBorder,
                      boxShadow: appLock ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                      position: 'relative', transition: 'background 0.2s',
                      flexShrink: 0, opacity: lockBusy ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: appLock ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%',
                      backgroundColor: 'white', transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                </div>
                {lockBusy && (
                  <div style={{ fontSize: '11px', color: theme.primary, marginTop: '8px', paddingLeft: '46px' }}>
                    {t('security.waitingBiometric')}
                  </div>
                )}
              </div>

              <Divider theme={theme} />

              {/* Close Account */}
              <Row icon="close" label={t('security.closeAccount')} value="" onClick={() => toggle('close')} danger theme={theme} isRTL={isRTL} />
              {open === 'close' && <ClosePanel theme={theme} setMsg={setMsg} />}

            </div>

            {/* ── Success message ── */}
            {msg && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: theme.upSoft,
                border: `1px solid ${theme.up}33`,
                fontSize: '13px',
                color: theme.up,
                fontWeight: 600,
              }}>
                {msg}
              </div>
            )}

            {/* ── Success popup overlay ── */}
            {msg && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              }} onClick={() => setMsg('')}>
                <div style={{
                  background: theme.card,
                  backdropFilter: theme.cardGlass, WebkitBackdropFilter: theme.cardGlass,
                  border: '1.5px solid rgba(16,185,129,0.5)',
                  borderRadius: '24px',
                  padding: '36px 32px',
                  maxWidth: '300px', width: '90%',
                  textAlign: 'center',
                  boxShadow: '0 20px 60px rgba(16,185,129,0.25), 0 8px 24px rgba(0,0,0,0.6)',
                  animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }} onClick={e => e.stopPropagation()}>
                  <style>{`@keyframes popIn { from { transform: scale(0.7); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.5)',
                    fontSize: '28px',
                  }}>✓</div>
                  <div style={{ fontWeight: '800', fontSize: '18px', color: theme.text, marginBottom: '10px' }}>
                    {(msg === t('security.fundPwSet') || msg === t('security.fundPwChanged')) ? '🔐 ' + t('security.fundPasswordTitle') :
                     (msg === t('security.twoFaLinked') || msg === t('security.twoFaUnlinked')) ? '📱 ' + t('security.googleAuthTitle') :
                     msg === t('security.emailUpdated') ? '✉️ ' + t('security.emailUpdatedTitle') :
                     msg === t('security.passwordChanged') ? '🔑 ' + t('security.passwordChangedTitle') : '✅ ' + t('common.done')}
                  </div>
                  <div style={{ fontSize: '13px', color: theme.subtext, lineHeight: '1.6', marginBottom: '24px' }}>{msg}</div>
                  <button onClick={() => setMsg('')} style={{
                    padding: '12px 32px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                  }}>{t('common.gotIt')}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function EmailPanel({ theme, onDone, setMsg }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestChange = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/email/request-change`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ newEmail, currentPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(2);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const confirmChange = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/email/confirm-change`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.emailUpdated'));
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {step === 1 ? (
        <>
          <input type="email" placeholder={t('security.newEmailPlaceholder')} value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="password" placeholder={t('security.currentLoginPwPlaceholder')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '14px' }} />
          <button onClick={requestChange} disabled={busy} style={primaryBtnStyle(theme)}>
            {t('security.sendCode')}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>{t('security.enterCodeSentTo', { email: newEmail })}</p>
          <input type="text" placeholder={t('security.sixDigitCode')} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <button onClick={confirmChange} disabled={busy} style={primaryBtnStyle(theme)}>
            {t('common.confirm')}
          </button>
          <p style={{ fontSize: '11px', color: theme.faint, marginTop: '12px', lineHeight: 1.5 }}>{t('security.withdrawLock12h')}</p>
        </>
      )}
    </Panel>
  );
}

function TwoFactorPanel({ theme, enabled, onDone, setMsg }) {
  const { t } = useLanguage();
  const [qr, setQr] = useState(null);
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (enabled) return;
    const start = async () => {
      const res = await fetch(`${API_URL}/api/account/2fa/setup`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSecret(data.secret);
        setQr(await QRCode.toDataURL(data.otpauth));
      }
    };
    const timer = setTimeout(start, 0);
    return () => clearTimeout(timer);
  }, [enabled]);

  const requestOtp = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/2fa/request-otp`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const verify = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/2fa/verify`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code, password, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.twoFaLinked'));
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const disable = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/2fa/disable`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code, password, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.twoFaUnlinked'));
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {!enabled ? (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>{t('security.twoFaScanDesc')}</p>
          {qr && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '12px',
              margin: '8px auto 12px',
              borderRadius: '14px',
              backgroundColor: 'white',
              width: 'fit-content',
            }}>
              <img src={qr} alt={t('security.qrAlt')} style={{ width: '150px', height: '150px', display: 'block' }} />
            </div>
          )}
          {secret && (
            <p style={{
              fontSize: '11px',
              color: theme.faint,
              textAlign: 'center',
              wordBreak: 'break-all',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: theme.inputBg,
              marginBottom: '12px',
              lineHeight: 1.6,
            }}>
              {t('security.manualEntry', { secret })}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>{t('security.twoFaUnlinkDesc')}</p>
      )}

      {!otpSent ? (
        <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
          {t('security.sendEmailCode')}
        </button>
      ) : (
        <>
          <input type="password" placeholder={t('security.loginPasswordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="text" placeholder={t('security.sixDigitEmailCode')} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <input type="text" placeholder={t('security.sixDigitAuthCode')} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          {!enabled ? (
            <button onClick={verify} disabled={busy} style={primaryBtnStyle(theme)}>
              {t('security.enable2fa')}
            </button>
          ) : (
            <button onClick={disable} disabled={busy} style={dangerBtnStyle(theme)}>
              {t('security.disable2fa')}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

function PasswordPanel({ theme, onDone, setMsg }) {
  const { t } = useLanguage();
  const [otpSent, setOtpSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/password/request-otp`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const submit = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/password/change`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ currentPassword, newPassword, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.passwordChanged'));
      onDone();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {!otpSent ? (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>{t('security.pwChangeDesc')}</p>
          <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
            {t('security.sendCode')}
          </button>
        </>
      ) : (
        <>
          <input type="text" placeholder={t('security.sixDigitEmailCode')} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <input type="password" placeholder={t('security.currentPwPlaceholder')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="password" placeholder={t('security.newPwPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '14px' }} />
          <button onClick={submit} disabled={busy} style={primaryBtnStyle(theme)}>
            {t('security.changePassword')}
          </button>
        </>
      )}
      <p style={{ fontSize: '11px', color: theme.faint, marginTop: '12px', lineHeight: 1.5 }}>{t('security.pwChangeWarn')}</p>
    </Panel>
  );
}

function FundPasswordPanel({ theme, onDone, setMsg }) {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/fund-password/set`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ pin }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.fundPwSet'));
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>{t('security.fundPwDesc')}</p>
      <input type="password" inputMode="numeric" placeholder={t('security.pinPlaceholder')} value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6}
        style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '6px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }} />
      <button onClick={submit} disabled={busy} style={primaryBtnStyle(theme)}>
        {t('security.setFundPassword')}
      </button>
    </Panel>
  );
}

function ChangeFundPasswordPanel({ theme, onDone, setMsg }) {
  const { t } = useLanguage();
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/fund-password/request-change-otp`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('verify');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const submitChange = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/fund-password/change`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ otp, newPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.fundPwChanged'));
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}

      {step === 'request' && (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>
            {t('security.fundPwChangeDesc')}
          </p>
          <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
            {busy ? t('security.sending') : t('security.sendVerificationCode')}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>
            {t('security.fundPwVerifyDesc')}
          </p>
          <input
            type="text" inputMode="numeric" placeholder={t('security.emailOtpPlaceholder')} value={otp}
            onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '12px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
          />
          <input
            type="password" inputMode="numeric" placeholder={t('security.newPinPlaceholder')} value={newPin}
            onChange={(e) => setNewPin(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '6px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={submitChange} disabled={busy} style={primaryBtnStyle(theme)}>
              {busy ? t('security.saving') : t('security.confirmChange')}
            </button>
            <button onClick={requestOtp} disabled={busy} style={{ ...primaryBtnStyle(theme), background: theme.cardBorder, color: theme.subtext, boxShadow: 'none' }}>
              {t('security.resend')}
            </button>
          </div>
        </>
      )}
    </Panel>
  );
}

function WhitelistToggle({ theme, enabled, onDone }) {
  const [busy, setBusy] = useState(false);
  const flip = async () => {
    setBusy(true);
    await fetch(`${API_URL}/api/account/withdrawal-whitelist`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ enabled: !enabled }) });
    setBusy(false);
    onDone();
  };
  return (
    <button onClick={flip} disabled={busy} style={{
      width: '48px',
      height: '28px',
      borderRadius: '14px',
      border: 'none',
      cursor: 'pointer',
      background: enabled ? theme.primaryGradient : theme.cardBorder,
      position: 'relative',
      flexShrink: 0,
      boxShadow: enabled ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
      transition: 'background 0.2s ease, box-shadow 0.2s ease',
    }}>
      <span style={{
        position: 'absolute',
        top: '4px',
        left: enabled ? '24px' : '4px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.2s ease',
      }} />
    </button>
  );
}

function ClosePanel({ theme, setMsg }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (confirmText !== 'CLOSE') { setError(t('security.typeCloseError')); return; }
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/close`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(t('security.accountClosed'));
      logout();
      navigate('/');
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      <p style={{ fontSize: '12px', color: theme.down, marginTop: 0, fontWeight: 600, lineHeight: 1.5 }}>
        {t('security.closeWarn')}
      </p>
      <input type="text" placeholder={t('security.closeConfirmPlaceholder')} value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
        style={{ ...inputStyle(theme), marginBottom: '14px', borderColor: theme.down + '44' }} />
      <button onClick={submit} disabled={busy} style={dangerBtnStyle(theme)}>
        {t('security.closeAccountPermanently')}
      </button>
    </Panel>
  );
}

export default Security;
