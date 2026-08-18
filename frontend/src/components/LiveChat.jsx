import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, ChevronDown, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const DRAG_KEY = 'kynex_chat_btn_pos';
const IDLE_MS = 4000;

// ── Topics ────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'deposit',   emoji: '📥', label: 'Deposit Issue',       msg: 'Hi, I need help with a deposit.' },
  { id: 'withdraw',  emoji: '📤', label: 'Withdrawal Issue',    msg: 'Hi, I need help with a withdrawal.' },
  { id: 'transfer',  emoji: '💰', label: 'Transfer Balance',    msg: 'Hi, I need help with a balance transfer.' },
  { id: 'signal',    emoji: '📡', label: 'Signal Help',         msg: 'Hi, I need help with signals.' },
  { id: 'kyc',       emoji: '🪪', label: 'KYC Verification',    msg: 'Hi, I need help with KYC verification.' },
  { id: 'trading',   emoji: '📊', label: 'Trading / Markets',   msg: 'Hi, I have a trading question.' },
  { id: 'referral',  emoji: '🎁', label: 'Referral / Invite',   msg: 'Hi, I have a referral question.' },
  { id: 'security',  emoji: '🔐', label: 'Security / Password', msg: 'Hi, I need security help.' },
  { id: 'level',     emoji: '🏅', label: 'Membership Level',    msg: 'Hi, I have a question about broker levels.' },
  { id: 'account',   emoji: '👤', label: 'Account Issue',       msg: 'Hi, I have an account issue.' },
  { id: 'other',     emoji: '❓', label: 'Other / General',     msg: 'Hi, I need general support.' },
  { id: 'guide',    emoji: '📖', label: 'Member Guide',         msg: null, navigate: '/legal/member-guide' },
  { id: 'certs',   emoji: '🏛️', label: 'Certificates',          msg: null, navigate: '/certificates' },
];

