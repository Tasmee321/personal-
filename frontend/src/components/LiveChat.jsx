import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getToken } from '../utils/auth';
import { API_URL } from '../config';

const LiveChat = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

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
    } catch { /* network error */ }
  }, [open]);

  useEffect(() => {
    fetchHistory();
    pollRef.current = setInterval(fetchHistory, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchHistory]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

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
    } catch { /* network error */ }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmtTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '16px', zIndex: 1000,
          width: 'min(340px, calc(100vw - 32px))',
          height: '460px',
          backgroundColor: theme.card,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: '18px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.brand || theme.primary} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={18} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>KYNEX Support</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Live Chat</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', padding: '4px' }}
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 12px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center', color: theme.faint, fontSize: '13px',
                marginTop: '60px', lineHeight: '1.6',
              }}>
                <MessageCircle size={32} color={theme.faint} style={{ marginBottom: '10px' }} />
                <div>Welcome to KYNEX Support</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Send a message to get started.</div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '78%',
                  padding: '9px 13px',
                  borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.from === 'user' ? theme.primary : (theme.inputBg || theme.cardBorder),
                  color: msg.from === 'user' ? 'white' : theme.text,
                  fontSize: '13px', lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}>
                  <div>{msg.text}</div>
                  <div style={{
                    fontSize: '10px', marginTop: '4px',
                    color: msg.from === 'user' ? 'rgba(255,255,255,0.65)' : theme.faint,
                    textAlign: 'right',
                  }}>
                    {fmtTime(msg.at)}
                    {msg.from === 'user' && (
                      <span style={{ marginLeft: '4px' }}>
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${theme.cardBorder}`,
            display: 'flex', gap: '8px', alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '10px 12px',
                borderRadius: '12px', border: `1px solid ${theme.cardBorder}`,
                backgroundColor: theme.inputBg || theme.bg,
                color: theme.text, fontSize: '13px',
                outline: 'none', fontFamily: 'inherit',
                maxHeight: '80px', overflowY: 'auto',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{
                width: '40px', height: '40px', borderRadius: '12px',
                border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                backgroundColor: input.trim() && !sending ? theme.primary : theme.cardBorder,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '85px', right: '16px', zIndex: 999,
          width: '52px', height: '52px', borderRadius: '50%',
          backgroundColor: theme.primary,
          border: 'none', cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(36,104,242,0.45)',
        }}
      >
        <MessageCircle size={22} color="white" />
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: '#EF4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: 'white', fontWeight: '700',
          }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
    </>
  );
};

export default LiveChat;
