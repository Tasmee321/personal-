import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const DRAG_KEY = 'kynex_chat_btn_pos';

const LiveChat = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminTyping, setAdminTyping] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const typingPollRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);

  // Draggable button state
  const savedPos = (() => { try { return JSON.parse(localStorage.getItem(DRAG_KEY)); } catch { return null; } })();
  const [btnPos, setBtnPos] = useState(savedPos || { bottom: 88, right: 16 });
  const dragRef = useRef(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/livechat/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
        if (!open) {
          const unreadCount = (data.messages || []).filter(m => m.from === 'admin' && !m.read).length;
          setUnread(unreadCount);
        } else {
          setUnread(0);
        }
      }
    } catch { /* network */ }
  }, [open]);

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
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch { /* network */ }
  }, []);

  useEffect(() => {
    fetchHistory();
    pollRef.current = setInterval(fetchHistory, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchHistory]);

  useEffect(() => {
    if (open) {
      typingPollRef.current = setInterval(fetchTyping, 2000);
    } else {
      clearInterval(typingPollRef.current);
      setAdminTyping(false);
    }
    return () => clearInterval(typingPollRef.current);
  }, [open, fetchTyping]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  // Mark user messages as read by admin — update local state for double tick
  // The backend already marks admin->user msgs read in /history
  // For user->admin double tick: poll and update read status from server
  const fetchReadStatus = useCallback(async () => {
    if (!open) return;
    try {
      const res = await fetch(`${API_URL}/api/livechat/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
      }
    } catch { /* network */ }
  }, [open]);

  useEffect(() => {
    // Already polling via fetchHistory every 5s — that handles read status too
  }, [fetchReadStatus]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    notifyTyping();
    clearTimeout(typingTimerRef.current);
  };

  // Notify bell of unread chat count
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kynex-chat-unread', { detail: { count: unread } }));
  }, [unread]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
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

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Drag logic
  const onMouseDown = (e) => {
    if (open) return;
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - (window.innerWidth - btnPos.right - 56),
      y: e.clientY - (window.innerHeight - btnPos.bottom - 56),
    };
    e.preventDefault();
  };
  const onTouchStart = (e) => {
    if (open) return;
    dragging.current = true;
    const t = e.touches[0];
    dragOffset.current = {
      x: t.clientX - (window.innerWidth - btnPos.right - 56),
      y: t.clientY - (window.innerHeight - btnPos.bottom - 56),
    };
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const newRight = Math.max(8, Math.min(window.innerWidth - 64, window.innerWidth - (cx - dragOffset.current.x) - 56));
      const newBottom = Math.max(8, Math.min(window.innerHeight - 64, window.innerHeight - (cy - dragOffset.current.y) - 56));
      setBtnPos({ right: newRight, bottom: newBottom });
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        setBtnPos(pos => { localStorage.setItem(DRAG_KEY, JSON.stringify(pos)); return pos; });
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const chatBottom = btnPos.bottom + 64;
  const chatRight = btnPos.right;

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: `${chatBottom}px`,
          right: `${Math.max(8, Math.min(chatRight, window.innerWidth - 360))}px`,
          zIndex: 1000,
          width: 'min(340px, calc(100vw - 32px))',
          height: '480px',
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '20px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.32)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.brand || theme.primary} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageCircle size={18} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>KYNEX Support</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>Online</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '6px', borderRadius: '8px' }}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 12px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            backgroundColor: theme.bg || theme.card,
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center', color: theme.faint, fontSize: '13px',
                marginTop: '60px', lineHeight: '1.6',
              }}>
                <MessageCircle size={32} color={theme.faint} style={{ marginBottom: '10px' }} />
                <div style={{ fontWeight: 600, color: theme.subtext }}>Welcome to KYNEX Support</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Send a message to get started.</div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.from === 'admin' && (
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '7px', marginTop: '2px',
                    fontSize: '11px', fontWeight: 700, color: 'white',
                  }}>K</div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '9px 13px',
                  borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.from === 'user' ? theme.primary : (theme.inputBg || '#F3F4F6'),
                  color: msg.from === 'user' ? 'white' : (theme.card === '#FFFFFF' || theme.card === '#fff' ? '#1F2937' : theme.text),
                  fontSize: '13px', lineHeight: '1.5',
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  <div>{msg.text}</div>
                  <div style={{
                    fontSize: '10px', marginTop: '4px',
                    color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : (theme.faint || '#9CA3AF'),
                    textAlign: 'right',
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
            ))}
            {/* Typing indicator */}
            {adminTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'white',
                }}>K</div>
                <div style={{
                  padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
                  backgroundColor: theme.inputBg || '#F3F4F6',
                  display: 'flex', gap: '4px', alignItems: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: theme.faint || '#9CA3AF',
                      animation: 'chatBounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${theme.cardBorder}`,
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            backgroundColor: theme.card,
            flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '10px 12px',
                borderRadius: '14px', border: `1.5px solid ${theme.cardBorder}`,
                backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '13px',
                outline: 'none', fontFamily: 'inherit',
                maxHeight: '80px', overflowY: 'auto',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = theme.primary}
              onBlur={e => e.target.style.borderColor = theme.cardBorder}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{
                width: '42px', height: '42px', borderRadius: '14px',
                border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                background: input.trim() && !sending
                  ? `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`
                  : theme.cardBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
                boxShadow: input.trim() && !sending ? `0 4px 12px ${theme.primary}55` : 'none',
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* FAB Button — draggable */}
      <div
        ref={dragRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={() => { if (!dragging.current) setOpen(o => !o); }}
        style={{
          position: 'fixed',
          bottom: `${btnPos.bottom}px`,
          right: `${btnPos.right}px`,
          zIndex: 999,
          width: '56px', height: '56px',
          borderRadius: '50%',
          background: open
            ? `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`
            : `linear-gradient(135deg, ${theme.primary}, ${theme.brand || theme.primary})`,
          border: 'none', cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 24px ${theme.primary}60, 0 2px 8px rgba(0,0,0,0.2)`,
          transition: 'transform 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {open
          ? <X size={22} color="white" />
          : <MessageCircle size={22} color="white" />
        }

      </div>

      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LiveChat;
