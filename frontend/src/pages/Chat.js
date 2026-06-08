import React, {
  useState, useEffect, useCallback, useRef, useMemo
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getConversations, startConversation, getMessages, getUsers
} from '../api';
import useWebSocket from '../hooks/useWebSocket';
import Avatar from '../components/Avatar';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import './Chat.css';

/* ─── Helpers ─── */
function fmtShort(ts) {
  try {
    const d = parseISO(ts);
    if (isToday(d))     return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'd MMM');
  } catch { return ''; }
}
function fmtTime(ts) {
  try { return format(parseISO(ts), 'HH:mm'); } catch { return ''; }
}
function fmtDay(day) {
  try {
    const d = parseISO(day);
    if (isToday(d))     return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  } catch { return day; }
}

/* ─── New-chat modal ─── */
function NewChatModal({ onClose, onStart }) {
  const [q,       setQ]       = useState('');
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getUsers(q)
      .then(r => { if (alive) { setUsers(r.data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [q]);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-ttl">New conversation</span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-search-wrap">
          <input className="inp modal-inp" autoFocus
            placeholder="Search by username…" value={q}
            onChange={e => setQ(e.target.value)} />
        </div>
        <div className="modal-list">
          {loading && (
            <div className="modal-empty">
              <div className="spin" style={{ width:24, height:24 }} />
            </div>
          )}
          {!loading && !users.length && (
            <div className="modal-empty">No users found</div>
          )}
          {!loading && users.map(u => (
            <div key={u.id} className="modal-user" onClick={() => onStart(u)}>
              <Avatar user={u} size={42} />
              <div className="modal-uinfo">
                <span className="modal-uname">{u.username}</span>
                {u.bio && <span className="modal-ubio">{u.bio}</span>}
              </div>
              <div className={`dot ${u.is_online ? 'on':'off'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar conversation item ─── */
function ConvItem({ conv, active, myId, onClick }) {
  const other = conv.other_user;
  const last  = conv.last_message;
  return (
    <div className={`conv ${active ? 'conv-active':''}`} onClick={onClick}>
      <div className="conv-av-wrap">
        <Avatar user={other} size={46} />
        <div className={`dot conv-dot ${other?.is_online ? 'on':'off'}`} />
      </div>
      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{other?.username}</span>
          {last && <span className="conv-ts">{fmtShort(last.timestamp)}</span>}
        </div>
        <div className="conv-bot">
          <span className="conv-preview">
            {last
              ? (last.sender_id === myId ? 'You: ' : '') + last.content
              : 'Start conversation'}
          </span>
          {conv.unread_count > 0 && (
            <span className="unread">{conv.unread_count}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Chat() {
  const { id: urlId }    = useParams();
  const nav              = useNavigate();
  const { user, logout } = useAuth();

  const [convs,      setConvs]      = useState([]);
  const [active,     setActive]     = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [showNew,    setShowNew]    = useState(false);
  const [sideOpen,   setSideOpen]   = useState(true);
  const [loadMsgs,   setLoadMsgs]   = useState(false);
  const [sideSearch, setSideSearch] = useState('');

  // FIX: keep a ref to active so WebSocket callback always sees current value
  const activeRef   = useRef(active);
  activeRef.current = active;

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const typTimer    = useRef(null);
  const myId        = user?.id;

  /* ── Load conversations ── */
  const loadConvs = useCallback(async () => {
    try {
      const { data } = await getConversations();
      setConvs(data);
      return data;
    } catch(err) {
      console.error('loadConvs failed', err);
      return [];
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  /* ── Sync active conv from URL ── */
  useEffect(() => {
    if (!urlId) {
      setActive(null);
      setMessages([]);
      return;
    }
    const found = convs.find(c => c.id === +urlId);
    if (found) setActive(found);
  }, [urlId, convs]);

  /* ── Load messages when conversation changes ── */
  useEffect(() => {
    if (!active) return;
    setLoadMsgs(true);
    setMessages([]); // clear old messages immediately
    getMessages(active.id)
      .then(r => { setMessages(r.data); })
      .catch(err => console.error('getMessages failed', err))
      .finally(() => setLoadMsgs(false));
  }, [active?.id]); // only re-run when the ID actually changes

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  /* ── WebSocket message handler ── */
  // FIX: no dependency on `active` — use activeRef.current instead
  const handleWS = useCallback(data => {
    console.log('[WS received]', data);

    if (data.type === 'message') {
      // Add message to list (deduplicate by id)
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, {
          id:        data.id,
          content:   data.content,
          timestamp: data.timestamp,
          is_read:   false,
          sender: {
            id:         data.sender_id,
            username:   data.sender_username,
            avatar_url: data.sender_avatar,
          },
        }];
      });

      // Update conversation preview in sidebar
      // FIX: use activeRef.current so we always have the current conv id
      const currentConvId = activeRef.current?.id;
      setConvs(prev =>
        prev
          .map(c => c.id === currentConvId
            ? {
                ...c,
                last_message: {
                  content:   data.content,
                  timestamp: data.timestamp,
                  sender_id: data.sender_id,
                },
                updated_at: data.timestamp,
                unread_count: 0,  // we're looking at it right now
              }
            : c
          )
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      );

      setTypingUser(null);
    }

    if (data.type === 'typing') {
      setTypingUser(data.is_typing ? data.username : null);
    }

    if (data.type === 'status') {
      setConvs(prev => prev.map(c =>
        c.other_user?.id === data.user_id
          ? { ...c, other_user: { ...c.other_user, is_online: data.is_online } }
          : c
      ));
    }
  }, []); // stable — no deps needed because we use refs

  const send = useWebSocket(active?.id, handleWS);

  /* ── Send message ── */
  const sendMsg = () => {
    const t = text.trim();
    if (!t || !active) return;
    send({ type: 'message', content: t });
    setText('');
    textareaRef.current?.focus();
  };

  /* ── Typing indicator ── */
  const onType = e => {
    setText(e.target.value);
    send({ type: 'typing', is_typing: true });
    clearTimeout(typTimer.current);
    typTimer.current = setTimeout(() => send({ type: 'typing', is_typing: false }), 1500);
  };

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  /* ── Start conversation ── */
  const startChat = async otherUser => {
    setShowNew(false);
    try {
      const { data } = await startConversation(otherUser.id);
      await loadConvs();
      nav(`/chat/${data.id}`);
      if (window.innerWidth < 768) setSideOpen(false);
    } catch(err) {
      console.error('startConversation failed', err);
    }
  };

  const openConv = conv => {
    setActive(conv);
    nav(`/chat/${conv.id}`);
    if (window.innerWidth < 768) setSideOpen(false);
  };

  /* ── Group messages by date ── */
  const grouped = useMemo(() => {
    return messages.reduce((acc, msg) => {
      const day = msg.timestamp ? msg.timestamp.slice(0, 10) : 'unknown';
      (acc[day] = acc[day] || []).push(msg);
      return acc;
    }, {});
  }, [messages]);

  /* ── Filtered sidebar search ── */
  const filteredConvs = useMemo(() =>
    sideSearch
      ? convs.filter(c =>
          c.other_user?.username?.toLowerCase().includes(sideSearch.toLowerCase())
        )
      : convs,
    [convs, sideSearch]
  );

  const other = active?.other_user;

  return (
    <div className="chat-root">

      {/* ══ SIDEBAR ══ */}
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`}>

        <div className="sb-head">
          <div className="sb-brand">
            <span className="sb-logo">💬</span>
            <span className="sb-title">Chat</span>
          </div>
          <button className="btn btn-primary sb-new" title="New chat"
            onClick={() => setShowNew(true)}>+</button>
        </div>

        {/* My profile strip */}
        <div className="sb-me" onClick={() => nav('/profile')}>
          <Avatar user={user} size={36} />
          <div className="sb-me-info">
            <span className="sb-me-name">{user?.username}</span>
            <span className="sb-me-status">● Online</span>
          </div>
          <button className="sb-logout" title="Sign out"
            onClick={e => { e.stopPropagation(); logout(); nav('/login'); }}>↩</button>
        </div>

        {/* Search */}
        <div className="sb-search-wrap">
          <input className="inp sb-search" placeholder="Search conversations…"
            value={sideSearch} onChange={e => setSideSearch(e.target.value)} />
        </div>

        {/* List */}
        <div className="sb-list">
          {filteredConvs.length === 0 && (
            <div className="sb-empty">
              <span>No conversations yet</span>
              <p>Tap + to start one</p>
            </div>
          )}
          {filteredConvs.map(c => (
            <ConvItem key={c.id} conv={c} myId={myId}
              active={c.id === active?.id} onClick={() => openConv(c)} />
          ))}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="chat-main">
        {!active ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h2 className="empty-h">Your messages</h2>
            <p className="empty-p">Pick a conversation or start a new one</p>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              New conversation
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-head">
              <button className="btn btn-ghost mobile-back"
                onClick={() => { setSideOpen(true); nav('/chat'); }}>←</button>
              <Avatar user={other} size={40} />
              <div className="chat-head-info">
                <span className="chat-head-name">{other?.username}</span>
                <span className="chat-head-status">
                  {other?.is_online
                    ? <><span className="dot on" style={{ display:'inline-block', marginRight:4 }} />Online</>
                    : 'Offline'}
                </span>
              </div>
              <button className="btn btn-ghost head-edit" title="Edit profile"
                onClick={() => nav('/profile')}>⚙</button>
            </div>

            {/* Messages */}
            <div className="messages">
              {loadMsgs && (
                <div className="msgs-loading">
                  <div className="spin" style={{ width:32, height:32 }} />
                </div>
              )}

              {!loadMsgs && messages.length === 0 && (
                <div className="msgs-empty">
                  No messages yet — say hello! 👋
                </div>
              )}

              {!loadMsgs && Object.entries(grouped).map(([day, msgs]) => (
                <div key={day}>
                  <div className="day-sep"><span>{fmtDay(day)}</span></div>
                  {msgs.map((msg, i) => {
                    const isMe   = msg.sender?.id === myId;
                    const prev   = i > 0 ? msgs[i - 1] : null;
                    const showAv = !isMe && (!prev || prev.sender?.id !== msg.sender?.id);
                    return (
                      <div key={msg.id} className={`msg-row ${isMe ? 'me' : 'them'}`}>
                        {!isMe && (
                          <div className="msg-av">
                            {showAv
                              ? <Avatar user={msg.sender} size={30} />
                              : <div style={{ width:30 }} />}
                          </div>
                        )}
                        <div className="msg-wrap">
                          <div className={`bubble ${isMe ? 'bme' : 'bthem'}`}>
                            {msg.content}
                          </div>
                          <div className={`msg-meta ${isMe ? 'meta-r' : 'meta-l'}`}>
                            {fmtTime(msg.timestamp)}
                            {isMe && (
                              <span className="read-tick">
                                {msg.is_read ? ' ✓✓' : ' ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {typingUser && (
                <div className="typing-row">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                  <span className="typing-lbl">{typingUser} is typing…</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="chat-bar">
              <textarea
                ref={textareaRef}
                className="chat-inp"
                placeholder="Message…"
                rows={1}
                value={text}
                onChange={onType}
                onKeyDown={onKey}
              />
              <button
                className={`send ${text.trim() ? 'send-on' : ''}`}
                onClick={sendMsg}
                disabled={!text.trim()}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </main>

      {showNew && (
        <NewChatModal onClose={() => setShowNew(false)} onStart={startChat} />
      )}
    </div>
  );
}