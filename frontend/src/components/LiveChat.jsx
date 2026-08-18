import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const DRAG_KEY = 'kynex_chat_btn_pos';
const IDLE_MS = 4000;

const TOPICS = [
  { id: 'transfer', emoji: '💰', label: 'Transfer Balance',  msg: 'Hi, I need help with a balance transfer issue.' },
  { id: 'withdraw', emoji: '📤', label: 'Withdrawal Issue',  msg: 'Hi, I need help with a withdrawal.' },
  { id: 'deposit',  emoji: '📥', label: 'Deposit Issue',     msg: 'Hi, I need help with a deposit.' },
  { id: 'trading',  emoji: '📊', label: 'Trading Help',      msg: 'Hi, I have a trading-related question.' },
  { id: 'signal',   emoji: '📡', label: 'Signal Issue',      msg: 'Hi, I have a question about signals.' },
  { id: 'other',    emoji: '❓', label: 'Other Issue',        msg: 'Hi, I need help with something else.' },
];

// Happy-face icon for the FAB button
const BotFace = () => (
  <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
    <circle cx="10" cy="11" r="2.2" fill="white" />
    <circle cx="18" cy="11" r="2.2" fill="white" />
    <path d="M8 17.5 Q14 22.5 20 17.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
);

const LiveChat = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [localMsgs, setLocalMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
      setUnread(0);
      markMessagesRead();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, markMessagesRead]);

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
        setLocalMsgs(prev => [...prev, { id: 'sys-' + Date.now(), type: 'notice', at: Date.now() }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    } catch { /* network */ }
    setSending(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setTopicSent(true);
    setSending(true);
    setInput('');
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
    resetIdle(); hasDraggedRef.current = false;
    dragging.current = true; setPressing(true);
    dragOffset.current = {
      x: e.clientX - (window.innerWidth - btnPos.right - 56),
      y: e.clientY - (window.innerHeight - btnPos.bottom - 56),
    };
    e.preventDefault();
  };
  const onTouchStart = (e) => {
    if (open) return;
    resetIdle(); hasDraggedRef.current = false;
    dragging.current = true; setPressing(true);
    const t = e.touches[0];
    dragOffset.current = {
      x: t.clientX - (window.innerWidth - btnPos.right - 56),
      y: t.clientY - (window.innerHeight - btnPos.bottom - 56),
    };
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
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
    };
  }, []);

  const chatBottom = btnPos.bottom + 64;
  const chatRight = btnPos.right;
  const isOnRight = btnPos.right < window.innerWidth / 2;
  const peekTranslate = isIdle && !open ? `translateX(${isOnRight ? '28px' : '-28px'})` : 'translateX(0)';
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
          width: 'min(340px, calc(100vw - 32px))',
          height: showWelcome ? 'auto' : '500px',
          maxHeight: 'calc(100vh - 130px)',
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '22px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: theme.cardGlass || 'blur(18px)',
          WebkitBackdropFilter: theme.cardGlass || 'blur(18px)',
        }}>

          {/* Header */}
          <div style={{
            padding: '13px 15px',
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.brand || theme.primary} 100%)`,
            display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0,
          }}>
            {topicSent && (
              <button onClick={() => { setTopicSent(false); setMessages([]); setLocalMsgs([]); }}
                style={{ background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '5px', borderRadius: '8px', flexShrink: 0 }}>
                <ArrowLeft size={15} />
              </button>
            )}
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BotFace />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>KYNEX Support</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', animation: 'chatOnlinePulse 2s ease-in-out infinite' }} />
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>Online · Replies in minutes</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }}>
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Welcome / Topic Menu */}
          {showWelcome ? (
            <div style={{ padding: '18px 14px 6px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BotFace />
                </div>
                <div style={{
                  background: theme.inputBg, borderRadius: '4px 18px 18px 18px',
                  padding: '12px 14px', fontSize: '13px', lineHeight: '1.6',
                  color: theme.text, flex: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <span style={{ fontWeight: '700', display: 'block', marginBottom: '3px' }}>👋 Hi! Welcome to KYNEX Support</span>
                  What's your issue today? Pick a topic or type your message below.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
                {TOPICS.map(t => (
                  <button key={t.id} onClick={() => selectTopic(t)} disabled={sending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '11px',
                      padding: '12px 13px', borderRadius: '13px',
                      border: `1.5px solid ${theme.cardBorder}`,
                      backgroundColor: theme.inputBg, cursor: 'pointer',
                      textAlign: 'left', width: '100%', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.cardBorder; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                      background: theme.primarySoft,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                    }}>{t.emoji}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: theme.text }}>{t.label}</span>
                    <ChevronRight size={15} color={theme.faint} />
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
            /* Message History */
            <div style={{
              flex: 1, overflowY: 'auto', padding: '14px 12px',
              display: 'flex', flexDirection: 'column', gap: '10px',
              backgroundColor: theme.bg || theme.card,
            }}>
              {allMsgs.map((msg) => {
                if (msg.type === 'notice') {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        backgroundColor: theme.primarySoft, color: theme.primary,
                        padding: '7px 15px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: '600',
                      }}>
                        ✓ An agent will contact you shortly
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.from === 'admin' && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: '7px', marginTop: '2px',
                      }}>
                        <BotFace />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '75%', padding: '9px 13px',
                      borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      backgroundColor: msg.from === 'user' ? theme.primary : (theme.inputBg || '#F3F4F6'),
                      color: msg.from === 'user' ? 'white' : theme.text,
                      fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                    }}>
                      <div>{msg.text}</div>
                      <div style={{
                        fontSize: '10px', marginTop: '4px',
                        color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : theme.faint,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px',
                      }}>
                        {fmtTime(msg.at)}
                        {msg.from === 'user' && (
                          <span style={{ fontSize: '11px', color: msg.read ? '#60A5FA' : 'rgba(255,255,255,0.6)', marginLeft: '2px' }}>
                            {msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {adminTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><BotFace /></div>
                  <div style={{
                    padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                    backgroundColor: theme.inputBg || '#F3F4F6',
                    display: 'flex', gap: '4px', alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: theme.faint,
                        animation: 'chatBounce 1.2s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: `1px solid ${theme.cardBorder}`,
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            backgroundColor: theme.card, flexShrink: 0,
          }}>
            <textarea
              value={input} onChange={handleInputChange} onKeyDown={handleKey}
              placeholder="Type a message..." rows={1}
              style={{
                flex: 1, resize: 'none', padding: '10px 12px',
                borderRadius: '14px', border: `1.5px solid ${theme.cardBorder}`,
                backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '13px', outline: 'none',
                fontFamily: 'inherit', maxHeight: '80px', overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = theme.primary}
              onBlur={e => e.target.style.borderColor = theme.cardBorder}
            />
            <button onClick={send} disabled={!input.trim() || sending} style={{
              width: '42px', height: '42px', borderRadius: '14px', border: 'none',
              cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
              background: input.trim() && !sending
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`
                : theme.cardBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
              boxShadow: input.trim() && !sending ? `0 4px 12px ${theme.primary}55` : 'none',
            }}>
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB — position + idle peek ── */}
      <div style={{
        position: 'fixed',
        bottom: `${btnPos.bottom}px`,
        right: `${btnPos.right}px`,
        zIndex: 999,
        width: '58px', height: '58px', borderRadius: '50%',
        transform: peekTranslate,
        transition: dragging.current ? 'none' : 'transform 0.45s cubic-bezier(0.34, 1.2, 0.64, 1)',
        // Smooth ring pulse via box-shadow — no separate divs, no z-index issues
        animation: !open && !isIdle && !pressing ? 'chatRing 2.8s ease-out infinite' : 'none',
      }}>
        {/* Main button */}
        <div
          ref={dragRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onClick={() => { if (!hasDraggedRef.current) { setOpen(o => !o); resetIdle(); } }}
          style={{
            position: 'relative',
            width: '58px', height: '58px', borderRadius: '50%',
            background: open
              ? `linear-gradient(145deg, ${theme.primary}, #6366F1)`
              : `linear-gradient(145deg, ${theme.brand || '#F59E0B'} 0%, ${theme.primary || '#3B82F6'} 100%)`,
            border: 'none',
            cursor: dragging.current ? 'grabbing' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: pressing
              ? '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)'
              : '0 6px 0 rgba(0,0,0,0.22), 0 10px 28px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28)',
            transform: pressing ? 'translateY(4px) scale(0.93)' : 'scale(1)',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            userSelect: 'none', touchAction: 'none',
          }}
        >
          {open
            ? <X size={22} color="white" />
            : <BotFace />
          }
          {!open && unread > 0 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-2px',
              minWidth: '20px', height: '20px', borderRadius: '10px',
              backgroundColor: '#EF4444', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: 'white', fontWeight: '800',
              padding: '0 4px', boxSizing: 'border-box',
            }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes chatRing {
          0%   { box-shadow: 0 0 0 0 ${theme.brand || '#F59E0B'}70; }
          60%  { box-shadow: 0 0 0 20px ${theme.brand || '#F59E0B'}00; }
          100% { box-shadow: 0 0 0 0 ${theme.brand || '#F59E0B'}00; }
        }
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatOnlinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default LiveChat;
