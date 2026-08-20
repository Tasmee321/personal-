import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpDown, ArrowRight, CheckCircle } from 'lucide-react';
import { getToken } from '../utils/auth';
import { scaleVolume } from '../utils/volumeDisplay';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }
function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const TransferPage = () => {
  const { theme } = useTheme();
  const [view, setView] = useState('transfer');
  const [direction, setDirection] = useState('toSignal'); // toSignal | toSpot
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [balance, setBalance] = useState(0);
  const [signalBalance, setSignalBalance] = useState(0);
  const [trades, setTrades] = useState([]);
  const [volumeData, setVolumeData] = useState(null);
  const [penaltyWarning, setPenaltyWarning] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const loadAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/real/account`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance || 0);
        setSignalBalance(data.signalBalance || 0);
        setTrades((data.trades || []).filter(t => t.type === 'transfer'));
        if (data.volumeData) setVolumeData(data.volumeData);
      }
    } catch {}
  };

  useEffect(() => { loadAccount(); }, []);

  const availableBalance = direction === 'toSignal' ? balance : signalBalance;
  const fromLabel = direction === 'toSignal' ? 'Spot Account' : 'Signal Account';
  const toLabel = direction === 'toSignal' ? 'Signal Account' : 'Spot Account';

  const txInFlight = useRef(false); // synchronous double-submit guard
  const doTransfer = async (confirm) => {
    if (txInFlight.current) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { setMsg('Please enter a valid amount.'); setMsgType('error'); return; }
    if (amt > availableBalance) { setMsg('Insufficient balance.'); setMsgType('error'); return; }
    txInFlight.current = true;
    setBusy(true); setMsg('');
    try {
      const body = { direction, amount: amt };
      if (confirm) body.confirmPenalty = true;
      const res = await fetch(`${API_URL}/api/real/transfer`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); setMsgType('error'); }
      else if (data.warning) { setPenaltyWarning(data); }
      else {
        setAmount(''); setPenaltyWarning(null);
        setBalance(data.balance); setSignalBalance(data.signalBalance);
        setSuccessPopup({ amount: amt, direction, reward: data.reward || 0, penaltyApplied: data.penaltyApplied || 0 });
        loadAccount();
      }
    } catch { setMsg('Network error.'); setMsgType('error'); }
    txInFlight.current = false;
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass || 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/assets" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Transfer</span>
        </div>
        <button onClick={() => { setView(view === 'transfer' ? 'history' : 'transfer'); setMsg(''); }} style={{ background: 'none', border: 'none', color: view === 'history' ? theme.primary : theme.subtext, fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          {view === 'transfer' ? 'History' : 'Transfer'}
        </button>
      </div>

      {view === 'transfer' && (
        <div style={{ padding: '16px 20px', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Balance pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Spot', bal: balance, color: theme.primary },
              { label: 'Signal', bal: signalBalance, color: theme.brand },
            ].map(acc => (
              <div key={acc.label} style={{ ...glassCard(theme), padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600' }}>{acc.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: acc.color }}>{fmt(acc.bal)} <span style={{ fontSize: '10px', color: theme.faint }}>USDT</span></span>
              </div>
            ))}
          </div>

          {/* Direction toggle */}
          <div style={{ ...glassCard(theme), padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* From */}
              <div style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: theme.inputBg || theme.bg, border: `1px solid ${theme.cardBorder}`, textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: theme.subtext, fontWeight: '600', marginBottom: '4px' }}>FROM</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text }}>{fromLabel}</div>
              </div>

              {/* Swap */}
              <button onClick={() => { setDirection(d => d === 'toSignal' ? 'toSpot' : 'toSignal'); setAmount(''); setMsg(''); setPenaltyWarning(null); }} style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.brandSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: theme.brand,
              }}>
                <ArrowUpDown size={17} />
              </button>

              {/* To */}
              <div style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: theme.inputBg || theme.bg, border: `1px solid ${theme.cardBorder}`, textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: theme.subtext, fontWeight: '600', marginBottom: '4px' }}>TO</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: theme.text }}>{toLabel}</div>
              </div>
            </div>
          </div>

          {/* Coin */}
          <div style={{ ...glassCard(theme), padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600' }}>Coin</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#26A17B,#1a7a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>₮</div>
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>USDT</span>
              <ArrowRight size={14} color={theme.faint} />
            </div>
          </div>

          {/* Amount */}
          <div style={{ ...glassCard(theme), padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: theme.subtext, fontWeight: '600', marginBottom: '8px' }}>Amount</div>
            <div style={{ position: 'relative' }}>
              <input
                type="number" min="0" value={amount}
                onChange={(e) => { setAmount(e.target.value); setPenaltyWarning(null); setMsg(''); }}
                placeholder="Enter amount"
                style={{ width: '100%', padding: '12px 90px 12px 12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: theme.subtext }}>USDT</span>
                <span style={{ color: theme.cardBorder }}>|</span>
                <button onClick={() => setAmount(String(availableBalance))} style={{ background: 'none', border: 'none', color: theme.brand, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', padding: 0 }}>All</button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: theme.faint, marginTop: '6px' }}>
              Available: <b style={{ color: theme.text }}>{fmt(availableBalance)}</b> USDT
            </div>
          </div>

          {/* Error/msg */}
          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: msgType === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${msgType === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
              <span style={{ fontSize: '13px', color: msgType === 'error' ? theme.down : theme.up }}>{msg}</span>
            </div>
          )}

          {/* Penalty warning */}
          {penaltyWarning && (
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: '13px', color: theme.down, fontWeight: '600', marginBottom: '6px' }}>Volume Incomplete</div>
              <div style={{ fontSize: '12px', color: theme.subtext, lineHeight: '1.6', marginBottom: '10px' }}>
                {penaltyWarning.message}<br />
                Penalty: <b style={{ color: theme.down }}>-{penaltyWarning.penaltyAmount.toFixed(2)} USDT</b><br />
                You receive: <b style={{ color: theme.up }}>{penaltyWarning.receiveAmount.toFixed(2)} USDT</b><br />
                Volume progress: <b>{penaltyWarning.volumeProgress}%</b>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => doTransfer(true)} disabled={busy} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: theme.down, color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>Confirm</button>
                <button onClick={() => setPenaltyWarning(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, backgroundColor: 'transparent', color: theme.subtext, fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Volume progress — shown before the user hits the penalty warning */}
          {direction === 'toSpot' && (() => {
            // Scaled to the user's Signal balance for display; backend still enforces the raw 5× rule.
            const v = scaleVolume(volumeData, signalBalance);
            if (!v) return null;
            const { pct, complete: done, total, done: doneAmt, remaining, showAmounts } = v;
            return (
              <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.subtext, marginBottom: '5px' }}>
                  <span>Trading volume {done ? '✓ complete' : ''}</span>
                  <span style={{ fontWeight: 600, color: done ? theme.up : theme.text }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.inputBg || theme.cardBorder, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: done ? theme.upGradient : theme.brandGradient, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '10px', color: theme.faint, marginTop: '5px' }}>
                  {showAmounts && <>{fmt(doneAmt)} / {fmt(total)} USDT</>}
                  {done
                    ? `${showAmounts ? ' · ' : ''}this transfer is penalty-free`
                    : showAmounts ? ` · ${fmt(remaining)} USDT remaining to avoid the 20% penalty` : 'Complete trading volume to avoid the 20% penalty'}
                </div>
              </div>
            );
          })()}

          {/* Notice */}
          <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: direction === 'toSpot' ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.06)', border: `1px solid ${direction === 'toSpot' ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.12)'}` }}>
            <p style={{ fontSize: '11px', color: theme.subtext, lineHeight: '1.6', margin: 0 }}>
              {direction === 'toSpot'
                ? '⚠️ 20% penalty applies if signal volume is not complete.'
                : '✅ No fees charged.'}
            </p>
          </div>

          {/* Transfer button */}
          <button onClick={() => doTransfer(false)} disabled={busy} style={{
            width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
            background: theme.brandGradient || theme.brand,
            color: '#1A1305', fontWeight: 'bold', fontSize: '15px',
            cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
            boxShadow: '0 6px 20px rgba(217,119,6,0.3)',
          }}>
            {busy ? 'Processing...' : 'Transfer Immediately'}
          </button>

        </div>
      )}

      {view === 'history' && (
        <div style={{ padding: '16px 20px', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '14px' }}>Transfer History</div>
          {trades.length === 0 && (
            <div style={{ ...glassCard(theme), padding: '40px', textAlign: 'center' }}>
              <div style={{ color: theme.faint, fontSize: '13px' }}>No transfer records yet</div>
            </div>
          )}
          {trades.map(t => (
            <div key={t.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>
                    {t.direction === 'toSignal' ? 'Spot → Signal' : 'Signal → Spot'}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.faint }}>{new Date(t.at).toLocaleString()}</div>
                  {t.reward > 0 && <div style={{ fontSize: '11px', color: theme.up, fontWeight: '600', marginTop: '2px' }}>+{t.reward.toFixed(2)} USDT reward</div>}
                  {t.penalty > 0 && <div style={{ fontSize: '11px', color: theme.down, fontWeight: '600', marginTop: '2px' }}>-{t.penalty.toFixed(2)} USDT penalty</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{fmt(t.amount)} USDT</div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', padding: '2px 8px', borderRadius: '6px', backgroundColor: theme.up }}>Done</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success popup */}
      {successPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ ...glassCard(theme), maxWidth: '340px', width: '100%', padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: theme.upGradient || theme.up, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
              <CheckCircle size={30} color="white" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: theme.text }}>Transfer Complete</h3>
            <p style={{ color: theme.subtext, fontSize: '14px', margin: '0 0 4px' }}><b>{fmt(successPopup.amount)} USDT</b> transferred</p>
            <p style={{ color: theme.faint, fontSize: '13px', margin: '0 0 16px' }}>{successPopup.direction === 'toSignal' ? 'Spot → Signal' : 'Signal → Spot'}</p>
            {successPopup.reward > 0 && (
              <div style={{ backgroundColor: theme.upSoft, padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
                <span style={{ color: theme.up, fontWeight: '700', fontSize: '13px' }}>+{successPopup.reward.toFixed(2)} USDT reward!</span>
              </div>
            )}
            {successPopup.penaltyApplied > 0 && (
              <div style={{ backgroundColor: theme.downSoft, padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
                <span style={{ color: theme.down, fontWeight: '700', fontSize: '13px' }}>-{successPopup.penaltyApplied.toFixed(2)} USDT penalty</span>
              </div>
            )}
            <button onClick={() => setSuccessPopup(null)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: theme.brandGradient || theme.brand, color: '#1A1305', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(217,119,6,0.3)' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferPage;