// ── Rich guides ────────────────────────────────────────────────────────────
const GUIDES = {
  deposit: {
    title: '📥 How to Deposit USDT — Full Guide',
    steps: [
      'Open KYNEX → tap Assets tab → tap Deposit at the top',
      'Choose your network: TRC20 (lowest fees & fastest), ERC20, or BEP20',
      'Copy your unique KYNEX wallet address shown on screen',
      'Open your exchange (Binance, OKX, Bybit, etc.) or wallet',
      'Start a withdrawal: paste the KYNEX address, enter amount, confirm',
      'After sending — copy the Transaction ID (TxID / TxHash) from your exchange history',
      'Return to KYNEX → Assets → Deposit tab',
      'Paste the TxID in the "Transaction ID" field',
      'Enter the exact USDT amount you sent',
      'Tap Submit → deposit auto-confirms in 30–120 seconds',
      'If not auto-approved → admin manually verifies within 1–48 hours',
      'If still pending after 48h → tap "Talk to Agent" and share your TxID',
    ],
    extra: {
      title: '🔍 Where to find your TxID',
      items: [
        'Binance: Wallet → Withdrawal History → tap transaction → copy TxID',
        'OKX: Assets → Withdrawal History → tap entry → copy TxHash',
        'TRC20 TxIDs start with a long string like: 3a8f…',
        'ERC20 TxIDs start with: 0x…',
      ],
    },
    note: '✨ Min deposit $200 USDT. First deposit: you get 4% bonus in Signal Wallet. Your referrer gets 6% bonus.',
  },
  withdraw: {
    title: '📤 How to Withdraw USDT — Full Guide',
    steps: [
      'Complete KYC first (Profile → Verification) — required for withdrawals',
      'Set your Fund Password (Profile → Security → Fund Password) — 4-6 digit PIN',
      'Open Assets tab → tap Withdraw',
      'Enter withdrawal amount (minimum $10 USDT)',
      'Fee: $5 flat for amounts under $100 · 5% fee for $100 and above',
      'Enter your external wallet address (TRC20/ERC20/BEP20 — match network)',
      'Enter your Fund Password to authorize the withdrawal',
      'Tap Submit — request goes to Pending status',
      'Admin reviews and processes within 1–48 hours',
      'You receive USDT in your external wallet — check blockchain explorer if delayed',
    ],
    extra: {
      title: '⚠️ Common withdrawal mistakes',
      items: [
        'Wrong network: sending TRC20 to an ERC20 address = lost funds',
        'Wrong address: always double-check first and last 4 characters',
        'Fund Password not set: set it first in Security settings',
        'KYC not verified: all withdrawals blocked until KYC is certified',
      ],
    },
    note: '⚠️ Withdrawals are locked 2 hours after password change. Min withdrawal $10 USDT.',
  },
  transfer: {
    title: '💰 How to Transfer Balance',
    steps: [
      'Open the Transfer page from the Assets tab or menu',
      'Direction: Spot → Signal Wallet (to fund trading) OR Signal → Spot (to access profits)',
      'Enter the amount to transfer — no minimum',
      'Read the warning panel carefully before confirming',
      'Tap Confirm — transfer is instant',
    ],
    extra: {
      title: '⚠️ Signal → Spot penalty rule',
      items: [
        'Signal volume completes in ~23 days (3 signals/day × 23 days)',
        'Transferring back BEFORE volume completes = 20% penalty deducted',
        'After volume completes: transfer with NO penalty',
        'Spot → Signal transfer: always free, no restrictions',
      ],
    },
    note: '💡 Keep funds in Signal Wallet to participate in daily AI signals and earn 0.662% profit per signal.',
  },
  signal: {
    title: '📡 How to Follow AI Signals — Step by Step',
    steps: [
      'Ensure your Signal Wallet has at least $200 USDT (minimum required)',
      'Open the Signal tab from the bottom navigation',
      'Check the time — signals are published at fixed times (see timetable below)',
      'Read the admin signal card in the center — e.g. "BTC UP" or "ETH DOWN"',
      'Select the matching coin (e.g. BTC) and direction (UP or DOWN)',
      'Your stake is automatically 1% of your Signal Wallet balance',
      'Tap Submit — signal is now active and waiting for result',
      'When signal completes: profit of 0.662% of your total balance is added',
      'If you miss a signal: wait for the next scheduled time',
      'Complete all 3 daily signals for ~23 days to finish volume requirements',
    ],
    timing: [
      { flag: '🇵🇰', country: 'Pakistan',     t1: '3:00 PM', t2: '5:00 PM', t3: '7:00 PM' },
      { flag: '🇮🇳', country: 'India',        t1: '3:30 PM', t2: '5:30 PM', t3: '7:30 PM' },
      { flag: '🇦🇪', country: 'Dubai (UAE)',  t1: '2:00 PM', t2: '4:00 PM', t3: '6:00 PM' },
      { flag: '🇬🇧', country: 'UK',           t1: '11:00 AM', t2: '1:00 PM', t3: '3:00 PM' },
      { flag: '🇳🇬', country: 'Nigeria',      t1: '11:00 AM', t2: '1:00 PM', t3: '3:00 PM' },
      { flag: '🇬🇭', country: 'Ghana',        t1: '10:00 AM', t2: '12:00 PM', t3: '2:00 PM' },
      { flag: '🇰🇪', country: 'Kenya',        t1: '1:00 PM',  t2: '3:00 PM', t3: '5:00 PM' },
      { flag: '🇿🇦', country: 'South Africa', t1: '12:00 PM', t2: '2:00 PM', t3: '4:00 PM' },
      { flag: '🇺🇸', country: 'USA (NY)',     t1: '6:00 AM',  t2: '8:00 AM', t3: '10:00 AM' },
      { flag: '🇨🇳', country: 'China',        t1: '6:00 PM',  t2: '8:00 PM', t3: '10:00 PM' },
    ],
    note: '⚠️ Min $200 in Signal Wallet. Each signal stakes exactly 1% of your Signal Wallet. Never skip a signal — it resets volume progress.',
  },
  kyc: {
    title: '🪪 KYC Verification — Full Guide',
    steps: [
      'Go to Profile → tap Verification',
      'Select your country from the dropdown',
      'Enter your full legal name (must match ID exactly)',
      'Enter your date of birth',
      'Choose document type: Passport, National ID, or Driver\'s License',
      'Take a clear photo of the FRONT of your ID — all 4 corners must be visible',
      'Take a clear photo of the BACK of your ID (if applicable)',
      'Take a selfie while holding your ID next to your face — face must be clear',
      'All text on the ID must be readable in photos',
      'Tap Submit — status changes to "Pending"',
      'Admin reviews within 24–48 hours — you\'ll see "Certified" or "Rejected"',
      'If rejected: re-upload clearer photos or use a different document type',
    ],
    extra: {
      title: '✅ Photo requirements',
      items: [
        'Good lighting — no glare or shadows on the document',
        'No blurry images — hold still when taking the photo',
        'No cropped edges — full document must be visible',
        'Selfie: hold ID at face level, both face and ID clearly visible',
      ],
    },
    note: '✅ KYC is required before any withdrawal. Certified status also increases your withdrawal limits.',
  },
  trading: {
    title: '📊 How to Trade on KYNEX',
    steps: [
      'Open the Markets tab to see all live prices and charts',
      'Tap any coin to open its detailed view',
      'On the Trade page: analyze the chart to decide direction',
      'Select UP (if you think price will rise) or DOWN (if it will fall)',
      'Set your stake amount and time period',
      'Review trade details and tap Confirm',
      'Monitor your active trades in Portfolio',
      'Profit or loss is settled when the time period ends',
    ],
    extra: {
      title: '📌 Trading vs Signals',
      items: [
        'Manual Trading: you pick direction, no guarantee of profit',
        'AI Signals: admin-issued signals with KYNEX backing — much lower risk',
        'Recommendation: use Signal tab for consistent daily profits',
        'Markets tab: real-time Binance prices with sparkline charts',
      ],
    },
    note: '💡 For new users, the Signal tab is the safest way to earn. Manual trading involves risk.',
  },
  referral: {
    title: '🎁 Referral System — Full Guide',
    steps: [
      'Open the Invite tab from the bottom navigation',
      'Copy your unique referral link',
      'Share with friends via WhatsApp, Telegram, Instagram, etc.',
      'Friend must register using your referral link',
      'When your invitee makes their FIRST deposit: you get 6% instantly',
      'Your 6% referral bonus goes to your Spot Wallet',
      'Transfer to Signal Wallet to participate in Reward Signals',
      'Reward Signals: 100% profit (no platform fee deducted from your share)',
      'The more you invite, the more Reward Signals you unlock',
    ],
    timing: [
      { flag: '💵', country: 'Invitee deposits $200',   t1: 'You get', t2: '$12',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $500',   t1: 'You get', t2: '$30',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $1,000', t1: 'You get', t2: '$60',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $2,000', t1: 'You get', t2: '$120', t3: 'bonus' },
    ],
    note: '💡 Referral bonus is credited instantly when your invitee transfers their deposit to Signal Wallet.',
  },
  security: {
    title: '🔐 Security & Password Guide',
    steps: [
      '— LOGIN PASSWORD —',
      'Profile → Security → Login Password → Change',
      'Request OTP code sent to your email address',
      'Enter: email OTP + current password + new password',
      'Confirm — you will be logged out automatically',
      '— FUND PASSWORD —',
      'Profile → Security → Fund Password → Set (first time) or Change',
      'Set a 4-6 digit PIN used before every withdrawal',
      '— GOOGLE 2FA —',
      'Install "Google Authenticator" app on your phone',
      'Profile → Security → Google Verification → Request Email Code',
      'Scan the QR code with Google Authenticator',
      'Enter: email OTP + authenticator code + login password',
    ],
    extra: {
      title: '🛡️ Security rules',
      items: [
        'After any password change: withdrawals locked for 2 hours',
        'Never share your Fund Password or OTP codes with anyone',
        'KYNEX support will NEVER ask for your password',
        'Lost Fund Password: contact support with KYC documents',
      ],
    },
    note: '⚠️ Always enable 2FA for maximum account security. It protects even if your password is stolen.',
  },
  level: {
    title: '🏅 Broker Level System',
    steps: [
      'KYNEX has 10 broker levels — each level unlocks bonus + bi-monthly salary',
      'LV1:  5 referrals, no team deposit req → $50 bonus + $18/mo salary',
      'LV2:  8 referrals, $200 team → $100 bonus + $38/mo salary',
      'LV3:  10 referrals, $300 team → $200 bonus + $75/mo salary',
      'LV4:  15 referrals, $450 team → $350 bonus + $125/mo salary',
      'LV5:  20 referrals, $600 team → $500 bonus + $200/mo salary',
      'LV6:  25 referrals, $1,000 team → $800 bonus + $300/mo salary',
      'LV7:  30 referrals, $2,500 team → $1,200 bonus + $500/mo salary',
      'LV8:  45 referrals, $5,000 team → $2,000 bonus + $750/mo salary',
      'LV9:  60 referrals, $7,500 team → $2,800 bonus + $1,000/mo salary',
      'LV10: 75 referrals, $10,000 team → $3,500 bonus + $1,200/mo salary',
    ],
    extra: {
      title: '📌 Level rules',
      items: [
        'Qualified Team Member = KYC verified + min $200 total balance',
        'Salaries paid on the 1st and 15th of every month',
        'Once you reach a level, you keep it — levels never decrease',
        'Bonus credited when you first hit the level requirements',
      ],
    },
    note: '💡 Start inviting today! Even LV1 (5 referrals) gives you $50 bonus + $18 monthly income.',
  },
  account: {
    title: '👤 Account Help Guide',
    steps: [
      'Login issue: go to /auth page → tap "Forgot Password" to reset',
      'OTP not received: check spam/junk folder, wait 2 minutes and retry',
      'Email change: Profile → Security → requires 2FA + current password',
      'Balance discrepancy: check Transaction History page for all movements',
      'Wrong balance: pull-to-refresh or re-login to sync',
      'Account blocked/locked: contact support with your registered email',
      'Multiple accounts: strictly prohibited — all accounts permanently banned',
      'Profile name change: Profile → tap your name to edit',
    ],
    extra: {
      title: '🔒 Account security tips',
      items: [
        'Use a strong password: mix letters, numbers, symbols',
        'Enable Google 2FA for extra protection',
        'Never share your login credentials with anyone',
        'Log out from public/shared devices after use',
      ],
    },
    note: '⚠️ Creating multiple accounts leads to permanent ban of ALL accounts and forfeiture of all balances.',
  },
  other: {
    title: '❓ General Support',
    steps: [
      'Please describe your issue in detail in the message box below',
      'Include any transaction ID, screenshot, amount, and date/time',
      'Mention your registered email if relevant',
      'Our support team will review and respond as soon as possible',
    ],
    extra: {
      title: '⏱️ Support hours',
      items: [
        'Live agents: typically reply within 1 hour during business hours',
        'Off-hours: messages answered within 12-24 hours',
        'For urgent deposit/withdrawal issues: always include your TxID',
      ],
    },
    note: '📌 Please be as specific as possible so we can resolve your issue faster.',
  },
};

// ── BotFace SVG ────────────────────────────────────────────────────────────
const BotFace = ({ size = 28, blink = false }) => (
  <svg viewBox="0 0 28 28" width={size} height={size} fill="none">
    <circle cx="10" cy="11" r="2.2" fill="white"
      style={blink ? { transformOrigin: '10px 11px', animation: 'eyeBlink 3.5s ease-in-out infinite' } : {}} />
    <circle cx="18" cy="11" r="2.2" fill="white"
      style={blink ? { transformOrigin: '18px 11px', animation: 'eyeBlink 3.5s ease-in-out infinite 0.2s' } : {}} />
    <path d="M8 17.5 Q14 22.5 20 17.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

// ── Bot guide card ─────────────────────────────────────────────────────────
function BotGuide({ guide, theme, time }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
        <BotFace size={18} />
      </div>
      <div style={{ maxWidth: '92%', background: theme.inputBg, borderRadius: '4px 16px 16px 16px', padding: '12px 14px', fontSize: '12.5px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', animation: 'chatSlideIn 0.22s ease-out', flex: 1 }}>
        <div style={{ fontWeight: '800', color: theme.text, marginBottom: '10px', fontSize: '13.5px' }}>{guide.title}</div>

        {/* Steps */}
        {guide.steps.map((step, i) => {
          // Detect section headers (lines starting with —)
          if (step.startsWith('—')) {
            return (
              <div key={i} style={{ fontSize: '10px', fontWeight: '800', color: theme.brand || '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: i === 0 ? 0 : '10px', marginBottom: '4px' }}>
                {step.replace(/—/g, '').trim()}
              </div>
            );
          }
          return (
            <div key={i} style={{ display: 'flex', gap: '7px', marginBottom: '6px', alignItems: 'flex-start' }}>
              <div style={{ width: '17px', height: '17px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8.5px', fontWeight: '800', color: 'white', marginTop: '1px' }}>{i + 1}</div>
              <div style={{ color: theme.subtext, lineHeight: '1.55' }}>{step}</div>
            </div>
          );
        })}

        {/* Extra info box */}
        {guide.extra && (
          <div style={{ marginTop: '10px', padding: '8px 10px', background: theme.primarySoft, borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.primary, marginBottom: '6px' }}>{guide.extra.title}</div>
            {guide.extra.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                <span style={{ color: theme.brand || '#F59E0B', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '11px', color: theme.subtext, lineHeight: '1.5' }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timing table (signals / referral) */}
        {guide.timing && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text, marginBottom: '5px' }}>
              {guide.id === 'referral' ? '💰 Referral Rewards' : '⏰ Signal Times (Local)'}
            </div>
            {guide.timing.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '3px 0', borderBottom: i < guide.timing.length - 1 ? `1px solid ${theme.cardBorder}` : 'none' }}>
                <span style={{ color: theme.text, fontWeight: '600' }}>{row.flag} {row.country}</span>
                <span style={{ color: theme.brand || '#F59E0B', fontWeight: '700' }}>{row.t1} · {row.t2} · {row.t3}</span>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        {guide.note && (
          <div style={{ marginTop: '10px', padding: '8px 10px', background: theme.brandSoft || theme.primarySoft, borderRadius: '8px', fontSize: '11.5px', color: theme.primary, lineHeight: '1.55' }}>
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

// ── Main component ─────────────────────────────────────────────────────────
const LiveChat = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
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
  const [sessionResolved, setSessionResolved] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const typingPollRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const idleTimerRef = useRef(null);
  const hasDraggedRef = useRef(false);

  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(DRAG_KEY)); } catch { return null; } })();
  const [btnPos, setBtnPos] = useState(savedPos || { bottom: 88, right: 16 });
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

  const markRead = useCallback(async () => {
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
    if (open) { setUnread(0); markRead(); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
  }, [open, markRead]);

  // Auto-switch from topics to chat after 5s if previous messages exist
  useEffect(() => {
    if (!open || topicSent || messages.length === 0) return;
    const t = setTimeout(() => setTopicSent(true), 5000);
    return () => clearTimeout(t);
  }, [open, topicSent, messages.length]);

  // Reset session state when opening fresh
  const startNewSession = useCallback(() => {
    setTopicSent(false);
    setLocalMsgs([]);
    setSessionResolved(false);
    setShowExitConfirm(false);
    setBotTyping(false);
  }, []);

  // Handle topic selection
  const selectTopic = async (topic) => {
    if (topic.navigate) {
      setOpen(false);
      navigate(topic.navigate);
      return;
    }
    setTopicSent(true);
    setSessionResolved(false);
    setShowExitConfirm(false);
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

        // Show bot typing → guide → resolve prompt
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          const guide = GUIDES[topic.id];
          if (guide) {
            setLocalMsgs(prev => [...prev, { id: 'guide-' + Date.now(), type: 'bot-guide', guide, at: Date.now() }]);
          }
          // Resolve prompt after guide
          setTimeout(() => {
            setLocalMsgs(prev => [...prev, { id: 'rp-' + Date.now(), type: 'resolve-prompt', at: Date.now() + 1 }]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
          }, 1800);
        }, 1500);
      }
    } catch { /* network */ }
    setSending(false);
  };

  const resolveIssue = useCallback((promptId, resolved) => {
    setLocalMsgs(prev => prev.filter(m => m.id !== promptId));
    if (resolved) {
      setSessionResolved(true);
    } else {
      setLocalMsgs(prev => [...prev, { id: 'unsolved-' + Date.now(), type: 'unsolved-options', at: Date.now() }]);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  const talkToAgent = useCallback(() => {
    setLocalMsgs(prev => [
      ...prev.filter(m => m.type !== 'unsolved-options'),
      { id: 'notice-' + Date.now(), type: 'notice', at: Date.now() },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setTopicSent(true); setSending(true); setInput('');
    setSessionResolved(false);
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
  const handleInputChange = (e) => { setInput(e.target.value); notifyTyping(); };
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Drag logic
  const onDown = (e, isTouch) => {
    if (open) return;
    resetIdle(); hasDraggedRef.current = false; dragging.current = true; setPressing(true);
    const cx = isTouch ? e.touches[0].clientX : e.clientX;
    const cy = isTouch ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: cx - (window.innerWidth - btnPos.right - 56), y: cy - (window.innerHeight - btnPos.bottom - 56) };
    if (!isTouch) e.preventDefault();
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

  const chatBottom = btnPos.bottom + 64;
  const chatRight = Math.max(8, Math.min(btnPos.right, window.innerWidth - 360));
  const isOnRight = btnPos.right < window.innerWidth / 2;
  const peekTranslate = isIdle && !open ? `translateX(${isOnRight ? '28px' : '-28px'})` : 'translateX(0)';
  const btnShadow = pressing
    ? '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 6px 0 rgba(0,0,0,0.22), 0 10px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28)';

  const showWelcome = !topicSent && messages.length === 0;
  const allMsgs = [...messages, ...localMsgs].sort((a, b) => a.at - b.at);

  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: `${chatBottom}px`, right: `${chatRight}px`, zIndex: 1000,
          width: 'min(352px, calc(100vw - 24px))',
          height: showWelcome ? 'auto' : sessionResolved ? 'auto' : '530px',
          maxHeight: 'calc(100vh - 130px)',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backdropFilter: theme.cardGlass || 'blur(18px)',
          WebkitBackdropFilter: theme.cardGlass || 'blur(18px)',
          animation: 'chatSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: '12px 14px', background: 'linear-gradient(135deg,#3B82F6 0%,#F59E0B 100%)',
            display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0,
          }}>
            {topicSent && !sessionResolved && (
              <button onClick={() => setShowExitConfirm(true)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '5px', borderRadius: '8px', flexShrink: 0 }}>
                <ArrowLeft size={15} />
              </button>
            )}
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BotFace blink />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>KYNEX Support</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', animation: 'chatOnlinePulse 2s ease-in-out infinite' }} />
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px' }}>Online · Fast replies</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
              <ChevronDown size={18} />
            </button>
          </div>

          {/* ── Exit confirm inline banner ── */}
          {showExitConfirm && (
            <div style={{ padding: '10px 14px', background: theme.primarySoft, borderBottom: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: '12px', color: theme.text, fontWeight: '600' }}>End this support session?</div>
              <button onClick={startNewSession} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: theme.primary, color: 'white', fontSize: '12px', fontWeight: '700' }}>Yes, end</button>
              <button onClick={() => setShowExitConfirm(false)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, cursor: 'pointer', background: 'transparent', color: theme.subtext, fontSize: '12px' }}>Cancel</button>
            </div>
          )}

          {/* ── SESSION RESOLVED VIEW ── */}
          {sessionResolved ? (
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 24px rgba(16,185,129,0.35)', fontSize: '28px' }}>✓</div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: theme.text, marginBottom: '8px' }}>Issue Resolved!</div>
              <div style={{ fontSize: '13px', color: theme.subtext, marginBottom: '24px', lineHeight: '1.6' }}>
                Great! We're glad we could help you today. This support session has ended.
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button onClick={startNewSession} style={{
                  flex: 1, padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', color: 'white',
                  fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                  <RefreshCw size={14} /> New Topic
                </button>
                <button onClick={() => setOpen(false)} style={{
                  flex: 1, padding: '12px', borderRadius: '14px', border: `1.5px solid ${theme.cardBorder}`,
                  cursor: 'pointer', background: 'transparent', color: theme.subtext,
                  fontWeight: '700', fontSize: '13px',
                }}>
                  Close Chat
                </button>
              </div>
            </div>

          ) : showWelcome ? (
            /* ── WELCOME / TOPICS MENU ── */
            <div style={{ overflowY: 'auto', padding: '14px 14px 4px' }}>
              {/* Team card */}
              <div style={{ background: theme.primarySoft, border: `1px solid ${theme.cardBorder}`, borderRadius: '14px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex' }}>
                  {['K', 'Y', 'N'].map((l, i) => (
                    <div key={l} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white', marginLeft: i === 0 ? 0 : '-8px', border: `2px solid ${theme.card}`, flexShrink: 0 }}>{l}</div>
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

              {/* Greeting */}
              <div style={{ display: 'flex', gap: '9px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BotFace size={20} blink />
                </div>
                <div style={{ background: theme.inputBg, borderRadius: '4px 16px 16px 16px', padding: '10px 12px', fontSize: '13px', lineHeight: '1.6', color: theme.text, flex: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight: '800', display: 'block', marginBottom: '2px' }}>👋 Hi! Welcome to KYNEX Support</span>
                  Select a topic to get instant help — or type your question below.
                </div>
              </div>

              {/* Topics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {TOPICS.map(t => (
                  <button key={t.id} onClick={() => selectTopic(t)} disabled={sending}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', border: `1.5px solid ${theme.cardBorder}`, backgroundColor: theme.inputBg, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.14s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span style={{ width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0, background: theme.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{t.emoji}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: theme.text }}>{t.label}</span>
                    <ChevronRight size={14} color={theme.faint} />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
                <span style={{ fontSize: '11px', color: theme.faint }}>or type below</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: theme.cardBorder }} />
              </div>
            </div>

          ) : (
            /* ── MESSAGE HISTORY ── */
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg || theme.card }}>
              {/* Broadcast banner */}
              {(() => {
                const bc = messages.filter(m => m.type === 'broadcast' || m.from === 'broadcast');
                const last = bc[bc.length - 1];
                return last ? (
                  <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(59,130,246,0.10))', borderBottom: `1px solid ${theme.cardBorder}`, padding: '9px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0, position: 'sticky', top: 0, zIndex: 2 }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>📢</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: theme.brand || '#F59E0B', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Broadcast</div>
                      <div style={{ fontSize: '12px', color: theme.text, lineHeight: '1.5' }}>{last.text}</div>
                    </div>
                  </div>
                ) : null;
              })()}

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {allMsgs.map((msg) => {
                  if (msg.type === 'notice') return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: theme.primarySoft, color: theme.primary, padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', animation: 'chatSlideIn 0.2s ease-out' }}>
                        ✓ An agent will contact you shortly
                      </div>
                    </div>
                  );
                  if (msg.type === 'bot-guide') return (
                    <BotGuide key={msg.id} guide={msg.guide} theme={theme} time={msg.at} />
                  );
                  if (msg.type === 'resolve-prompt') return (
                    <div key={msg.id} style={{ animation: 'chatSlideIn 0.22s ease-out' }}>
                      <div style={{ background: theme.inputBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: theme.text, marginBottom: '10px' }}>Was your issue resolved? 🤔</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => resolveIssue(msg.id, true)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: theme.upSoft, color: theme.up, fontWeight: '700', fontSize: '13px' }}>
                            👍 Yes, Resolved
                          </button>
                          <button onClick={() => resolveIssue(msg.id, false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: theme.downSoft, color: theme.down, fontWeight: '700', fontSize: '13px' }}>
                            👎 Not Solved
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  if (msg.type === 'unsolved-options') return (
                    <div key={msg.id} style={{ animation: 'chatSlideIn 0.22s ease-out' }}>
                      <div style={{ background: theme.inputBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', color: theme.subtext, marginBottom: '10px', fontWeight: '600' }}>
                          Still having trouble? Here's what you can do:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                          <button onClick={talkToAgent} style={{ padding: '10px 14px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💬</span> Talk to a Live Agent
                          </button>
                          <button onClick={startNewSession} style={{ padding: '10px 14px', borderRadius: '11px', border: `1.5px solid ${theme.cardBorder}`, cursor: 'pointer', background: theme.primarySoft, color: theme.primary, fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📋</span> Browse Other Topics
                          </button>
                          <button onClick={() => setOpen(false)} style={{ padding: '10px 14px', borderRadius: '11px', border: `1.5px solid ${theme.cardBorder}`, cursor: 'pointer', background: 'transparent', color: theme.subtext, fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✕</span> Exit Chat
                          </button>
                        </div>
                      </div>
                    </div>
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
                        <div style={{ fontSize: '10px', marginTop: '4px', color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : theme.faint, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                          {fmtTime(msg.at)}
                          {msg.from === 'user' && <span style={{ fontSize: '11px', color: msg.read ? '#60A5FA' : 'rgba(255,255,255,0.6)' }}>{msg.read ? '✓✓' : '✓'}</span>}
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

                {/* Admin typing */}
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
              </div>
            </div>
          )}

          {/* ── Input (hidden in resolved/welcome-only states) ── */}
          {!sessionResolved && (
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
          )}
        </div>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: `${btnPos.bottom}px`, right: `${btnPos.right}px`,
        zIndex: 999, width: '58px', height: '58px', borderRadius: '50%',
        transform: peekTranslate,
        transition: dragging.current ? 'none' : 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1)',
        animation: !open && !isIdle && !pressing ? 'chatRing 2.8s ease-out infinite' : 'none',
      }}>
        <div
          onMouseDown={(e) => onDown(e, false)}
          onTouchStart={(e) => onDown(e, true)}
          onClick={() => { if (!hasDraggedRef.current) { setOpen(o => !o); resetIdle(); } }}
          style={{
            position: 'relative', width: '58px', height: '58px', borderRadius: '50%',
            background: open ? 'linear-gradient(145deg,#3B82F6,#6366F1)' : 'linear-gradient(145deg,#F59E0B 0%,#3B82F6 100%)',
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
        @keyframes chatSlideIn { from { opacity:0; transform:translateY(14px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes chatRing { 0% { box-shadow:0 0 0 0 rgba(245,158,11,0.65); } 60% { box-shadow:0 0 0 20px rgba(245,158,11,0); } 100% { box-shadow:0 0 0 0 rgba(245,158,11,0); } }
        @keyframes chatBounce { 0%,60%,100% { transform:translateY(0); opacity:0.5; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes chatOnlinePulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes eyeBlink { 0%,88%,100% { transform:scaleY(1); } 92% { transform:scaleY(0.06); } }
      `}</style>
    </>
  );
};

export default LiveChat;
