import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown, ArrowRight, CheckCircle, Lock } from 'lucide-react';
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
  { key: 'futures', label: 'Futures Account' },
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
  const [futuresLocked, setFuturesLocked] = useState(0);
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
        const locked = (data.futures || []).filter(p => !p.closed).reduce((s, p) => s + (p.margin || 0), 0);
        setFuturesLocked(Math.round(locked * 100) / 100);
        setTrades((data.trades || []).filter(t => t.type === 'transfer'));
      }
    } catch {}
  };

  useEffect(() => { loadAccount(); }, []);

  const getBalance = (key) => {
    if (key === 'spot') return balance;
    if (key === 'signal') return signalBalance;
    if (key === 'futures') return futuresLocked;
    return 0;
  };

  const swap = () => {
    // futures can't be a "from" for actual transfer — skip if futures involved
    if (from === 'futures' || to === 'futures') return;
    setFrom(to); setTo(from); setAmount(''); setMsg(''); setPenaltyWarning(null);
  };

  const availableBalance = getBalance(from);

  const getDirection = () => {
    if (from === 'spot' && to === 'signal') return 'toSignal';
    if (from === 'signal' && to === 'spot') return 'toSpot';
    if (from === 'spot' && to === 'futures') return 'toFutures';
    if (from === 'futures' && to === 'spot') return 'fromFutures';
    return null;
  };

  const direction = getDirection();
  const isFuturesInvolved = from === 'futures' || to === 'futures';
  const futuresLocked_bool = from === 'futures'; // futures margin is locked in positions

  const doTransfer = async (confirm) => {
    if (isFuturesInvolved) {
      setMsg('Futures margin is locked in open positions. Close your positions first to release margin back to Spot.'); 
      setMsgType('error'); return;
    }
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
        setAmount(''); setPenaltyWarning(null);
        setBalance(data.balance);
        setSignalBalance(data.signalBalance);
        setSuccessPopup({ amount: amt, direction, reward: data.reward || 0, penaltyApplied: data.penaltyApplied || 0 });
        loadAccount();
      }
    } catch { setMsg('Network error.'); setMsgType('error'); }
    setBusy(false);
  };

  const fromLabel = ACCOUNTS.find(a => a.key === from)?.label;
  const toLabel = ACCOUNTS.find(a => a.key === to)?.label;

  // Account selector — prevents invalid pairs
  const handleFromChange = (key) => {
    setFrom(key); setAmount(''); setMsg(''); setPenaltyWarning(null);
    if (key === 'futures') setTo('spot');
    else if (key === to) setTo(key === 'spot' ? 'signal' : 'spot');
  };
  const handleToChange = (key) => {
    setTo(key); setAmount(''); setMsg(''); setPenaltyWarning(null);
    if (key === 'futures') setFrom('spot');
    else if (key === from) setFrom(key === 'spot' ? 'signal' : 'spot');
  };

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
            {/* Balance overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              {[
                { key: 'spot', label: 'Spot', bal: balance, color: theme.primary },
                { key: 'signal', label: 'Signal', bal: signalBalance, color: theme.brand },
                { key: 'futures', label: 'Futures', bal: futuresLocked, color: '#8B5CF6', locked: true },
              ].map(acc => (
                <div key={acc.key} style={{ ...glassCard(theme), padding: '12px', textAlign: 'center', border: (from === acc.key || to === acc.key) ? `1.5px solid ${acc.color}` : `1px solid ${theme.cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                    {acc.locked && <Lock size={10} color={theme.faint} />}
                    <span style={{ fontSize: '11px', color: theme.subtext, fontWeight: '600' }}>{acc.label}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: acc.color }}>{fmt(acc.bal)}</div>
                  <div style={{ fontSize: '10px', color: theme.faint }}>USDT</div>
                </div>
              ))}
            </div>

            {/* From / To selectors */}
            <div style={{ ...glassCard(theme), padding: '20px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: theme.subtext, fontWeight: '600', marginBottom: '8px' }}>FROM</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ACCOUNTS.map(acc => (
                    <button key={acc.key} onClick={() => handleFromChange(acc.key)} style={{
                      flex: 1, padding: '9px 6px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      border: from === acc.key ? `1.5px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
                      background: from === acc.key ? theme.primarySoft : 'transparent',
                      color: from === acc.key ? theme.primary : theme.subtext, transition: 'all 0.15s',
                    }}>{acc.label.replace(' Account', '')}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <button onClick={swap} disabled={isFuturesInvolved} style={{
                  width: '38px', height: '38px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.inputBg || theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isFuturesInvolved ? 'not-allowed' : 'pointer', color: theme.primary, opacity: isFuturesInvolved ? 0.4 : 1,
                }}>
                  <ArrowUpDown size={16} />
                </button>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: theme.subtext, fontWeight: '600', marginBottom: '8px' }}>TO</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ACCOUNTS.map(acc => (
                    <button key={acc.key} onClick={() => handleToChange(acc.key)} disabled={acc.key === from} style={{
                      flex: 1, padding: '9px 6px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
                      cursor: acc.key === from ? 'not-allowed' : 'pointer',
                      border: to === acc.key ? `1.5px solid ${theme.down}` : `1px solid ${theme.cardBorder}`,
                      background: to === acc.key ? `rgba(239,68,68,0.08)` : 'transparent',
                      color: to === acc.key ? theme.down : theme.subtext,
                      opacity: acc.key === from ? 0.35 : 1, transition: 'all 0.15s',
                    }}>{acc.label.replace(' Account', '')}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Futures locked notice */}
            {isFuturesInvolved && (
              <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(139,92,246,0.08)', border: `1px solid rgba(139,92,246,0.2)`, marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Lock size={16} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#8B5CF6', marginBottom: '4px' }}>Futures Margin Locked</div>
                  <div style={{ fontSize: '12px', color: theme.subtext, lineHeight: '1.6' }}>
                    Futures margin is locked inside open positions. To release funds, close your futures positions — margin returns to your Spot account automatically.
                  </div>
                </div>
              </div>
            )}

            {/* Coin */}
            <div style={{ ...glassCard(theme), padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: theme.subtext, fontWeight: '600', marginBottom: '10px' }}>Coin</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #26A17B, #1a7a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '11px' }}>₮</div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>USDT</span>
                </div>
                <ArrowRight size={16} color={theme.faint} />
              </div>
            </div>

            {/* Amount */}
            {!isFuturesInvolved && (
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
                  Available: {fmt(availableBalance)} USDT ({fromLabel})
                </div>
              </div>
            )}

            {msg && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '12px', backgroundColor: msgType === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${msgType === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                <span style={{ fontSize: '13px', color: msgType === 'error' ? theme.down : theme.up }}>{msg}</span>
              </div>
            )}

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
                Transfers between Spot and Signal are instant with no fees. Futures margin is automatically released to Spot when you close a position.
              </p>
            </div>

            <button onClick={() => doTransfer(false)} disabled={busy || isFuturesInvolved} style={{
              width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
              background: isFuturesInvolved ? theme.cardBorder : (theme.brandGradient || theme.brand),
              color: isFuturesInvolved ? theme.subtext : '#1A1305', fontWeight: 'bold',
              fontSize: '15px', cursor: (busy || isFuturesInvolved) ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1, boxShadow: isFuturesInvolved ? 'none' : '0 6px 20px rgba(217,119,6,0.3)',
            }}>
              {isFuturesInvolved ? 'Close Positions to Release Margin' : 'Transfer Immediately'}
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
              const label = isToSignal ? 'Spot → Signal' : 'Signal → Spot';
              return (
                <div key={t.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{label}</div>
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
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ ...glassCard(theme), maxWidth: '360px', width: '100%', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.upGradient || theme.up, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
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
              <button onClick={() => setSuccessPopup(null)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: theme.brandGradient || theme.brand, color: '#1A1305', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(217,119,6,0.3)' }}>
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
