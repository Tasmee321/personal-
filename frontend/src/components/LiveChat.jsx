import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const DRAG_KEY = 'kynex_chat_btn_pos';
const IDLE_MS = 4000;

// ── Topic list ──────────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'deposit',   emoji: '📥', label: 'Deposit Issue',        msg: 'Hi, I need help with a deposit.' },
  { id: 'withdraw',  emoji: '📤', label: 'Withdrawal Issue',     msg: 'Hi, I need help with a withdrawal.' },
  { id: 'transfer',  emoji: '💰', label: 'Transfer Balance',     msg: 'Hi, I need help with a balance transfer.' },
  { id: 'signal',    emoji: '📡', label: 'Signal Help',          msg: 'Hi, I need help with signals.' },
  { id: 'kyc',       emoji: '🪪', label: 'KYC Verification',     msg: 'Hi, I need help with KYC verification.' },
  { id: 'trading',   emoji: '📊', label: 'Trading / Markets',    msg: 'Hi, I have a trading question.' },
  { id: 'referral',  emoji: '🎁', label: 'Referral / Invite',    msg: 'Hi, I have a referral question.' },
  { id: 'security',  emoji: '🔐', label: 'Security / Password',  msg: 'Hi, I need security help.' },
  { id: 'level',     emoji: '🏅', label: 'Membership Level',     msg: 'Hi, I have a question about broker levels.' },
  { id: 'account',   emoji: '👤', label: 'Account Issue',        msg: 'Hi, I have an account issue.' },
  { id: 'other',     emoji: '❓', label: 'Other Issue',           msg: 'Hi, I need general support.' },
];

