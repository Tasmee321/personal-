import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
const KEY_STORAGE = 'kynex_admin_key';

function adminHeaders(key) {
  return { 'Content-Type': 'application/json', 'x-admin-key': key };
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const AdminKyc = () => {
  const { theme } = useTheme();
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || '');
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [signalActive, setSignalActive] = useState(false);
  const [globalDailyLimit, setGlobalDailyLimit] = useState('');
  const [candleSymbol, setCandleSymbol] = useState('BTCUSDT');
  const [candleDirection, setCandleDirection] = useState('up');
  const [candleDuration, setCandleDuration] = useState('2');
  const [candleTime, setCandleTime] = useState('');
  const [activeOverrides, setActiveOverrides] = useState([]);
  const [referralBonusUser, setReferralBonusUser] = useState('');
  const [referralBonusAmount, setReferralBonusAmount] = useState('');
  const [activeReferrers, setActiveReferrers] = useState([]);
  const [referralSignalTime, setReferralSignalTime] = useState('');
  const [referralSignalWindow, setReferralSignalWindow] = useState('15');
  const [referralDirection, setReferralDirection] = useState('up');
  const [referralSymbol, setReferralSymbol] = useState('BTCUSDT');

  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAmt, setBalanceAmt] = useState('');
  const [balanceWallet, setBalanceWallet] = useState('spot');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [teamTree, setTeamTree] = useState(null);
  const [teamUser, setTeamUser] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);

  const [depositWallets, setDepositWallets] = useState({ trc20: '', erc20: '', bep20: '' });
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [savingWallets, setSavingWallets] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const safeFetch = async (url, opts) => {
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      try { return { ok: res.ok, data: JSON.parse(text) }; } catch { return { ok: false, data: { error: 'Backend server not running. Run: node server.js' } }; }
    } catch { return { ok: false, data: { error: 'Cannot connect to backend. Run: node server.js' } }; }
  };

  const loadAll = useCallback(async (key) => {
    setError('');
    const h = { 'x-admin-key': key };
    const [u, k, w, s, co, ref, dw, dp] = await Promise.all([
      safeFetch(`${API_URL}/api/admin/users`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/kyc/pending`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/withdrawals/pending`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/signal-release`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/candle-overrides`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/referral-active`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/deposit-wallets`, { headers: h }),
      safeFetch(`${API_URL}/api/admin/deposits/pending`, { headers: h }),
    ]);
    if (!u.ok) { setError(u.data.error || 'Invalid admin key.'); setAuthed(false); return; }
    setUsers(u.data.users || []);
    setPending(k.data.pending || []);
    setWithdrawals(w.data.pending || []);
    setSignalActive(!!s.data.signalActive);
    setGlobalDailyLimit(s.data.globalDailyLimit ? String(s.data.globalDailyLimit) : '');
    setReferralSignalTime(s.data.referralSignalTime || '');
    setReferralSignalWindow(String(s.data.referralSignalWindow || 15));
    setReferralDirection(s.data.referralDirection || 'up');
    setReferralSymbol(s.data.referralSymbol || 'BTCUSDT');
    setActiveOverrides(co.data?.overrides || []);
    setActiveReferrers(ref.data?.referrers || []);
    if (dw.ok) setDepositWallets(dw.data.wallets || { trc20: '', erc20: '', bep20: '' });
    if (dp.ok) setPendingDeposits(dp.data.deposits || []);
    setAuthed(true);
    sessionStorage.setItem(KEY_STORAGE, key);
  }, []);

  useEffect(() => {
    if (adminKey) loadAll(adminKey);
  }, []);

  const decide = async (userId, approve) => {
    setBusyId(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/kyc/${userId}/decide`, {
        method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending(prev => prev.filter(p => p.id !== userId));
      showToast(approve ? 'KYC Approved' : 'KYC Rejected');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const processWithdrawal = async (requestId, approve) => {
    setBusyId(requestId);
    try {
      const res = await fetch(`${API_URL}/api/admin/withdrawals/${requestId}/process`, {
        method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWithdrawals(prev => prev.filter(w => w.id !== requestId));
      showToast(approve ? 'Withdrawal Approved' : 'Withdrawal Rejected');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const toggleSignal = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/signal-release`, {
        method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify({ active: !signalActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignalActive(data.signalActive);
      showToast(data.signalActive ? 'Signals Activated' : 'Signals Deactivated');
    } catch (err) { setError(err.message); }
  };

  const saveGlobalLimit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/global-signal-limit`, {
        method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify({ limit: Number(globalDailyLimit) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Global daily limit set to ${data.globalDailyLimit}`);
    } catch (err) { setError(err.message); }
  };

  const pushCandleOverride = async () => {
    try {
      const body = { symbol: candleSymbol, direction: candleDirection, durationMinutes: Number(candleDuration) };
      if (candleTime) body.scheduledTime = candleTime;
      const res = await fetch(`${API_URL}/api/admin/candle-override`, {
        method: 'POST', headers: adminHeaders(adminKey), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const label = candleTime ? `scheduled at ${candleTime}` : 'now';
      showToast(`Candle: ${candleSymbol.replace('USDT','')} ${candleDirection.toUpperCase()} for ${candleDuration}m (${label})`);
      setCandleTime('');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const deleteCandleOverride = async (index) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/candle-override`, {
        method: 'DELETE', headers: adminHeaders(adminKey), body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Override removed');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const saveReferralSignalTime = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/referral-signal-time`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ time: referralSignalTime, windowMinutes: Number(referralSignalWindow), direction: referralDirection, symbol: referralSymbol }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Referral signal: ${data.referralSymbol.replace('USDT','')} ${data.referralDirection.toUpperCase()} at ${data.referralSignalTime} (${data.referralSignalWindow}min)`);
    } catch (err) { setError(err.message); }
  };

  const grantReferralBonus = async () => {
    if (!referralBonusUser || !referralBonusAmount) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/referral-bonus`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ userId: referralBonusUser, bonusSignals: Number(referralBonusAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReferralBonusAmount('');
      setReferralBonusUser('');
      showToast(`Granted ${referralBonusAmount} bonus signals`);
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const adjustBalance = async () => {
    if (!selectedUser || !balanceAmt) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${selectedUser.id}/balance`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ amount: Number(balanceAmt), wallet: balanceWallet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBalanceAmt('');
      showToast(`Balance updated: ${balanceWallet} wallet`);
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const sendMessage = async () => {
    if (!selectedUser || !msgTitle.trim() || !msgBody.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${selectedUser.id}/message`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ title: msgTitle, body: msgBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsgTitle(''); setMsgBody('');
      showToast('Message sent');
    } catch (err) { setError(err.message); }
  };

  const setLevel = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/set-level`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ userId: selectedUser.id, level: Number(newLevel) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewLevel('');
      showToast(`Level set to ${data.level}`);
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const setSignalLimit = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/signal-limit`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ userId: selectedUser.id, dailyLimit: Number(newLimit) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewLimit('');
      showToast(`Signal limit set to ${data.dailySignalLimit}`);
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const toggleBlock = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${user.id}/block`, {
        method: 'POST', headers: adminHeaders(adminKey),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.closed ? 'Account Blocked' : 'Account Unblocked');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const deleteUser = async (user) => {
    if (!confirm(`DELETE "${user.name}" (${user.email})? This cannot be undone!`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${user.id}`, {
        method: 'DELETE', headers: adminHeaders(adminKey),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('User deleted');
      setSelectedUser(null);
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const loadTeam = async (user) => {
    setLoadingTree(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${user.id}/team`, { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeamTree(data.tree);
      setTeamUser(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoadingTree(false); }
  };

  const saveDepositWallets = async () => {
    setSavingWallets(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-wallets`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ wallets: depositWallets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Deposit wallets saved');
    } catch (err) { setError(err.message); }
    finally { setSavingWallets(false); }
  };

  const processDeposit = async (requestId, approve) => {
    setBusyId(requestId);
    try {
      const res = await fetch(`${API_URL}/api/admin/deposits/${requestId}/process`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ approve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingDeposits(prev => prev.filter(d => d.id !== requestId));
      showToast(approve ? 'Deposit Approved — balance credited' : 'Deposit Rejected');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  };

  const removeWhitelist = async (userId, address) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/whitelist/remove`, {
        method: 'POST', headers: adminHeaders(adminKey),
        body: JSON.stringify({ userId, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Address removed');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const tabs = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'kyc', label: 'KYC' },
    { key: 'deposits', label: 'Deposits' },
    { key: 'withdrawals', label: 'Withdrawals' },
    { key: 'signals', label: 'Signals' },
  ];

  const card = {
    backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
    borderRadius: '14px', padding: '20px', boxShadow: theme.shadow,
  };
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.card,
    color: theme.text, fontSize: '13px', boxSizing: 'border-box',
  };
  const btnPrimary = {
    padding: '10px 20px', borderRadius: '8px', border: 'none',
    backgroundColor: theme.primary, color: 'white', fontWeight: 'bold',
    cursor: 'pointer', fontSize: '13px',
  };
  const btnSuccess = { ...btnPrimary, backgroundColor: theme.up };
  const btnDanger = { ...btnPrimary, backgroundColor: theme.down };

  const filteredUsers = users.filter(u => {
    if (userFilter === 'deposited' && u.totalDeposited <= 0) return false;
    if (userFilter === 'kyc' && u.kycStatus !== 'certified') return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || String(u.uid).includes(q);
  });

  const totalBalance = users.reduce((s, u) => s + u.balance + u.signalBalance, 0);
  const totalDeposited = users.reduce((s, u) => s + u.totalDeposited, 0);
  const totalWithdrawn = users.reduce((s, u) => s + (u.totalWithdrawn || 0), 0);
  const verifiedCount = users.filter(u => u.verified).length;

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>KYNEX</div>
          <div style={{ fontSize: '13px', color: theme.subtext, marginBottom: '24px' }}>Admin Panel</div>
          <input type="password" placeholder="Enter admin key" value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAll(adminKey)}
            style={{ ...inputStyle, marginBottom: '12px', textAlign: 'center' }} />
          <button onClick={() => loadAll(adminKey)} style={{ ...btnPrimary, width: '100%' }}>Login</button>
          {error && <p style={{ color: theme.down, fontSize: '12px', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
          backgroundColor: theme.up, color: 'white', padding: '12px 20px',
          borderRadius: '10px', fontWeight: 'bold', fontSize: '13px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s',
        }}>{toast}</div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 24px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        gap: '16px',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.brand }}>KYNEX</div>
        <div style={{ fontSize: '12px', color: theme.subtext, padding: '3px 10px', borderRadius: '6px', backgroundColor: theme.primarySoft || 'rgba(99,102,241,0.15)', color: theme.primary }}>Admin</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '11px', color: theme.faint }}>supportkynex@gmail.com</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', overflowX: 'auto', borderBottom: `1px solid ${theme.cardBorder}` }}>
        {tabs.map(t => {
          const count = t.key === 'kyc' ? pending.length : t.key === 'withdrawals' ? withdrawals.length : t.key === 'deposits' ? pendingDeposits.length : 0;
          return (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedUser(null); }} style={{
              padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              border: activeTab === t.key ? 'none' : `1px solid ${theme.cardBorder}`,
              backgroundColor: activeTab === t.key ? theme.primary : 'transparent',
              color: activeTab === t.key ? 'white' : theme.subtext, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {t.label}
              {count > 0 && <span style={{
                backgroundColor: activeTab === t.key ? 'rgba(255,255,255,0.3)' : theme.down,
                color: 'white', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
              }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {error && <div style={{ padding: '8px 24px' }}><p style={{ color: theme.down, fontSize: '13px', margin: 0 }}>{error}</p></div>}

      <div style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total Users', value: users.length, color: theme.primary },
                { label: 'Verified (KYC)', value: verifiedCount, color: theme.up },
                { label: 'Pending KYC', value: pending.length, color: '#f59e0b' },
                { label: 'Pending Deposits', value: pendingDeposits.length, color: '#F59E0B' },
                { label: 'Pending Withdrawals', value: withdrawals.length, color: theme.down },
                { label: 'Total Deposited', value: `$${totalDeposited.toLocaleString()}`, color: theme.up },
                { label: 'Total Withdrawn', value: `$${totalWithdrawn.toLocaleString()}`, color: theme.down },
                { label: 'Total Balances', value: `$${totalBalance.toLocaleString()}`, color: theme.primary },
                { label: 'Signals', value: signalActive ? 'Active' : 'Inactive', color: signalActive ? theme.up : theme.down },
                { label: 'Blocked Users', value: users.filter(u => u.closed).length, color: theme.down },
              ].map((s, i) => (
                <div key={i} style={{ ...card, padding: '16px 18px' }}>
                  <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={card}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>Recent KYC Submissions</div>
                {pending.length === 0 && <div style={{ color: theme.faint, fontSize: '13px' }}>No pending submissions</div>}
                {pending.slice(0, 3).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: '11px', color: theme.subtext }}>{p.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => decide(p.id, true)} style={{ ...btnSuccess, padding: '5px 12px', fontSize: '11px' }}>Approve</button>
                      <button onClick={() => decide(p.id, false)} style={{ ...btnDanger, padding: '5px 12px', fontSize: '11px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={card}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>Recent Withdrawals</div>
                {withdrawals.length === 0 && <div style={{ color: theme.faint, fontSize: '13px' }}>No pending withdrawals</div>}
                {withdrawals.slice(0, 3).map(w => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{w.email || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: theme.subtext }}>{Number(w.netPayout).toFixed(2)} USDT via {w.network?.toUpperCase()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => processWithdrawal(w.id, true)} style={{ ...btnSuccess, padding: '5px 12px', fontSize: '11px' }}>Approve</button>
                      <button onClick={() => processWithdrawal(w.id, false)} style={{ ...btnDanger, padding: '5px 12px', fontSize: '11px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && !selectedUser && (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search by name, email, or UID..." value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)} style={{ ...inputStyle, maxWidth: '300px' }} />
              {['all', 'deposited', 'kyc'].map(f => (
                <button key={f} onClick={() => setUserFilter(f)} style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                  backgroundColor: userFilter === f ? theme.primary : theme.card, color: userFilter === f ? 'white' : theme.subtext,
                  border: `1px solid ${userFilter === f ? theme.primary : theme.cardBorder}`,
                }}>{f === 'all' ? 'All Users' : f === 'deposited' ? 'Deposited' : 'KYC Verified'}</button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${theme.cardBorder}`, textAlign: 'left' }}>
                    {['UID', 'Name', 'Email', 'KYC', 'Level', 'Spot', 'Signal', 'Deposited', 'Withdrawn', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 8px', color: theme.subtext, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${theme.cardBorder}`, cursor: 'pointer' }}
                      onClick={() => { setSelectedUser(u); setNewLevel(String(u.level || 0)); setNewLimit(String(u.dailySignalLimit || 3)); }}>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '12px' }}>{u.uid}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600' }}>{u.name}</td>
                      <td style={{ padding: '10px 8px', color: theme.subtext }}>{u.email}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                          backgroundColor: u.kycStatus === 'certified' ? theme.upSoft : u.kycStatus === 'pending' ? 'rgba(245,158,11,0.15)' : theme.downSoft,
                          color: u.kycStatus === 'certified' ? theme.up : u.kycStatus === 'pending' ? '#f59e0b' : theme.down,
                        }}>{u.kycStatus}</span>
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: theme.primary }}>{u.level}</td>
                      <td style={{ padding: '10px 8px', fontVariantNumeric: 'tabular-nums' }}>${u.balance.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', fontVariantNumeric: 'tabular-nums' }}>${u.signalBalance.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: theme.up }}>${u.totalDeposited.toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', fontVariantNumeric: 'tabular-nums', color: theme.down }}>${(u.totalWithdrawn || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                          backgroundColor: u.closed ? theme.downSoft : theme.upSoft,
                          color: u.closed ? theme.down : theme.up,
                        }}>{u.closed ? 'Blocked' : 'Active'}</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); setNewLevel(String(u.level || 0)); setNewLimit(String(u.dailySignalLimit || 3)); }}
                          style={{ ...btnPrimary, padding: '4px 12px', fontSize: '11px' }}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: theme.faint }}>{filteredUsers.length} users</div>
          </>
        )}

        {activeTab === 'users' && selectedUser && (
          <>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '16px', padding: 0 }}>
              ← Back to Users
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '16px' }}>{selectedUser.email} · UID {selectedUser.uid}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>Spot Balance</div>
                    <div style={{ fontWeight: 'bold', color: theme.primary }}>${selectedUser.balance.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>Signal Balance</div>
                    <div style={{ fontWeight: 'bold', color: theme.primary }}>${selectedUser.signalBalance.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>Level</div>
                    <div style={{ fontWeight: 'bold', color: theme.primary }}>{selectedUser.level}</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>Signal Limit</div>
                    <div style={{ fontWeight: 'bold', color: theme.primary }}>{selectedUser.dailySignalLimit}/day</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: selectedUser.kycStatus === 'certified' ? theme.upSoft : theme.downSoft, color: selectedUser.kycStatus === 'certified' ? theme.up : theme.down, fontWeight: 'bold' }}>
                    KYC: {selectedUser.kycStatus}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: selectedUser.twoFactorEnabled ? theme.upSoft : theme.downSoft, color: selectedUser.twoFactorEnabled ? theme.up : theme.down, fontWeight: 'bold' }}>
                    2FA: {selectedUser.twoFactorEnabled ? 'On' : 'Off'}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: !selectedUser.closed ? theme.upSoft : theme.downSoft, color: !selectedUser.closed ? theme.up : theme.down, fontWeight: 'bold' }}>
                    {selectedUser.closed ? 'Blocked' : 'Active'}
                  </span>
                </div>
                {selectedUser.levelInfo && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', backgroundColor: theme.card, border: `1px solid ${theme.faint}22` }}>
                    <div style={{ fontSize: '11px', color: theme.subtext, marginBottom: '6px' }}>Team Stats</div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', flexWrap: 'wrap' }}>
                      <span>Direct: <b style={{ color: theme.primary }}>{selectedUser.levelInfo.directCount}</b> <span style={{ color: theme.faint, fontSize: '10px' }}>({selectedUser.levelInfo.qualifiedDirectCount} qualified)</span></span>
                      <span>Team: <b style={{ color: theme.primary }}>{selectedUser.levelInfo.teamCount}</b> <span style={{ color: theme.faint, fontSize: '10px' }}>({selectedUser.levelInfo.qualifiedTeamCount} qualified)</span></span>
                      <span>Team Deposit: <b style={{ color: theme.up }}>${selectedUser.levelInfo.teamDeposit}</b></span>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => loadTeam(selectedUser)} style={btnPrimary} disabled={loadingTree}>
                    {loadingTree ? 'Loading...' : 'View Team Tree'}
                  </button>
                  <button onClick={() => toggleBlock(selectedUser)} style={selectedUser.closed ? btnSuccess : btnDanger}>
                    {selectedUser.closed ? 'Unblock Account' : 'Block Account'}
                  </button>
                  <button onClick={() => deleteUser(selectedUser)} style={{ ...btnDanger, backgroundColor: '#7f1d1d' }}>
                    Delete User
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Adjust Balance</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select value={balanceWallet} onChange={(e) => setBalanceWallet(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                      <option value="spot">Spot</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input type="number" placeholder="Amount (+/-)" value={balanceAmt} onChange={(e) => setBalanceAmt(e.target.value)} style={inputStyle} />
                    <button onClick={adjustBalance} style={btnPrimary}>Apply</button>
                  </div>
                  <div style={{ fontSize: '11px', color: theme.faint }}>Use negative values to deduct</div>
                </div>

                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Set Level & Signal Limit</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="number" min="0" max="9" placeholder="Level (0-9)" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} style={inputStyle} />
                    <button onClick={setLevel} style={btnPrimary}>Set Level</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" min="1" max="100" placeholder="Daily limit" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} style={inputStyle} />
                    <button onClick={setSignalLimit} style={btnPrimary}>Set Limit</button>
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Send Notification</div>
                  <input type="text" placeholder="Title" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }} />
                  <textarea placeholder="Message body" value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  <button onClick={sendMessage} style={{ ...btnPrimary, marginTop: '8px' }}>Send</button>
                </div>

                {selectedUser.whitelistedAddresses?.length > 0 && (
                  <div style={card}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Whitelisted Addresses</div>
                    {selectedUser.whitelistedAddresses.map((addr, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <code style={{ fontSize: '11px', color: theme.subtext, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>{addr}</code>
                        <button onClick={() => removeWhitelist(selectedUser.id, addr)} style={{ ...btnDanger, padding: '3px 10px', fontSize: '10px' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {teamTree && teamUser && teamUser.id === selectedUser.id && (() => {
              const countAll = (nodes) => nodes.reduce((s, n) => s + 1 + countAll(n.children || []), 0);
              const totalMembers = countAll(teamTree);
              const directCount = teamTree.length;

              const TreeNode = ({ node, depth = 0 }) => (
                <div style={{ marginLeft: depth * 24, marginBottom: '4px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                    borderRadius: '8px', backgroundColor: depth === 0 ? `${theme.primary}11` : theme.bg,
                    border: `1px solid ${theme.cardBorder}`,
                  }}>
                    {depth > 0 && <span style={{ color: theme.faint, fontSize: '12px' }}>└</span>}
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{node.name}</span>
                    <span style={{ fontSize: '11px', color: theme.subtext }}>{node.email}</span>
                    <span style={{ fontSize: '11px', color: theme.faint, fontFamily: 'monospace' }}>UID {node.uid}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                      backgroundColor: node.level > 0 ? `${theme.primary}22` : `${theme.faint}22`,
                      color: node.level > 0 ? theme.primary : theme.faint,
                    }}>Lv {node.level}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                      backgroundColor: node.kycStatus === 'certified' ? theme.upSoft : theme.downSoft,
                      color: node.kycStatus === 'certified' ? theme.up : theme.down,
                    }}>{node.kycStatus === 'certified' ? 'KYC' : 'No KYC'}</span>
                    <span style={{ fontSize: '11px', color: theme.up, fontWeight: '600', marginLeft: 'auto' }}>
                      ${node.totalDeposited} dep · ${node.balance} bal
                    </span>
                  </div>
                  {(node.children || []).map(c => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
                </div>
              );

              return (
                <div style={{ ...card, marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Referral Team Tree — {teamUser.name}</div>
                      <div style={{ fontSize: '12px', color: theme.subtext, marginTop: '2px' }}>
                        Direct: <b style={{ color: theme.primary }}>{directCount}</b> · Total Team: <b style={{ color: theme.primary }}>{totalMembers}</b> · Level: <b style={{ color: theme.primary }}>{teamUser.level}</b>
                      </div>
                    </div>
                    <button onClick={() => { setTeamTree(null); setTeamUser(null); }} style={{ ...btnDanger, padding: '6px 14px', fontSize: '11px' }}>Close</button>
                  </div>
                  {teamTree.length === 0 ? (
                    <div style={{ color: theme.faint, textAlign: 'center', padding: '30px', fontSize: '13px' }}>No team members</div>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {teamTree.map(n => <TreeNode key={n.id} node={n} depth={0} />)}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {activeTab === 'kyc' && (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>Pending KYC Submissions ({pending.length})</div>
            {pending.length === 0 && <div style={{ ...card, color: theme.faint, textAlign: 'center', padding: '40px' }}>No pending KYC submissions</div>}
            {pending.map(p => (
              <div key={p.id} style={{ ...card, marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '2px' }}>{p.email} · UID {p.uid}</div>
                    <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '2px' }}>Country: {p.country} · DOB: {p.dob}</div>
                    <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '2px' }}>Doc: {p.docType} · ID: <code>{p.idNumber}</code> · {p.documentCount} photo(s)</div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>Submitted: {fmtDate(p.submittedAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => decide(p.id, true)} disabled={busyId === p.id} style={btnSuccess}>Approve</button>
                    <button onClick={() => decide(p.id, false)} disabled={busyId === p.id} style={btnDanger}>Reject</button>
                  </div>
                </div>
                {Array.isArray(p.documents) && p.documents.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subtext, marginBottom: '8px' }}>Uploaded Documents</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {p.documents.map((doc, i) => (
                        <a key={i} href={doc} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${theme.cardBorder}` }}>
                          <img src={doc} alt={`Document ${i + 1}`} style={{ width: '180px', height: '120px', objectFit: 'cover', display: 'block', cursor: 'pointer' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {(!p.documents || p.documents.length === 0) && p.documentCount > 0 && (
                  <div style={{ fontSize: '11px', color: theme.faint, fontStyle: 'italic' }}>Documents were submitted before image storage was enabled. Ask user to re-submit.</div>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'deposits' && (
          <>
            {/* Wallet Addresses */}
            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>Deposit Wallet Addresses</div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '14px' }}>
                Set your USDT receiving addresses. Users will see these addresses and send deposits to them.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'trc20', label: 'TRC20 (Tron)', color: '#FF0013' },
                  { key: 'erc20', label: 'ERC20 (Ethereum)', color: '#627EEA' },
                  { key: 'bep20', label: 'BEP20 (BSC)', color: '#F3BA2F' },
                ].map(n => (
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color, flexShrink: 0 }}></span>
                    <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '130px' }}>{n.label}</span>
                    <input type="text" placeholder={`${n.label} wallet address`}
                      value={depositWallets[n.key] || ''}
                      onChange={(e) => setDepositWallets(prev => ({ ...prev, [n.key]: e.target.value }))}
                      style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} />
                  </div>
                ))}
              </div>
              <button onClick={saveDepositWallets} disabled={savingWallets}
                style={{ ...btnPrimary, marginTop: '14px' }}>
                {savingWallets ? 'Saving...' : 'Save Wallet Addresses'}
              </button>
            </div>

            {/* Pending Deposits */}
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>
              Pending Deposit Requests ({pendingDeposits.length})
            </div>
            {pendingDeposits.length === 0 && (
              <div style={{ ...card, color: theme.faint, textAlign: 'center', padding: '40px' }}>No pending deposit requests</div>
            )}
            {pendingDeposits.map(d => (
              <div key={d.id} style={{ ...card, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{d.userName || d.userEmail || 'Unknown'}</div>
                    <div style={{ fontSize: '13px', color: theme.subtext, marginBottom: '4px' }}>
                      Amount: <b style={{ color: theme.up }}>{Number(d.amount).toFixed(2)} USDT</b> · Network: <b>{d.network?.toUpperCase()}</b>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.subtext, marginBottom: '4px' }}>
                      TX Hash: <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{d.txHash}</code>
                    </div>
                    {d.verificationNote && (
                      <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '4px', fontStyle: 'italic' }}>
                        Auto-verify: {d.verificationNote}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: theme.faint }}>Submitted: {fmtDate(d.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                    <button onClick={() => processDeposit(d.id, true)} disabled={busyId === d.id} style={btnSuccess}>Approve</button>
                    <button onClick={() => processDeposit(d.id, false)} disabled={busyId === d.id} style={btnDanger}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'withdrawals' && (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>Pending Withdrawals ({withdrawals.length})</div>
            {withdrawals.length === 0 && <div style={{ ...card, color: theme.faint, textAlign: 'center', padding: '40px' }}>No pending withdrawals</div>}
            {withdrawals.map(w => (
              <div key={w.id} style={{ ...card, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{w.name || w.email || 'Unknown'}</div>
                    <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '2px' }}>
                      Amount: <b>{Number(w.amount).toFixed(2)} USDT</b> · Net Payout: <b style={{ color: theme.up }}>{Number(w.netPayout).toFixed(2)} USDT</b>
                    </div>
                    <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '2px' }}>
                      Network: <b>{w.network?.toUpperCase()}</b>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.subtext, marginBottom: '2px' }}>
                      Address: <code style={{ fontSize: '11px' }}>{w.walletAddress}</code>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>Requested: {fmtDate(w.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => processWithdrawal(w.id, true)} disabled={busyId === w.id} style={btnSuccess}>Approve</button>
                    <button onClick={() => processWithdrawal(w.id, false)} disabled={busyId === w.id} style={btnDanger}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'signals' && (
          <>
            {/* Signal on/off */}
            <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>Signal Trading</div>
                <div style={{ fontSize: '13px', color: theme.subtext }}>
                  Status: <b style={{ color: signalActive ? theme.up : theme.down }}>{signalActive ? 'Active' : 'Inactive'}</b>
                </div>
              </div>
              <button onClick={toggleSignal} style={signalActive ? btnDanger : btnSuccess}>
                {signalActive ? 'Deactivate Signals' : 'Activate Signals'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Global daily limit */}
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Global Daily Signal Limit (All Users)</div>
                <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px' }}>
                  Set a daily limit for ALL users. Per-user limits still override this.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" min="1" max="100" placeholder="e.g. 4" value={globalDailyLimit}
                    onChange={(e) => setGlobalDailyLimit(e.target.value)} style={inputStyle} />
                  <button onClick={saveGlobalLimit} style={btnPrimary}>Set</button>
                </div>
                {globalDailyLimit && <div style={{ fontSize: '11px', color: theme.up, marginTop: '6px' }}>Current: {globalDailyLimit} signals/day for all users</div>}
              </div>

              {/* Candle override */}
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Candle Control</div>
                <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px' }}>
                  Schedule a coin's candle direction at a specific time. Leave time empty to start now.
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={candleSymbol} onChange={(e) => setCandleSymbol(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                    {['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','LTCUSDT'].map(s => (
                      <option key={s} value={s}>{s.replace('USDT','')}</option>
                    ))}
                  </select>
                  <select value={candleDirection} onChange={(e) => setCandleDirection(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                    <option value="up">UP</option>
                    <option value="down">DOWN</option>
                  </select>
                  <input type="time" value={candleTime} onChange={(e) => setCandleTime(e.target.value)}
                    style={{ ...inputStyle, width: '120px' }} title="Schedule time (leave empty = now)" />
                  <input type="number" min="1" max="30" value={candleDuration} onChange={(e) => setCandleDuration(e.target.value)}
                    style={{ ...inputStyle, width: '70px' }} placeholder="Min" />
                  <button onClick={pushCandleOverride} style={btnPrimary}>Schedule</button>
                </div>
                {activeOverrides.length > 0 && (
                  <div style={{ fontSize: '11px', marginTop: '6px' }}>
                    <div style={{ fontWeight: '600', color: theme.text, marginBottom: '4px' }}>Scheduled / Active:</div>
                    {activeOverrides.map((o, i) => {
                      const now = Date.now();
                      const isActive = o.startsAt <= now && o.endsAt > now;
                      const isScheduled = o.startsAt > now;
                      const remaining = isActive ? Math.max(0, Math.ceil((o.endsAt - now) / 60000)) : 0;
                      const startTime = new Date(o.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: o.direction === 'up' ? theme.up : theme.down, fontWeight: '600' }}>
                            {o.symbol.replace('USDT','')} {o.direction.toUpperCase()}
                          </span>
                          {isActive && <span style={{ color: theme.up }}>LIVE — {remaining}m left</span>}
                          {isScheduled && <span style={{ color: theme.subtext }}>Scheduled {startTime}</span>}
                          {!isActive && !isScheduled && <span style={{ color: theme.faint }}>Expired</span>}
                          <button onClick={() => deleteCandleOverride(i)} style={{ background: 'none', border: 'none', color: theme.down, cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Referral signal session */}
            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Referral Signal Session</div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px' }}>
                Set the daily referral signal. Users with bonus signals just click one button — direction, coin, and settle time are all auto from here.
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                <select value={referralSymbol} onChange={(e) => setReferralSymbol(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                  {['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','LTCUSDT'].map(s => (
                    <option key={s} value={s}>{s.replace('USDT','')}</option>
                  ))}
                </select>
                <select value={referralDirection} onChange={(e) => setReferralDirection(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="up">UP</option>
                  <option value="down">DOWN</option>
                </select>
                <input type="time" value={referralSignalTime} onChange={(e) => setReferralSignalTime(e.target.value)}
                  style={{ ...inputStyle, width: '130px' }} title="Start time" />
                <input type="number" min="5" max="120" value={referralSignalWindow} onChange={(e) => setReferralSignalWindow(e.target.value)}
                  style={{ ...inputStyle, width: '70px' }} placeholder="min" />
                <span style={{ fontSize: '12px', color: theme.subtext }}>min</span>
                <button onClick={saveReferralSignalTime} style={btnPrimary}>Set</button>
              </div>
              {referralSignalTime && (
                <div style={{ fontSize: '11px', color: theme.up, marginTop: '4px' }}>
                  Daily session: <b>{referralSymbol.replace('USDT','')} {referralDirection.toUpperCase()}</b> from <b>{referralSignalTime}</b> to <b>{(() => {
                    const [h, m] = referralSignalTime.split(':').map(Number);
                    const end = new Date(); end.setHours(h, m + Number(referralSignalWindow), 0, 0);
                    return end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  })()}</b> — users click one button, trade auto-settles at end, always wins with 1% profit
                </div>
              )}
            </div>

            {/* Referral bonus signals */}
            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Referral Bonus Signals</div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '12px' }}>
                Grant extra bonus signals (1% profit each) to users who referred active depositors.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <select value={referralBonusUser} onChange={(e) => setReferralBonusUser(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', minWidth: '200px' }}>
                  <option value="">Select user...</option>
                  {activeReferrers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.referredCount} referral(s)</option>
                  ))}
                </select>
                <input type="number" min="1" max="100" placeholder="Bonus signals" value={referralBonusAmount}
                  onChange={(e) => setReferralBonusAmount(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                <button onClick={grantReferralBonus} style={btnPrimary}>Grant</button>
              </div>

              <div style={{ fontWeight: '600', fontSize: '12px', color: theme.text, marginBottom: '8px' }}>
                Active Referrers (referred users who deposited)
              </div>
              {activeReferrers.length === 0 && (
                <div style={{ color: theme.faint, fontSize: '12px' }}>No active referrers yet</div>
              )}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {activeReferrers.map(r => (
                  <div key={r.id} style={{
                    padding: '10px', marginBottom: '8px', borderRadius: '10px',
                    backgroundColor: theme.bg, border: `1px solid ${theme.cardBorder}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: theme.text }}>{r.name}</span>
                        <span style={{ color: theme.subtext, fontSize: '12px', marginLeft: '8px' }}>{r.email}</span>
                        <span style={{ color: theme.faint, fontSize: '11px', marginLeft: '8px' }}>UID {r.uid}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {r.referralBonusSignals > 0 && (
                          <span style={{ fontSize: '11px', color: theme.up, fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', backgroundColor: theme.upSoft }}>
                            {r.referralBonusSignals} bonus
                          </span>
                        )}
                        <button onClick={() => { setReferralBonusUser(r.id); setReferralBonusAmount('1'); }}
                          style={{ ...btnPrimary, padding: '4px 10px', fontSize: '11px' }}>Grant Bonus</button>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>
                      {r.referredCount} referred user(s):
                      {r.referred.map((ref, i) => (
                        <span key={i} style={{ marginLeft: '6px' }}>
                          <b>{ref.name}</b> (${ref.totalDeposited} deposited)
                          {i < r.referred.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          table { font-size: 11px !important; }
          td, th { padding: 6px 4px !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminKyc;
