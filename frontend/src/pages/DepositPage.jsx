import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, AlertTriangle, Clock, Shield, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const NETWORKS = [
  { key: 'trc20', label: 'TRC20', chain: 'Tron (TRC20)', color: '#FF0013', confirmations: 20, estTime: '~2 min', min: 10 },
  { key: 'erc20', label: 'ERC20', chain: 'Ethereum (ERC20)', color: '#627EEA', confirmations: 12, estTime: '~5 min', min: 20 },
  { key: 'bep20', label: 'BEP20', chain: 'BNB Smart Chain (BEP20)', color: '#F3BA2F', confirmations: 15, estTime: '~1 min', min: 10 },
];

const DepositPage = () => {
  const { theme } = useTheme();
  const [depNet, setDepNet] = useState('trc20');
  const [depositAddresses, setDepositAddresses] = useState({});
  const [copied, setCopied] = useState(false);
  const [depositHistory, setDepositHistory] = useState([]);
  const [view, setView] = useState('deposit');
  const [showNetDropdown, setShowNetDropdown] = useState(false);
  const [balance, setBalance] = useState(0);

  const [depAmt, setDepAmt] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [depMsg, setDepMsg] = useState('');
  const [depError, setDepError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [addrRes, acctRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/demo/deposit/addresses`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/demo/account`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/demo/deposit/history`, { headers: authHeaders() }),
        ]);
        const addrData = await addrRes.json();
        const acctData = await acctRes.json();
        const histData = await histRes.json();
        if (addrRes.ok) setDepositAddresses(addrData.addresses || {});
        if (acctRes.ok) setBalance(acctData.balance || 0);
        if (histRes.ok) setDepositHistory(histData.requests || []);
      } catch {}
    })();
  }, []);

  const net = NETWORKS.find(n => n.key === depNet);
  const addr = depositAddresses[depNet] || '';
  const copyAddr = () => { if (!addr) return; navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const submitDeposit = async () => {
    const amt = Number(depAmt);
    if (!amt || amt <= 0) { setDepError('Enter a valid amount.'); return; }
    if (amt < net.min) { setDepError(`Minimum deposit is ${net.min} USDT.`); return; }
    if (!txHash.trim()) { setDepError('Enter the transaction hash (TXID).'); return; }
    setSubmitting(true); setDepError(''); setDepMsg('');
    try {
      const res = await fetch(`${API_URL}/api/demo/deposit/request`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ amount: amt, network: depNet, txHash: txHash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.autoVerified) {
        setDepMsg(`Deposit verified! ${amt.toFixed(2)} USDT credited to your Spot wallet instantly.`);
      } else {
        setDepMsg(`Deposit submitted! ${amt.toFixed(2)} USDT via ${net.label} is pending review.`);
      }
      setDepAmt(''); setTxHash('');
      setDepositHistory(prev => [{ id: data.requestId, amount: amt, network: depNet, txHash: txHash.trim(), status: data.status || 'pending', createdAt: Date.now(), autoVerified: data.autoVerified }, ...prev]);
    } catch (err) { setDepError(err.message); }
    finally { setSubmitting(false); }
  };

  const infoRow = (label, value, valueColor) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.cardBorder}` }}>
      <span style={{ fontSize: '13px', color: theme.subtext }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: valueColor || theme.text }}>{value}</span>
    </div>
  );

  const statusBadge = (status) => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Pending' },
      done: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Confirmed' },
      rejected: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return <span style={{ fontSize: '10px', fontWeight: '700', color: s.color, padding: '2px 8px', borderRadius: '6px', backgroundColor: s.bg }}>{s.label}</span>;
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg,
    color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass || 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/assets" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Deposit</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['deposit', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? `${theme.primary}15` : 'none', border: view === v ? `1px solid ${theme.primary}` : `1px solid transparent`,
              color: view === v ? theme.primary : theme.subtext, fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              padding: '6px 14px', borderRadius: '8px',
            }}>{v === 'deposit' ? 'Deposit' : 'History'}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
        {view === 'deposit' && (
          <>
            {/* Coin */}
            <div style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Coin</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#26A17B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px' }}>₮</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>USDT</div>
                  <div style={{ fontSize: '11px', color: theme.subtext }}>Tether USD</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: theme.faint }}>Available</div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: theme.primary }}>{fmt(balance)}</div>
                </div>
              </div>
            </div>

            {/* Network */}
            <div style={{ position: 'relative', zIndex: 40, marginBottom: '12px' }}>
              <div style={{ ...glassCard(theme), padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Network</div>
                <button onClick={() => setShowNetDropdown(!showNetDropdown)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`,
                  backgroundColor: theme.inputBg || theme.bg, color: theme.text, cursor: 'pointer', fontSize: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: net.color }}></span>
                    <span style={{ fontWeight: '600' }}>{net.label}</span>
                    <span style={{ fontSize: '12px', color: theme.subtext }}>{net.chain}</span>
                  </div>
                  <ChevronDown size={16} style={{ color: theme.faint, transform: showNetDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>
              {showNetDropdown && (
                <div style={{ position: 'absolute', left: '0', right: '0', top: '100%', marginTop: '4px', backgroundColor: theme.bg === '#080C18' ? '#111830' : '#FFFFFF', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 100, overflow: 'hidden' }}>
                  {NETWORKS.map(n => (
                    <button key={n.key} onClick={() => { setDepNet(n.key); setShowNetDropdown(false); }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px',
                      border: 'none', backgroundColor: depNet === n.key ? `${n.color}15` : 'transparent',
                      color: theme.text, cursor: 'pointer', fontSize: '13px', borderBottom: `1px solid ${theme.cardBorder}`,
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.color }}></span>
                      <span style={{ fontWeight: '600' }}>{n.label}</span>
                      <span style={{ fontSize: '11px', color: theme.subtext }}>{n.chain}</span>
                      {depNet === n.key && <Check size={14} style={{ marginLeft: 'auto', color: n.color }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* QR + Address */}
            {addr ? (
              <div style={{ ...glassCard(theme), padding: '24px 20px', marginBottom: '12px', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '16px', borderRadius: '16px', backgroundColor: 'white', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <QRCodeSVG value={addr} size={180} level="M" bgColor="#FFFFFF" fgColor="#000000" />
                </div>
                <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                  {net.label} Deposit Address
                </div>
                <p style={{ fontSize: '13px', color: theme.text, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: '2', textAlign: 'center', letterSpacing: '0.5px', fontWeight: '600', margin: '0 0 12px 0', padding: '14px 16px', background: theme.bg === '#080C18' ? '#1E293B' : '#F8FAFC', borderRadius: '12px', border: theme.bg === '#080C18' ? '1px solid #334155' : '1px solid #CBD5E1' }}>{addr}</p>
                <button onClick={copyAddr} style={{
                  padding: '12px 24px', border: 'none', borderRadius: '10px',
                  background: copied ? theme.up : theme.primary, color: 'white', fontWeight: '700', fontSize: '13px',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s',
                }}>
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Address</>}
                </button>
              </div>
            ) : (
              <div style={{ ...glassCard(theme), padding: '30px 20px', marginBottom: '12px', textAlign: 'center' }}>
                <div style={{ color: theme.faint, fontSize: '13px' }}>Deposit address not available yet. Contact support.</div>
              </div>
            )}

            {/* Submit Deposit */}
            <div style={{ ...glassCard(theme), padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Confirm Deposit</div>
              <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '12px' }}>
                After sending USDT to the address above, fill in the details below to confirm your deposit.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="number" min="0" value={depAmt} onChange={(e) => { setDepAmt(e.target.value); setDepError(''); }}
                  placeholder={`Amount (min ${net.min} USDT)`} style={inputStyle} />
                <input type="text" value={txHash} onChange={(e) => { setTxHash(e.target.value); setDepError(''); }}
                  placeholder="Transaction Hash (TXID)" style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }} />
                <button onClick={submitDeposit} disabled={submitting} style={{
                  padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.up})`, color: 'white',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                }}>
                  {submitting ? 'Submitting...' : 'Submit Deposit Request'}
                </button>
              </div>
              {depError && <p style={{ fontSize: '12px', color: theme.down, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{depError}</p>}
              {depMsg && <p style={{ fontSize: '12px', color: theme.up, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{depMsg}</p>}
            </div>

            {/* Info */}
            <div style={{ ...glassCard(theme), padding: '16px', marginBottom: '12px' }}>
              {infoRow('Network', net.chain)}
              {infoRow('Minimum Deposit', `${net.min} USDT`)}
              {infoRow('Confirmations', `${net.confirmations} blocks`)}
              {infoRow('Estimated Time', net.estTime)}
              <div style={{ padding: '10px 0' }}>
                <span style={{ fontSize: '13px', color: theme.subtext }}>Deposit Fee</span>
                <span style={{ float: 'right', fontSize: '13px', fontWeight: '600', color: theme.up }}>Free</span>
              </div>
            </div>

            {/* Warnings */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.12)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '12px', color: '#F59E0B', lineHeight: '1.5' }}>
                  Send only <b>USDT</b> on the <b>{net.chain}</b> network. Deposits via other networks will not be credited.
                </span>
              </div>
              <div style={{ padding: '12px 14px', backgroundColor: 'rgba(239,68,68,0.06)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Shield size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: '12px', color: '#EF4444', lineHeight: '1.5' }}>
                  Funds sent to the wrong address or network cannot be recovered.
                </span>
              </div>
            </div>

            {/* Tips */}
            <div style={{ ...glassCard(theme), padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>How to Deposit</div>
              {[
                { step: '1', text: 'Copy the deposit address above or scan the QR code.' },
                { step: '2', text: `Send USDT via ${net.label} network from your external wallet.` },
                { step: '3', text: 'Enter the amount and transaction hash (TXID) in the form above.' },
                { step: '4', text: 'Your deposit will be reviewed and credited within 30 minutes.' },
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: i < 3 ? '10px' : 0 }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: `${theme.primary}15`, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{tip.step}</span>
                  <span style={{ fontSize: '12px', color: theme.subtext, lineHeight: '1.5' }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'history' && (
          <>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px' }}>Deposit History</div>
            {depositHistory.length === 0 && (
              <div style={{ ...glassCard(theme), padding: '50px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4 }}>📥</div>
                <div style={{ color: theme.faint, fontSize: '13px' }}>No deposit records yet</div>
                <div style={{ color: theme.faint, fontSize: '11px', marginTop: '4px' }}>Your deposits will appear here once submitted</div>
              </div>
            )}
            {depositHistory.map(entry => (
              <div key={entry.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                      {entry.amount?.toFixed(2)} USDT via {entry.network?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '4px' }}>{new Date(entry.createdAt).toLocaleString()}</div>
                    {entry.txHash && (
                      <div style={{ fontSize: '10px', color: theme.subtext, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        TX: {entry.txHash}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: entry.status === 'done' ? theme.up : theme.text, fontVariantNumeric: 'tabular-nums', marginBottom: '4px' }}>
                      +{fmt(entry.amount)}
                    </div>
                    {statusBadge(entry.status)}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DepositPage;
