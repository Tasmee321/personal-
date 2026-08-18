import React, { useEffect, useState, useCallback } from 'react';
import { registerBiometric, clearBiometric } from '../components/AppLock';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, ChevronRight, Shield, Mail, Smartphone, Key, Lock, AlertTriangle, Ban } from 'lucide-react';

const KYC_LABELS = { not_started: 'Not Verified', pending: 'Pending', certified: 'Certified', rejected: 'Rejected' };
import { getToken, logout } from '../utils/auth';
import { useTheme } from '../ThemeContext';
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

function Row({ label, value, onClick, danger, theme, icon }) {
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
      textAlign: 'left',
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
  const navigate = useNavigate();
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
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = (panel) => { setOpen(open === panel ? null : panel); setMsg(''); };

  const [lockBusy, setLockBusy] = useState(false);

  const toggleAppLock = useCallback(async () => {
    if (lockBusy) return;

    if (appLock) {
      // ── Turn OFF ──
      if (window.KynexBridge?.setAppLock) window.KynexBridge.setAppLock('false');
      clearBiometric();
      // reset first-load flag so next session starts clean
      localStorage.removeItem('kynex_lock_first_load');
      setAppLock(false);
      setMsg('App Lock disabled.');
      return;
    }

    // ── Turn ON ──
    if (window.KynexBridge?.setAppLock) {
      // APK: native layer handles the actual lock
      window.KynexBridge.setAppLock('true');
      localStorage.setItem('kynex_app_lock', 'true');
      setAppLock(true);
      setMsg('App Lock enabled. Screen will lock when you leave the app.');
      return;
    }

    // PWA / browser: use WebAuthn (Face ID / fingerprint / device PIN)
    if (!window.PublicKeyCredential) {
      setMsg('Biometric lock is not supported on this browser or device.');
      return;
    }
    setLockBusy(true);
    setMsg('');
    try {
      await registerBiometric();
      setAppLock(true);
      setMsg('App Lock enabled. Biometric registered — app will lock when you switch away.');
    } catch (err) {
      const m = err?.name === 'NotAllowedError'
        ? 'Permission denied. Please allow biometric access and try again.'
        : err?.message || 'Could not register biometric. Try again.';
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
          <span style={{ fontWeight: 700, fontSize: '17px' }}>Security</span>
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
                <span style={{ color: theme.subtext, fontWeight: 600 }}>Security Level</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: levelColor,
                  padding: '3px 10px',
                  borderRadius: '8px',
                  backgroundColor: security.securityLevel === 'High' ? theme.upSoft
                    : security.securityLevel === 'Medium' ? theme.primarySoft
                    : theme.downSoft,
                }}>
                  {security.securityLevel}
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
              <Row icon="identity" label="Identity Verification" value={KYC_LABELS[security.kycStatus] || 'Not Verified'} onClick={() => navigate('/verification')} theme={theme} />

              <Divider theme={theme} />

              {/* Email */}
              <Row icon="email" label="Email" value={security.email} onClick={() => toggle('email')} theme={theme} />
              {open === 'email' && <EmailPanel theme={theme} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Google 2FA */}
              <Row icon="google" label="Google Verification" value={security.twoFactorEnabled ? 'Linked' : 'Not Linked'} onClick={() => toggle('2fa')} theme={theme} />
              {open === '2fa' && <TwoFactorPanel theme={theme} enabled={security.twoFactorEnabled} onDone={() => { load(); setOpen(null); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Login Password */}
              <Row icon="password" label="Login Password" value="Change" onClick={() => toggle('password')} theme={theme} />
              {open === 'password' && <PasswordPanel theme={theme} onDone={() => { setOpen(null); load(); logout(); navigate('/auth'); }} setMsg={setMsg} />}

              <Divider theme={theme} />

              {/* Fund Password */}
              <Row
                icon="fund"
                label="Fund Password"
                value={security.fundPasswordSet ? 'Set' : 'Not Set'}
                onClick={security.fundPasswordSet ? () => toggle('fund-change') : () => toggle('fund')}
                theme={theme}
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
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Withdrawal Whitelist</div>
                  <div style={{ fontSize: '11px', color: theme.faint, marginTop: '2px' }}>Restrict withdrawals to trusted destinations only.</div>
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
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>App Lock</div>
                    <div style={{ fontSize: '11px', color: theme.faint, marginTop: '2px' }}>
                      {window.KynexBridge
                        ? 'Lock screen when leaving the app (Android).'
                        : 'Face ID / fingerprint / device PIN when app resumes (PWA).'}
                    </div>
                  </div>
                  <div
                    onClick={lockBusy ? undefined : toggleAppLock}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      cursor: lockBusy ? 'not-allowed' : 'pointer',
                      backgroundColor: appLock ? '#F59E0B' : theme.cardBorder,
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
                    Waiting for biometric…
                  </div>
                )}
              </div>

              <Divider theme={theme} />

              {/* Close Account */}
              <Row icon="close" label="Close Account" value="" onClick={() => toggle('close')} danger theme={theme} />
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
                  background: 'linear-gradient(135deg, #0f1f0f 0%, #1a3a1a 100%)',
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
                  <div style={{ fontWeight: '800', fontSize: '18px', color: '#fff', marginBottom: '10px' }}>
                    {msg.includes('Fund password') ? '🔐 Fund Password' :
                     msg.includes('Google') ? '📱 Google Authenticator' :
                     msg.includes('Email') ? '✉️ Email Updated' :
                     msg.includes('Password changed') ? '🔑 Password Changed' : '✅ Done'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', marginBottom: '24px' }}>{msg}</div>
                  <button onClick={() => setMsg('')} style={{
                    padding: '12px 32px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                  }}>Got it</button>
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
      setMsg('Email updated. Withdrawals are locked for 12 hours.');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {step === 1 ? (
        <>
          <input type="email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="password" placeholder="Current login password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '14px' }} />
          <button onClick={requestChange} disabled={busy} style={primaryBtnStyle(theme)}>
            Send Code
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>Enter the code sent to {newEmail}</p>
          <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <button onClick={confirmChange} disabled={busy} style={primaryBtnStyle(theme)}>
            Confirm
          </button>
          <p style={{ fontSize: '11px', color: theme.faint, marginTop: '12px', lineHeight: 1.5 }}>Withdrawals will be locked for 12 hours after the change.</p>
        </>
      )}
    </Panel>
  );
}

function TwoFactorPanel({ theme, enabled, onDone, setMsg }) {
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
    const t = setTimeout(start, 0);
    return () => clearTimeout(t);
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
      setMsg('Google Authenticator is now linked.');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const disable = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/2fa/disable`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code, password, otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Google Authenticator was unlinked.');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {!enabled ? (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>Scan with Google Authenticator or Authy, then confirm with your password, an email code, and the live authenticator code.</p>
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
              <img src={qr} alt="2FA QR code" style={{ width: '150px', height: '150px', display: 'block' }} />
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
              Manual entry: {secret}
            </p>
          )}
        </>
      ) : (
        <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>Confirm with your password, an email code, and your current authenticator code to unlink 2FA.</p>
      )}

      {!otpSent ? (
        <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
          Send Email Code
        </button>
      ) : (
        <>
          <input type="password" placeholder="Login password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="text" placeholder="6-digit email code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <input type="text" placeholder="6-digit authenticator code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          {!enabled ? (
            <button onClick={verify} disabled={busy} style={primaryBtnStyle(theme)}>
              Enable 2FA
            </button>
          ) : (
            <button onClick={disable} disabled={busy} style={dangerBtnStyle(theme)}>
              Disable 2FA
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

function PasswordPanel({ theme, onDone, setMsg }) {
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
      setMsg('Password changed. Please log in again.');
      onDone();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      {!otpSent ? (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>We'll email a code to your account address to confirm this change.</p>
          <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
            Send Code
          </button>
        </>
      ) : (
        <>
          <input type="text" placeholder="6-digit email code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '10px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }} />
          <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '10px' }} />
          <input type="password" placeholder="New password (e.g. Kynex123)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            style={{ ...inputStyle(theme), marginBottom: '14px' }} />
          <button onClick={submit} disabled={busy} style={primaryBtnStyle(theme)}>
            Change Password
          </button>
        </>
      )}
      <p style={{ fontSize: '11px', color: theme.faint, marginTop: '12px', lineHeight: 1.5 }}>Withdrawals will be locked for 2 hours after the change, and you'll be signed out.</p>
    </Panel>
  );
}

function FundPasswordPanel({ theme, onDone, setMsg }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/fund-password/set`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ pin }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Fund password set — you can now withdraw.');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>A 4-6 digit PIN required before every withdrawal.</p>
      <input type="password" inputMode="numeric" placeholder="4-6 digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6}
        style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '6px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }} />
      <button onClick={submit} disabled={busy} style={primaryBtnStyle(theme)}>
        Set Fund Password
      </button>
    </Panel>
  );
}

