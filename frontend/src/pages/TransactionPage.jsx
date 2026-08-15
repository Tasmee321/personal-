import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function glassCard(theme) {
  return { backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`, boxShadow: theme.shadow, backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)' };
}

const FILTERS = ['All', 'Deposit', 'Withdraw', 'Spot', 'Signal', 'Futures', 'Transfer'];

const TransactionPage = () => {
  const { theme, iconBadges } = useTheme();
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [futures, setFutures] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const [accRes, depRes, withRes] = await Promise.all([
          fetch(`${API_URL}/api/demo/account`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/demo/deposit/history`, { headers: authHeaders() }),
          fetch(`${API_URL}/api/demo/withdrawals`, { headers: authHeaders() }),
        ]);
        const accData = await accRes.json();
        if (accRes.ok) {
          setTrades(accData.trades || []);
          setPositions(accData.positions || []);
          setFutures(accData.futures || []);
          setLedger(accData.ledger || []);
        }
        const depData = await depRes.json();
        if (depRes.ok) setDeposits(depData.deposits || []);
        const withData = await withRes.json();
        if (withRes.ok) setWithdrawals(withData.requests || []);
      } catch {}
    })();
  }, []);

  const closedSignals = useMemo(() => positions.filter(p => p.settled), [positions]);
  const closedFutures = useMemo(() => futures.filter(p => p.closed), [futures]);

  const depositStatusColor = (status) => {
    if (status === 'confirmed') return theme.up;
    if (status === 'pending') return theme.brand;
    return theme.faint;
  };
  const withdrawStatusColor = (status) => {
    if (status === 'completed') return theme.up;
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
    deposits.forEach(d => items.push({ id: d.id || `dep-${d.at}`, at: d.at, category: 'Deposit', label: `Deposit ${fmt(d.amount)} USDT${d.network ? ` via ${d.network.toUpperCase()}` : ''}`, amount: d.amount, status: d.type === 'deposit' ? 'confirmed' : 'confirmed', statusColor: theme.up }));
    withdrawals.forEach(w => items.push({ id: w.id, at: w.createdAt || w.at, category: 'Withdraw', label: `Withdraw ${fmt(w.netPayout || w.amount)} USDT via ${(w.network || '').toUpperCase()}`, amount: -(w.netPayout || w.amount), status: w.status, statusColor: withdrawStatusColor(w.status) }));
    return items.sort((a, b) => b.at - a.at);
  }, [trades, closedSignals, closedFutures, deposits, withdrawals]);

  const filtered = filter === 'All' ? activity : activity.filter(a => a.category === filter);

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

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: iconBadges.amber.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Receipt size={26} color={iconBadges.amber.fg} />
            </div>
            <p style={{ color: theme.faint, fontSize: '14px', margin: 0 }}>No transactions yet</p>
          </div>
        )}

        {filtered.map(item => (
          <div key={item.id} style={{ ...glassCard(theme), padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: theme.faint, marginTop: '3px' }}>{new Date(item.at).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: theme.primary, backgroundColor: theme.primarySoft, padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{item.category}</span>
                {item.status && (
                  <span style={{ fontSize: '10px', fontWeight: '700', color: item.statusColor, backgroundColor: item.statusColor + '1A', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', textTransform: 'capitalize' }}>{item.status}</span>
                )}
              </div>
            </div>
            <span style={{ fontWeight: '700', fontSize: '14px', color: item.amount >= 0 ? theme.up : theme.down, flexShrink: 0 }}>
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
    </div>
  );
};

export default TransactionPage;
