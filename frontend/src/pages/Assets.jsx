import { useEffect, useMemo, useState } from 'react';
import PullIndicator from '../components/PullToRefresh';
import { usePullToRefresh } from '../utils/usePullToRefresh';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Receipt, AlertTriangle, Settings } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { CoinIcon } from '../components/CoinIcons';
import { Shimmer } from '../components/Skeleton';
import { getToken } from '../utils/auth';
import { scaleVolume } from '../utils/volumeDisplay';
import { useTheme } from '../ThemeContext';
import { useLanguage } from '../LanguageContext';
import ALL_COINS, { buildWsStreamUrl } from '../config/coins';
import { API_URL } from '../config';

const COINS = ALL_COINS;

const TABS = ['Overview', 'Spot', 'Futures', 'Signals'];
const TAB_LABELS = { Overview: 'assets.tabOverview', Spot: 'assets.tabSpot', Futures: 'assets.tabFutures', Signals: 'assets.tabSignals' };

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function fmt(n, digits = 2) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function glassCard(theme, extra = {}) {
  return {
    backgroundColor: theme.card,
    backdropFilter: theme.cardGlass,
    WebkitBackdropFilter: theme.cardGlass,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '18px',
    padding: '18px',
    boxShadow: theme.shadow,
    ...extra,
  };
}

