import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../ThemeContext';

const LOCK_KEY  = 'kynex_app_lock';
const CRED_KEY  = 'kynex_lock_cred_id';
const FIRST_KEY = 'kynex_lock_first_load';

// ── WebAuthn helpers ──────────────────────────────────────────────────────────
function b64ToUint8(b64) {
  const pad = '='.repeat((4 - b64.replace(/-/g, '+').replace(/_/g, '/').length % 4) % 4);
  return Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad), c => c.charCodeAt(0));
}
function uint8ToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function registerBiometric() {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported on this browser.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId    = crypto.getRandomValues(new Uint8Array(16));

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'KYNEX' },
      user: { id: userId, name: 'kynex-lock', displayName: 'KYNEX' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7   }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });

  localStorage.setItem(CRED_KEY, uint8ToB64(cred.rawId));
  localStorage.setItem(LOCK_KEY, 'true');
}

export async function verifyBiometric() {
  const stored = localStorage.getItem(CRED_KEY);
  if (!stored) throw new Error('No biometric registered. Please re-enable App Lock.');

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: 'public-key', id: b64ToUint8(stored) }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
}

export function clearBiometric() {
  localStorage.removeItem(CRED_KEY);
  localStorage.removeItem(LOCK_KEY);
  localStorage.removeItem(FIRST_KEY);
}

// ── Component ─────────────────────────────────────────────────────────────────
const AppLock = () => {
  const { theme } = useTheme();
  const [locked, setLocked]       = useState(false);
  const [authing, setAuthing]     = useState(false);
  const [error,   setError]       = useState('');
  const [failCount, setFailCount] = useState(0);
  const autoTriedRef              = useRef(false);
  const isAPK = !!(window.KynexBridge);

  // Emergency disable — clears lock without biometric
  const disableAndUnlock = useCallback(() => {
    clearBiometric();
    setLocked(false);
    setError('');
    setFailCount(0);
    autoTriedRef.current = false;
  }, []);

  // Trigger biometric prompt
  const unlock = useCallback(async () => {
    setAuthing(true);
    setError('');
    try {
      await verifyBiometric();
      setLocked(false);
      autoTriedRef.current = false;
      setFailCount(0);
    } catch (err) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Cancelled. Tap to try again.'
        : err?.message || 'Authentication failed. Tap to retry.';
      setError(msg);
      setFailCount(c => c + 1);
    } finally {
      setAuthing(false);
    }
  }, []);

  // Lock when app comes back from background (visibilitychange)
  useEffect(() => {
    if (isAPK) return;

    // Use sessionStorage for first-load flag so every fresh page open skips the lock.
    // The lock only fires when the user backgrounds then resumes the same session.
    const SESSION_KEY = 'kynex_session_started';

    const onVisible = () => {
      if (document.hidden) return;
      if (localStorage.getItem(LOCK_KEY) !== 'true') return;
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        return;
      }
      autoTriedRef.current = false;
      setLocked(true);
    };

    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, '1');
    }

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isAPK]);

  // Auto-trigger biometric once when lock screen appears
  useEffect(() => {
    if (!locked || authing || autoTriedRef.current) return;
    autoTriedRef.current = true;
    const t = setTimeout(() => unlock(), 350);
    return () => clearTimeout(t);
  }, [locked, authing, unlock]);

  if (!locked || isAPK) return null;

  const showEmergency = failCount >= 2;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      backgroundColor: theme.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px', padding: '32px',
    }}>
      {/* Branding */}
      <div style={{ fontWeight: '900', fontSize: '36px', letterSpacing: '-1px', color: theme.brand }}>
        KYNEX
      </div>

      {/* Lock icon ring */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(59,130,246,0.15))',
        border: '2px solid rgba(245,158,11,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '36px',
      }}>
        🔒
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: '700', fontSize: '17px', color: theme.text, marginBottom: '6px' }}>
          App Locked
        </div>
        <div style={{ fontSize: '13px', color: theme.subtext, lineHeight: '1.6' }}>
          Verify your identity to continue
        </div>
      </div>

      {error && (
        <div style={{
          fontSize: '12px', color: theme.down, textAlign: 'center',
          backgroundColor: theme.downSoft, padding: '8px 16px', borderRadius: '10px',
          border: `1px solid ${theme.down}40`,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={unlock}
        disabled={authing}
        style={{
          padding: '14px 36px', borderRadius: '16px', border: 'none',
          background: authing ? theme.inputBg : 'linear-gradient(135deg, #F59E0B, #3B82F6)',
          color: authing ? theme.subtext : 'white', fontWeight: '700', fontSize: '15px',
          cursor: authing ? 'not-allowed' : 'pointer',
          boxShadow: authing ? 'none' : '0 6px 20px rgba(245,158,11,0.35)',
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        {authing ? (
          <>
            <span style={{ fontSize: '14px' }}>⏳</span> Verifying…
          </>
        ) : (
          <>
            <span style={{ fontSize: '16px' }}>🔓</span> Unlock with Biometric
          </>
        )}
      </button>

      <div style={{ fontSize: '11px', color: theme.subtext, textAlign: 'center' }}>
        Face ID · Touch ID · Fingerprint · Device PIN
      </div>

      {/* Emergency disable — shown after 2 failed attempts */}
      {showEmergency && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <div style={{ fontSize: '12px', color: theme.faint, marginBottom: '8px' }}>
            Biometric not working?
          </div>
          <button
            onClick={disableAndUnlock}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.down}66`,
              color: theme.down,
              padding: '8px 20px',
              borderRadius: '10px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Disable App Lock &amp; Enter
          </button>
        </div>
      )}
    </div>
  );
};

export default AppLock;