// ── Auto guide content per topic ────────────────────────────────────────────
const GUIDES = {
  deposit: {
    title: '📥 How to Deposit USDT',
    steps: [
      'Go to Assets tab → tap Deposit at the top',
      'Choose network: TRC20 (cheapest fees), ERC20, or BEP20',
      'Copy your unique wallet address shown on screen',
      'Send USDT from your wallet/exchange to this address',
      'Wait 15–60 minutes — balance updates automatically after confirmation',
    ],
    note: '✨ Min deposit $200 USDT. First deposit: you get 4% bonus in Signal Wallet + referrer gets 6% bonus.',
  },
  withdraw: {
    title: '📤 How to Withdraw',
    steps: [
      'Go to Assets tab → tap Withdraw',
      'Enter amount (minimum $10 USDT)',
      'Fee: $5 flat for amounts under $100 · 5% for $100 and above',
      'Paste your wallet address (TRC20/ERC20/BEP20)',
      'Enter your Fund Password (set in Security settings)',
      'Submit — admin processes within 1–48 hours',
    ],
    note: '⚠️ KYC verification and Fund Password are required before your first withdrawal.',
  },
  transfer: {
    title: '💰 How to Transfer Balance',
    steps: [
      'Open Transfer from the main menu or Assets page',
      'Choose direction: Spot → Signal Wallet or Signal → Spot',
      'Enter the amount to transfer',
      'Read the warning carefully before confirming',
      'Tap Confirm to complete the transfer',
    ],
    note: '⚠️ Transferring Signal → Spot BEFORE completing ~23 days of signals incurs a 20% penalty on the transferred amount.',
  },
  signal: {
    title: '📡 How to Follow AI Signals',
    steps: [
      'Open the Signal tab from the bottom navigation bar',
      'Check the admin signal card in the center — e.g. "BTC UP"',
      'Select the matching coin (e.g. BTC) and direction (UP or DOWN)',
      'Stake is automatically 1% of your Signal Wallet',
      'Tap Submit and wait for the signal time to complete',
      'Successful signal = 0.662% net profit on your total balance',
    ],
    timing: [
      { flag: '🇵🇰', country: 'Pakistan',     t1: '3:00 PM', t2: '5:00 PM', t3: '7:00 PM' },
      { flag: '🇮🇳', country: 'India',        t1: '3:30 PM', t2: '5:30 PM', t3: '7:30 PM' },
      { flag: '🇦🇪', country: 'Dubai (UAE)',  t1: '2:00 PM', t2: '4:00 PM', t3: '6:00 PM' },
      { flag: '🇬🇧', country: 'UK',           t1: '11:00 AM', t2: '1:00 PM', t3: '3:00 PM' },
      { flag: '🇳🇬', country: 'Nigeria',      t1: '11:00 AM', t2: '1:00 PM', t3: '3:00 PM' },
      { flag: '🇬🇭', country: 'Ghana',        t1: '10:00 AM', t2: '12:00 PM', t3: '2:00 PM' },
      { flag: '🇰🇪', country: 'Kenya',        t1: '1:00 PM', t2: '3:00 PM', t3: '5:00 PM' },
      { flag: '🇿🇦', country: 'South Africa', t1: '12:00 PM', t2: '2:00 PM', t3: '4:00 PM' },
      { flag: '🇺🇸', country: 'USA (NY)',     t1: '6:00 AM', t2: '8:00 AM', t3: '10:00 AM' },
      { flag: '🇨🇳', country: 'China',        t1: '6:00 PM', t2: '8:00 PM', t3: '10:00 PM' },
    ],
    note: '⚠️ Min $200 in Signal Wallet to participate. Execute all 3 daily signals for volume completion in ~23 days.',
  },
  kyc: {
    title: '🪪 KYC Verification Steps',
    steps: [
      'Go to Profile → tap Verification',
      'Select your country, enter full name and date of birth',
      'Choose document type: Passport, National ID, or Driver\'s License',
      'Upload clear front + back photos of your ID document',
      'Upload a selfie holding your ID document',
      'Submit — admin reviews within 24–48 hours',
    ],
    note: '✅ Certified users unlock full withdrawal access. KYC is required before any withdrawal.',
  },
  trading: {
    title: '📊 How to Trade on KYNEX',
    steps: [
      'Open the Markets tab to see all live coin prices',
      'Tap any coin to view its chart and trading view',
      'On the Trade page, select your direction: UP or DOWN',
      'Set your stake amount and time',
      'Confirm your trade — results show in portfolio',
    ],
    note: '📌 For guaranteed AI-powered profit, use the Signal tab instead of manual trading. KYNEX fully backs all official signals.',
  },
  referral: {
    title: '🎁 Referral & Invite Rewards',
    steps: [
      'Open the Invite page from the bottom navigation',
      'Copy your unique referral link and share with friends',
      'When your invitee makes their first deposit: you earn 6% bonus',
      'You also unlock Reward Signals based on their deposit amount',
      'Reward Signals give you FULL 1% profit — zero platform fee',
    ],
    timing: [
      { flag: '💵', country: 'Invitee deposits $200', t1: '6%=', t2: '$12', t3: '1 Reward Signal' },
      { flag: '💵', country: 'Invitee deposits $500', t1: '6%=', t2: '$30', t3: '3 Reward Signals' },
      { flag: '💵', country: 'Invitee deposits $1,000', t1: '6%=', t2: '$60', t3: '5 Reward Signals' },
    ],
    note: '💡 Referral bonus is credited to your Spot Wallet instantly when your invitee transfers to Signal Wallet.',
  },
  security: {
    title: '🔐 Security & Password Help',
    steps: [
      'Go to Profile → Security page',
      'Change Login Password: enter current password → set new password',
      'Set Fund Password: 4–6 digit PIN required for withdrawals',
      'Enable 2FA: install Google Authenticator → scan QR code in app',
      '2FA needs: login password + email OTP + authenticator code',
    ],
    note: '⚠️ After any password reset, withdrawals are locked for 2 hours. Never share your Fund Password or OTP codes.',
  },
  level: {
    title: '🏅 Broker Level System',
    steps: [
      'KYNEX has 10 Broker Levels — each unlocks salary + bonuses',
      'LV1: 5 direct referrals → $50 bonus + $18 bi-monthly salary',
      'LV3: 10 referrals + $100 team deposit → $200 bonus + $75 salary',
      'LV5: 20 referrals + $600 team → $500 bonus + $200 salary',
      'LV10: 75 referrals + $10,000 team → $3,500 bonus + $1,200 salary',
      'Salaries paid on the 1st and 15th of every month',
    ],
    note: '📌 Qualified Team Member = KYC verified + min $200 USDT total balance. See Member Guide for full table.',
  },
  account: {
    title: '👤 Account Help',
    steps: [
      'Login issue: go to Login page → use "Forgot Password"',
      'Email OTP not received: check spam/junk folder',
      'Balance discrepancy: check the Transaction History page',
      'Wrong balance showing: pull to refresh or re-login',
      'Account blocked: message us here with your email to investigate',
    ],
    note: '⚠️ Creating multiple accounts is strictly prohibited and results in permanent ban of all accounts.',
  },
  other: {
    title: '❓ General Support',
    steps: [
      'Please describe your issue in detail in the message box below',
      'Include any transaction ID, screenshot, or date/time if relevant',
      'Our team will review and respond as soon as possible',
    ],
    note: '📌 Typical response time: within 1 hour during business hours. We\'re here to help!',
  },
};

