import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt, X, Copy, CheckCheck } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { SkeletonList } from '../components/Skeleton';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(ts) { return ts ? new Date(ts).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'; }
function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const FILTERS = ['All', 'Deposit', 'Withdraw', 'Spot', 'Signal', 'Futures', 'Transfer'];

/* ── Detail Modal ── */
function DetailModal({ item, onClose, theme }) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  const rows = [];
  if (item.category === 'Deposit') {
    rows.push(
      { label: 'Type', value: 'Deposit' },
      { label: 'Amount', value: `${fmt(item.rawAmount)} USDT` },
      { label: 'Network', value: (item.network || '').toUpperCase() || '—' },
      { label: 'Status', value: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '—', color: item.statusColor },
      { label: 'Submitted', value: fmtDate(item.at) },
      { label: 'Confirmed', value: fmtDate(item.processedAt) },
      { label: 'TX Hash', value: item.txHash || '—', copyable: !!item.txHash },
      { label: 'Auto Verified', value: item.autoVerified ? 'Yes (blockchain)' : 'Manual' },
    );
  } else if (item.category === 'Withdraw') {
    rows.push(
      { label: 'Type', value: 'Withdrawal' },
      { label: 'Requested', value: `${fmt(item.rawAmount)} USDT` },
      { label: 'Fee', value: `${fmt(item.fee)} USDT` },
      { label: 'You Receive', value: `${fmt(item.netPayout)} USDT` },
      { label: 'Network', value: (item.network || '').toUpperCase() || '—' },
      { label: 'Wallet Address', value: item.walletAddress || '—', copyable: !!item.walletAddress },
      { label: 'Status', value: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : '—', color: item.statusColor },
      { label: 'Submitted', value: fmtDate(item.at) },
      { label: 'Reviewed', value: fmtDate(item.reviewedAt) },
      { label: 'TX ID', value: item.txid || '—', copyable: !!item.txid },
    );
  } else {
    rows.push(
      { label: 'Type', value: item.category },
      { label: 'Description', value: item.label },
      { label: 'Amount', value: `${item.amount >= 0 ? '+' : ''}${fmt(Math.abs(item.amount))} USDT` },
      { label: 'Date', value: fmtDate(item.at) },
    );
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999,
      backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        ...glassCard(theme),
        width: '100%', maxWidth: '520px', borderRadius: '20px 20px 0 0',
        padding: '20px', paddingBottom: '36px',
        animation: 'slideUp 0.22s ease',
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>Transaction Detail</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: theme.primary, backgroundColor: theme.primarySoft, padding: '2px 8px', borderRadius: '6px' }}>{item.category}</span>
              {item.status && (
                <span style={{ fontSize: '10px', fontWeight: '700', color: item.statusColor, backgroundColor: item.statusColor + '1A', padding: '2px 8px', borderRadius: '6px', textTransform: 'capitalize' }}>{item.status}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.subtext, display: 'flex', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Amount hero */}
        {(item.category === 'Deposit' || item.category === 'Withdraw') && (
          <div style={{
            background: item.category === 'Deposit' ? theme.upSoft : theme.downSoft,
            borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: item.category === 'Deposit' ? theme.up : theme.down }}>
              {item.category === 'Deposit' ? '+' : '-'}{fmt(item.category === 'Withdraw' ? item.netPayout : item.rawAmount)} USDT
            </div>
            <div style={{ fontSize: '11px', color: theme.subtext, marginTop: '4px' }}>
              {item.category === 'Withdraw' ? 'Net payout after fee' : 'Deposited amount'}
            </div>
          </div>
        )}

        {/* Detail rows */}
        <div style={{ ...glassCard(theme), padding: '4px 0', borderRadius: '12px' }}>
          {rows.map((row, i) => row.value !== '—' || row.label === 'TX Hash' || row.label === 'TX ID' || row.label === 'Wallet Address' ? (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 16px', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`,
            }}>
              <span style={{ fontSize: '12px', color: theme.subtext, flexShrink: 0, marginRight: '12px' }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{
                  fontSize: '12px', fontWeight: '600',
                  color: row.color || theme.text,
                  wordBreak: 'break-all', textAlign: 'right',
                  maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: row.copyable ? 'normal' : 'nowrap',
                }}>{row.value}</span>
                {row.copyable && row.value !== '—' && (
                  <button onClick={() => copy(row.value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, flexShrink: 0, padding: '2px' }}>
                    {copied ? <CheckCheck size={14} color={theme.up} /> : <Copy size={14} />}
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

const TransactionPage = () => {
  const { theme, iconBadges } = useTheme();
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [futures, setFutures] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [accRes, depRes, withRes] = await Promise.all([
          fetch(`${API_URL}/api/real/account`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/real/deposit/history`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/real/withdrawals`, { headers: authHeaders() }),
        ]);
        const accData = await accRes.json();
        if (accRes.ok) {
          setTrades(accData.trades || []);
          setPositions(accData.positions || []);
          setFutures(accData.futures || []);
          setLedger(accData.ledger || []);
        }
        const depData = await depRes.json();
        if (depRes.ok) setDeposits(depData.requests || depData.deposits || []);
        const withData = await withRes.json();
        if (withRes.ok) setWithdrawals(withData.requests || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const closedSignals = useMemo(() => positions.filter(p => p.settled), [positions]);
  const closedFutures = useMemo(() => futures.filter(p => p.closed), [futures]);

  const depositStatusColor = (status) => {
    if (status === 'confirmed' || status === 'done') return theme.up;
    if (status === 'pending') return theme.brand;
    return theme.faint;
  };
  const withdrawStatusColor = (status) => {
    if (status === 'completed' || status === 'done') return theme.up;
    if (status === 'rejected') return theme.down;
    return theme.brand;
  };

  const activity = useMemo(() => {
    const items = [];
    trades.forEach(t => {
      if (t.type === 'transfer') {
        const penaltyLabel = t.penalty ? ` (20% fee: -${fmt(t.penalty)})` : '';
        const rewardLabel = t.reward ? ` (+${fmt(t.reward)} reward)` : '';
        items.push({ id: t.id, at: t.at, category: 'Transfer', label: (t.direction === 'toSignal' ? 'Spot → Signal' : 'Signal → Spot') + penaltyLabel + rewardLabel, amount: t.penalty ? -t.penalty : 0 });
        return;
      }
      items.push({ id: t.id, at: t.at, category: 'Spot', label: `${t.side === 'buy' ? 'Bought' : 'Sold'} ${fmt(t.quantity)} ${t.pair.split('/')[0]}`, amount: t.side === 'buy' ? -t.amount : t.amount });
    });
    closedSignals.forEach(p => {
      const isCancelled = !!p.cancelled;
      items.push({ id: p.id, at: p.settledAt || p.openedAt, category: 'Signal', label: isCancelled ? `Signal ${p.pair} CANCELLED` : `Signal ${p.pair} ${p.won ? 'WIN' : 'LOSS'}`, amount: isCancelled ? 0 : p.profit });
    });
    closedFutures.forEach(p => items.push({ id: p.id, at: p.closedAt, category: 'Futures', label: `Futures ${p.pair} ${p.direction.toUpperCase()} closed`, amount: p.pnl }));

    deposits.forEach(d => {
      const sc = depositStatusColor(d.status);
      items.push({
        id: d.id || `dep-${d.at || d.createdAt}`,
        at: d.createdAt || d.at,
        category: 'Deposit',
        label: `Deposit ${fmt(d.amount)} USDT${d.network ? ` via ${d.network.toUpperCase()}` : ''}`,
        amount: d.amount,
        rawAmount: d.amount,
        status: d.status === 'done' ? 'confirmed' : d.status,
        statusColor: sc,
        // full detail fields
        network: d.network,
        txHash: d.txHash,
        processedAt: d.processedAt,
        autoVerified: d.autoVerified,
      });
    });

    withdrawals.forEach(w => {
      const sc = withdrawStatusColor(w.status);
      items.push({
        id: w.id,
        at: w.createdAt || w.at,
        category: 'Withdraw',
        label: `Withdraw ${fmt(w.netPayout || w.amount)} USDT via ${(w.network || '').toUpperCase()}`,
        amount: -(w.netPayout || w.amount),
        rawAmount: w.amount,
        netPayout: w.netPayout || w.amount,
        fee: w.fee || 0,
        status: w.status === 'done' ? 'completed' : w.status,
        statusColor: sc,
        // full detail fields
        network: w.network,
        walletAddress: w.walletAddress,
        reviewedAt: w.reviewedAt,
        txid: w.txid,
      });
    });

    return items.sort((a, b) => b.at - a.at);
  }, [trades, closedSignals, closedFutures, deposits, withdrawals]);

  const filtered = filter === 'All' ? activity : activity.filter(a => a.category === filter);
  const isClickable = (item) => item.category === 'Deposit' || item.category === 'Withdraw';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card, backdropFilter: theme.cardGlass || 'blur(16px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link to="/assets" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Transaction History</span>
      </div>

      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 14px', borderRadius: '20px', border: filter === f ? 'none' : `1px solid ${theme.cardBorder}`, background: filter === f ? theme.primaryGradient : theme.card, color: filter === f ? '#fff' : theme.subtext, fontWeight: '700', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
              {f}
            </button>
          ))}
        </div>

        {loading && <SkeletonList rows={5} height={64} />}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: iconBadges.amber.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Receipt size={26} color={iconBadges.amber.fg} />
            </div>
            <p style={{ color: theme.faint, fontSize: '14px', margin: 0 }}>No transactions yet</p>
          </div>
        )}

        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => isClickable(item) ? setSelectedItem(item) : undefined}
            style={{
              ...glassCard(theme),
              padding: '14px 16px', marginBottom: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: isClickable(item) ? 'pointer' : 'default',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
            }}
            onMouseEnter={e => { if (isClickable(item)) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: theme.faint, marginTop: '3px' }}>{new Date(item.at).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: theme.primary, backgroundColor: theme.primarySoft, padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{item.category}</span>
                {item.status && (
                  <span style={{ fontSize: '10px', fontWeight: '700', color: item.statusColor, backgroundColor: item.statusColor + '1A', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', textTransform: 'capitalize' }}>{item.status}</span>
                )}
                {isClickable(item) && (
                  <span style={{ fontSize: '10px', color: theme.primary, fontWeight: '600' }}>Tap for details</span>
                )}
              </div>
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: item.amount >= 0 ? theme.up : theme.down, flexShrink: 0, marginLeft: '12px' }}>
              {item.amount >= 0 ? '+' : ''}{fmt(Math.abs(item.amount))}
            </span>
          </div>
        ))}

        {ledger.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>Ledger</div>
            <div style={{ ...glassCard(theme), padding: '4px 16px' }}>
              {ledger.slice(0, 30).map((entry, i) => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`, fontSize: '12px' }}>
                  <div>
                    <div style={{ color: theme.text, fontWeight: '600' }}>{entry.description}</div>
                    <div style={{ color: theme.faint, fontSize: '10px' }}>{entry.wallet?.toUpperCase()} &middot; {new Date(entry.at).toLocaleString()}</div>
                  </div>
                  <span style={{ fontWeight: '700', color: entry.amount >= 0 ? theme.up : theme.down, flexShrink: 0 }}>
                    {entry.amount >= 0 ? '+' : ''}{fmt(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} theme={theme} />
    </div>
  );
};

export default TransactionPage;