function ChangeFundPasswordPanel({ theme, onDone, setMsg }) {
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
      setMsg('Fund password changed successfully.');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}

      {step === 'request' && (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>
            To change your fund password, we'll send a verification code to your registered email.
          </p>
          <button onClick={requestOtp} disabled={busy} style={primaryBtnStyle(theme)}>
            {busy ? 'Sending…' : 'Send Verification Code'}
          </button>
        </>
      )}

      {step === 'verify' && (
        <>
          <p style={{ fontSize: '12px', color: theme.subtext, marginTop: 0, lineHeight: 1.5 }}>
            Enter the 6-digit code sent to your email, then set your new fund password.
          </p>
          <input
            type="text" inputMode="numeric" placeholder="Email OTP code" value={otp}
            onChange={(e) => setOtp(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '12px', letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
          />
          <input
            type="password" inputMode="numeric" placeholder="New 4-6 digit PIN" value={newPin}
            onChange={(e) => setNewPin(e.target.value)} maxLength={6}
            style={{ ...inputStyle(theme), marginBottom: '14px', letterSpacing: '6px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={submitChange} disabled={busy} style={primaryBtnStyle(theme)}>
              {busy ? 'Saving…' : 'Confirm Change'}
            </button>
            <button onClick={requestOtp} disabled={busy} style={{ ...primaryBtnStyle(theme), background: theme.cardBorder, color: theme.subtext, boxShadow: 'none' }}>
              Resend
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
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (confirmText !== 'CLOSE') { setError('Type CLOSE to confirm.'); return; }
    setError(''); setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/account/close`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Account closed.');
      logout();
      navigate('/');
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Panel theme={theme}>
      {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: 0, fontWeight: 600 }}>{error}</p>}
      <p style={{ fontSize: '12px', color: theme.down, marginTop: 0, fontWeight: 600, lineHeight: 1.5 }}>
        This permanently closes your account. This email can never be used to create a KYNEX account again.
      </p>
      <input type="text" placeholder='Type "CLOSE" to confirm' value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
        style={{ ...inputStyle(theme), marginBottom: '14px', borderColor: theme.down + '44' }} />
      <button onClick={submit} disabled={busy} style={dangerBtnStyle(theme)}>
        Close Account Permanently
      </button>
    </Panel>
  );
}

export default Security;