function BalanceBar({ label, value, total, color, theme }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: theme.subtext, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}55` }} />
          {label}
        </span>
        <span style={{ fontWeight: '700', color: theme.text }}>{fmt(value)}</span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.inputBg, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '3px', backgroundColor: color, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function PenaltyWarningModal({ amount, penaltyAmount, receiveAmount, volumeProgress, onConfirm, onCancel }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div style={{ ...glassCard(theme, { maxWidth: '360px', width: '100%', boxShadow: theme.shadowElevated, padding: '24px' }) }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
            <span style={{ fontSize: '24px' }}>&#9888;</span>
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: theme.text, fontSize: '18px', fontWeight: '700' }}>{t('assets.penaltyTitle')}</h3>
          <p style={{ margin: 0, color: theme.subtext, fontSize: '13px', lineHeight: '1.6' }}>
            {t('assets.penaltyDesc')}
          </p>
        </div>

        {volumeProgress !== undefined && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.faint, marginBottom: '4px' }}>
              <span>{t('assets.volumeProgress')}</span>
              <span style={{ fontWeight: '600' }}>{volumeProgress}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.inputBg, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '3px', background: theme.primaryGradient, width: `${Math.min(100, volumeProgress)}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        <div style={{ backgroundColor: theme.inputBg, borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: theme.subtext }}>{t('assets.transferAmount')}</span>
            <span style={{ fontWeight: 'bold', color: theme.text }}>{fmt(amount)} USDT</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: theme.down }}>{t('assets.penaltyRow')}</span>
            <span style={{ fontWeight: 'bold', color: theme.down }}>-{fmt(penaltyAmount)} USDT</span>
          </div>
          <div style={{ borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: theme.subtext, fontWeight: '600' }}>{t('assets.youReceive')}</span>
            <span style={{ fontWeight: 'bold', color: theme.up }}>{fmt(receiveAmount)} USDT</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: '14px', border: `1px solid ${theme.cardBorder}`, backgroundColor: 'transparent', color: theme.text, fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: '14px', border: 'none', background: theme.downGradient, color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            {t('assets.confirmTransfer')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferForm({ spotBalance, signalBalance, volumeData, onSubmit, onRefresh }) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const [direction, setDirection] = useState('toSignal');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState(null);

  const vd = volumeData || { depositBase: 0, requiredVolume: 0, tradedVolume: 0, signalTradeCount: 0 };
  const volumeComplete = vd.requiredVolume > 0 && vd.tradedVolume >= vd.requiredVolume;
  // Display-only: progress scaled to the user's Signal balance (backend still enforces the raw 5× rule).
  const vol = scaleVolume(vd, signalBalance);
  const daysCompleted = Math.floor((vd.signalTradeCount || 0) / 3);

  const submit = async () => {
    const amt = Number(value);
    if (!amt || amt <= 0) { setMsgOk(false); return setMsg(t('assets.enterAmountGt0')); }
    setBusy(true);
    setMsg('');
    const result = await onSubmit(direction, amt, false);
    setBusy(false);
    if (result && result.warning) {
      setPenaltyModal({ amount: amt, penaltyAmount: result.penaltyAmount, receiveAmount: result.receiveAmount, volumeProgress: result.volumeProgress });
      return;
    }
    if (result && result.error) { setMsgOk(false); setMsg(result.error); return; }
    setValue('');
    setMsgOk(true);
    setMsg(result?.penaltyApplied ? t('assets.msgPenaltyDeducted', { amt: fmt(result.penaltyApplied) }) : result?.reward ? t('assets.msgRewardCredited', { amt: fmt(result.reward) }) : t('assets.msgDone'));
  };

  const handlePenaltyConfirm = async () => {
    const amt = penaltyModal.amount;
    setPenaltyModal(null);
    setBusy(true);
    const result = await onSubmit('toSpot', amt, true);
    setBusy(false);
    if (result && result.error) { setMsgOk(false); setMsg(result.error); return; }
    setValue('');
    setMsgOk(true);
    setMsg(result?.penaltyApplied ? t('assets.msgPenaltyDeducted', { amt: fmt(result.penaltyApplied) }) : t('assets.msgDone'));
    if (onRefresh) onRefresh();
  };

  const maxBalance = direction === 'toSignal' ? spotBalance || 0 : signalBalance || 0;

  return (
    <>
      {penaltyModal && (
        <PenaltyWarningModal
          amount={penaltyModal.amount}
          penaltyAmount={penaltyModal.penaltyAmount}
          receiveAmount={penaltyModal.receiveAmount}
          volumeProgress={penaltyModal.volumeProgress}
          onConfirm={handlePenaltyConfirm}
          onCancel={() => setPenaltyModal(null)}
        />
      )}
      <div style={glassCard(theme, { marginBottom: '14px' })}>
        <div style={{ display: 'flex', border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
          <button onClick={() => setDirection('toSignal')} style={{ flex: 1, padding: '11px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', backgroundColor: direction === 'toSignal' ? theme.primarySoft : 'transparent', color: direction === 'toSignal' ? theme.primary : theme.subtext, transition: 'all 0.2s' }}>
            {t('assets.dirToSignal')}
          </button>
          <button onClick={() => setDirection('toSpot')} style={{ flex: 1, padding: '11px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', backgroundColor: direction === 'toSpot' ? theme.primarySoft : 'transparent', color: direction === 'toSpot' ? theme.primary : theme.subtext, transition: 'all 0.2s' }}>
            {t('assets.dirToSpot')}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: theme.faint, marginBottom: '8px' }}>
          <span>{t('assets.spotBal', { amt: fmt(spotBalance) })}</span>
          <span>{t('assets.signalBal', { amt: fmt(signalBalance) })}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00"
              style={{ width: '100%', padding: isRTL ? '13px 14px 13px 55px' : '13px 55px 13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            <button onClick={() => setValue(String(maxBalance))} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '8px', top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', borderRadius: '8px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}>
              {t('common.max')}
            </button>
          </div>
          <button onClick={submit} disabled={busy} style={{ padding: '0 22px', borderRadius: '12px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: '700', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, boxShadow: '0 4px 14px rgba(59,130,246,0.25)', fontSize: '14px' }}>
            {t('assets.transferBtn')}
          </button>
        </div>

        {direction === 'toSpot' && vol && (
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', backgroundColor: volumeComplete ? theme.upSoft : theme.brandSoft, border: `1px solid ${volumeComplete ? theme.up : theme.brand}40` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: volumeComplete ? theme.up : theme.brand }}>
                {volumeComplete ? t('assets.volumeCompleteFee') : t('assets.volumeIncompletePenalty')}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: volumeComplete ? theme.up : theme.text }}>{Math.round(vol.pct)}%</span>
            </div>
            <div style={{ height: '5px', borderRadius: '3px', backgroundColor: theme.inputBg, overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ height: '100%', borderRadius: '3px', background: volumeComplete ? theme.upGradient : theme.brandGradient, width: `${vol.pct}%`, transition: 'width 0.3s' }} />
            </div>
            {vol.showAmounts && (
              <div style={{ fontSize: '10px', color: theme.faint, marginTop: '5px' }}>
                {t('assets.volumeAmounts', { done: fmt(vol.done), total: fmt(vol.total), remaining: fmt(vol.remaining) })}
              </div>
            )}
          </div>
        )}

        {direction === 'toSignal' && (
          <p style={{ fontSize: '11px', color: theme.faint, marginTop: '10px', marginBottom: 0 }}>{t('assets.instantTransfer')}</p>
        )}
        {msg && <p style={{ fontSize: '12px', color: msgOk ? theme.up : theme.down, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{msg}</p>}
      </div>
    </>
  );
}

function DepositPanel({ depositAddresses, rewardSummary, onDeposited }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [depNet, setDepNet] = useState('trc20');
  const [depAmt, setDepAmt] = useState('');
  const [depBusy, setDepBusy] = useState(false);
  const [depMsg, setDepMsg] = useState('');
  const [depMsgOk, setDepMsgOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const networks = [
    { key: 'trc20', label: 'TRC20', chain: 'TRON', color: '#FF0013', confirmations: 20, min: 10 },
    { key: 'erc20', label: 'ERC20', chain: 'Ethereum', color: '#627EEA', confirmations: 12, min: 20 },
    { key: 'bep20', label: 'BEP20', chain: 'BSC', color: '#F3BA2F', confirmations: 15, min: 10 },
  ];
  const net = networks.find(n => n.key === depNet);
  const addr = depositAddresses[depNet] || '...';
  const copyAddr = () => { navigator.clipboard.writeText(addr); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const simulateDeposit = async () => {
    const amt = Number(depAmt);
    if (!amt || amt <= 0) { setDepMsgOk(false); return setDepMsg(t('assets.enterAmountGt0')); }
    setDepBusy(true); setDepMsg('');
    try {
      const res = await fetch(`${API_URL}/api/real/deposit/simulate`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: amt, network: depNet }) });
      const data = await res.json();
      if (!res.ok) { setDepMsgOk(false); setDepMsg(data.error); } else { setDepAmt(''); setDepMsgOk(true); setDepMsg(t('assets.msgDeposited', { amt: amt.toFixed(2), net: net.label })); onDeposited(data.balance); }
    } catch { setDepMsgOk(false); setDepMsg(t('common.networkError')); }
    setDepBusy(false);
  };
  return (
    <div style={glassCard(theme, { marginBottom: '14px' })}>
      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: theme.text }}>{t('assets.depositUsdt')}</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {networks.map(n => (
          <button key={n.key} onClick={() => { setDepNet(n.key); setDepMsg(''); }} style={{ flex: 1, padding: '10px 4px', borderRadius: '12px', border: `1px solid ${depNet === n.key ? n.color : theme.cardBorder}`, backgroundColor: depNet === n.key ? `${n.color}12` : 'transparent', color: depNet === n.key ? theme.text : theme.subtext, fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
            {n.label}
          </button>
        ))}
      </div>
      <div style={{ backgroundColor: theme.inputBg, borderRadius: '14px', padding: '14px', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '8px' }}>{t('assets.depositNetInfo', { chain: net.chain, label: net.label, min: net.min, conf: net.confirmations })}</div>
        <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '6px' }}>{t('assets.depositAddress')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <code style={{ flex: 1, fontSize: '11px', color: theme.text, wordBreak: 'break-all', fontFamily: 'monospace', backgroundColor: theme.card, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}` }}>{addr}</code>
          <button onClick={copyAddr} style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', background: copied ? theme.upGradient : theme.primaryGradient, color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer', flexShrink: 0, boxShadow: copied ? '0 2px 8px rgba(16,185,129,0.3)' : '0 2px 8px rgba(59,130,246,0.25)' }}>
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
      </div>
      <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: theme.brandSoft, border: `1px solid ${theme.brand}30`, marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: theme.brand, fontWeight: '600', lineHeight: '1.5' }}>{t('assets.depositWarn', { chain: net.chain })}</span>
      </div>
      <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>{t('assets.quickDeposit')}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="number" min="0" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} placeholder={t('assets.amountPlaceholder')} style={{ flex: 1, padding: '13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
        <button onClick={simulateDeposit} disabled={depBusy} style={{ padding: '0 22px', borderRadius: '12px', border: 'none', background: theme.upGradient, color: 'white', fontWeight: '700', cursor: depBusy ? 'not-allowed' : 'pointer', opacity: depBusy ? 0.7 : 1, boxShadow: '0 4px 14px rgba(16,185,129,0.25)', fontSize: '14px' }}>{t('assets.depositBtn')}</button>
      </div>
      {depMsg && <p style={{ fontSize: '12px', color: depMsgOk ? theme.up : theme.down, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{depMsg}</p>}
      {rewardSummary.eligible && (
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>{t('assets.rewardEligible')}</span>
        </div>
      )}
      {rewardSummary.firstRewardClaimed && (
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.cardBorder}` }}>
          <span style={{ fontSize: '11px', color: theme.faint }}>{t('assets.rewardClaimed')}</span>
        </div>
      )}
    </div>
  );
}

