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
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' });
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
  const [teamData, setTeamData] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [userDetailTab, setUserDetailTab] = useState('info');
  const [userDeposits, setUserDeposits] = useState([]);
  const [userWithdrawals, setUserWithdrawals] = useState([]);
  const [userSignals, setUserSignals] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [depositWallets, setDepositWallets] = useState({ trc20: '', erc20: '', bep20: '' });
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [savingWallets, setSavingWallets] = useState(false);
  const [showDepositDetail, setShowDepositDetail] = useState(false);
  const [showWithdrawDetail, setShowWithdrawDetail] = useState(false);

  // Live Chat
  const [chatThreads, setChatThreads] = useState([]);
  const [activeChatUid, setActiveChatUid] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatReply, setChatReply] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const chatBottomRef = React.useRef(null);
  const chatPollRef = React.useRef(null);
  const typingPollRef = React.useRef(null);
  const lastAdminTypingSent = React.useRef(0);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadChatThreads = React.useCallback(async (key) => {
    const k = key || adminKey;
    if (!k) return;
    const { ok, data } = await safeFetch(`${API_URL}/api/admin/livechat`, { headers: { 'x-admin-key': k } });
    if (ok && data.ok) setChatThreads(data.threads || []);
  }, [adminKey]);

  const openChatThread = async (uid) => {
    setActiveChatUid(uid);
    setUserTyping(false);
    const { ok, data } = await safeFetch(`${API_URL}/api/admin/livechat/${uid}`, { headers: { 'x-admin-key': adminKey } });
    if (ok && data.ok) {
      setChatMessages(data.messages || []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    clearInterval(chatPollRef.current);
    clearInterval(typingPollRef.current);
    chatPollRef.current = setInterval(async () => {
      const r = await safeFetch(`${API_URL}/api/admin/livechat/${uid}`, { headers: { 'x-admin-key': adminKey } });
      if (r.ok && r.data.ok) {
        setChatMessages(r.data.messages || []);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    }, 4000);
    typingPollRef.current = setInterval(async () => {
      const r = await safeFetch(`${API_URL}/api/admin/livechat/${uid}/typing-status`, { headers: { 'x-admin-key': adminKey } });
      if (r.ok && r.data.ok) setUserTyping(r.data.userTyping || false);
    }, 2000);
  };

  const notifyAdminTyping = async () => {
    const now = Date.now();
    if (now - lastAdminTypingSent.current < 2000 || !activeChatUid) return;
    lastAdminTypingSent.current = now;
    try {
      await fetch(`${API_URL}/api/admin/livechat/${activeChatUid}/typing`, {
        method: 'POST', headers: { 'x-admin-key': adminKey },
      });
    } catch { /* network */ }
  };

  const sendChatReply = async () => {
    const text = chatReply.trim();
    if (!text || chatSending || !activeChatUid) return;
    setChatSending(true);
    setChatReply('');
    const { ok, data } = await safeFetch(`${API_URL}/api/admin/livechat/${activeChatUid}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ text }),
    });
    if (ok && data.ok) {
      setChatMessages(prev => [...prev, data.message]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
    setChatSending(false);
  };

  const sendBroadcast = async () => {
    const text = broadcastText.trim();
    if (!text || broadcastSending) return;
    setBroadcastSending(true);
    setBroadcastResult('');
    try {
      const res = await fetch(`${API_URL}/api/admin/livechat/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.ok) {
        setBroadcastText('');
        setBroadcastResult(`✓ Sent to ${data.sent} deposited user${data.sent !== 1 ? 's' : ''}`);
        setTimeout(() => setBroadcastResult(''), 4000);
        loadChatThreads();
      } else {
        setBroadcastResult('✗ Failed to send');
        setTimeout(() => setBroadcastResult(''), 3000);
      }
    } catch {
      setBroadcastResult('✗ Network error');
      setTimeout(() => setBroadcastResult(''), 3000);
    }
    setBroadcastSending(false);
  };

  React.useEffect(() => {
    if (activeTab === 'livechat' && authed) {
      loadChatThreads();
      const interval = setInterval(() => loadChatThreads(), 6000);
      return () => { clearInterval(interval); clearInterval(chatPollRef.current); clearInterval(typingPollRef.current); };
    }
    return () => { clearInterval(chatPollRef.current); clearInterval(typingPollRef.current); };
  }, [activeTab, authed, loadChatThreads]);

  const safeFetch = async (url, opts, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, opts);
        const text = await res.text();
        try {
          return { ok: res.ok, data: JSON.parse(text) };
        } catch {
          return { ok: false, data: { error: 'Server returned invalid response. Try again.' } };
        }
      } catch {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
    return { ok: false, data: { error: 'Server is waking up — please wait a moment and try again.' } };
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
    if (dp.ok) setPendingDeposits(dp.data.pending || []);
    setAuthed(true);
    sessionStorage.setItem(KEY_STORAGE, key);
    // Load chat threads for badge count
    const chatR = await safeFetch(`${API_URL}/api/admin/livechat`, { headers: h });
    if (chatR.ok && chatR.data.ok) setChatThreads(chatR.data.threads || []);
  }, []);

  useEffect(() => {
    if (adminKey) loadAll(adminKey);
  }, []);

  // Auto-refresh every 30 seconds when authed — no manual refresh needed
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      loadAll(adminKey);
      // Also refresh chat threads count for the tab badge
      loadChatThreads(adminKey);
    }, 30000);
    return () => clearInterval(interval);
  }, [authed, adminKey, loadAll, loadChatThreads]);

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

  const resetUser = async (user) => {
    if (!confirm(`RESET account for "${user.name}" (${user.email})?

This will zero all balances, positions, deposits and withdrawal history.
This cannot be undone!`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${user.id}/reset`, {
        method: 'POST', headers: adminHeaders(adminKey),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Account reset successfully');
      loadAll(adminKey);
    } catch (err) { setError(err.message); }
  };

  const loadUserHistory = async (user, tab) => {
    setUserDetailTab(tab);
    if (tab === 'deposits' && userDeposits.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/user/${user.id}/deposits`, { headers: adminHeaders(adminKey) });
        const data = await res.json();
        setUserDeposits(data.deposits || []);
      } catch(e) {} finally { setLoadingHistory(false); }
    }
    if (tab === 'withdrawals' && userWithdrawals.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/user/${user.id}/withdrawals`, { headers: adminHeaders(adminKey) });
        const data = await res.json();
        setUserWithdrawals(data.withdrawals || []);
      } catch(e) {} finally { setLoadingHistory(false); }
    }
    if (tab === 'signals' && userSignals.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${API_URL}/api/admin/user/${user.id}/signals`, { headers: adminHeaders(adminKey) });
        const data = await res.json();
        setUserSignals(data.signals || []);
      } catch(e) {} finally { setLoadingHistory(false); }
    }
    if (tab === 'tree') {
      loadTeam(user);
    }
  };

  const loadTeam = async (user) => {
    setLoadingTree(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/user/${user.id}/team`, { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeamTree(data.tree);
      setTeamUser(data.user);
      setTeamData(data);
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
    { key: 'livechat', label: 'Live Chat' },
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
    <div className="admin-root" style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
          backgroundColor: theme.up, color: 'white', padding: '12px 20px',
          borderRadius: '10px', fontWeight: 'bold', fontSize: '13px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s',
        }}>{toast}</div>
      )}

      {/* Deposit detail modal */}
      {showDepositDetail && (() => {
        const deposited = users.filter(u => u.totalDeposited > 0).sort((a, b) => b.totalDeposited - a.totalDeposited);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowDepositDetail(false)}>
            <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '92%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.cardBorder}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Deposits by User</div>
                  <div style={{ fontSize: '12px', color: theme.subtext }}>{deposited.length} users · Total ${totalDeposited.toLocaleString()}</div>
                </div>
                <button onClick={() => setShowDepositDetail(false)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.card }}>
                    <tr style={{ borderBottom: `2px solid ${theme.cardBorder}` }}>
                      {['#', 'UID', 'Name', 'Email', 'Deposited'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: theme.subtext, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deposited.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <td style={{ padding: '8px 10px', color: theme.faint, fontSize: '12px' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '11px' }}>{u.uid}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '600' }}>{u.name}</td>
                        <td style={{ padding: '8px 10px', color: theme.subtext }}>{u.email}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: theme.up }}>${u.totalDeposited.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Withdraw detail modal */}
      {showWithdrawDetail && (() => {
        const withdrawn = users.filter(u => (u.totalWithdrawn || 0) > 0).sort((a, b) => (b.totalWithdrawn || 0) - (a.totalWithdrawn || 0));
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowWithdrawDetail(false)}>
            <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '92%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.cardBorder}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Withdrawals by User</div>
                  <div style={{ fontSize: '12px', color: theme.subtext }}>{withdrawn.length} users · Total ${totalWithdrawn.toLocaleString()}</div>
                </div>
                <button onClick={() => setShowWithdrawDetail(false)} style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '20px' }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: theme.card }}>
                    <tr style={{ borderBottom: `2px solid ${theme.cardBorder}` }}>
                      {['#', 'UID', 'Name', 'Email', 'Withdrawn'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: theme.subtext, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawn.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                        <td style={{ padding: '8px 10px', color: theme.faint, fontSize: '12px' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '11px' }}>{u.uid}</td>
                        <td style={{ padding: '8px 10px', fontWeight: '600' }}>{u.name}</td>
                        <td style={{ padding: '8px 10px', color: theme.subtext }}>{u.email}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: theme.down }}>${(u.totalWithdrawn || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 24px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        gap: '16px',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: theme.brand }}>KYNEX</div>
        <div style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', backgroundColor: theme.primarySoft || 'rgba(99,102,241,0.15)', color: theme.primary }}>Admin</div>
        <div style={{ flex: 1 }} />
        <div className="admin-email" style={{ fontSize: '11px', color: theme.faint }}>supportkynex@gmail.com</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', overflowX: 'auto', borderBottom: `1px solid ${theme.cardBorder}` }}>
        {tabs.map(t => {
          const totalChatUnread = chatThreads.reduce((s, th) => s + (th.unreadAdmin || 0), 0);
          const count = t.key === 'kyc' ? pending.length : t.key === 'withdrawals' ? withdrawals.length : t.key === 'deposits' ? pendingDeposits.length : t.key === 'livechat' ? totalChatUnread : 0;
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

      <div className="admin-content" style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {activeTab === 'dashboard' && (
          <>
            <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
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
                <div key={i}
                  onClick={s.label === 'Total Deposited' ? () => setShowDepositDetail(true) : s.label === 'Total Withdrawn' ? () => setShowWithdrawDetail(true) : undefined}
                  style={{ ...card, padding: '16px 18px', cursor: (s.label === 'Total Deposited' || s.label === 'Total Withdrawn') ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '6px' }}>{s.label}{(s.label === 'Total Deposited' || s.label === 'Total Withdrawn') && <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.6 }}>▶ details</span>}</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="admin-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
            <div className="admin-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
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
                      onClick={() => { setSelectedUser(u); setNewLevel(String(u.level || 0)); setNewLimit(String(u.dailySignalLimit || 3)); setUserDetailTab('info'); setUserDeposits([]); setUserWithdrawals([]); setUserSignals([]); setTeamTree(null); setTeamData(null); setTeamUser(null); }}>
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
            {/* Detail tabs */}
            <div className="admin-detail-tabs" style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { key: 'info', label: 'Info & Actions' },
                { key: 'kyc_detail', label: 'KYC Detail' },
                { key: 'security', label: 'Security & Logins' },
                { key: 'deposits', label: 'Deposit History' },
                { key: 'withdrawals', label: 'Withdrawal History' },
                { key: 'signals', label: 'Signal History' },
                { key: 'tree', label: 'Team Tree' },
              ].map(t => (
                <button key={t.key} onClick={() => loadUserHistory(selectedUser, t.key)} style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  backgroundColor: userDetailTab === t.key ? theme.primary : theme.card,
                  color: userDetailTab === t.key ? '#fff' : theme.text,
                }}>{t.label}</button>
              ))}
            </div>

            {/* INFO & ACTIONS TAB */}
            {userDetailTab === 'info' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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
                {selectedUser.levelInfo && (() => {
                  const li = selectedUser.levelInfo;
                  const minBal = teamData?.minBalance || 200;
                  const levelReqs = teamData?.levelRequirements || [];
                  const dlCounts = li.directLevelCounts || {};
                  const qdCount = li.qualifiedDirectCount || 0;
                  const qdDeposit = li.qualifiedTeamDeposit || 0;
                  const currentLv = selectedUser.level || 0;
                  const nextReq = levelReqs.find(r => r.level === currentLv + 1);

                  return (
                    <div style={{ marginTop: '12px' }}>
                      {/* Summary row */}
                      <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.cardBorder}`, marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: theme.subtext, fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team Overview</div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: theme.primarySoft }}>
                            Direct: <b style={{ color: theme.primary }}>{li.directCount}</b>
                          </span>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: theme.upSoft }}>
                            Qualified: <b style={{ color: theme.up }}>{qdCount}</b>
                          </span>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: theme.downSoft }}>
                            Unqualified: <b style={{ color: theme.down }}>{li.directCount - qdCount}</b>
                          </span>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: theme.bg, border: `1px solid ${theme.cardBorder}` }}>
                            Total Team: <b>{li.teamCount}</b>
                          </span>
                        </div>
                        <div style={{ marginTop: '6px', fontSize: '11px', color: theme.faint }}>
                          Min balance to qualify: <b style={{ color: theme.text }}>${minBal}</b> + KYC certified
                        </div>
                      </div>

                      {/* Unqualified members warning */}
                      {teamData?.unqualifiedDirectList?.length > 0 && (
                        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: theme.downSoft, border: `1px solid ${theme.down}33`, marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: theme.down, marginBottom: '4px' }}>
                            ⚠ {teamData.unqualifiedDirectList.length} direct member(s) not counting toward levels
                          </div>
                          {teamData.unqualifiedDirectList.slice(0, 3).map(m => (
                            <div key={m.uid} style={{ fontSize: '11px', color: theme.down, marginBottom: '2px' }}>
                              UID {m.uid} · ${(m.balance || 0).toFixed(2)} bal · {m.reason}
                            </div>
                          ))}
                          {teamData.unqualifiedDirectList.length > 3 && (
                            <div style={{ fontSize: '11px', color: theme.down }}>+{teamData.unqualifiedDirectList.length - 3} more…</div>
                          )}
                        </div>
                      )}

                      {/* Level breakdown pills */}
                      {levelReqs.length > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: theme.bg, border: `1px solid ${theme.cardBorder}`, marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: theme.subtext, fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Level Breakdown</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {levelReqs.map(req => {
                              const membersForLevel = teamData?.directByLevel?.[req.level] || [];
                              const count = membersForLevel.length;
                              const achieved = currentLv >= req.level;
                              const isNext = currentLv === req.level - 1;
                              return (
                                <span key={req.level} style={{
                                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                                  border: achieved ? `1px solid ${theme.up}` : isNext ? `1px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
                                  backgroundColor: achieved ? theme.upSoft : isNext ? theme.primarySoft : theme.bg,
                                  color: achieved ? theme.up : isNext ? theme.primary : theme.faint,
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                }}>
                                  {achieved && '✓ '}Lv{req.level}
                                  <span style={{ backgroundColor: achieved ? theme.up : isNext ? theme.primary : theme.faint, color: 'white', borderRadius: '8px', padding: '0px 5px', fontSize: '10px' }}>{count}</span>
                                </span>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: '10px', color: theme.faint, marginTop: '6px' }}>Count = qualified directs meeting each level's requirement · Green = achieved · Blue = next target</div>
                        </div>
                      )}

                      {/* Next level requirements */}
                      {nextReq && (
                        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: theme.primarySoft, border: `1px solid ${theme.primary}33` }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: theme.primary, marginBottom: '6px' }}>Next: Level {nextReq.level} Requirements</div>
                          {/* Qualified direct progress */}
                          <div style={{ marginBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                              <span style={{ color: theme.subtext }}>Qualified Direct</span>
                              <span style={{ fontWeight: '700', color: qdCount >= nextReq.direct ? theme.up : theme.text }}>{qdCount} / {nextReq.direct}</span>
                            </div>
                            <div style={{ height: '4px', borderRadius: '2px', backgroundColor: `${theme.primary}22`, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: '2px', backgroundColor: qdCount >= nextReq.direct ? theme.up : theme.primary, width: `${Math.min(100, (qdCount / nextReq.direct) * 100)}%` }} />
                            </div>
                          </div>
                          {/* Team deposit progress */}
                          {nextReq.teamDeposit > 0 && (
                            <div style={{ marginBottom: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                                <span style={{ color: theme.subtext }}>Team Deposit</span>
                                <span style={{ fontWeight: '700', color: qdDeposit >= nextReq.teamDeposit ? theme.up : theme.text }}>${qdDeposit.toLocaleString()} / ${nextReq.teamDeposit.toLocaleString()}</span>
                              </div>
                              <div style={{ height: '4px', borderRadius: '2px', backgroundColor: `${theme.primary}22`, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: '2px', backgroundColor: qdDeposit >= nextReq.teamDeposit ? theme.up : theme.primary, width: `${Math.min(100, (qdDeposit / nextReq.teamDeposit) * 100)}%` }} />
                              </div>
                            </div>
                          )}
                          {/* Sub-level requirements */}
                          {Object.entries(nextReq.directLevels || {}).map(([lvl, need]) => {
                            const have = dlCounts[Number(lvl)] || 0;
                            return (
                              <div key={lvl} style={{ marginBottom: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                                  <span style={{ color: theme.subtext }}>Lv{lvl} Direct Members</span>
                                  <span style={{ fontWeight: '700', color: have >= need ? theme.up : theme.text }}>{have} / {need}</span>
                                </div>
                                <div style={{ height: '4px', borderRadius: '2px', backgroundColor: `${theme.primary}22`, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: '2px', backgroundColor: have >= need ? theme.up : theme.primary, width: `${Math.min(100, (have / need) * 100)}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => loadTeam(selectedUser)} style={btnPrimary} disabled={loadingTree}>
                    {loadingTree ? 'Loading...' : 'View Team Tree'}
                  </button>
                  <button onClick={() => toggleBlock(selectedUser)} style={selectedUser.closed ? btnSuccess : btnDanger}>
                    {selectedUser.closed ? 'Unblock Account' : 'Block Account'}
                  </button>
                  <button onClick={() => resetUser(selectedUser)} style={{ ...btnDanger, backgroundColor: '#92400e' }}>
                    Reset Account
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
            </div>}

            {/* KYC DETAIL TAB */}
            {userDetailTab === 'kyc_detail' && (
              <div className="admin-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>KYC Information</div>
                  {!selectedUser.kyc || selectedUser.kyc.status === 'not_started' ? (
                    <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No KYC submitted yet</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: 'Status', value: selectedUser.kyc.status?.toUpperCase() },
                        { label: 'First Name', value: selectedUser.kyc.firstName },
                        { label: 'Last Name', value: selectedUser.kyc.lastName },
                        { label: 'Date of Birth', value: selectedUser.kyc.dob },
                        { label: 'Country', value: selectedUser.kyc.country },
                        { label: 'Document Type', value: selectedUser.kyc.docType },
                        { label: 'Document ID Number', value: selectedUser.kyc.idNumber },
                        { label: 'Submitted At', value: fmtDate(selectedUser.kyc.submittedAt) },
                        { label: 'Decided At', value: fmtDate(selectedUser.kyc.decidedAt) },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                          <span style={{ fontSize: '12px', color: theme.subtext }}>{label}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>KYC Documents</div>
                  {!selectedUser.kyc?.documents?.length ? (
                    <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No documents uploaded</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedUser.kyc.documents.map((url, i) => {
                        const labels = ['ID Front', 'ID Back', 'Selfie'];
                        return (
                          <div key={i}>
                            <div style={{ fontSize: '11px', color: theme.subtext, marginBottom: '6px', fontWeight: '600' }}>{labels[i] || `Document ${i + 1}`}</div>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={labels[i] || `doc-${i}`} style={{ width: '100%', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, objectFit: 'cover', maxHeight: '180px' }} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECURITY & LOGINS TAB */}
            {userDetailTab === 'security' && (
              <div className="admin-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>Security Overview</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Fund Password', value: selectedUser.fundPasswordSet ? '✅ Set' : '❌ Not Set' },
                      { label: 'Two-Factor Auth', value: selectedUser.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled' },
                      { label: 'Password Last Changed', value: fmtDate(selectedUser.passwordChangedAt) },
                      { label: 'Last Login', value: fmtDate(selectedUser.lastLoginAt) },
                      { label: 'Last Login IP', value: selectedUser.lastLoginIp || '—' },
                      { label: 'Account Created', value: fmtDate(selectedUser.createdAt) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                        <span style={{ fontSize: '12px', color: theme.subtext }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>Login History (Last 20)</div>
                  {!selectedUser.loginHistory?.length ? (
                    <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No login history yet — updates on next login</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                      {selectedUser.loginHistory.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', backgroundColor: theme.bg }}>
                          <span style={{ fontSize: '11px', color: theme.subtext }}>{fmtDate(entry.at)}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: theme.text, fontFamily: 'monospace' }}>{entry.ip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DEPOSIT HISTORY TAB */}
            {userDetailTab === 'deposits' && (
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>Deposit History</div>
                {loadingHistory && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>Loading...</div>}
                {!loadingHistory && userDeposits.length === 0 && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No deposits found</div>}
                {!loadingHistory && userDeposits.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{d.type === 'manual_credit' ? 'Manual Credit' : 'Deposit'}</div>
                      <div style={{ fontSize: '11px', color: theme.faint }}>{d.at ? new Date(d.at).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }) : '-'}</div>
                      {d.note && <div style={{ fontSize: '11px', color: theme.subtext }}>{d.note}</div>}
                    </div>
                    <div style={{ fontWeight: 'bold', color: theme.up, fontSize: '14px' }}>+${d.amount?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* WITHDRAWAL HISTORY TAB */}
            {userDetailTab === 'withdrawals' && (
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>Withdrawal History</div>
                {loadingHistory && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>Loading...</div>}
                {!loadingHistory && userWithdrawals.length === 0 && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No withdrawals found</div>}
                {!loadingHistory && userWithdrawals.map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{w.network || 'Withdrawal'} — <code style={{ fontSize: '11px' }}>{w.address?.slice(0,16)}...</code></div>
                      <div style={{ fontSize: '11px', color: theme.faint }}>{w.requestedAt ? new Date(w.requestedAt).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }) : '-'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: theme.down, fontSize: '14px' }}>-${w.amount?.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginTop: '2px',
                        backgroundColor: w.status === 'approved' ? theme.upSoft : w.status === 'rejected' ? theme.downSoft : `${theme.faint}22`,
                        color: w.status === 'approved' ? theme.up : w.status === 'rejected' ? theme.down : theme.faint,
                        fontWeight: '700'
                      }}>{(w.status || 'pending').toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SIGNAL HISTORY TAB */}
            {userDetailTab === 'signals' && (
              <div style={card}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '14px' }}>Signal History</div>
                {loadingHistory && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>Loading...</div>}
                {!loadingHistory && userSignals.length === 0 && <div style={{ color: theme.faint, textAlign: 'center', padding: '30px' }}>No signals found</div>}
                {!loadingHistory && userSignals.map((s, i) => {
                  const statusLabel = s.timedOut ? 'TIMED OUT' : s.cancelled ? 'CANCELLED' : !s.settled ? 'ACTIVE' : s.won ? 'WIN' : 'LOSS';
                  const statusColor = s.timedOut ? '#f59e0b' : s.cancelled ? theme.faint : !s.settled ? theme.primary : s.won ? theme.up : theme.down;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.pair} — <span style={{ color: s.direction === 'up' ? theme.up : theme.down }}>{s.direction?.toUpperCase()}</span></div>
                        <div style={{ fontSize: '11px', color: theme.faint }}>{s.openedAt ? new Date(s.openedAt).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }) : '-'}</div>
                        <div style={{ fontSize: '11px', color: theme.subtext }}>Stake: ${s.stake} · Entry: ${s.entryPrice?.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: statusColor, fontSize: '13px' }}>{statusLabel}</div>
                        {s.won && <div style={{ fontSize: '12px', color: theme.up }}>+${s.profit}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TEAM TREE TAB */}
            {userDetailTab === 'tree' && teamTree && teamUser && teamUser.id === selectedUser.id && (() => {
              const countAll = (nodes) => nodes.reduce((s, n) => s + 1 + countAll(n.children || []), 0);
              const totalMembers = countAll(teamTree);
              const directCount = teamTree.length;

              // Flatten tree into rows for table view
              const flattenDeposited = (nodes, depth, rows) => {
                for (const n of nodes) {
                  if ((n.totalDeposited || 0) > 0) rows.push({ ...n, depth });
                  flattenDeposited(n.children || [], depth + 1, rows);
                }
                return rows;
              };
              const tableRows = flattenDeposited(teamTree, 1, []);

              const downloadPdf = () => {
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Referral Team - ${teamUser.name}</title>
                <style>body{font-family:sans-serif;padding:20px;color:#111}h2{margin-bottom:4px}p{color:#555;margin:0 0 16px}
                table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f5f5f5;padding:8px 10px;text-align:left;border:1px solid #ddd;font-size:11px}
                td{padding:8px 10px;border:1px solid #ddd}tr:nth-child(even){background:#fafafa}</style></head><body>
                <h2>Referral Team Tree — ${teamUser.name}</h2>
                <p>UID: ${teamUser.uid} · Email: ${teamUser.email} · Direct: ${directCount} · Total: ${totalMembers}</p>
                <table><thead><tr><th>#</th><th>Level</th><th>UID</th><th>Name</th><th>Email</th><th>Deposited</th><th>Balance</th><th>KYC</th></tr></thead>
                <tbody>${tableRows.map((r, i) => `<tr><td>${i+1}</td><td>${r.depth}</td><td>${r.uid||''}</td><td>${'—'.repeat(r.depth-1)} ${r.name||''}</td><td>${r.email||''}</td><td>$${(r.totalDeposited||0).toFixed(2)}</td><td>$${(r.balance||0).toFixed(2)}</td><td>${r.kycStatus==='certified'?'✓':r.kycStatus||'—'}</td></tr>`).join('')}
                </tbody></table></body></html>`;
                const w = window.open('', '_blank');
                w.document.write(html);
                w.document.close();
                w.focus();
                setTimeout(() => w.print(), 500);
              };

              const minBal = teamData?.minBalance || 200;
              const TreeNode = ({ node, depth = 0 }) => {
                const qualReason = !node.isQualified
                  ? (node.kycStatus !== 'certified' ? 'No KYC' : `Bal $${node.balance} < $${minBal}`)
                  : null;
                return (
                  <div style={{ marginLeft: depth * 20, marginBottom: '4px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: node.isQualified
                        ? (depth === 0 ? theme.upSoft : `${theme.up}09`)
                        : (depth === 0 ? theme.downSoft : `${theme.down}08`),
                      border: `1px solid ${node.isQualified ? theme.up + '44' : theme.down + '33'}`,
                      flexWrap: 'wrap',
                    }}>
                      {depth > 0 && <span style={{ color: theme.faint, fontSize: '11px' }}>└</span>}
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
                      }}>{node.kycStatus === 'certified' ? 'KYC ✓' : 'No KYC'}</span>
                      <span style={{
                        padding: '1px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800',
                        backgroundColor: node.isQualified ? theme.up : theme.down,
                        color: 'white',
                      }}>
                        {node.isQualified ? '✓ Counts' : `✗ ${qualReason}`}
                      </span>
                      <span style={{ fontSize: '11px', color: theme.text, fontWeight: '600', marginLeft: 'auto' }}>
                        ${node.totalDeposited} dep · <span style={{ color: node.balance >= minBal ? theme.up : theme.down }}>${node.balance} bal</span>
                      </span>
                    </div>
                    {(node.children || []).map(c => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
                  </div>
                );
              };

              return (
                <div style={{ ...card, marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Referral Team Tree — {teamUser.name}</div>
                      <div style={{ fontSize: '12px', color: theme.subtext, marginTop: '2px' }}>
                        Direct: <b style={{ color: theme.primary }}>{directCount}</b> · Total: <b style={{ color: theme.primary }}>{totalMembers}</b> · Deposited members: <b style={{ color: theme.up }}>{tableRows.length}</b> · Level: <b style={{ color: theme.primary }}>{teamUser.level}</b>
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: theme.up, fontWeight: '700' }}>✓ {teamData?.qualifiedDirectCount || 0} counting</span>
                        <span style={{ color: theme.down, fontWeight: '700' }}>✗ {teamData?.unqualifiedDirectCount || 0} not counting</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={downloadPdf} style={{ ...btnPrimary, padding: '6px 14px', fontSize: '11px', backgroundColor: '#7C3AED' }}>⬇ PDF</button>
                      <button onClick={() => { setTeamTree(null); setTeamUser(null); }} style={{ ...btnDanger, padding: '6px 14px', fontSize: '11px' }}>Close</button>
                    </div>
                  </div>

                  {/* Deposited members table */}
                  {tableRows.length > 0 && (
                    <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: theme.subtext, marginBottom: '8px' }}>Deposited Members (all levels)</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${theme.cardBorder}` }}>
                            {['#', 'Gen', 'UID', 'Name', 'Email', 'Deposited', 'Balance', 'KYC'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: theme.subtext, fontSize: '10px', textTransform: 'uppercase', fontWeight: '600' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((r, i) => (
                            <tr key={r.id} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                              <td style={{ padding: '6px 8px', color: theme.faint }}>{i + 1}</td>
                              <td style={{ padding: '6px 8px', color: theme.primary, fontWeight: '700' }}>G{r.depth}</td>
                              <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '11px' }}>{r.uid || '—'}</td>
                              <td style={{ padding: '6px 8px', fontWeight: '600', paddingLeft: `${(r.depth - 1) * 12 + 8}px` }}>{'└ '.repeat(r.depth - 1)}{r.name}</td>
                              <td style={{ padding: '6px 8px', color: theme.subtext }}>{r.email}</td>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold', color: theme.up }}>${(r.totalDeposited || 0).toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', color: r.balance >= minBal ? theme.up : theme.down }}>${(r.balance || 0).toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', color: r.kycStatus === 'certified' ? theme.up : theme.faint, fontSize: '11px' }}>{r.kycStatus === 'certified' ? '✓' : r.kycStatus || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Original tree view */}
                  <div style={{ fontSize: '12px', fontWeight: '600', color: theme.subtext, marginBottom: '8px' }}>Full Tree View</div>
                  {teamTree.length === 0 ? (
                    <div style={{ color: theme.faint, textAlign: 'center', padding: '30px', fontSize: '13px' }}>No team members</div>
                  ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color, flexShrink: 0 }}></span>
                    <span style={{ fontSize: '12px', fontWeight: '600', minWidth: '100px' }}>{n.label}</span>
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

            <div className="admin-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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

            {/* Referral signal session — hardcoded 20:00-20:20 PKT on server, no UI needed */}

            {/* Referral bonus signals */}
            <div style={{ ...card, marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>Referral Bonus Signals</div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '12px' }}>
                Grant extra bonus signals (1% profit each) to users who referred active depositors.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={referralBonusUser} onChange={(e) => setReferralBonusUser(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', minWidth: '160px', flex: '1 1 160px' }}>
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

        {/* ── Live Chat Tab ── */}
        {activeTab === 'livechat' && (
          <div className="admin-chat-wrap" style={{ display: 'flex', gap: '16px', height: '600px' }}>
            {/* Thread list */}
            <div className={`admin-chat-sidebar${activeChatUid ? ' chat-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', width: '280px', flexShrink: 0, gap: '10px' }}>
              {/* Broadcast box */}
              <div style={{ ...card, padding: '12px', flexShrink: 0 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: theme.text }}>
                  📢 Broadcast to Deposited Users
                </div>
                <textarea
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Type a message for all deposited users..."
                  rows={3}
                  style={{
                    width: '100%', resize: 'none', padding: '8px 10px',
                    borderRadius: '8px', border: `1.5px solid ${theme.cardBorder}`,
                    backgroundColor: theme.inputBg || theme.bg, color: theme.text,
                    fontSize: '12px', outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  {broadcastResult && (
                    <span style={{ fontSize: '11px', color: broadcastResult.startsWith('✓') ? '#10B981' : '#EF4444' }}>
                      {broadcastResult}
                    </span>
                  )}
                  {!broadcastResult && <span />}
                  <button
                    onClick={sendBroadcast}
                    disabled={!broadcastText.trim() || broadcastSending}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none',
                      backgroundColor: broadcastText.trim() && !broadcastSending ? theme.primary : theme.cardBorder,
                      color: 'white', fontSize: '12px', fontWeight: '600',
                      cursor: broadcastText.trim() && !broadcastSending ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {broadcastSending ? 'Sending…' : 'Send All'}
                  </button>
                </div>
              </div>

              {/* Threads */}
              <div style={{ ...card, flex: 1, overflowY: 'auto', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', color: theme.text }}>
                Chat Threads ({chatThreads.length})
              </div>
              {chatThreads.length === 0 && (
                <div style={{ color: theme.faint, fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                  No active chats yet.
                </div>
              )}
              {chatThreads.map(t => (
                <div
                  key={t.uid}
                  onClick={() => openChatThread(t.uid)}
                  style={{
                    padding: '10px', borderRadius: '10px', marginBottom: '6px', cursor: 'pointer',
                    backgroundColor: activeChatUid === t.uid ? `${theme.primary}18` : 'transparent',
                    border: `1px solid ${activeChatUid === t.uid ? theme.primary : theme.cardBorder}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: theme.text }}>{t.name || t.email}</div>
                    {t.unreadAdmin > 0 && (
                      <div style={{
                        backgroundColor: '#EF4444', color: 'white',
                        borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
                        padding: '2px 6px', minWidth: '18px', textAlign: 'center',
                      }}>{t.unreadAdmin}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.faint, marginTop: '2px' }}>{t.email}</div>
                  {t.lastMessage && (
                    <div style={{
                      fontSize: '12px', color: theme.subtext, marginTop: '4px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {t.lastMessage.from === 'admin' ? '↩ ' : ''}{t.lastMessage.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>

            {/* Chat window */}
            <div className="admin-chat-main" style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {!activeChatUid ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.faint, fontSize: '14px' }}>
                  Select a thread to start chatting
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{
                    padding: '14px 16px', borderBottom: `1px solid ${theme.cardBorder}`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <button className="admin-chat-back" onClick={() => { setActiveChatUid(null); setChatMessages([]); clearInterval(chatPollRef.current); }}
                      style={{ display: 'none', background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: '14px', fontWeight: '700', padding: 0 }}>←</button>
                    <div style={{ flex: 1 }}>
                      {(() => {
                        const t = chatThreads.find(x => x.uid === activeChatUid);
                        return (
                          <>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{t?.name || t?.email || activeChatUid}</div>
                            <div style={{ fontSize: '11px', color: theme.faint }}>{t?.email} · UID: {t?.userUid || '—'}</div>
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={() => { setActiveChatUid(null); setChatMessages([]); clearInterval(chatPollRef.current); }}
                      style={{ background: 'none', border: 'none', color: theme.faint, cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: theme.bg || theme.card }}>
                    {chatMessages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'admin' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
                        {msg.from === 'user' && (
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                            background: `${theme.primary}22`, border: `1px solid ${theme.primary}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: theme.primary,
                          }}>U</div>
                        )}
                        <div style={{
                          maxWidth: '70%', padding: '9px 13px',
                          borderRadius: msg.from === 'admin' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: msg.from === 'admin' ? theme.primary : (theme.inputBg || theme.card),
                          color: msg.from === 'admin' ? 'white' : theme.text,
                          fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          border: msg.from === 'user' ? `1px solid ${theme.cardBorder}` : 'none',
                        }}>
                          <div>{msg.text}</div>
                          <div style={{ fontSize: '10px', marginTop: '4px', color: msg.from === 'admin' ? 'rgba(255,255,255,0.65)' : theme.faint, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                            {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.from === 'admin' && (
                              <span style={{ color: msg.readByUser ? '#60A5FA' : 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                                {msg.readByUser ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* User typing indicator */}
                    {userTyping && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: `${theme.primary}22`, border: `1px solid ${theme.primary}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: theme.primary,
                        }}>U</div>
                        <div style={{
                          padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                          backgroundColor: theme.inputBg || theme.card,
                          border: `1px solid ${theme.cardBorder}`,
                          display: 'flex', gap: '4px', alignItems: 'center',
                        }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              backgroundColor: theme.faint,
                              animation: 'adminChatBounce 1.2s infinite',
                              animationDelay: `${i * 0.2}s`,
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '11px', color: theme.faint }}>typing…</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Reply input */}
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${theme.cardBorder}`, display: 'flex', gap: '8px', backgroundColor: theme.card }}>
                    <input
                      value={chatReply}
                      onChange={e => { setChatReply(e.target.value); notifyAdminTyping(); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatReply(); } }}
                      placeholder="Reply to user..."
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '13px', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = theme.primary}
                      onBlur={e => e.target.style.borderColor = theme.cardBorder}
                    />
                    <button onClick={sendChatReply} disabled={!chatReply.trim() || chatSending} style={{ ...btnPrimary, opacity: !chatReply.trim() || chatSending ? 0.5 : 1 }}>
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes adminChatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @media (max-width: 768px) {
          table { font-size: 11px !important; }
          td, th { padding: 6px 4px !important; }
          .admin-two-col { grid-template-columns: 1fr !important; }
          .admin-email { display: none !important; }
        }
        @media (max-width: 600px) {
          .admin-root { font-size: 13px; }
          .admin-root > div:nth-child(2) { padding: 10px 12px !important; gap: 8px !important; }
          .admin-root > div:nth-child(3) { padding: 10px 8px !important; gap: 6px !important; }
          .admin-root > div:nth-child(3) button { padding: 7px 10px !important; font-size: 11px !important; }
          .admin-content { padding: 10px !important; }
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-table-wrap table { min-width: 600px; }
          .admin-detail-tabs { flex-wrap: wrap !important; }
          .admin-detail-tabs button { flex: 0 0 auto !important; font-size: 11px !important; padding: 6px 10px !important; }
          .admin-chat-wrap { flex-direction: column !important; height: calc(100vh - 130px) !important; }
          .admin-chat-sidebar { width: 100% !important; flex-shrink: 1 !important; max-height: 50% !important; }
          .admin-chat-sidebar.chat-open { display: none !important; }
          .admin-chat-main { min-height: 0 !important; flex: 1 !important; }
          .admin-chat-back { display: inline-block !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminKyc;
