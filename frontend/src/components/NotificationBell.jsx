import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MailOpen, Check } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const NotificationBell = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const ref = useRef(null);

  const unreadCount = messages.filter((m) => !m.read).length;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch { /* next poll */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    const poll = setInterval(load, 15000);
    return () => { clearTimeout(t); clearInterval(poll); };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    await fetch(`${API_URL}/api/messages/${id}/read`, { method: 'POST', headers: authHeaders() });
  };

  const markAllRead = async () => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    await fetch(`${API_URL}/api/messages/read-all`, { method: 'POST', headers: authHeaders() });
  };

  const recent = messages.slice(0, 8);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', position: 'relative', color: theme.subtext }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-6px', minWidth: '16px', height: '16px',
            borderRadius: '8px', backgroundColor: theme.down, color: 'white',
            fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', boxSizing: 'border-box',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: '320px', marginTop: '8px', zIndex: 1200,
          backgroundColor: theme.card, borderRadius: '16px', border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.shadowElevated || theme.shadow,
          backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${theme.cardBorder}` }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.text }}>
              Notifications {unreadCount > 0 && <span style={{ color: theme.primary, fontSize: '12px' }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: theme.primary, fontSize: '12px', fontWeight: '600', padding: '0' }}
              >
                <Check size={13} /> Read all
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {recent.length === 0 && (
              <div style={{ padding: '30px 16px', textAlign: 'center' }}>
                <MailOpen size={28} color={theme.faint} style={{ marginBottom: '8px' }} />
                <p style={{ color: theme.faint, fontSize: '13px', margin: 0 }}>No notifications yet</p>
              </div>
            )}

            {recent.map((m) => (
              <button
                key={m.id}
                onClick={() => { if (!m.read) markRead(m.id); }}
                style={{
                  width: '100%', display: 'flex', gap: '12px', padding: '12px 16px', textAlign: 'left',
                  cursor: m.read ? 'default' : 'pointer', border: 'none', borderBottom: `1px solid ${theme.cardBorder}`,
                  backgroundColor: m.read ? 'transparent' : theme.primarySoft,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                  backgroundColor: m.read ? 'transparent' : theme.primary,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: m.read ? 'normal' : 'bold', fontSize: '13px', color: theme.text }}>{m.title}</span>
                    <span style={{ fontSize: '10px', color: theme.faint, flexShrink: 0, marginLeft: '8px' }}>{timeAgo(m.at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: theme.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.body}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {messages.length > 0 && (
            <Link
              to="/messages"
              onClick={() => setOpen(false)}
              style={{
                display: 'block', textAlign: 'center', padding: '12px', fontSize: '13px',
                color: theme.primary, fontWeight: '600', textDecoration: 'none',
                borderTop: `1px solid ${theme.cardBorder}`,
              }}
            >
              View all messages
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
