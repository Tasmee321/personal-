import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, ChevronDown, ChevronRight, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const DRAG_KEY = 'kynex_chat_btn_pos';
const IDLE_MS = 4000;

// ── Keyword → topic detection ──────────────────────────────────────────────
const TOPIC_KEYWORDS = {
  deposit:  ['deposit', 'txid', 'txhash', 'transaction id', 'not received', 'add fund', 'deposited', 'jama', 'send usdt'],
  withdraw: ['withdraw', 'withdrawal', 'cash out', 'payout', 'nikalna', 'fund password', 'get money', 'nikaln'],
  signal:   ['signal', 'ai signal', '0.66', '1%', 'profit', 'daily signal', 'follow signal', 'trade signal'],
  kyc:      ['kyc', 'verify', 'verification', 'document', 'passport', 'identity', 'id card', 'certified', 'pending kyc'],
  transfer: ['transfer', 'move balance', 'spot to signal', 'signal to spot', '20%', 'penalty', 'tabdeel'],
  security: ['password', 'security', '2fa', 'otp', 'locked', 'forgot password', 'login issue', 'cant login'],
  referral: ['refer', 'invite', 'referral', 'bonus', 'reward signal', '6%', 'commission', 'invite friend'],
  level:    ['level', 'broker', 'salary', 'lv1', 'lv2', 'lv3', 'team', 'downline', 'qualification'],
  account:  ['account', 'email', 'blocked', 'suspended', 'balance wrong', 'register', 'sign up', 'login'],
  trading:  ['trade', 'market', 'chart', 'buy', 'sell', 'btc', 'eth', 'coin', 'price'],
};
function detectTopic(text) {
  const lower = text.toLowerCase();
  for (const [id, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return TOPICS.find(t => t.id === id) || null;
    }
  }
  return null;
}

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
  { id: 'guide',     emoji: '📖', label: 'Member Guide',        msg: null, navigate: '/legal/member-guide' },
  { id: 'certs',     emoji: '🏛️', label: 'Certificates',        msg: null, navigate: '/certificates' },
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
      'If still pending after 48h → tap "Talk to Agent" below and share your TxID',
    ],
    extra: {
      title: '🔍 Where to find your TxID',
      items: [
        'Binance: Wallet → Withdrawal History → tap transaction → copy TxID',
        'OKX: Assets → Withdrawal History → tap entry → copy TxHash',
        'TRC20 TxIDs are long alphanumeric strings',
        'ERC20 TxIDs start with 0x…',
      ],
    },
    note: '✨ Min deposit $200 USDT. First deposit: 4% bonus in Signal Wallet. Your referrer gets 6% bonus.',
  },
  withdraw: {
    title: '📤 How to Withdraw USDT — Full Guide',
    steps: [
      'Complete KYC first (Profile → Verification) — required for all withdrawals',
      'Set your Fund Password (Profile → Security → Fund Password) — 4-6 digit PIN',
      'Open Assets tab → tap Withdraw',
      'Enter withdrawal amount (minimum $10 USDT)',
      'Fee: $5 flat for amounts under $100 · 5% fee for $100 and above',
      'Enter your external wallet address (TRC20/ERC20/BEP20 — match network)',
      'Enter your Fund Password to authorize',
      'Tap Submit — request goes to Pending status',
      'Admin reviews and processes within 1–48 hours',
      'You receive USDT in your external wallet',
    ],
    extra: {
      title: '⚠️ Common mistakes',
      items: [
        'Wrong network: sending TRC20 to an ERC20 address = lost funds',
        'Wrong address: always verify first and last 4 characters',
        'Fund Password not set: set it first in Security settings',
        'KYC not verified: all withdrawals blocked until certified',
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
    note: '💡 Keep funds in Signal Wallet to participate in daily AI signals and earn 0.66% profit per signal.',
  },
  signal: {
    title: '📡 How to Follow AI Signals — Step by Step',
    steps: [
      'Ensure your Signal Wallet has at least $200 USDT (minimum required)',
      'Open the Signal tab from the bottom navigation',
      'Check the time — signals are published at fixed times (see timetable below)',
      'Read the admin signal card — e.g. "BTC UP" or "ETH DOWN"',
      'Select the matching coin (e.g. BTC) and direction (UP or DOWN)',
      'Your stake is automatically 1% of your Signal Wallet balance',
      'Tap Submit — signal is now active and waiting for result',
      'When signal completes: 0.66% profit credited to your total balance',
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
    note: '⚠️ Min $200 in Signal Wallet. Each signal stakes exactly 1% of your Signal Wallet.',
  },
  kyc: {
    title: '🪪 KYC Verification — Full Guide',
    steps: [
      'Go to Profile → tap Verification',
      'Select your country from the dropdown',
      'Enter your full legal name (must match ID exactly)',
      'Enter your date of birth',
      'Choose document type: Passport, National ID, or Driver\'s License',
      'Take a clear photo of the FRONT of your ID — all 4 corners visible',
      'Take a clear photo of the BACK of your ID (if applicable)',
      'Take a selfie while holding your ID next to your face',
      'All text on the ID must be readable in photos',
      'Tap Submit — status changes to "Pending"',
      'Admin reviews within 24–48 hours — "Certified" or "Rejected"',
      'If rejected: re-upload clearer photos or use a different document',
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
    note: '✅ KYC is required before any withdrawal. Certified status increases your withdrawal limits.',
  },
  trading: {
    title: '📊 How to Trade on KYNEX',
    steps: [
      'Open the Markets tab to see all live prices and charts',
      'Tap any coin to open its detailed view',
      'On the Trade page: analyze the chart to decide direction',
      'Select UP (price will rise) or DOWN (price will fall)',
      'Set your stake amount and time period',
      'Review trade details and tap Confirm',
      'Monitor your active trades in Portfolio',
      'Profit or loss settled when the time period ends',
    ],
    extra: {
      title: '📌 Trading vs Signals',
      items: [
        'Manual Trading: you pick direction, no guarantee of profit',
        'AI Signals: admin-issued signals with KYNEX backing — lower risk',
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
      'Reward Signals: 100% profit — zero platform fee deducted',
      'The more you invite, the more Reward Signals you unlock',
    ],
    timing: [
      { flag: '💵', country: 'Invitee deposits $200',   t1: 'You get', t2: '$12',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $500',   t1: 'You get', t2: '$30',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $1,000', t1: 'You get', t2: '$60',  t3: 'bonus' },
      { flag: '💵', country: 'Invitee deposits $2,000', t1: 'You get', t2: '$120', t3: 'bonus' },
    ],
    note: '💡 Referral bonus is credited instantly when your invitee transfers deposit to Signal Wallet.',
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
    note: '⚠️ Always enable 2FA for maximum account security.',
  },
  level: {
    title: '🏅 Broker Level System',
    steps: [
      'KYNEX has 10 broker levels — each unlocks bonus + bi-monthly salary',
      'LV1:  5 referrals → $50 bonus + $18/mo salary',
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
    note: '💡 Start inviting today! LV1 (5 referrals) = $50 bonus + $18 monthly income.',
  },
  account: {
    title: '👤 Account Help Guide',
    steps: [
      'Login issue: go to /auth → tap "Forgot Password" to reset via email',
      'OTP not received: check spam/junk folder, wait 2 minutes and retry',
      'Email change: Profile → Security → requires 2FA + current password',
      'Balance discrepancy: check Transaction History page for all movements',
      'Wrong balance: pull-to-refresh or re-login to sync latest data',
      'Account blocked/locked: contact support with your registered email',
      'Multiple accounts: strictly prohibited — permanent ban of ALL accounts',
    ],
    extra: {
      title: '🔒 Security tips',
      items: [
        'Use a strong password: mix letters, numbers, symbols',
        'Enable Google 2FA for extra protection',
        'Never share credentials with anyone',
        'Log out from public/shared devices after use',
      ],
    },
    note: '⚠️ Creating multiple accounts leads to permanent ban and forfeiture of all balances.',
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
    note: '📌 Be as specific as possible so we can resolve your issue faster.',
  },
};

// ── BotFace ────────────────────────────────────────────────────────────────
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

        {guide.steps.map((step, i) => {
          if (step.startsWith('—')) {
            return (
              <div key={i} style={{ fontSize: '10px', fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: i === 0 ? 0 : '10px', marginBottom: '4px' }}>
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

        {guide.extra && (
          <div style={{ marginTop: '10px', padding: '8px 10px', background: theme.primarySoft, borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.primary, marginBottom: '6px' }}>{guide.extra.title}</div>
            {guide.extra.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                <span style={{ color: '#F59E0B', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '11px', color: theme.subtext, lineHeight: '1.5' }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {guide.timing && (
          <div style={{ marginTop: '10px', borderTop: `1px solid ${theme.cardBorder}`, paddingTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: theme.text, marginBottom: '5px' }}>
              {guide.timing[0]?.t1 === 'You get' ? '💰 Referral Rewards' : '⏰ Signal Times by Country'}
            </div>
            {guide.timing.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '3px 0', borderBottom: i < guide.timing.length - 1 ? `1px solid ${theme.cardBorder}` : 'none' }}>
                <span style={{ color: theme.text, fontWeight: '600' }}>{row.flag} {row.country}</span>
                <span style={{ color: '#F59E0B', fontWeight: '700' }}>{row.t1} · {row.t2} · {row.t3}</span>
              </div>
            ))}
          </div>
        )}

        {guide.note && (
          <div style={{ marginTop: '10px', padding: '8px 10px', background: theme.primarySoft, borderRadius: '8px', fontSize: '11.5px', color: theme.primary, lineHeight: '1.55' }}>
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

  // view: 'welcome' | 'bot' | 'agent' | 'resolved'
  const [view, setView] = useState('welcome');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);       // server messages (admin sees these)
  const [localMsgs, setLocalMsgs] = useState([]);     // local only (bot guides, prompts)
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [suggestedTopic, setSuggestedTopic] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [toast, setToast] = useState(null);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const typingPollRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const idleTimerRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const initialLoadRef = useRef(false); // resume agent session on first load
  const seenMsgIdsRef = useRef(new Set());
  const toastTimerRef = useRef(null);

  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(DRAG_KEY)); } catch { return null; } })();
  const [btnPos, setBtnPos] = useState(savedPos || { bottom: 88, right: 16 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // ── Idle timer ─────────────────────────────────────────────────────────
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

  // ── Fetch server messages ──────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/livechat/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        const msgs = data.messages || [];
        setMessages(msgs);
        if (!open) setUnread(msgs.filter(m => m.from === 'admin' && !m.read).length);
        // On first load: seed seen IDs, auto-resume agent view if history exists
        if (!initialLoadRef.current) {
          initialLoadRef.current = true;
          msgs.forEach(m => seenMsgIdsRef.current.add(m.id || String(m.at)));
          if (msgs.filter(m => !m.broadcast).length > 0) setView('agent');
          return;
        }
        // Detect new admin messages → toast notification + auto-open for regular messages
        let latestNew = null;
        msgs.forEach(m => {
          const key = m.id || String(m.at);
          if (m.from === 'admin' && !seenMsgIdsRef.current.has(key)) {
            seenMsgIdsRef.current.add(key);
            latestNew = m;
          }
        });
        if (latestNew && !open) {
          setToast(latestNew);
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => setToast(null), 8000);
          if (!latestNew.broadcast) {
            setOpen(true);
            setView('agent');
          }
        }
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
    if (open) {
      setUnread(0);
      markRead();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  }, [open, markRead]);

  // ── Web Push subscription ──────────────────────────────────────────────
  const subscribePush = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // already subscribed
      const keyRes = await fetch(`${API_URL}/api/push/vapid-key`);
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(sub),
      });
    } catch { /* browser or network error */ }
  }, []);

  // Request notification permission when chat first opens; subscribe to push
  useEffect(() => {
    if (!open) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      subscribePush();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { if (p === 'granted') subscribePush(); });
    }
  }, [open, subscribePush]);

  // Listen for SW notification click → open chat in agent view
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e) => {
      if (e.data?.type === 'KYNEX_NOTIF_CLICK') { setOpen(true); setView('agent'); }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // ── 5-minute idle auto-reset to welcome ───────────────────────────────
  useEffect(() => {
    if (view !== 'agent' || !open) return;
    const timer = setTimeout(() => setView('welcome'), 2 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [view, open, messages.length]);

  // ── View control helpers ───────────────────────────────────────────────
  // resetToWelcome: clears bot session, stays open (or closes if called with close=true)
  const resetToWelcome = useCallback((andClose = false) => {
    setView('welcome');
    setLocalMsgs([]);
    setSelectedTopic(null);
    setBotTyping(false);
    setShowExitConfirm(false);
    if (andClose) setOpen(false);
  }, []);

  // ── Topic selection (NO API call — local bot session only) ─────────────
  const selectTopic = useCallback((topic) => {
    if (topic.navigate) {
      setOpen(false);
      navigate(topic.navigate);
      return;
    }
    setView('bot');
    setSelectedTopic(topic);
    // Local user bubble — never sent to admin
    const userBubble = {
      id: 'u-' + Date.now(), type: 'user-bubble',
      text: topic.msg || `I need help with: ${topic.label}`, at: Date.now(),
    };
    setLocalMsgs([userBubble]);
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      const guide = GUIDES[topic.id];
      if (guide) {
        setLocalMsgs(prev => [...prev, { id: 'guide-' + Date.now(), type: 'bot-guide', guide, at: Date.now() }]);
      }
      setTimeout(() => {
        setLocalMsgs(prev => [...prev, { id: 'rp-' + Date.now(), type: 'resolve-prompt', at: Date.now() + 1 }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }, 1800);
    }, 1500);
  }, [navigate]);

  // ── Resolve prompt handlers ────────────────────────────────────────────
  const resolveIssue = useCallback((promptId, resolved) => {
    setLocalMsgs(prev => prev.filter(m => m.id !== promptId));
    if (resolved) {
      setView('resolved');
    } else {
      setLocalMsgs(prev => [...prev, { id: 'unsolved-' + Date.now(), type: 'unsolved-options', at: Date.now() }]);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  // ── Talk to Agent — sends FIRST message to API, switches to agent view ─
  const talkToAgent = useCallback(async () => {
    const topic = selectedTopic;
    const text = topic
      ? `I need live support for: ${topic.label}. The bot guide did not resolve my issue.`
      : 'I need to talk to a live support agent.';
    setLocalMsgs(prev => prev.filter(m => m.type !== 'unsolved-options'));
    setView('agent');
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/livechat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.ok) setMessages(prev => [...prev, data.message]);
    } catch { /* network */ }
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [selectedTopic]);

  // ── Send user message (agent mode — goes to admin) ─────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true); setInput('');
    // If user types from welcome (not typical, but possible), switch to agent
    if (view !== 'agent') setView('agent');
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
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    notifyTyping();
    if (view === 'welcome' && val.length >= 3) {
      setSuggestedTopic(detectTopic(val));
    } else {
      setSuggestedTopic(null);
    }
  };
  const fmtTime = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  // ── Drag logic ─────────────────────────────────────────────────────────
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

  // ── Layout helpers ─────────────────────────────────────────────────────
  const chatBottom = btnPos.bottom + 64;
  const chatRight = Math.max(8, Math.min(btnPos.right, window.innerWidth - 360));
  const isOnRight = btnPos.right < window.innerWidth / 2;
  const peekTranslate = isIdle && !open ? `translateX(${isOnRight ? '28px' : '-28px'})` : 'translateX(0)';
  const btnShadow = pressing
    ? '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 6px 0 rgba(0,0,0,0.22), 0 10px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28)';

  const localNotices = localMsgs.filter(m => m.type === 'notice');
  const allAgentMsgs = [...messages, ...localNotices].sort((a, b) => a.at - b.at);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: `${chatBottom}px`, right: `${chatRight}px`, zIndex: 1000,
          width: 'min(352px, calc(100vw - 24px))',
          height: view === 'resolved' ? 'auto' : 'min(560px, calc(100vh - 150px))',
          maxHeight: 'calc(100vh - 130px)',
          backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`,
          borderRadius: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backdropFilter: theme.cardGlass || 'blur(18px)',
          WebkitBackdropFilter: theme.cardGlass || 'blur(18px)',
          animation: 'chatSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 14px', background: 'linear-gradient(135deg,#3B82F6 0%,#F59E0B 100%)',
            display: 'flex', alignItems: 'center', gap: '9px', flexShrink: 0,
          }}>
            {/* Left: back arrow (bot view) or New Topic (agent view) */}
            {view === 'bot' && (
              <button onClick={() => resetToWelcome(false)}
                title="Back to topics"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px', borderRadius: '8px', flexShrink: 0, display: 'flex' }}>
                <ArrowLeft size={15} />
              </button>
            )}
            {view === 'agent' && (
              <button onClick={() => resetToWelcome(false)}
                title="New topic"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px 9px', borderRadius: '8px', flexShrink: 0, fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={12} /> Topics
              </button>
            )}

            {/* Center: avatar + title */}
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BotFace blink />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>KYNEX Support</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', animation: 'chatOnlinePulse 2s ease-in-out infinite' }} />
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px' }}>
                  {view === 'agent' ? 'Live Agent Session' : 'Online · Fast replies'}
                </div>
              </div>
            </div>

            {/* Right: End Chat (agent) or minimize */}
            {view === 'agent' && (
              <button onClick={() => setShowExitConfirm(true)}
                title="End chat session"
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: 'white', padding: '5px 9px', borderRadius: '8px', flexShrink: 0, fontSize: '11px', fontWeight: '700' }}>
                End
              </button>
            )}
            <button onClick={() => { setOpen(false); setView('welcome'); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
              <ChevronDown size={18} />
            </button>
          </div>

          {/* ── Exit confirm inline banner ── */}
          {showExitConfirm && (
            <div style={{ padding: '10px 14px', background: theme.primarySoft, borderBottom: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: '12px', color: theme.text, fontWeight: '600' }}>End this support session?</div>
              <button onClick={() => resetToWelcome(true)} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: theme.primary, color: 'white', fontSize: '12px', fontWeight: '700' }}>Yes, end</button>
              <button onClick={() => setShowExitConfirm(false)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, cursor: 'pointer', background: 'transparent', color: theme.subtext, fontSize: '12px' }}>Cancel</button>
            </div>
          )}

          {/* ── RESOLVED VIEW ── */}
          {view === 'resolved' && (
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 24px rgba(16,185,129,0.35)', fontSize: '28px', color: 'white', fontWeight: '800' }}>✓</div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: theme.text, marginBottom: '8px' }}>Issue Resolved!</div>
              <div style={{ fontSize: '13px', color: theme.subtext, marginBottom: '24px', lineHeight: '1.6' }}>
                Great! We're glad we could help you today. This support session has ended.
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button onClick={() => resetToWelcome(false)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', color: 'white', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <RefreshCw size={14} /> New Topic
                </button>
                <button onClick={() => resetToWelcome(true)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: `1.5px solid ${theme.cardBorder}`, cursor: 'pointer', background: 'transparent', color: theme.subtext, fontWeight: '700', fontSize: '13px' }}>
                  Close Chat
                </button>
              </div>
            </div>
          )}

          {/* ── WELCOME VIEW ── */}
          {view === 'welcome' && (
            <div style={{ overflowY: 'auto', padding: '14px 14px 4px' }}>
              {/* If previous agent session exists — show resume card */}
              {messages.length > 0 && (
                <button onClick={() => setView('agent')}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', border: `1.5px solid ${theme.primary}`, backgroundColor: theme.primarySoft, cursor: 'pointer', textAlign: 'left', marginBottom: '12px', boxSizing: 'border-box' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#F59E0B)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={15} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: theme.primary, marginBottom: '2px' }}>Active Conversation</div>
                    <div style={{ fontSize: '11px', color: theme.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {messages[messages.length - 1]?.text?.slice(0, 48) || 'Tap to continue'}
                    </div>
                  </div>
                  <ChevronRight size={14} color={theme.primary} />
                </button>
              )}

              {/* Support team card */}
              <div style={{ background: theme.primarySoft, border: `1px solid ${theme.cardBorder}`, borderRadius: '14px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex' }}>
                  {['K','Y','N'].map((l,i)=>(
                    <div key={l} style={{ width:'26px',height:'26px',borderRadius:'50%',background:'linear-gradient(135deg,#3B82F6,#F59E0B)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'800',color:'white',marginLeft:i===0?0:'-8px',border:`2px solid ${theme.card}`,flexShrink:0 }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight:'700', fontSize:'13px', color:theme.text }}>KYNEX Support Team</div>
                  <div style={{ fontSize:'11px', color:theme.up || '#22C55E', display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                    <div style={{ width:'5px',height:'5px',borderRadius:'50%',backgroundColor:theme.up||'#22C55E' }} />
                    Available · Replies in minutes
                  </div>
                </div>
              </div>

              {/* Greeting bubble */}
              <div style={{ display:'flex', gap:'9px', marginBottom:'12px' }}>
                <div style={{ width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#3B82F6,#F59E0B)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <BotFace size={20} blink />
                </div>
                <div style={{ background:theme.inputBg, borderRadius:'4px 16px 16px 16px', padding:'10px 12px', fontSize:'13px', lineHeight:'1.6', color:theme.text, flex:1, boxShadow:'0 2px 6px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight:'800', display:'block', marginBottom:'2px' }}>👋 Hi! Welcome to KYNEX Support</span>
                  Select a topic below to get an instant guide, or talk to a live agent.
                </div>
              </div>

              {/* Topics grid */}
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
                {TOPICS.map(t => (
                  <button key={t.id} onClick={() => selectTopic(t)}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'12px', border:`1.5px solid ${theme.cardBorder}`, backgroundColor:theme.inputBg, cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.14s', boxSizing:'border-box' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#3B82F6'; e.currentTarget.style.transform='translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=theme.cardBorder; e.currentTarget.style.transform='translateX(0)'; }}>
                    <span style={{ width:'30px',height:'30px',borderRadius:'9px',flexShrink:0,background:theme.primarySoft,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px' }}>{t.emoji}</span>
                    <span style={{ flex:1, fontSize:'13px', fontWeight:'600', color:theme.text }}>{t.label}</span>
                    <ChevronRight size={14} color={theme.faint} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── BOT VIEW (guide + resolve prompt — local only, not sent to admin) ── */}
          {view === 'bot' && (
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', backgroundColor:theme.bg||theme.card }}>
              <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
                {localMsgs.map(msg => {
                  if (msg.type === 'user-bubble') return (
                    <div key={msg.id} style={{ display:'flex', justifyContent:'flex-end' }}>
                      <div style={{ maxWidth:'78%', padding:'9px 13px', borderRadius:'18px 18px 4px 18px', backgroundColor:theme.primary, color:'white', fontSize:'13px', lineHeight:'1.5', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', animation:'chatSlideIn 0.18s ease-out' }}>
                        {msg.text}
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginTop:'3px', textAlign:'right' }}>{fmtTime(msg.at)}</div>
                      </div>
                    </div>
                  );
                  if (msg.type === 'bot-guide') return <BotGuide key={msg.id} guide={msg.guide} theme={theme} time={msg.at} />;
                  if (msg.type === 'resolve-prompt') return (
                    <div key={msg.id} style={{ animation:'chatSlideIn 0.22s ease-out' }}>
                      <div style={{ background:theme.inputBg, border:`1px solid ${theme.cardBorder}`, borderRadius:'16px', padding:'12px 14px', textAlign:'center' }}>
                        <div style={{ fontSize:'13px', fontWeight:'700', color:theme.text, marginBottom:'10px' }}>Was your issue resolved? 🤔</div>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <button onClick={() => resolveIssue(msg.id, true)} style={{ flex:1, padding:'10px', borderRadius:'12px', border:'none', cursor:'pointer', background:theme.upSoft, color:theme.up, fontWeight:'700', fontSize:'13px' }}>
                            👍 Yes, Resolved
                          </button>
                          <button onClick={() => resolveIssue(msg.id, false)} style={{ flex:1, padding:'10px', borderRadius:'12px', border:'none', cursor:'pointer', background:theme.downSoft, color:theme.down, fontWeight:'700', fontSize:'13px' }}>
                            👎 Not Solved
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  if (msg.type === 'unsolved-options') return (
                    <div key={msg.id} style={{ animation:'chatSlideIn 0.22s ease-out' }}>
                      <div style={{ background:theme.inputBg, border:`1px solid ${theme.cardBorder}`, borderRadius:'16px', padding:'12px 14px' }}>
                        <div style={{ fontSize:'12px', color:theme.subtext, marginBottom:'10px', fontWeight:'600' }}>
                          Still having trouble? Choose an option:
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                          <button onClick={talkToAgent} style={{ padding:'10px 14px', borderRadius:'11px', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#3B82F6,#6366F1)', color:'white', fontWeight:'700', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span>💬</span> Talk to a Live Agent
                          </button>
                          <button onClick={() => resetToWelcome(false)} style={{ padding:'10px 14px', borderRadius:'11px', border:`1.5px solid ${theme.cardBorder}`, cursor:'pointer', background:theme.primarySoft, color:theme.primary, fontWeight:'700', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span>📋</span> Browse Other Topics
                          </button>
                          <button onClick={() => resetToWelcome(true)} style={{ padding:'10px 14px', borderRadius:'11px', border:`1.5px solid ${theme.cardBorder}`, cursor:'pointer', background:'transparent', color:theme.subtext, fontWeight:'600', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span>✕</span> End Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  return null;
                })}

                {botTyping && (
                  <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <div style={{ width:'26px',height:'26px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#3B82F6,#F59E0B)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <BotFace size={18} />
                    </div>
                    <div style={{ padding:'10px 14px', borderRadius:'4px 18px 18px 18px', backgroundColor:theme.inputBg, display:'flex', gap:'4px', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{ width:'6px',height:'6px',borderRadius:'50%',backgroundColor:theme.faint,animation:'chatBounce 1.2s infinite',animationDelay:`${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* ── AGENT VIEW (live messages — admin sees these) ── */}
          {view === 'agent' && (
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', backgroundColor:theme.bg||theme.card }}>
              <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
                {/* Connecting notice at top if no messages yet */}
                {messages.length === 0 && (
                  <div style={{ display:'flex', justifyContent:'center', padding:'16px 0' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', backgroundColor:theme.primarySoft, color:theme.primary, padding:'8px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:'600' }}>
                      ⏳ Connecting you to a live agent…
                    </div>
                  </div>
                )}

                {allAgentMsgs.map(msg => {
                  if (msg.type === 'notice') return (
                    <div key={msg.id} style={{ display:'flex', justifyContent:'center' }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', backgroundColor:theme.primarySoft, color:theme.primary, padding:'7px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', animation:'chatSlideIn 0.2s ease-out' }}>
                        ✓ {msg.text || 'An agent will contact you shortly'}
                      </div>
                    </div>
                  );
                  if (msg.broadcast) return (
                    <div key={msg.id || msg.at} style={{ display:'flex', justifyContent:'flex-start', animation:'chatSlideIn 0.18s ease-out' }}>
                      <div style={{ maxWidth:'85%', padding:'9px 13px', borderRadius:'4px 18px 18px 18px', backgroundColor:'rgba(245,158,11,0.12)', border:'1.5px solid rgba(245,158,11,0.4)', color:theme.text, fontSize:'13px', lineHeight:'1.5', wordBreak:'break-word', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                        <div style={{ fontSize:'10px', fontWeight:'800', color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'4px' }}>📢 Admin Announcement</div>
                        <div>{msg.text}</div>
                        <div style={{ fontSize:'10px', marginTop:'4px', color:theme.faint, textAlign:'right' }}>{fmtTime(msg.at)}</div>
                      </div>
                    </div>
                  );
                  return (
                    <div key={msg.id || msg.at} style={{ display:'flex', justifyContent:msg.from==='user'?'flex-end':'flex-start' }}>
                      {msg.from === 'admin' && (
                        <div style={{ width:'26px',height:'26px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#3B82F6,#F59E0B)',display:'flex',alignItems:'center',justifyContent:'center',marginRight:'7px',marginTop:'2px' }}>
                          <BotFace size={18} />
                        </div>
                      )}
                      <div style={{ maxWidth:'75%', padding:'9px 13px', borderRadius:msg.from==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px', backgroundColor:msg.from==='user'?theme.primary:(theme.inputBg||'#F3F4F6'), color:msg.from==='user'?'white':theme.text, fontSize:'13px', lineHeight:'1.5', wordBreak:'break-word', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', animation:'chatSlideIn 0.18s ease-out' }}>
                        <div>{msg.text}</div>
                        <div style={{ fontSize:'10px', marginTop:'4px', color:msg.from==='user'?'rgba(255,255,255,0.7)':theme.faint, textAlign:'right', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'3px' }}>
                          {fmtTime(msg.at)}
                          {msg.from==='user' && <span style={{ color:msg.read?'#60A5FA':'rgba(255,255,255,0.6)' }}>{msg.read?'✓✓':'✓'}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {adminTyping && (
                  <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <div style={{ width:'26px',height:'26px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#3B82F6,#F59E0B)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <BotFace size={18} />
                    </div>
                    <div style={{ padding:'10px 14px', borderRadius:'4px 18px 18px 18px', backgroundColor:theme.inputBg, display:'flex', gap:'4px', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{ width:'6px',height:'6px',borderRadius:'50%',backgroundColor:theme.faint,animation:'chatBounce 1.2s infinite',animationDelay:`${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* ── Input (welcome, bot, and agent views) ── */}
          {view !== 'resolved' && !showExitConfirm && (
            <div style={{ borderTop:`1px solid ${theme.cardBorder}`, backgroundColor:theme.card, flexShrink:0 }}>
              {/* Suggestion chip (welcome view: keyword detected) */}
              {suggestedTopic && view === 'welcome' && (
                <div style={{ padding:'6px 12px 0' }}>
                  <button onClick={() => { setSuggestedTopic(null); setInput(''); selectTopic(suggestedTopic); }}
                    style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 12px', borderRadius:'12px', border:`1.5px solid #3B82F6`, background:'rgba(59,130,246,0.08)', cursor:'pointer', width:'100%', textAlign:'left', animation:'chatSlideIn 0.18s ease-out' }}>
                    <span style={{ fontSize:'16px' }}>{suggestedTopic.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'11px', color:'#3B82F6', fontWeight:'700' }}>💡 Detected topic</div>
                      <div style={{ fontSize:'12px', color:theme.text, fontWeight:'600' }}>{suggestedTopic.label} — Tap for instant guide</div>
                    </div>
                    <ChevronRight size={14} color="#3B82F6" />
                  </button>
                </div>
              )}
              <div style={{ padding:'10px 12px', display:'flex', gap:'8px', alignItems:'flex-end' }}>
                <textarea value={input} onChange={handleInputChange} onKeyDown={handleKey}
                  placeholder={view === 'welcome' ? 'Or type your question…' : view === 'bot' ? 'Type for live agent…' : 'Type a message…'}
                  rows={1}
                  style={{ flex:1, resize:'none', padding:'10px 12px', borderRadius:'14px', border:`1.5px solid ${theme.cardBorder}`, backgroundColor:theme.inputBg||theme.bg, color:theme.text, fontSize:'13px', outline:'none', fontFamily:'inherit', maxHeight:'80px', overflowY:'auto', transition:'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor='#3B82F6'}
                  onBlur={e => e.target.style.borderColor=theme.cardBorder}
                />
                <button onClick={send} disabled={!input.trim()||sending} style={{ width:'42px', height:'42px', borderRadius:'14px', border:'none', cursor:input.trim()&&!sending?'pointer':'not-allowed', background:input.trim()&&!sending?'linear-gradient(135deg,#3B82F6,#F59E0B)':theme.cardBorder, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', boxShadow:input.trim()&&!sending?'0 4px 12px rgba(59,130,246,0.4)':'none' }}>
                  <Send size={16} color="white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Notification Toast (chat closed + new admin message) ───── */}
      {toast && !open && (
        <div
          onClick={() => { setToast(null); clearTimeout(toastTimerRef.current); setOpen(true); setView('agent'); }}
          style={{ position:'fixed', bottom:`${btnPos.bottom + 74}px`, right:`${btnPos.right}px`, zIndex:1001, width:'min(300px, calc(100vw - 32px))', backgroundColor:theme.card, border:`1.5px solid ${toast.broadcast ? 'rgba(245,158,11,0.6)' : 'rgba(59,130,246,0.5)'}`, borderRadius:'16px', padding:'12px 14px 14px', boxShadow:toast.broadcast ? '0 8px 32px rgba(245,158,11,0.2)' : '0 8px 32px rgba(59,130,246,0.2)', animation:'chatSlideIn 0.28s cubic-bezier(0.4,0,0.2,1)', cursor:'pointer', overflow:'hidden' }}
        >
          <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
            <div style={{ fontSize:'20px', flexShrink:0 }}>{toast.broadcast ? '📢' : '💬'}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', fontWeight:'800', color:toast.broadcast ? '#F59E0B' : theme.primary, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'3px' }}>
                {toast.broadcast ? 'Admin Announcement · KYNEX' : 'New Message · KYNEX'}
              </div>
              <div style={{ fontSize:'13px', color:theme.text, lineHeight:'1.5', fontWeight:'500', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {toast.text}
              </div>
              <div style={{ fontSize:'10px', color:theme.faint, marginTop:'4px' }}>Tap to open chat</div>
            </div>
            <button onClick={e => { e.stopPropagation(); setToast(null); clearTimeout(toastTimerRef.current); }} style={{ background:'transparent', border:'none', cursor:'pointer', color:theme.faint, padding:'2px', flexShrink:0, fontSize:'14px', lineHeight:1 }}>✕</button>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', background:toast.broadcast ? '#F59E0B' : theme.primary, animation:'toastProgress 8s linear forwards' }} />
          </div>
        </div>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:`${btnPos.bottom}px`, right:`${btnPos.right}px`, zIndex:999, width:'58px', height:'58px', borderRadius:'50%', transform:peekTranslate, transition:dragging.current?'none':'transform 0.45s cubic-bezier(0.34,1.2,0.64,1)', animation:!open&&!isIdle&&!pressing?'chatRing 2.8s ease-out infinite':'none' }}>
        <div
          onMouseDown={(e)=>onDown(e,false)}
          onTouchStart={(e)=>onDown(e,true)}
          onClick={()=>{ if(!hasDraggedRef.current){ setOpen(o=>!o); resetIdle(); } }}
          style={{ position:'relative', width:'58px', height:'58px', borderRadius:'50%', background:open?'linear-gradient(145deg,#3B82F6,#6366F1)':'linear-gradient(145deg,#F59E0B 0%,#3B82F6 100%)', border:'none', cursor:dragging.current?'grabbing':'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:btnShadow, transform:pressing?'translateY(4px) scale(0.93)':'scale(1)', transition:'transform 0.1s ease, box-shadow 0.1s ease', userSelect:'none', touchAction:'none' }}
        >
          {open ? <X size={22} color="white" /> : <BotFace blink={!pressing} />}
          {!open && unread > 0 && (
            <div style={{ position:'absolute', top:'-2px', right:'-2px', minWidth:'20px', height:'20px', borderRadius:'10px', backgroundColor:'#EF4444', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:'800', padding:'0 4px', boxSizing:'border-box' }}>
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
        @keyframes toastProgress { from { width:100%; } to { width:0%; } }
      `}</style>
    </>
  );
};

export default LiveChat;
