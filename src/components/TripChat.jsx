import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../hooks/useSocket'
import useChatStore from '../store/chatStore'
import { useTheme } from '../context/ThemeContext'
import { Send, Trash2, ChevronUp, Loader2, MessageCircle } from 'lucide-react'


/* ── Single message row — uses React hover state so delete button works reliably ── */
function MessageRow({ msg, mine, grouped, T, avatarBg, senderInit, senderName, fmtTime, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', flexDirection:mine?'row-reverse':'row', alignItems:'flex-end', gap:8, marginTop:grouped?2:12, animation:'ts-fadein .2s ease' }}>

      {/* Avatar */}
      {!mine && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0, opacity:grouped?0:1, border:`2px solid ${T.bg}` }}>
          {senderInit}
        </div>
      )}

      <div style={{ maxWidth:'68%' }}>
        {!mine && !grouped && (
          <p style={{ fontSize:11, fontWeight:600, color:T.deepTeal, marginBottom:4, marginLeft:4 }}>{senderName}</p>
        )}
        <div>
          {/* Bubble */}
          <div style={{
            padding:'9px 13px',
            borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background:   mine ? `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})` : T.bgCard,
            color:        mine ? '#fff' : T.text,
            fontSize:     13, lineHeight:1.6, wordBreak:'break-word',
            border:       mine ? 'none' : `1px solid ${T.border}`,
            boxShadow:    mine ? `0 4px 16px ${T.deepTeal}30` : `0 1px 4px ${T.shadow}`,
          }}>
            {msg.content}
          </div>
          {/* Timestamp + delete */}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, justifyContent:mine?'flex-end':'flex-start' }}>
            <span style={{ fontSize:10, color:T.textMuted }}>{fmtTime(msg.createdAt)}</span>
            {mine && (
              <button
                onClick={() => onDelete(msg._id)}
                style={{ background:'none', border:'none', color:hovered?'#dc2626':T.textMuted, cursor:'pointer', padding:0, display:'flex', alignItems:'center', opacity:hovered?1:0, transition:'all .15s' }}>
                <Trash2 size={10}/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TripChat({ tripId, currentUser }) {
  const { T } = useTheme()

  const { initMessages, prependMessages, addMessage, removeMessage, _getChat } = useChatStore()
  const { messages, hasMore, page, loaded } = _getChat(tripId)

  const [text,        setText]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [loadingOld,  setLoadingOld]  = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)

  const socket = useSocket(tripId)

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    if (loaded) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/trips/${tripId}/messages?page=1&limit=50`)
        if (cancelled) return
        const { messages: msgs, pagination } = res.data.data
        initMessages(tripId, msgs, pagination.page < pagination.pages)
      } catch {
        if (!cancelled) toast.error('Could not load messages')
      }
    })()
    return () => { cancelled = true }
  }, [tripId])

  // ── Scroll to bottom on load ──────────────────────────────
  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages.length, loaded])

  // ── Socket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return
    const onNew     = msg          => addMessage(tripId, msg)
    const onDeleted = msgId        => removeMessage(tripId, msgId)
    const onTStart  = ({ user, socketId }) => {
      if (socketId === socket.id) return
      setTypingUsers(p => p.some(u => u.socketId === socketId) ? p : [...p, { user, socketId }])
    }
    const onTStop   = ({ socketId }) => setTypingUsers(p => p.filter(u => u.socketId !== socketId))

    socket.on('new-message',     onNew)
    socket.on('message-deleted', onDeleted)
    socket.on('typing-start',    onTStart)
    socket.on('typing-stop',     onTStop)
    return () => {
      socket.off('new-message',     onNew)
      socket.off('message-deleted', onDeleted)
      socket.off('typing-start',    onTStart)
      socket.off('typing-stop',     onTStop)
    }
  }, [socket, tripId])

  // ── Load older ────────────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOld) return
    setLoadingOld(true)
    try {
      const nextPage = page + 1
      const res = await api.get(`/trips/${tripId}/messages?page=${nextPage}&limit=50`)
      const { messages: older, pagination } = res.data.data
      prependMessages(tripId, older, nextPage, nextPage < pagination.pages)
    } catch { toast.error('Failed to load older messages') }
    finally  { setLoadingOld(false) }
  }, [hasMore, loadingOld, page, tripId])

  // ── Send ──────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const content = text.trim()
    if (!content || sending) return
    setText('')
    setSending(true)
    socket?.emit('typing-stop', { tripId })
    clearTimeout(typingTimer.current)
    try {
      const res = await api.post(`/trips/${tripId}/messages`, { content })
      addMessage(tripId, res.data.data)
    } catch {
      toast.error('Failed to send')
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [text, sending, socket, tripId])

  // ── Delete ────────────────────────────────────────────────
  const deleteMsg = useCallback(async (msgId) => {
    try {
      await api.delete(`/trips/${tripId}/messages/${msgId}`)
      removeMessage(tripId, msgId)
    } catch { toast.error('Failed to delete') }
  }, [tripId])

  // ── Typing emit ───────────────────────────────────────────
  const handleInput = e => {
    setText(e.target.value)
    if (!socket) return
    socket.emit('typing-start', { tripId, user: currentUser?.name || 'Someone' })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing-stop', { tripId }), 2000)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Helpers ───────────────────────────────────────────────
  const isMe       = msg => (msg.sender?._id || msg.sender)?.toString() === currentUser?._id?.toString()
  const senderName = msg => msg.sender?.name || 'Unknown'
  const senderInit = msg => (msg.sender?.name?.[0] || '?').toUpperCase()
  const fmtTime    = iso => new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })

  // Avatar colors cycling through brand palette
  const avatarBg = (msg) => {
    const colors = [T.deepTeal, T.sage, T.skyTeal, `${T.deepTeal}99`]
    const seed   = (msg.sender?._id || msg.sender || '').toString()
    return colors[seed.charCodeAt(seed.length - 1) % colors.length] || T.deepTeal
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:T.bgCard, borderRadius:16, overflow:'hidden', border:`1px solid ${T.border}`, fontFamily:"'DM Sans',sans-serif" }}>

      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes ts-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ts-chat-scroll::-webkit-scrollbar { width:3px }
        .ts-chat-scroll::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:'13px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10, flexShrink:0, background:T.bgCard }}>
        <div style={{ width:30, height:30, borderRadius:9, background:`${T.deepTeal}12`, border:`1px solid ${T.deepTeal}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MessageCircle size={14} color={T.deepTeal}/>
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1.2 }}>Trip Chat</p>
          <p style={{ fontSize:10, color:T.textMuted }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Live indicator */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:T.sage, boxShadow:`0 0 6px ${T.sage}`, animation:'ts-pulse 2s ease-in-out infinite' }}/>
          <span style={{ fontSize:10, color:T.textMuted, fontWeight:500 }}>Live</span>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="ts-chat-scroll"
        style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:2, background:T.bg }}>

        {/* Load older button */}
        {hasMore && (
          <button onClick={loadOlder} disabled={loadingOld}
            style={{ alignSelf:'center', display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMuted, fontSize:12, cursor:loadingOld?'not-allowed':'pointer', marginBottom:10, fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor=T.deepTeal}
            onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
            {loadingOld ? <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/> : <ChevronUp size={11}/>}
            {loadingOld ? 'Loading…' : 'Load older messages'}
          </button>
        )}

        {/* Initial loading */}
        {!loaded && (
          <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
            <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
          </div>
        )}

        {/* Empty state */}
        {loaded && messages.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 0', textAlign:'center' }}>
            <div style={{ width:50, height:50, borderRadius:14, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:12 }}>💬</div>
            <p style={{ fontSize:14, color:T.textMuted, fontWeight:500 }}>No messages yet.</p>
            <p style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Be the first to say something!</p>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => {
          const mine    = isMe(msg)
          const prev    = messages[i - 1]
          const grouped = prev && (prev.sender?._id || prev.sender)?.toString() === (msg.sender?._id || msg.sender)?.toString()
          return (
            <MessageRow
              key={msg._id}
              msg={msg}
              mine={mine}
              grouped={grouped}
              T={T}
              avatarBg={avatarBg(msg)}
              senderInit={senderInit(msg)}
              senderName={senderName(msg)}
              fmtTime={fmtTime}
              onDelete={deleteMsg}
            />
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, animation:'ts-fadein .2s ease' }}>
            <div style={{ padding:'8px 14px', borderRadius:'14px 14px 14px 4px', background:T.bgCard, border:`1px solid ${T.border}`, display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:T.deepTeal, display:'inline-block', animation:`bounce .9s ease ${i*0.15}s infinite` }}/>
              ))}
            </div>
            <span style={{ fontSize:11, color:T.textMuted, fontStyle:'italic' }}>
              {typingUsers.map(u => u.user).join(', ')} typing…
            </span>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* ── Input area ── */}
      <div style={{ padding:'10px 12px 12px', borderTop:`1px solid ${T.border}`, flexShrink:0, background:T.bgCard }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            ref={inputRef} rows={1}
            placeholder="Type a message… (Enter to send)"
            value={text} onChange={handleInput} onKeyDown={handleKeyDown}
            style={{ flex:1, padding:'10px 13px', borderRadius:11, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', resize:'none', fontFamily:"'DM Sans',sans-serif", lineHeight:1.55, maxHeight:96, overflowY:'auto', transition:'border-color .15s, box-shadow .15s', boxSizing:'border-box' }}
            onFocus={e => { e.target.style.borderColor=T.deepTeal; e.target.style.boxShadow=`0 0 0 3px ${T.deepTeal}14` }}
            onBlur={e  => { e.target.style.borderColor=T.border;   e.target.style.boxShadow='none' }}
          />
          <button onClick={sendMessage} disabled={!text.trim() || sending}
            style={{
              width:38, height:38, borderRadius:10, border:'none', flexShrink:0,
              background: text.trim()
                ? `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`
                : T.bgAlt,
              color:      text.trim() ? '#fff' : T.textMuted,
              display:    'flex', alignItems:'center', justifyContent:'center',
              cursor:     text.trim() ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
              boxShadow:  text.trim() ? `0 4px 14px ${T.deepTeal}35` : 'none',
            }}>
            {sending
              ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/>
              : <Send size={14}/>
            }
          </button>
        </div>
      </div>

      <style>{`@keyframes ts-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}