// ── Bot face SVG with optional blinking eyes ─────────────────────────────
const BotFace = ({ size = 28, blink = false }) => (
  <svg viewBox="0 0 28 28" width={size} height={size} fill="none">
    <circle cx="10" cy="11" r="2.2" fill="white"
      style={blink ? { transformOrigin: '10px 11px', animation: 'eyeBlink 3.5s ease-in-out infinite' } : {}} />
    <circle cx="18" cy="11" r="2.2" fill="white"
      style={blink ? { transformOrigin: '18px 11px', animation: 'eyeBlink 3.5s ease-in-out infinite 0.2s' } : {}} />
    <path d="M8 17.5 Q14 22.5 20 17.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

// ── Bot guide message renderer ────────────────────────────────────────────
function BotGuide({ guide, theme, time }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, #3B82F6, #F59E0B)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px',
      }}>
        <BotFace size={18} />
      </div>
      <div style={{
        maxWidth: '90%', background: theme.inputBg,
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 14px', fontSize: '13px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
        animation: 'chatSlideIn 0.22s ease-out',
      }}>
        {/* Title */}
        <div style={{ fontWeight: '800', color: theme.text, marginBottom: '10px', fontSize: '14px' }}>{guide.title}</div>

        {/* Steps */}
        {guide.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px', alignItems: 'flex-start' }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, #3B82F6, #6366F1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: '800', color: 'white', marginTop: '1px',
            }}>{i + 1}</div>
            <div style={{ color: theme.subtext, lineHeight: '1.55', fontSize: '12px' }}>{step}</div>
          </div>
        ))}

        {/* Signal timing table */}
        {guide.timing && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>
              {guide.id === 'referral' ? '💰 Referral Reward Table' : '⏰ Signal Times (Local Time)'}
            </div>
            {guide.timing.map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '11px', paddingBottom: '4px',
                borderBottom: i < guide.timing.length - 1 ? `1px solid ${theme.cardBorder}` : 'none',
                marginBottom: '4px',
              }}>
                <span style={{ color: theme.text, fontWeight: '600' }}>{row.flag} {row.country}</span>
                <span style={{ color: theme.brand || '#F59E0B', fontWeight: '700', textAlign: 'right' }}>
                  {row.t1} · {row.t2} · {row.t3}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Highlight note */}
        {guide.note && (
          <div style={{
            marginTop: '10px', padding: '8px 10px',
            background: theme.primarySoft,
            borderRadius: '8px', fontSize: '12px',
            color: theme.primary, lineHeight: '1.55',
          }}>
            {guide.note}
          </div>
        )}

        <div style={{ fontSize: '10px', color: theme.faint, textAlign: 'right', marginTop: '8px' }}>
          {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
const LiveChat = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [localMsgs, setLocalMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [topicSent, setTopicSent] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const typingPollRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const idleTimerRef = useRef(null);
  const hasDraggedRef = useRef(false);

  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(DRAG_KEY)); } catch { return null; } })();
  const [btnPos, setBtnPos] = useState(savedPos || { bottom: 88, right: 16 });
  const dragRef = useRef(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
  }, []);

  useEffect(() => {
    if (open) { setIsIdle(false); clearTimeout(idleTimerRef.current); }
    else resetIdle();
    return () => clearTimeout(idleTimerRef.current);
  }, [open, resetIdle]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/livechat/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
        if (!open) setUnread((data.messages || []).filter(m => m.from === 'admin' && !m.read).length);
        if ((data.messages || []).length > 0) setTopicSent(true);
      }
    } catch { /* network */ }
  }, [open]);

  const markMessagesRead = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/livechat/history?markRead=1`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) { setMessages(data.messages || []); setUnread(0); }
    } catch { /* network */ }
  }, []);

  const fetchTyping = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/livechat/typing-status`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAdminTyping(data.adminTyping || false);
    } catch { /* network */ }
  }, []);

  const notifyTyping = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    try {
      await fetch(`${API_URL}/api/livechat/typing`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch { /* network */ }
  }, []);

  useEffect(() => {
    fetchHistory();
    pollRef.current = setInterval(fetchHistory, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchHistory]);

  useEffect(() => {
    if (open) typingPollRef.current = setInterval(fetchTyping, 2000);
    else { clearInterval(typingPollRef.current); setAdminTyping(false); }
    return () => clearInterval(typingPollRef.current);
  }, [open, fetchTyping]);

  useEffect(() => {
    if (open) {
      setUnread(0); markMessagesRead();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, markMessagesRead]);

  // Topic selection — auto-send message + show bot guide + notice
  const selectTopic = async (topic) => {
    setTopicSent(true);
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/livechat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text: topic.msg }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);

        // Show bot typing indicator, then guide
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          const guide = GUIDES[topic.id];
          if (guide) {
            setLocalMsgs(prev => [...prev, { id: 'guide-' + Date.now(), type: 'bot-guide', guide, at: Date.now() }]);
          }
          setTimeout(() => {
            setLocalMsgs(prev => [...prev, { id: 'notice-' + Date.now(), type: 'notice', at: Date.now() }]);
            // resolve prompt after 2s
            setTimeout(() => {
              setLocalMsgs(prev => [...prev, { id: 'rp-' + Date.now(), type: 'resolve-prompt', at: Date.now() + 1 }]);
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
            }, 2000);
          }, 500);
        }, 1400);
      }
    } catch { /* network */ }
    setSending(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setTopicSent(true); setSending(true); setInput('');
    try {
      const res = await fetch(`${API_URL}/api/livechat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } catch { /* network */ }
    setSending(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const handleInputChange = (e) => { setInput(e.target.value); notifyTyping(); clearTimeout(typingTimerRef.current); };
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Drag
  const onMouseDown = (e) => {
    if (open) return;
    resetIdle(); hasDraggedRef.current = false; dragging.current = true; setPressing(true);
    dragOffset.current = { x: e.clientX - (window.innerWidth - btnPos.right - 56), y: e.clientY - (window.innerHeight - btnPos.bottom - 56) };
    e.preventDefault();
  };
  const onTouchStart = (e) => {
    if (open) return;
    resetIdle(); hasDraggedRef.current = false; dragging.current = true; setPressing(true);
    const t = e.touches[0];
    dragOffset.current = { x: t.clientX - (window.innerWidth - btnPos.right - 56), y: t.clientY - (window.innerHeight - btnPos.bottom - 56) };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      hasDraggedRef.current = true; setPressing(false);
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setBtnPos({
        right: Math.max(8, Math.min(window.innerWidth - 64, window.innerWidth - (cx - dragOffset.current.x) - 56)),
        bottom: Math.max(8, Math.min(window.innerHeight - 64, window.innerHeight - (cy - dragOffset.current.y) - 56)),
      });
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false; setPressing(false);
      setBtnPos(pos => { localStorage.setItem(DRAG_KEY, JSON.stringify(pos)); return pos; });
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS);
    };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true }); window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
  }, []);

  // Auto-switch from topics to chat after 5s if previous messages exist
  useEffect(() => {
    if (!open || topicSent || messages.length === 0) return;
    const t = setTimeout(() => setTopicSent(true), 5000);
    return () => clearTimeout(t);
  }, [open, topicSent, messages.length]);

  const resolveIssue = (promptId, resolved) => {
    setLocalMsgs(prev => prev.filter(m => m.id !== promptId));
    const newMsg = resolved
      ? { id: 'res-' + Date.now(), type: 'resolved-confirm', at: Date.now() }
      : { id: 'notice-' + Date.now(), type: 'notice', at: Date.now() };
    setLocalMsgs(prev => [...prev, newMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const chatBottom = btnPos.bottom + 64;
  const chatRight = btnPos.right;
  const isOnRight = btnPos.right < window.innerWidth / 2;
  const peekTranslate = isIdle && !open ? `translateX(${isOnRight ? '28px' : '-28px'})` : 'translateX(0)';
  const btnShadow = pressing
    ? '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 6px 0 rgba(0,0,0,0.22), 0 10px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28)';
  const showWelcome = !topicSent && messages.length === 0;
  const allMsgs = [...messages, ...localMsgs].sort((a, b) => a.at - b.at);

  return (
    <>
      {/* ── Chat Window ── */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: `${chatBottom}px`,
          right: `${Math.max(8, Math.min(chatRight, window.innerWidth - 360))}px`,
          zIndex: 1000,
          width: 'min(348px, calc(100vw - 24px))',
          height: showWelcome ? 'auto' : '520px',
          maxHeight: 'calc(100vh - 130px)',
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '22px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: theme.cardGlass || 'blur(18px)',
          WebkitBackdropFilter: theme.cardGlass || 'blur(18px)',
          animation: 'chatSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 14px',
            background: `linear-gradient(135deg, #3B82F6 0%, #F59E0B 100%)`,
            display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
          }}>
            {topicSent && (
              <button onClick={() => { setTopicSent(false); setMessages([]); setLocalMsgs([]); setBotTyping(false); }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '5px', borderRadius: '8px', flexShrink: 0 }}>
                <ArrowLeft size={15} />
              </button>
            )}
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BotFace blink />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', letterSpacing: '0.1px' }}>KYNEX Support</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', animation: 'chatOnlinePulse 2s ease-in-out infinite' }} />
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px' }}>Online · Replies in minutes</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
              <ChevronDown size={18} />
            </button>
          </div>

          {/* ── Welcome Menu ── */}
          {showWelcome ? (
            <div style={{ overflowY: 'auto', padding: '16px 14px 4px' }}>
              {/* Team card */}
              <div style={{
                background: `linear-gradient(135deg, ${theme.primarySoft}, ${theme.brandSoft || theme.primarySoft})`,
                border: `1px solid ${theme.cardBorder}`, borderRadius: '14px',
                padding: '12px 14px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ display: 'flex' }}>
                  {['K', 'Y', 'N'].map((l, i) => (
                    <div key={l} style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: `linear-gradient(135deg, #3B82F6, #F59E0B)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: '800', color: 'white',
                      marginLeft: i === 0 ? 0 : '-8px', border: `2px solid ${theme.card}`, flexShrink: 0,
                    }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: theme.text }}>KYNEX Support Team</div>
                  <div style={{ fontSize: '11px', color: theme.up, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: theme.up }} />
                    Available · Replies in minutes
                  </div>
                </div>
              </div>

              {/* Greeting bubble */}
              <div style={{ display: 'flex', gap: '9px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BotFace size={20} blink />
                </div>
                <div style={{ background: theme.inputBg, borderRadius: '4px 16px 16px 16px', padding: '11px 13px', fontSize: '13px', lineHeight: '1.6', color: theme.text, flex: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight: '800', display: 'block', marginBottom: '2px' }}>👋 Hi! Welcome to KYNEX Support</span>
                  What's your issue today? Select a topic below or type your message directly.
                </div>
              </div>

              {/* Topic buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                {TOPICS.map(t => (
                  <button key={t.id} onClick={() => selectTopic(t)} disabled={sending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 12px', borderRadius: '12px',
                      border: `1.5px solid ${theme.cardBorder}`,
                      backgroundColor: theme.inputBg, cursor: 'pointer',
                      textAlign: 'left', width: '100%', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: theme.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{t.emoji}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: theme.text }}>{t.label}</span>
                    <ChevronRight size={14} color={theme.faint} />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
                <span style={{ fontSize: '11px', color: theme.faint }}>or type below</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
              </div>
            </div>
          ) : (
            /* ── Message History ── */
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg || theme.card }}>
              {/* Broadcast banner pinned at top */}
              {(() => {
                const bc = messages.filter(m => m.type === 'broadcast' || m.from === 'broadcast');
                const last = bc[bc.length - 1];
                return last ? (
                  <div style={{ background: `linear-gradient(135deg, rgba(245,158,11,0.12), rgba(59,130,246,0.10))`, borderBottom: `1px solid ${theme.cardBorder}`, padding: '9px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0, position: 'sticky', top: 0, zIndex: 2 }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>📢</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: theme.brand || '#F59E0B', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Broadcast</div>
                      <div style={{ fontSize: '12px', color: theme.text, lineHeight: '1.5' }}>{last.text}</div>
                    </div>
                  </div>
                ) : null;
              })()}
              <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {allMsgs.map((msg) => {
                if (msg.type === 'notice') return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: theme.primarySoft, color: theme.primary, padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', animation: 'chatSlideIn 0.2s ease-out' }}>
                      ✓ An agent will contact you shortly
                    </div>
                  </div>
                );
                if (msg.type === 'resolve-prompt') return (
                  <div key={msg.id} style={{ padding: '4px 0', animation: 'chatSlideIn 0.22s ease-out' }}>
                    <div style={{ background: theme.inputBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: theme.text, marginBottom: '10px' }}>Was your issue resolved?</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => resolveIssue(msg.id, true)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: theme.upSoft, color: theme.up, fontWeight: '700', fontSize: '13px' }}>
                          👍 Resolved
                        </button>
                        <button onClick={() => resolveIssue(msg.id, false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: theme.downSoft, color: theme.down, fontWeight: '700', fontSize: '13px' }}>
                          👎 Not Solved
                        </button>
                      </div>
                    </div>
                  </div>
                );
                if (msg.type === 'resolved-confirm') return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', animation: 'chatSlideIn 0.2s ease-out' }}>
                    <div style={{ background: theme.upSoft, borderRadius: '20px', padding: '8px 18px', color: theme.up, fontSize: '12px', fontWeight: '700' }}>
                      🎉 Great! Glad we could help.
                    </div>
                  </div>
                );
                if (msg.type === 'bot-guide') return (
                  <BotGuide key={msg.id} guide={msg.guide} theme={theme} time={msg.at} />
                );
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.from === 'admin' && (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '7px', marginTop: '2px' }}>
                        <BotFace size={18} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '75%', padding: '9px 13px',
                      borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      backgroundColor: msg.from === 'user' ? theme.primary : (theme.inputBg || '#F3F4F6'),
                      color: msg.from === 'user' ? 'white' : theme.text,
                      fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                      animation: 'chatSlideIn 0.18s ease-out',
                    }}>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: '10px', marginTop: '4px', color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : theme.faint, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        {fmtTime(msg.at)}
                        {msg.from === 'user' && <span style={{ fontSize: '11px', color: msg.read ? '#60A5FA' : 'rgba(255,255,255,0.6)', marginLeft: '2px' }}>{msg.read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot typing indicator */}
              {botTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BotFace size={18} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '4px 18px 18px 18px', backgroundColor: theme.inputBg, display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.faint, animation: 'chatBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin typing indicator */}
              {adminTyping && !botTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BotFace size={18} />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '4px 18px 18px 18px', backgroundColor: theme.inputBg, display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.faint, animation: 'chatBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
              </div>{/* inner padding div */}
            </div>{/* outer scroll div */}
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.cardBorder}`, display: 'flex', gap: '8px', alignItems: 'flex-end', backgroundColor: theme.card, flexShrink: 0 }}>
            <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey}
              placeholder="Type a message..." rows={1}
              style={{ flex: 1, resize: 'none', padding: '10px 12px', borderRadius: '14px', border: `1.5px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg || theme.bg, color: theme.text, fontSize: '13px', outline: 'none', fontFamily: 'inherit', maxHeight: '80px', overflowY: 'auto', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = theme.cardBorder}
            />
            <button onClick={send} disabled={!input.trim() || sending} style={{
              width: '42px', height: '42px', borderRadius: '14px', border: 'none',
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              background: input.trim() && !sending ? 'linear-gradient(135deg,#3B82F6,#F59E0B)' : theme.cardBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
              boxShadow: input.trim() && !sending ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
            }}>
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <div style={{
        position: 'fixed', bottom: `${btnPos.bottom}px`, right: `${btnPos.right}px`,
        zIndex: 999, width: '58px', height: '58px', borderRadius: '50%',
        transform: peekTranslate,
        transition: dragging.current ? 'none' : 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1)',
        animation: !open && !isIdle && !pressing ? 'chatRing 2.8s ease-out infinite' : 'none',
      }}>
        <div ref={dragRef} onMouseDown={onMouseDown} onTouchStart={onTouchStart}
          onClick={() => { if (!hasDraggedRef.current) { setOpen(o => !o); resetIdle(); } }}
          style={{
            position: 'relative', width: '58px', height: '58px', borderRadius: '50%',
            background: open
              ? 'linear-gradient(145deg,#3B82F6,#6366F1)'
              : 'linear-gradient(145deg,#F59E0B 0%,#3B82F6 100%)',
            border: 'none', cursor: dragging.current ? 'grabbing' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: btnShadow,
            transform: pressing ? 'translateY(4px) scale(0.93)' : 'scale(1)',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            userSelect: 'none', touchAction: 'none',
          }}
        >
          {open ? <X size={22} color="white" /> : <BotFace blink={!pressing} />}
          {!open && unread > 0 && (
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', minWidth: '20px', height: '20px', borderRadius: '10px', backgroundColor: '#EF4444', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: '800', padding: '0 4px', boxSizing: 'border-box' }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes chatSlideIn {
          0%   { opacity: 0; transform: translateY(14px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatRing {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.65); }
          60%  { box-shadow: 0 0 0 20px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatOnlinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes eyeBlink {
          0%, 88%, 100% { transform: scaleY(1); }
          92% { transform: scaleY(0.06); }
        }
      `}</style>
    </>
  );
};

export default LiveChat;
