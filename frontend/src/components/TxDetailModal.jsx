import React, { useState } from 'react';
import { X, Copy, CheckCheck } from 'lucide-react';

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(ts) {
  return ts ? new Date(ts).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
}
function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const NETWORK_NAMES = { trc20: 'Tron (TRC20)', erc20: 'Ethereum (ERC20)', bep20: 'BNB Smart Chain (BEP20)' };

function statusColor(status) {
  if (['done', 'completed', 'approved', 'confirmed'].includes(status)) return '#10B981';
  if (status === 'pending') return '#F59E0B';
  if (status === 'rejected') return '#EF4444';
  return '#9CA3AF';
}
function statusLabel(status) {
  if (['done', 'completed', 'approved'].includes(status)) return 'Completed';
  if (status === 'pending') return 'Pending';
  if (status === 'rejected') return 'Rejected';
  if (status === 'confirmed') return 'Confirmed';
  return status || '—';
}

export default function TxDetailModal({ item, type, onClose, theme }) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  const isDeposit = type === 'deposit';
  const fee = item.fee ?? (Number(item.amount) < 100 ? 5 : Math.round(Number(item.amount) * 0.05 * 100) / 100);
  const netPayout = item.netPayout ?? Math.max(0, Number(item.amount) - fee);
  const networkName = NETWORK_NAMES[item.network] || (item.network || '').toUpperCase();

  const rows = isDeposit ? [
    { label: 'Type',         value: 'Deposit' },
    { label: 'Amount',       value: `+${fmt(item.amount)} USDT`, color: '#10B981' },
    { label: 'Network',      value: networkName },
    { label: 'Status',       value: statusLabel(item.status), color: statusColor(item.status) },
    { label: 'Submitted',    value: fmtDate(item.createdAt) },
    { label: 'Confirmed',    value: fmtDate(item.processedAt) },
    { label: 'TX Hash',      value: item.txHash || '—', copyable: !!item.txHash },
    { label: 'Verification', value: item.autoVerified ? '⚡ Auto (blockchain)' : 'Manual review' },
  ] : [
    { label: 'Type',         value: 'Withdrawal' },
    { label: 'Requested',    value: `${fmt(item.amount)} USDT` },
    { label: 'Fee',          value: `-${fmt(fee)} USDT`, color: '#EF4444' },
    { label: 'You Receive',  value: `${fmt(netPayout)} USDT`, color: '#10B981' },
    { label: 'Network',      value: networkName },
    { label: 'Wallet',       value: item.walletAddress || item.address || '—', copyable: !!(item.walletAddress || item.address) },
    { label: 'Status',       value: statusLabel(item.status), color: statusColor(item.status) },
    { label: 'Submitted',    value: fmtDate(item.createdAt || item.requestedAt) },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...glassCard(theme), width: '100%', maxWidth: '520px', borderRadius: '20px 20px 0 0', padding: '20px', paddingBottom: '36px', animation: 'slideUp 0.22s ease' }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>Transaction Detail</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: theme.primary, backgroundColor: theme.primarySoft, padding: '2px 8px', borderRadius: '6px' }}>{isDeposit ? 'Deposit' : 'Withdraw'}</span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: statusColor(item.status), backgroundColor: statusColor(item.status) + '1A', padding: '2px 8px', borderRadius: '6px' }}>{statusLabel(item.status)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subtext, display: 'flex', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Amount hero */}
        <div style={{ background: isDeposit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '16px', border: isDeposit ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: isDeposit ? '#10B981' : '#EF4444' }}>
            {isDeposit ? '+' : '-'}{fmt(item.amount)} USDT
          </div>
          <div style={{ fontSize: '11px', color: theme.subtext, marginTop: '4px' }}>{isDeposit ? 'Deposited amount' : 'Requested amount (before fee)'}</div>
        </div>

        {/* Detail rows */}
        <div style={{ ...glassCard(theme), padding: '4px 0', borderRadius: '12px' }}>
          {rows.map((row, i) => row.value !== '—' ? (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}` }}>
              <span style={{ fontSize: '12px', color: theme.subtext, flexShrink: 0, marginRight: '12px' }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: row.color || theme.text, wordBreak: 'break-all', textAlign: 'right', maxWidth: '220px', overflow: 'hidden', whiteSpace: row.copyable ? 'normal' : 'nowrap', textOverflow: 'ellipsis' }}>{row.value}</span>
                {row.copyable && row.value !== '—' && (
                  <button onClick={() => copy(row.value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, flexShrink: 0, padding: '2px' }}>
                    {copied ? <CheckCheck size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
