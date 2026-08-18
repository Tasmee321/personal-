import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailOpen, Inbox } from 'lucide-react';
import { getToken } from '../utils/auth';
import { useTheme } from '../ThemeContext';
import { API_URL } from '../config';

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function glassCard(theme) {
  return {
    backgroundColor: theme.card,
    borderRadius: '16px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.shadow,
    backdropFilter: theme.cardGlass || 'blur(16px)',
    WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
  };
}

const Messages = () => {
  const { theme, iconBadges } = useTheme();
  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const markRead = async (id) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    await fetch(`${API_URL}/api/messages/${id}/read`, { method: 'POST', headers: authHeaders() });
  };

  const openMessage = (msg) => {
    if (!msg.read) markRead(msg.id);
    setSelectedMsg(msg);
  };

  const markAllRead = async () => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    await fetch(`${API_URL}/api/messages/read-all`, { method: 'POST', headers: authHeaders() });
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      {/* Sticky glass header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.cardBorder}`, backgroundColor: theme.card,
        backdropFilter: theme.cardGlass || 'blur(16px)', WebkitBackdropFilter: theme.cardGlass || 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/dashboard" style={{ color: theme.text, display: 'flex' }}><ArrowLeft size={20} /></Link>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Messages</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 'bold', color: 'white', backgroundColor: theme.down,
              borderRadius: '10px', padding: '2px 8px', minWidth: '18px', textAlign: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, fontSize: '13px', fontWeight: 'bold' }}>
            Read all
          </button>
        )}
      </div>

      <div style={{ padding: '20px', maxWidth: '520px', margin: '0 auto' }}>
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', backgroundColor: iconBadges.teal.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <Inbox size={26} color={iconBadges.teal.fg} />
            </div>
            <p style={{ color: theme.faint, fontSize: '14px', margin: 0 }}>No messages yet</p>
          </div>
        )}

        {messages.map((m) => (
          <button
            key={m.id}
            onClick={() => openMessage(m)}
            style={{
              width: '100%', display: 'flex', gap: '12px', padding: '16px', textAlign: 'left',
              cursor: 'pointer', marginBottom: '10px', boxSizing: 'border-box', overflow: 'hidden',
              color: theme.text, fontFamily: 'inherit',
              ...glassCard(theme),
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              backgroundColor: m.read ? theme.primarySoft : iconBadges.blue.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: m.read ? theme.faint : iconBadges.blue.fg,
            }}>
              {m.read ? <MailOpen size={17} /> : <Mail size={17} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: m.read ? 'normal' : 'bold', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{m.title}</span>
                {!m.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: theme.down, flexShrink: 0, marginTop: '5px', marginLeft: '8px' }} />}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: theme.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{m.body}</p>
              <div style={{ fontSize: '11px', color: theme.faint, marginTop: '6px' }}>{new Date(m.at).toLocaleString()}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedMsg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} onClick={() => setSelectedMsg(null)}>
          <div style={{ ...glassCard(theme), padding: '24px', maxWidth: '420px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedMsg.title}</h3>
              <button onClick={() => setSelectedMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.faint, fontSize: '20px' }}>
                &times;
              </button>
            </div>
            <div style={{ fontSize: '11px', color: theme.faint, marginBottom: '16px' }}>{new Date(selectedMsg.at).toLocaleString()}</div>
            <p style={{ margin: 0, fontSize: '14px', color: theme.subtext, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedMsg.body}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
