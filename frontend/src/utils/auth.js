import { API_URL } from '../config';

const TOKEN_KEY = 'kynex_token';
const FCM_KEY = 'kynex_fcm_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Decode the JWT payload without verifying (verification happens server-side).
// Returns null for anything that isn't a well-formed JWT.
export function decodeToken(token = getToken()) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '='))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// True only when a real, non-expired JWT is stored. A garbage string or an expired token
// no longer passes the route guards.
export function isAuthenticated() {
  const payload = decodeToken();
  if (!payload) {
    if (getToken()) localStorage.removeItem(TOKEN_KEY); // clean up junk
    return false;
  }
  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY);
    return false;
  }
  return true;
}

// Seconds until the current token expires (null if no valid token)
export function tokenSecondsLeft() {
  const payload = decodeToken();
  if (!payload?.exp) return null;
  return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
}

export function logout() {
  const token = getToken();
  localStorage.removeItem(TOKEN_KEY);
  // Best-effort: stop push notifications for this account on this device
  if (token) {
    try {
      fetch(`${API_URL}/api/fcm-token`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  }
  localStorage.removeItem(FCM_KEY);
}

// Wrap window.fetch once: if an API request that carried our token comes back 401,
// the token is dead (expired / revoked) → clear it and send the user to /auth.
// Login / OTP endpoints never carry a token, so their 401s (wrong password) are untouched.
let guardInstalled = false;
export function installAuthFetchGuard() {
  if (guardInstalled || typeof window === 'undefined' || !window.fetch) return;
  guardInstalled = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await origFetch(input, init);
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (res.status === 401 && url.startsWith(API_URL)) {
        const h = init?.headers || (typeof input !== 'string' ? input?.headers : null);
        let auth = '';
        if (h) {
          if (typeof h.get === 'function') auth = h.get('Authorization') || h.get('authorization') || '';
          else auth = h.Authorization || h.authorization || '';
        }
        // Only when the request used our (now-rejected) bearer token, and it's not a fund-password /
        // 2FA style 401 on an endpoint that keeps the session valid.
        const isSessionEndpoint = /\/api\/demo\/withdraw$|\/api\/account\/(2fa|password|email|fund-password)/.test(url);
        if (auth.startsWith('Bearer ') && auth.slice(7) === getToken() && !isSessionEndpoint) {
          localStorage.removeItem(TOKEN_KEY);
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.replace('/auth');
          }
        }
      }
    } catch { /* never let the guard break a request */ }
    return res;
  };
}
