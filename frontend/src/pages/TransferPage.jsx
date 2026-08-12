import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown, ArrowRight, CheckCircle } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }

function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const ACCOUNTS = [
  { key: 'spot', label: 'Spot Account' },
  { key: 'signal', label: 'Signal Account' },
];

const TransferPage = () => {
  const { theme } = useTheme();
  const [view, setView] = useState('transfer');
  const [from, setFrom] = useState('spot');
  const [to, setTo] = useState('signal');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [balance, setBalance] = useState(0);
  const [signalBalance, setSignalBalance] = useState(0);
  const [trades, setTrades] = useState([]);
  const [penaltyWarning, setPenaltyWarning] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const loadAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/demo/account`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance || 0);
        setSignalBalance(data.signalBalance || 0);
        setTrades((data.trades || []).filter(t => t.type === 'transfer'));
      }
    } catch {}
  };

  useEffect(() => { loadAccount(); }, []);

  const swap = () => { setFrom(to); setTo(from); setAmount(''); setMsg(''); setPenaltyWarning(null); };
  const availableBalance = from === 'spot' ? balance : signalBalance;
  const direction = from === 'spot' ? 'toSignal' : 'toSpot';

  const doTransfer = async (confirm) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setMsg('Please enter a valid amount.'); setMsgType('error'); return; }
    if (amt > availableBalance) { setMsg('Insufficient balance.'); setMsgType('error'); return; }
    setBusy(true); setMsg('');
    try {
      const body = { direction, amount: amt };
      if (confirm) body.confirmPenalty = true;
      const res = await fetch(`${API_URL}/api/demo/transfer`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); setMsgType('error'); }
      else if (data.warning) {
        setPenaltyWarning(data);
      } else {
        const amt = Number(amount);
        setAmount('');
        setPenaltyWarning(null);
        setBalance(data.balance);
        setSignalBalance(data.signalBalance);
        setSuccessPopup({
          amount: amt,
          direction,
          reward: data.reward || 0,
          penaltyApplied: data.penaltyApplied || 0,
        });
        loadAccount();
      }
    } catch { setMsg('Network error.'); setMsgType('error'); }
    setBusy(false);
  };

  const fromLabel = ACCOUNTS.find(a => a.key === from).label;
  const toLabel = ACCOUNTS.find(a => a.key === to).label;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass || 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/assets" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: view === 'transfer' ? theme.primary : theme.text }}>Transfer</span>
        </div>
        <button onClick={() => setView(view === 'transfer' ? 'history' : 'transfer')} style={{ background: 'none', border: 'none', color: view === 'history' ? theme.primary : theme.subtext, fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          {view === 'transfer' ? 'Transactions' : 'Transfer'}
        </button>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {view === 'transfer' && (
          <>
            <div style={{ ...glassCard(theme), padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: theme.primary }} />
                    <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600' }}>From</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', paddingBottom: '14px', borderBottom: `1px solid ${theme.cardBorder}` }}>{fromLabel}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: theme.down }} />
                    <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600' }}>To</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{toLabel}</div>
                </div>

                <button onClick={swap} style={{
                  width: '42px', height: '42px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.inputBg || theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: theme.primary, flexShrink: 0,
                }}>
                  <ArrowUpDown size={18} />
                </button>
              </div>
            </div>

            <div style={{ ...glassCard(theme), padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: theme.subtext, fontWeight: '600' }}>Coin</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #26A17B, #1a7a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '11px' }}>₮</div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>USDT</span>
                </div>
                <ArrowRight size={16} color={theme.faint} />
              </div>
            </div>

            <div style={{ ...glassCard(theme), padding: '20px', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: '600', marginBottom: '10px' }}>Amount</div>
              <div style={{ position: 'relative' }}>
                <input type="number" min="0" value={amount} onChange={(e) => { setAmount(e.target.value); setPenaltyWarning(null); setMsg(''); }}
                  placeholder="Please enter the quantity"
                  style={{ width: '100%', padding: '14px 100px 14px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: theme.subtext }}>USDT</span>
                  <span style={{ fontSize: '1px', color: theme.cardBorder }}>|</span>
                  <button onClick={() => setAmount(String(availableBalance))} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', padding: 0 }}>All</button>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: theme.faint, marginTop: '8px' }}>
                Max Amount Available for Transfer: {fmt(availableBalance)} USDT
              </div>
            </div>

            {penaltyWarning && (
              <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: theme.down, fontWeight: '600', marginBottom: '6px' }}>Volume Incomplete</div>
                <div style={{ fontSize: '12px', color: theme.subtext, lineHeight: '1.6', marginBottom: '10px' }}>
                  {penaltyWarning.message}<br />
                  Penalty: <b style={{ color: theme.down }}>-{penaltyWarning.penaltyAmount.toFixed(2)} USDT</b><br />
                  You receive: <b style={{ color: theme.up }}>{penaltyWarning.receiveAmount.toFixed(2)} USDT</b><br />
                  Volume progress: <b>{penaltyWarning.volumeProgress}%</b>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => doTransfer(true)} disabled={busy} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: theme.down, color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                    Confirm Transfer
                  </button>
                  <button onClick={() => setPenaltyWarning(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: 'transparent', color: theme.subtext, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.12)`, marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text, marginBottom: '6px' }}>Transfer Notice</div>
              <p style={{ fontSize: '12px', color: theme.subtext, lineHeight: '1.6', margin: 0 }}>
                Transactions can only be carried out when the assets are transferred to the corresponding account. There is no charge for transfer between accounts.
              </p>
            </div>

            <button onClick={() => doTransfer(false)} disabled={busy} style={{
              width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
              background: theme.primaryGradient || theme.primary, color: 'white', fontWeight: 'bold',
              fontSize: '15px', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
            }}>
              Transfer Immediately
            </button>

          </>
        )}

        {view === 'history' && (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>Transfer History</div>
            {trades.length === 0 && (
              <div style={{ ...glassCard(theme), padding: '40px', textAlign: 'center' }}>
                <div style={{ color: theme.faint, fontSize: '13px' }}>No transfer records yet</div>
              </div>
            )}
            {trades.map(t => {
              const isToSignal = t.direction === 'toSignal';
              return (
                <div key={t.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>
                        {isToSignal ? 'Spot → Signal' : 'Signal → Spot'}
                      </div>
                      <div style={{ fontSize: '11px', color: theme.faint }}>{new Date(t.at).toLocaleString()}</div>
                      {t.reward > 0 && <div style={{ fontSize: '11px', color: theme.up, fontWeight: '600', marginTop: '2px' }}>+{t.reward.toFixed(2)} USDT reward</div>}
                      {t.penalty > 0 && <div style={{ fontSize: '11px', color: theme.down, fontWeight: '600', marginTop: '2px' }}>-{t.penalty.toFixed(2)} USDT penalty (20%)</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{fmt(t.amount)} USDT</div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', padding: '2px 8px', borderRadius: '6px', backgroundColor: theme.up }}>Completed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        {successPopup && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}>
            <div style={{ ...glassCard(theme), maxWidth: '360px', width: '100%', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: theme.upGradient || theme.up,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
              }}>
                <CheckCircle size={32} color="white" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: theme.text }}>Transfer Complete</h3>
              <p style={{ color: theme.subtext, fontSize: '14px', margin: '0 0 6px' }}>
                <b>{fmt(successPopup.amount)} USDT</b> transferred successfully
              </p>
              <p style={{ color: theme.faint, fontSize: '13px', margin: '0 0 16px' }}>
                {successPopup.direction === 'toSignal' ? 'Spot → Signal' : 'Signal → Spot'}
              </p>
              {successPopup.reward > 0 && (
                <div style={{ backgroundColor: theme.upSoft || 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '10px', marginBottom: '12px' }}>
                  <span style={{ color: theme.up, fontWeight: '700', fontSize: '13px' }}>+{successPopup.reward.toFixed(2)} USDT reward credited!</span>
                </div>
              )}
              {successPopup.penaltyApplied > 0 && (
                <div style={{ backgroundColor: theme.downSoft || 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '10px', marginBottom: '12px' }}>
                  <span style={{ color: theme.down, fontWeight: '700', fontSize: '13px' }}>-{successPopup.penaltyApplied.toFixed(2)} USDT penalty deducted</span>
                </div>
              )}
              <button onClick={() => setSuccessPopup(null)} style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: theme.primaryGradient || theme.primary,
                color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(59,130,246,0.3)',
              }}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferPage;
