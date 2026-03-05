import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, MessageCircle, Trash2, ChevronDown, Loader2 } from 'lucide-react'
import api from '../lib/axios'
import { useSocket } from '../hooks/useSocket'

/* ── helpers ── */
function formatTime(iso) {
  const d = new Date(iso), now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ user, size = 32 }) {
  const hue = (user?.name?.charCodeAt(0) || 65) * 13 % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: user?.avatar ? undefined : `hsl(${hue},55%,45%)`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff' }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.name?.[0]?.toUpperCase() || '?')}
    </div>
  )
}

export default function TripChat({ tripId, currentUser }) {
  // Pass tripId so the socket is connected and in the right room
  const socket      = useSocket(tripId)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)

  const [input,       setInput]       = useState('')
  const [messages,    setMessages]    = useState([])
  const [typers,      setTypers]      = useState({})
  const [atBottom,    setAtBottom]    = useState(true)
  const [page,        setPage]        = useState(1)
  const [hasMore,     setHasMore]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Initial load ──────────────────────────────────────────
  const { isLoading } = useQuery({
    queryKey: ['messages', tripId],
    queryFn: () => api.get(`/trips/${tripId}/messages?page=1&limit=50`).then(r => r.data.data),
    onSuccess: (data) => {
      setMessages(data.messages)
      setHasMore(data.pagination.page < data.pagination.pages)
      setTimeout(() => scrollToBottom('auto'), 50)
    },
  })

  // ── Load older messages ───────────────────────────────────
  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const { data } = await api.get(`/trips/${tripId}/messages?page=${nextPage}&limit=50`)
      setMessages(prev => [...data.data.messages, ...prev])
      setHasMore(nextPage < data.data.pagination.pages)
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }

  // ── Send message ──────────────────────────────────────────
  const { mutate: sendMsg, isPending: sending } = useMutation({
    mutationFn: content => api.post(`/trips/${tripId}/messages`, { content }).then(r => r.data.data),
    onSuccess: (msg) => {
      // Socket will broadcast to others; add locally only if not already present
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg])
      setTimeout(() => scrollToBottom(), 50)
    },
  })

  const { mutate: deleteMsg } = useMutation({
    mutationFn: msgId => api.delete(`/trips/${tripId}/messages/${msgId}`),
    onSuccess: (_, msgId) => setMessages(prev => prev.filter(m => m._id !== msgId)),
  })

  // ── Socket listeners ──────────────────────────────────────
  // NOTE: Do NOT emit join:trip here — TripDetail's useSocket(tripId) already
  // joins the room. Emitting again would cause duplicate room joins.
  useEffect(() => {
    if (!socket) return

    const onNewMessage = (msg) => {
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg])
      setAtBottom(prev => {
        if (prev) setTimeout(() => scrollToBottom(), 50)
        return prev
      })
    }

    const onDeleted = (msgId) => {
      setMessages(prev => prev.filter(m => m._id !== msgId))
    }

    const onTypingStart = ({ user, socketId }) => {
      // Don't show own typing indicator
      if (socketId === socket.id) return
      setTypers(prev => ({ ...prev, [socketId]: user?.name || 'Someone' }))
    }

    const onTypingStop = ({ socketId }) => {
      setTypers(prev => { const n = { ...prev }; delete n[socketId]; return n })
    }

    socket.on('new-message',     onNewMessage)
    socket.on('message-deleted', onDeleted)
    socket.on('typing-start',    onTypingStart)
    socket.on('typing-stop',     onTypingStop)

    return () => {
      socket.off('new-message',     onNewMessage)
      socket.off('message-deleted', onDeleted)
      socket.off('typing-start',    onTypingStart)
      socket.off('typing-stop',     onTypingStop)
    }
  }, [socket])

  const scrollToBottom = (behavior = 'smooth') =>
    bottomRef.current?.scrollIntoView({ behavior })

  // ── Input handling ────────────────────────────────────────
  const handleInput = (e) => {
    setInput(e.target.value)
    if (socket) {
      socket.emit('typing-start', { tripId, user: currentUser })
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socket.emit('typing-stop', { tripId })
      }, 1500)
    }
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    clearTimeout(typingTimer.current)
    if (socket) socket.emit('typing-stop', { tripId })
    sendMsg(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const typerNames = Object.values(typers)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07070f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <MessageCircle size={16} color="#60a5fa" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5' }}>Trip Chat</span>
        <span style={{ fontSize: 11, color: '#505070', marginLeft: 'auto' }}>Members only</span>
      </div>

      {/* Messages area */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}
        onScroll={e => {
          const el = e.currentTarget
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
        }}
      >
        {hasMore && (
          <button onClick={loadMore} disabled={loadingMore}
            style={{ alignSelf: 'center', marginBottom: 8, padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#606080', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loadingMore ? 'Loading...' : 'Load older messages'}
          </button>
        )}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={22} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f5', marginBottom: 6 }}>No messages yet</p>
            <p style={{ fontSize: 12, color: '#505070' }}>Start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe       = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id
          const prevMsg    = messages[i - 1]
          const sameSender = prevMsg?.sender?._id
            ? prevMsg.sender._id === msg.sender?._id
            : prevMsg?.sender === msg.sender?._id
          const showAvatar = !isMe && !sameSender

          return (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={isMe}
              showAvatar={showAvatar}
              sameSender={sameSender}
              onDelete={isMe ? () => deleteMsg(msg._id) : null}
            />
          )
        })}

        {/* Typing indicator */}
        {typerNames.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 3, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, borderBottomLeftRadius: 4 }}>
              {[0,1,2].map(d => (
                <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#606080', display: 'inline-block', animation: `bounce 1s ${d * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#505070' }}>
              {typerNames.length === 1 ? typerNames[0] : `${typerNames.length} people`} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {!atBottom && (
        <button onClick={() => scrollToBottom()}
          style={{ position: 'absolute', bottom: 70, right: 16, width: 32, height: 32, borderRadius: '50%', background: '#14142a', border: '1px solid rgba(255,255,255,0.15)', color: '#c0c0d8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10 }}>
          <ChevronDown size={14} />
        </button>
      )}

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: '#0a0a18' }}>
        <textarea
          ref={inputRef} rows={1}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f5', fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
          onFocus={e => e.target.style.borderColor = '#4f8ef7'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button onClick={handleSend} disabled={!input.trim() || sending}
          style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: input.trim() ? 'linear-gradient(135deg,#4f8ef7,#7c3aed)' : 'rgba(255,255,255,0.06)', color: input.trim() ? '#fff' : '#404060', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all .15s', flexShrink: 0 }}>
          <Send size={15} />
        </button>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0) } 40% { transform: translateY(-5px) } }
        textarea::placeholder { color: #404060 }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px }
      `}</style>
    </div>
  )
}

function MessageBubble({ msg, isMe, showAvatar, sameSender, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: sameSender ? 2 : 10 }}
    >
      {!isMe && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {showAvatar && <Avatar user={msg.sender} size={28} />}
        </div>
      )}

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {showAvatar && !isMe && (
          <span style={{ fontSize: 11, color: '#606080', marginBottom: 3, marginLeft: 4 }}>
            {msg.sender?.name || 'Unknown'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
          <div style={{
            padding: '8px 12px',
            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isMe ? 'linear-gradient(135deg,#4f8ef7,#7c3aed)' : 'rgba(255,255,255,0.07)',
            color: isMe ? '#fff' : '#e0e0f0',
            fontSize: 13, lineHeight: 1.55, wordBreak: 'break-word',
            border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
          }}>
            {msg.content}
          </div>

          {onDelete && hovered && (
            <button onClick={onDelete}
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(248,113,113,0.12)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <span style={{ fontSize: 10, color: '#404060', marginTop: 3, marginLeft: isMe ? 0 : 4, marginRight: isMe ? 4 : 0 }}>
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  )
}