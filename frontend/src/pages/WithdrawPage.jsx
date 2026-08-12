import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const NETWORKS = [
  { key: 'trc20', label: 'TRC20', chain: 'TRON' },
  { key: 'erc20', label: 'ERC20', chain: 'Ethereum' },
  { key: 'bep20', label: 'BEP20', chain: 'BSC' },
];

const WithdrawPage = () => {
  const { theme } = useTheme();
  const [balance, setBalance] = useState(0);
  const [wdNet, setWdNet] = useState('trc20');
  const [wdAddr, setWdAddr] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [wdPin, setWdPin] = useState('');
  const [wdBusy, setWdBusy] = useState(false);
  const [wdMsg, setWdMsg] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [view, setView] = useState('withdraw');

  const wdFee = Math.round(Number(wdAmt || 0) * 0.05 * 100) / 100;
  const wdNetAmt = Number(wdAmt || 0) - wdFee;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/demo/account`, { headers: authHeaders() });
        const data = await res.json();
        if (res.ok) { setBalance(data.balance || 0); setWithdrawalRequests(data.withdrawalRequests || []); }
      } catch {}
    })();
  }, []);

  const submitWithdraw = async () => {
    const amt = Number(wdAmt);
    if (!amt || amt <= 0) return setWdMsg('Enter an amount.');
    if (!wdAddr.trim()) return setWdMsg('Enter your wallet address.');
    if (!wdPin) return setWdMsg('Enter your fund password.');
    setWdBusy(true); setWdMsg('');
    try {
      const res = await fetch(`${API_URL}/api/demo/withdraw`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: amt, network: wdNet, walletAddress: wdAddr, fundPassword: wdPin }) });
      const data = await res.json();
      if (!res.ok) { setWdMsg(data.error); } else {
        setWdAmt(''); setWdAddr(''); setWdPin('');
        setWdMsg(`Withdrawal submitted! ${data.netPayout.toFixed(2)} USDT pending review.`);
        setBalance(data.balance);
        setWithdrawalRequests(prev => [{ id: data.requestId, amount: amt, fee: data.fee, netPayout: data.netPayout, network: wdNet, status: 'pending', createdAt: Date.now() }, ...prev]);
      }
    } catch { setWdMsg('Network error.'); }
    setWdBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass || 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/assets" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Withdraw USDT</span>
        </div>
        <button onClick={() => setView(view === 'withdraw' ? 'history' : 'withdraw')} style={{ background: 'none', border: 'none', color: view === 'history' ? theme.primary : theme.subtext, fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          {view === 'withdraw' ? 'History' : 'Withdraw'}
        </button>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        {view === 'withdraw' && (
          <>
            <div style={{ ...glassCard(theme), padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: theme.subtext, fontSize: '13px' }}>Available Balance</span>
              <span style={{ fontWeight: 'bold', color: theme.brand }}>{fmt(balance)} USDT</span>
            </div>

            <div style={{ ...glassCard(theme), padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '12px' }}>Select Network</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {NETWORKS.map(n => (
                  <button key={n.key} onClick={() => setWdNet(n.key)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1px solid ${wdNet === n.key ? theme.primary : theme.cardBorder}`, backgroundColor: wdNet === n.key ? theme.primarySoft : 'transparent', color: wdNet === n.key ? theme.primary : theme.subtext, fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    {n.label}
                  </button>
                ))}
              </div>

              <input value={wdAddr} onChange={e => setWdAddr(e.target.value)} placeholder={`${NETWORKS.find(n => n.key === wdNet).chain} wallet address`} style={{ width: '100%', padding: '13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px', outline: 'none' }} />

              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input type="number" min="0" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder="Amount (USDT)" style={{ width: '100%', padding: '13px 55px 13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                <button onClick={() => setWdAmt(String(balance || 0))} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', borderRadius: '8px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>MAX</button>
              </div>

              {Number(wdAmt) > 0 && (
                <div style={{ backgroundColor: theme.inputBg, borderRadius: '14px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: theme.subtext }}>Amount</span><span style={{ fontWeight: 'bold' }}>{fmt(Number(wdAmt))} USDT</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: theme.down }}>Fee (5%)</span><span style={{ fontWeight: 'bold', color: theme.down }}>-{wdFee.toFixed(2)} USDT</span></div>
                  <div style={{ borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: theme.subtext, fontWeight: '600' }}>You Receive</span><span style={{ fontWeight: 'bold', color: theme.up }}>{wdNetAmt > 0 ? wdNetAmt.toFixed(2) : '0.00'} USDT</span></div>
                </div>
              )}

              <input type="password" value={wdPin} onChange={e => setWdPin(e.target.value)} placeholder="Fund password" style={{ width: '100%', padding: '13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }} />

              <button onClick={submitWithdraw} disabled={wdBusy} style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: theme.downGradient, color: 'white', fontWeight: '700', fontSize: '14px', cursor: wdBusy ? 'not-allowed' : 'pointer', opacity: wdBusy ? 0.7 : 1 }}>Submit Withdrawal</button>
              {wdMsg && <p style={{ fontSize: '12px', color: wdMsg.includes('submitted') ? theme.up : theme.down, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{wdMsg}</p>}
            </div>
          </>
        )}

        {view === 'history' && (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>Withdrawal History</div>
            {withdrawalRequests.length === 0 && (
              <div style={{ ...glassCard(theme), padding: '40px', textAlign: 'center' }}>
                <div style={{ color: theme.faint, fontSize: '13px' }}>No withdrawal records yet</div>
              </div>
            )}
            {withdrawalRequests.map(wr => (
              <div key={wr.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{Number(wr.amount).toFixed(2)} USDT</div>
                    <div style={{ fontSize: '11px', color: theme.subtext }}>Net: {Number(wr.netPayout || wr.amount).toFixed(2)} USDT via {(wr.network || '').toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>{new Date(wr.createdAt).toLocaleString()}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', backgroundColor: wr.status === 'completed' ? 'rgba(16,185,129,0.12)' : wr.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: wr.status === 'completed' ? '#10B981' : wr.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>
                    {wr.status === 'completed' ? 'Completed' : wr.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