function WithdrawPanel({ balance, withdrawalRequests, onWithdrawn }) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const [wdNet, setWdNet] = useState('trc20');
  const [wdAddr, setWdAddr] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [wdPin, setWdPin] = useState('');
  const [wdBusy, setWdBusy] = useState(false);
  const [wdMsg, setWdMsg] = useState('');
  const [wdMsgOk, setWdMsgOk] = useState(false);
  const wdAmt_ = Number(wdAmt || 0);
  const wdFee = wdAmt_ > 0 ? (wdAmt_ < 100 ? 5 : Math.round(wdAmt_ * 0.05 * 100) / 100) : 0;
  const wdFeeLabel = wdAmt_ > 0 && wdAmt_ < 100 ? t('assets.feeFlat') : t('assets.feePct');
  const wdNet_ = wdAmt_ - wdFee;
  const networks = [
    { key: 'trc20', label: 'TRC20', chain: 'TRON' },
    { key: 'erc20', label: 'ERC20', chain: 'Ethereum' },
    { key: 'bep20', label: 'BEP20', chain: 'BSC' },
  ];
  const submitWithdraw = async () => {
    const amt = Number(wdAmt);
    if (!amt || amt <= 0) { setWdMsgOk(false); return setWdMsg(t('assets.enterAmount')); }
    if (!wdAddr.trim()) { setWdMsgOk(false); return setWdMsg(t('assets.enterAddress')); }
    if (!wdPin) { setWdMsgOk(false); return setWdMsg(t('assets.enterFundPw')); }
    setWdBusy(true); setWdMsg('');
    try {
      const res = await fetch(`${API_URL}/api/real/withdraw`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ amount: amt, network: wdNet, walletAddress: wdAddr, fundPassword: wdPin }) });
      const data = await res.json();
      if (!res.ok) { setWdMsgOk(false); setWdMsg(data.error); } else { setWdAmt(''); setWdAddr(''); setWdPin(''); setWdMsgOk(true); setWdMsg(t('assets.msgWithdrawSubmitted', { amt: data.netPayout.toFixed(2) })); onWithdrawn(data.balance); }
    } catch { setWdMsgOk(false); setWdMsg(t('common.networkError')); }
    setWdBusy(false);
  };
  return (
    <div style={glassCard(theme, { marginBottom: '14px' })}>
      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: theme.text }}>{t('assets.withdrawUsdt')}</div>
      <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '14px' }}>{t('assets.available', { amt: fmt(balance) })}</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {networks.map(n => (
          <button key={n.key} onClick={() => setWdNet(n.key)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `1px solid ${wdNet === n.key ? theme.primary : theme.cardBorder}`, backgroundColor: wdNet === n.key ? theme.primarySoft : 'transparent', color: wdNet === n.key ? theme.primary : theme.subtext, fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
            {n.label}
          </button>
        ))}
      </div>
      <input value={wdAddr} onChange={e => setWdAddr(e.target.value)} placeholder={t('assets.walletAddressPlaceholder', { chain: networks.find(n=>n.key===wdNet).chain })} style={{ width: '100%', padding: '13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px', outline: 'none' }} />
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <input type="number" min="0" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder={t('assets.amountPlaceholder')} style={{ width: '100%', padding: isRTL ? '13px 14px 13px 55px' : '13px 55px 13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
        <button onClick={() => setWdAmt(String(balance || 0))} style={{ position: 'absolute', [isRTL ? 'left' : 'right']: '8px', top: '50%', transform: 'translateY(-50%)', padding: '5px 10px', borderRadius: '8px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: '700', fontSize: '11px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}>
          {t('common.max')}
        </button>
      </div>
      {Number(wdAmt) > 0 && (
        <div style={{ backgroundColor: theme.inputBg, borderRadius: '14px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: theme.subtext }}>{t('assets.amountLabel')}</span><span style={{ fontWeight: 'bold' }}>{fmt(Number(wdAmt))} USDT</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}><span style={{ color: theme.down }}>{wdFeeLabel}</span><span style={{ fontWeight: 'bold', color: theme.down }}>-{wdFee.toFixed(2)} USDT</span></div>
          <div style={{ borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: theme.subtext, fontWeight: '600' }}>{t('assets.youReceive')}</span><span style={{ fontWeight: 'bold', color: theme.up }}>{wdNet_ > 0 ? wdNet_.toFixed(2) : '0.00'} USDT</span></div>
        </div>
      )}
      <input type="password" value={wdPin} onChange={e => setWdPin(e.target.value)} placeholder={t('assets.fundPassword')} style={{ width: '100%', padding: '13px 14px', borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, color: theme.text, fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }} />
      <button onClick={submitWithdraw} disabled={wdBusy} style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: theme.downGradient, color: 'white', fontWeight: '700', fontSize: '14px', cursor: wdBusy ? 'not-allowed' : 'pointer', opacity: wdBusy ? 0.7 : 1, boxShadow: '0 4px 14px rgba(239,68,68,0.25)' }}>{t('assets.submitWithdrawal')}</button>
      {wdMsg && <p style={{ fontSize: '12px', color: wdMsgOk ? theme.up : theme.down, marginTop: '10px', marginBottom: 0, fontWeight: '600' }}>{wdMsg}</p>}
      {withdrawalRequests.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: theme.subtext, marginBottom: '8px' }}>{t('assets.recentRequests')}</div>
          {withdrawalRequests.slice(0, 5).map(wr => (
            <div key={wr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${theme.cardBorder}`, fontSize: '12px' }}>
              <div>
                <div style={{ fontWeight: '600', color: theme.text }}>{Number(wr.netPayout).toFixed(2)} USDT <span style={{ color: theme.faint, fontWeight: 'normal' }}>{t('assets.via', { net: wr.network.toUpperCase() })}</span></div>
                <div style={{ color: theme.faint, fontSize: '10px' }}>{new Date(wr.createdAt).toLocaleString()}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', backgroundColor: wr.status === 'completed' ? theme.upSoft : wr.status === 'rejected' ? theme.downSoft : theme.brandSoft, color: wr.status === 'completed' ? theme.up : wr.status === 'rejected' ? theme.down : theme.brand }}>
                {wr.status === 'completed' ? t('status.completed') : wr.status === 'rejected' ? t('status.rejected') : t('status.pending')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Assets = () => {
  const { theme, iconBadges } = useTheme();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [panel, setPanel] = useState(null);
  const [futuresWarningDismissed, setFuturesWarningDismissed] = useState(false);
  const [showAllSpot, setShowAllSpot] = useState(false);
  const [showAllSignal, setShowAllSignal] = useState(false);
  const [showAllFutures, setShowAllFutures] = useState(false);
  const [showAllSignalHistory, setShowAllSignalHistory] = useState(false);

  const [balance, setBalance] = useState(null);
  const [signalBalance, setSignalBalance] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [positions, setPositions] = useState([]);
  const [futures, setFutures] = useState([]);
  const [trades, setTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [volumeData, setVolumeData] = useState({ depositBase: 0, requiredVolume: 0, tradedVolume: 0, signalTradeCount: 0, firstDepositAt: null });
  const [depositAddresses, setDepositAddresses] = useState({});
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [rewardSummary, setRewardSummary] = useState({ totalDeposited: 0, firstRewardClaimed: false, eligible: false });

  const loadAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/real/account`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setSignalBalance(data.signalBalance);
        setHoldings(data.holdings || {});
        setPositions(data.positions || []);
        setFutures(data.futures || []);
        setTrades(data.trades || []);
        if (data.volumeData) setVolumeData(data.volumeData);
        if (data.depositAddresses) setDepositAddresses(data.depositAddresses);
        if (data.withdrawalRequests) setWithdrawalRequests(data.withdrawalRequests);
        if (data.ledger) setLedger(data.ledger);
        if (data.rewardSummary) setRewardSummary(data.rewardSummary);
      }
    } catch {
      // next poll retries
    }
  };

  useEffect(() => {
    const poll = setInterval(loadAccount, 5000);
    const initial = setTimeout(loadAccount, 0);
    return () => { clearInterval(poll); clearTimeout(initial); };
  }, []);
  const { pull: ptrPull, refreshing: ptrRefreshing } = usePullToRefresh(loadAccount);

  useEffect(() => {
    const ws = new WebSocket(buildWsStreamUrl());
    ws.onmessage = (event) => {
      let data; try { ({ data } = JSON.parse(event.data)); } catch { return; }
      if (!data || !data.s) return;
      setLivePrices((prev) => ({ ...prev, [data.s]: parseFloat(data.c) }));
    };
    return () => ws.close();
  }, []);

  const priceFor = (pair) => {
    const coin = COINS.find((c) => c.pair === pair);
    return coin ? livePrices[coin.symbol] : undefined;
  };

  const spotValue = useMemo(() => Object.entries(holdings).reduce((sum, [pair, qty]) => {
    const coin = COINS.find((c) => c.pair === pair);
    const price = coin ? livePrices[coin.symbol] : undefined;
    return sum + (price ? qty * price : 0);
  }, 0), [holdings, livePrices]);

  const openSignals = useMemo(() => positions.filter((p) => !p.settled), [positions]);
  const closedSignals = useMemo(() => positions.filter((p) => p.settled), [positions]);
  const openFutures = useMemo(() => futures.filter((p) => !p.closed), [futures]);
  const closedFutures = useMemo(() => futures.filter((p) => p.closed), [futures]);

  const signalsLocked = openSignals.reduce((s, p) => s + p.stake, 0);
  const futuresLocked = openFutures.reduce((s, p) => s + p.margin, 0);
  const totalValue = (balance || 0) + (signalBalance || 0) + spotValue + signalsLocked + futuresLocked;

  const activity = useMemo(() => {
    const items = [];
    trades.forEach((tx) => {
      if (tx.type === 'transfer') {
        const rewardLabel = tx.reward ? t('assets.actRewardSuffix', { amt: fmt(tx.reward) }) : '';
        const penaltyLabel = tx.penalty ? t('assets.actPenaltySuffix', { amt: fmt(tx.penalty) }) : '';
        items.push({
          id: tx.id, at: tx.at, category: 'transfer',
          label: (tx.direction === 'toSignal' ? t('assets.actTransferToSignal') : t('assets.actTransferToSpot')) + penaltyLabel + rewardLabel,
          amount: tx.penalty ? -tx.penalty : 0,
        });
        return;
      }
      items.push({
        id: tx.id, at: tx.at, category: 'spot',
        label: `${tx.side === 'buy' ? t('assets.actBought') : t('assets.actSold')} ${fmt(tx.quantity, 6)} ${tx.pair.split('/')[0]}`,
        amount: tx.side === 'buy' ? -tx.amount : tx.amount,
      });
    });
    closedSignals.forEach((p) => items.push({
      id: p.id, at: p.settledAt, category: 'signal',
      label: `${t('assets.actSignal')} ${p.pair} ${p.won ? t('status.win') : t('status.loss')}`,
      amount: p.profit,
    }));
    closedFutures.forEach((p) => items.push({
      id: p.id, at: p.closedAt, category: 'futures',
      label: `${t('assets.actFutures')} ${p.pair} ${p.direction.toUpperCase()} ${t('assets.actClosed')}`,
      amount: p.pnl,
    }));
    return items.sort((a, b) => b.at - a.at);
  }, [trades, closedSignals, closedFutures, lang]);

  const spotActivity = useMemo(
    () => activity.filter((a) => a.category === 'spot' || a.category === 'transfer'),
    [activity]
  );

  const signalActivity = useMemo(
    () => activity.filter((a) => a.category === 'signal' || a.category === 'transfer'),
    [activity]
  );

  const futuresActivity = useMemo(
    () => activity.filter((a) => a.category === 'futures'),
    [activity]
  );

  const transfer = async (direction, amount, confirmPenalty = false) => {
    try {
      const res = await fetch(`${API_URL}/api/real/transfer`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ direction, amount, confirmPenalty }) });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      if (data.warning) return { warning: true, penaltyAmount: data.penaltyAmount, receiveAmount: data.receiveAmount, volumeProgress: data.volumeProgress };
      setBalance(data.balance);
      setSignalBalance(data.signalBalance);
      loadAccount();
      return data.penaltyApplied ? { penaltyApplied: data.penaltyApplied } : data.reward ? { reward: data.reward } : null;
    } catch {
      return { error: t('common.networkError') };
    }
  };

  const QUICK_ACTIONS = [
    { key: 'deposit', label: 'dashboard.deposit', icon: ArrowDownToLine },
    { key: 'withdraw', label: 'dashboard.withdraw', icon: ArrowUpFromLine },
    { key: 'transfer', label: 'dashboard.transfer', icon: ArrowLeftRight },
    { key: 'transaction', label: 'assets.transaction', icon: Receipt },
  ];

  return (
    <div style={{ padding: '20px', paddingBottom: '90px', color: theme.text, backgroundColor: theme.bg, minHeight: '100vh' }}>
      <PullIndicator pull={ptrPull} refreshing={ptrRefreshing} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: theme.text }}>{t('assets.balance')}</h3>
        <Link to="/settings" style={{ color: theme.subtext, display: 'flex' }}><Settings size={20} /></Link>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {TABS.map((tabId) => (
          <button key={tabId} onClick={() => setTab(tabId)} style={{
            flexShrink: 0, padding: '9px 18px', borderRadius: '22px', cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            border: tab === tabId ? 'none' : `1px solid ${theme.cardBorder}`,
            background: tab === tabId ? theme.primaryGradient : theme.card,
            backdropFilter: tab !== tabId ? theme.cardGlass : 'none',
            color: tab === tabId ? '#fff' : theme.subtext,
            boxShadow: tab === tabId ? '0 4px 14px rgba(59,130,246,0.25)' : 'none',
            transition: 'all 0.2s',
          }}>
            {t(TAB_LABELS[tabId])}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          {balance === null ? (
            /* First load — balance is still null, so the total would read a misleading 0.00 USDT.
               Show a skeleton of the same shape instead. Subsequent 5s polls keep the last real
               value on screen, so this only ever appears once, on entry. */
            <div style={{ ...glassCard(theme, { padding: '22px', marginBottom: '20px', boxShadow: theme.shadowElevated }) }}>
              <Shimmer w="110px" h={13} r={6} mb={10} />
              <Shimmer w="180px" h={30} r={8} mb={22} />
              {[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} w="100%" h={14} r={6} mb={12} />)}
            </div>
          ) : (
          <div style={{ ...glassCard(theme, { padding: '22px', marginBottom: '20px', boxShadow: theme.shadowElevated }) }}>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 4px 0' }}>{t('assets.estTotalValue')}</p>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '30px', fontWeight: '700', color: theme.text }}>{fmt(totalValue)} <span style={{ fontSize: '14px', color: theme.subtext, fontWeight: '500' }}>USDT</span></h2>

            <BalanceBar label={t('assets.barSpotUsdt')} value={balance || 0} total={totalValue} color={theme.primary} theme={theme} />
            <BalanceBar label={t('assets.barSpotHoldings')} value={spotValue} total={totalValue} color={iconBadges.teal.fg} theme={theme} />
            <BalanceBar label={t('assets.barSignalBalance')} value={signalBalance || 0} total={totalValue} color={theme.brand} theme={theme} />
            <BalanceBar label={t('assets.barSignalInTrades')} value={signalsLocked} total={totalValue} color={iconBadges.amber.fg} theme={theme} />
            <BalanceBar label={t('assets.barFuturesMargin')} value={futuresLocked} total={totalValue} color={iconBadges.purple.fg} theme={theme} />
          </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px' }}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isActive = panel === action.key;
              const route = { deposit: '/deposit', withdraw: '/withdraw', transfer: '/transfer', transaction: '/transactions' }[action.key];
              return (
                <button key={action.key} onClick={() => route ? navigate(route) : setPanel(isActive ? null : action.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: isActive ? theme.brandGradient : theme.brandSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? '0 6px 20px rgba(217,119,6,0.45)' : '0 2px 8px rgba(217,119,6,0.15)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                    border: isActive ? 'none' : `1.5px solid rgba(217,119,6,0.2)`,
                  }}>
                    <Icon size={22} color={isActive ? '#1A1305' : theme.brand} />
                  </div>
                  <span style={{ fontSize: '11px', color: isActive ? theme.brand : theme.subtext, fontWeight: '700', transition: 'color 0.2s' }}>{t(action.label)}</span>
                </button>
              );
            })}
          </div>

          {panel === 'deposit' && (
            <DepositPanel
              depositAddresses={depositAddresses}
              rewardSummary={rewardSummary}
              onDeposited={(newBalance) => { setBalance(newBalance); loadAccount(); }}
            />
          )}
          {panel === 'withdraw' && (
            <WithdrawPanel
              balance={balance}
              withdrawalRequests={withdrawalRequests}
              onWithdrawn={(newBalance) => { setBalance(newBalance); loadAccount(); }}
            />
          )}
          {panel === 'transfer' && <TransferForm spotBalance={balance} signalBalance={signalBalance} volumeData={volumeData} onSubmit={transfer} onRefresh={loadAccount} />}

          {panel === null && activity.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.recentActivity')}</span>
                <button onClick={() => setPanel('transaction')} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Receipt size={13} /> {t('assets.viewAll')}
                </button>
              </div>
              {activity.slice(0, 3).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: `1px solid ${theme.cardBorder}` }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>{new Date(item.at).toLocaleString()}</div>
                  </div>
                  <span style={{ fontWeight: '700', color: item.amount >= 0 ? theme.up : theme.down }}>
                    {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                  </span>
                </div>
              ))}
            </>
          )}
          {panel === null && activity.length === 0 && (
            <p style={{ color: theme.faint, fontSize: '13px' }}>{t('assets.noActivity')}</p>
          )}

          {panel === 'transaction' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.allActivity')}</span>
                <button onClick={() => setPanel(null)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                  {t('common.close')}
                </button>
              </div>
              {activity.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderTop: `1px solid ${theme.cardBorder}` }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: theme.text }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: theme.faint }}>{new Date(item.at).toLocaleString()}</div>
                  </div>
                  <span style={{ fontWeight: '700', color: item.amount >= 0 ? theme.up : theme.down }}>
                    {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                  </span>
                </div>
              ))}
            </>
          )}

          {panel === 'transaction' && ledger.length > 0 && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>{t('assets.ledger')}</div>
              <div style={glassCard(theme, { padding: '4px 16px' })}>
                {ledger.slice(0, 20).map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}`, fontSize: '12px' }}>
                    <div>
                      <div style={{ color: theme.text, fontWeight: '600' }}>{entry.description}</div>
                      <div style={{ color: theme.faint, fontSize: '10px' }}>{entry.wallet.toUpperCase()} &middot; {new Date(entry.at).toLocaleString()}</div>
                    </div>
                    <span style={{ fontWeight: '700', color: entry.amount >= 0 ? theme.up : theme.down, flexShrink: 0 }}>
                      {entry.amount >= 0 ? '+' : ''}{fmt(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>{t('assets.assetsTitle')}</div>
            <div style={glassCard(theme, { padding: '4px 16px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{t('assets.usdtSpot')}</div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>{t('assets.frozenInFutures', { amt: fmt(futuresLocked) })}</div>
                </div>
                <span style={{ fontWeight: '700', color: theme.text }}>{fmt(balance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${theme.cardBorder}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{t('assets.signalBalance')}</span>
                    {volumeData.requiredVolume > 0 && (
                      <span style={{ fontSize: '9px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px', backgroundColor: volumeData.tradedVolume >= volumeData.requiredVolume ? theme.upSoft : theme.brandSoft, color: volumeData.tradedVolume >= volumeData.requiredVolume ? theme.up : theme.brand }}>
                        {volumeData.tradedVolume >= volumeData.requiredVolume ? t('assets.volDone') : t('assets.volPct', { pct: Math.round((volumeData.tradedVolume / volumeData.requiredVolume) * 100) })}
                      </span>
                    )}
                  </div>
                  <div style={{ color: theme.faint, fontSize: '11px' }}>{t('assets.inOpenTrades', { amt: fmt(signalsLocked) })}</div>
                </div>
                <span style={{ fontWeight: '700', color: theme.text }}>{fmt(signalBalance)}</span>
              </div>
              {Object.entries(holdings).map(([pair, qty]) => {
                const coin = COINS.find((c) => c.pair === pair);
                const price = priceFor(pair);
                return (
                  <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${theme.cardBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CoinIcon symbol={coin?.short || pair} size={28} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{coin?.short || pair}</div>
                        <div style={{ color: theme.faint, fontSize: '11px' }}>{fmt(qty, 6)} {coin?.short}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: '700', color: theme.text }}>{price ? `$${fmt(qty * price)}` : '...'}</span>
                  </div>
                );
              })}
              {Object.keys(holdings).length === 0 && <p style={{ color: theme.faint, fontSize: '13px', padding: '12px 0' }}>{t('assets.noCoinHoldings')}</p>}
            </div>
          </div>
        </>
      )}

      {tab === 'Spot' && (
        <>
          <div style={{ ...glassCard(theme, { padding: '20px', marginBottom: '16px', boxShadow: theme.shadowElevated }) }}>
            <p style={{ color: theme.subtext, fontSize: '13px', margin: '0 0 4px 0' }}>{t('assets.totalSpotValue')}</p>
            <h2 style={{ margin: '0 0 14px 0', fontSize: '26px', fontWeight: '700', color: theme.text }}>{fmt((balance || 0) + spotValue)} <span style={{ fontSize: '13px', color: theme.subtext, fontWeight: '500' }}>USDT</span></h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: theme.subtext }}>{t('assets.usdtBalance')}</span>
              <span style={{ fontWeight: '700', color: theme.text }}>{fmt(balance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
              <span style={{ color: theme.subtext }}>{t('assets.coinHoldings')}</span>
              <span style={{ fontWeight: '700', color: theme.text }}>{fmt(spotValue)}</span>
            </div>
          </div>
          <div style={glassCard(theme, { padding: '4px 16px' })}>
          {Object.entries(holdings).length === 0 && <p style={{ color: theme.faint, fontSize: '13px', padding: '16px 0' }}>{t('assets.noSpotHoldings')}</p>}
          {Object.entries(holdings).map(([pair, qty]) => {
            const coin = COINS.find((c) => c.pair === pair);
            const price = priceFor(pair);
            return (
              <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${theme.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CoinIcon symbol={coin?.short || pair} size={36} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: theme.text }}>{pair}</div>
                    <div style={{ color: theme.faint, fontSize: '11px' }}>{fmt(qty, 6)} {coin?.short}</div>
                  </div>
                </div>
                <span style={{ fontWeight: '700', color: theme.text }}>{price ? `$${fmt(qty * price)}` : '...'}</span>
              </div>
            );
          })}
          </div>

          {spotActivity.length > 0 && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.recentActivity')}</span>
                {spotActivity.length > 3 && (
                  <button onClick={() => setShowAllSpot(!showAllSpot)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={13} /> {showAllSpot ? t('assets.showLess') : t('assets.viewAll')}
                  </button>
                )}
              </div>
              <div style={glassCard(theme, { padding: '4px 16px' })}>
                {(showAllSpot ? spotActivity : spotActivity.slice(0, 3)).map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>{item.label}</div>
                      <div style={{ fontSize: '10px', color: theme.faint }}>{new Date(item.at).toLocaleString()}</div>
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: item.amount >= 0 ? theme.up : theme.down, flexShrink: 0 }}>
                      {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'Futures' && (
        <div>
          {!futuresWarningDismissed ? (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
              <div style={{ ...glassCard(theme, { maxWidth: '380px', width: '100%', boxShadow: theme.shadowElevated, padding: '28px' }) }}>
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #FDE68A, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
                    <AlertTriangle size={24} color="#92400E" />
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', color: theme.text, fontSize: '18px', fontWeight: '700' }}>{t('assets.riskNotice')}</h3>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px', fontSize: '13px', color: theme.subtext, lineHeight: '1.7' }}>
                  <p style={{ margin: '0 0 10px' }}>{t('assets.risk1')}</p>
                  <p style={{ margin: '0 0 10px' }}>{t('assets.risk2')}</p>
                  <p style={{ margin: '0 0 10px' }}>{t('assets.risk3')}</p>
                  <p style={{ margin: '0' }}>{t('assets.risk4')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setTab('Overview')} style={{ flex: 1, padding: '13px', borderRadius: '14px', border: 'none', background: theme.downGradient, color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>{t('common.cancel')}</button>
                  <button onClick={() => setFuturesWarningDismissed(true)} style={{ flex: 1, padding: '13px', borderRadius: '14px', border: 'none', background: theme.primaryGradient, color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(59,130,246,0.25)' }}>{t('assets.openAccount')}</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>{t('assets.open')}</div>
              {openFutures.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>{t('assets.noOpenFutures')}</p>}
              {openFutures.map((p) => (
                <div key={p.id} style={glassCard(theme, { padding: '16px', marginBottom: '10px' })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', color: theme.text }}>{p.pair} · {p.leverage}x</span>
                    <span style={{ color: p.direction === 'long' ? theme.up : theme.down, fontWeight: '700', padding: '2px 10px', borderRadius: '8px', backgroundColor: p.direction === 'long' ? theme.upSoft : theme.downSoft, fontSize: '12px' }}>{p.direction.toUpperCase()}</span>
                  </div>
                  <div style={{ color: theme.subtext, fontSize: '12px', marginTop: '6px' }}>{t('assets.marginEntry', { margin: fmt(p.margin), entry: fmt(p.entryPrice) })}</div>
                </div>
              ))}
              {closedFutures.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.history')}</span>
                    {closedFutures.length > 3 && (
                      <button onClick={() => setShowAllFutures(!showAllFutures)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Receipt size={13} /> {showAllFutures ? t('assets.showLess') : t('assets.viewAll')}
                      </button>
                    )}
                  </div>
                  {(showAllFutures ? closedFutures : closedFutures.slice(0, 3)).map((p) => (
                    <div key={p.id} style={glassCard(theme, { padding: '16px', marginBottom: '10px' })}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', color: theme.text }}>{p.pair} · {p.leverage}x {p.direction.toUpperCase()}</span>
                        <span style={{ color: p.pnl >= 0 ? theme.up : theme.down, fontWeight: '700' }}>{p.pnl >= 0 ? '+' : ''}{fmt(p.pnl)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'Signals' && (
        <div>
          <div style={{ ...glassCard(theme, { padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) }}>
            <span style={{ color: theme.subtext, fontSize: '13px', fontWeight: '600' }}>{t('assets.signalBalance')}</span>
            <span style={{ fontWeight: '700', color: theme.brand, fontSize: '16px' }}>{fmt(signalBalance)} USDT</span>
          </div>

          {signalBalance < 200 && (
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: theme.brandSoft, border: `1px solid ${theme.brand}30`, marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: theme.brand, fontWeight: '600' }}>{t('assets.minSignalBalance')}</span>
            </div>
          )}

          <div style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext, marginBottom: '10px' }}>{t('assets.open')}</div>
          {openSignals.length === 0 && <p style={{ color: theme.faint, fontSize: '13px' }}>{t('assets.noOpenSignals')}</p>}
          {openSignals.map((p) => (
            <div key={p.id} style={glassCard(theme, { padding: '16px', marginBottom: '10px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', color: theme.text }}>{p.pair}</span>
                <span style={{ color: p.direction === 'up' ? theme.up : theme.down, fontWeight: '700', padding: '2px 10px', borderRadius: '8px', backgroundColor: p.direction === 'up' ? theme.upSoft : theme.downSoft, fontSize: '12px' }}>{p.direction.toUpperCase()}</span>
              </div>
              <div style={{ color: theme.subtext, fontSize: '12px', marginTop: '6px' }}>{t('assets.stake', { stake: fmt(p.stake) })}</div>
            </div>
          ))}

          {closedSignals.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 0 10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.history')}</span>
                {closedSignals.length > 3 && (
                  <button onClick={() => setShowAllSignalHistory(!showAllSignalHistory)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={13} /> {showAllSignalHistory ? t('assets.showLess') : t('assets.viewAll')}
                  </button>
                )}
              </div>
              {(showAllSignalHistory ? closedSignals : closedSignals.slice(0, 3)).map((p) => (
                <div key={p.id} style={glassCard(theme, { padding: '16px', marginBottom: '10px' })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700', color: theme.text }}>{p.pair}</span>
                    <span style={{ color: p.won ? theme.up : theme.down, fontWeight: '700' }}>{p.profit >= 0 ? '+' : ''}{fmt(p.profit)}</span>
                  </div>
                </div>
              ))}
            </>
          )}

          {signalActivity.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '22px 0 10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: theme.subtext }}>{t('assets.recentActivity')}</span>
                {signalActivity.length > 3 && (
                  <button onClick={() => setShowAllSignal(!showAllSignal)} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={13} /> {showAllSignal ? t('assets.showLess') : t('assets.viewAll')}
                  </button>
                )}
              </div>
              <div style={glassCard(theme, { padding: '4px 16px' })}>
                {(showAllSignal ? signalActivity : signalActivity.slice(0, 3)).map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${theme.cardBorder}` }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>{item.label}</div>
                      <div style={{ fontSize: '10px', color: theme.faint }}>{new Date(item.at).toLocaleString()}</div>
                    </div>
                    {item.category !== 'transfer' && (
                      <span style={{ fontWeight: '700', fontSize: '13px', color: item.amount >= 0 ? theme.up : theme.down, flexShrink: 0 }}>
                        {item.amount >= 0 ? '+' : ''}{fmt(item.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Assets;
