import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { useSocket } from '../hooks/useSocket'
import useChatStore from '../store/chatStore'
import { Send, Trash2, ChevronUp, Loader2 } from 'lucide-react'

export default function TripChat({ tripId, currentUser }) {
  // ── Store (persists across tab switches & route changes) ──
  const { initMessages, prependMessages, addMessage, removeMessage, _getChat } = useChatStore()
  const { messages, hasMore, page, loaded } = _getChat(tripId)

  // ── Local UI-only state ───────────────────────────────────
  const [text,        setText]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [loadingOld,  setLoadingOld]  = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const typingTimer = useRef(null)

  const socket = useSocket(tripId)

  // ── Initial fetch — skipped if store already populated ────
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
  }, [tripId])  // only re-run if tripId changes

  // ── Scroll to bottom when messages first appear ───────────
  useEffect(() => {
    if (loaded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loaded])

  // ── Socket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const onNew     = (msg)        => addMessage(tripId, msg)
    const onDeleted = (msgId)      => removeMessage(tripId, msgId)
    const onTStart  = ({ user, socketId }) => {
      if (socketId === socket.id) return
      setTypingUsers(p => p.some(u => u.socketId === socketId) ? p : [...p, { user, socketId }])
    }
    const onTStop   = ({ socketId }) =>
      setTypingUsers(p => p.filter(u => u.socketId !== socketId))

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

  // ── Load older messages ───────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOld) return
    setLoadingOld(true)
    try {
      const nextPage = page + 1
      const res = await api.get(`/trips/${tripId}/messages?page=${nextPage}&limit=50`)
      const { messages: older, pagination } = res.data.data
      prependMessages(tripId, older, nextPage, nextPage < pagination.pages)
    } catch {
      toast.error('Failed to load older messages')
    } finally {
      setLoadingOld(false)
    }
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
      // Add our own message from API (socket broadcasts to others only)
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
    } catch {
      toast.error('Failed to delete')
    }
  }, [tripId])

  // ── Typing emit ───────────────────────────────────────────
  const handleInput = (e) => {
    setText(e.target.value)
    if (!socket) return
    socket.emit('typing-start', { tripId, user: currentUser?.name || 'Someone' })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing-stop', { tripId }), 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // ── Helpers ───────────────────────────────────────────────
  const isMe       = (msg) => (msg.sender?._id || msg.sender)?.toString() === currentUser?._id?.toString()
  const senderName = (msg) => msg.sender?.name || 'Unknown'
  const senderInit = (msg) => (msg.sender?.name?.[0] || '?').toUpperCase()
  const fmtTime    = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // ── JSX ───────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#07070f', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Header ── */}
      <div style={{ padding:'13px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px #34d399' }} />
        <span style={{ fontSize:13, fontWeight:600, color:'#c0c0d8', fontFamily:"'DM Sans',sans-serif" }}>Trip Chat</span>
        <span style={{ marginLeft:'auto', fontSize:11, color:'#404060' }}>{messages.length} messages</span>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:2 }}>

        {hasMore && (
          <button onClick={loadOlder} disabled={loadingOld}
            style={{ alignSelf:'center', display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'#606080', fontSize:12, cursor:loadingOld?'not-allowed':'pointer', marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}>
            {loadingOld ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> : <ChevronUp size={12} />}
            {loadingOld ? 'Loading…' : 'Load older messages'}
          </button>
        )}

        {!loaded && (
          <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
            <Loader2 size={22} color="#4f8ef7" style={{ animation:'spin 1s linear infinite' }} />
          </div>
        )}

        {loaded && messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#404060', fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>💬</div>
            No messages yet. Say hi!
          </div>
        )}

        {messages.map((msg, i) => {
          const mine    = isMe(msg)
          const prev    = messages[i - 1]
          const grouped = prev && (prev.sender?._id || prev.sender)?.toString() === (msg.sender?._id || msg.sender)?.toString()

          return (
            <div key={msg._id} className="ts-msg-row"
              style={{ display:'flex', flexDirection:mine?'row-reverse':'row', alignItems:'flex-end', gap:8, marginTop:grouped?2:10 }}>

              {!mine && (
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f8ef7,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, opacity:grouped?0:1 }}>
                  {senderInit(msg)}
                </div>
              )}

              <div style={{ maxWidth:'70%' }}>
                {!mine && !grouped && (
                  <p style={{ fontSize:11, color:'#606080', marginBottom:3, marginLeft:2, fontWeight:600 }}>{senderName(msg)}</p>
                )}
                <div style={{ position:'relative' }}>
                  <div style={{ padding:'9px 13px', borderRadius:mine?'14px 14px 4px 14px':'14px 14px 14px 4px', background:mine?'linear-gradient(135deg,#4f8ef7,#7c3aed)':'rgba(255,255,255,0.06)', color:mine?'#fff':'#d0d0e8', fontSize:13, lineHeight:1.55, wordBreak:'break-word', border:mine?'none':'1px solid rgba(255,255,255,0.07)' }}>
                    {msg.content}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3, justifyContent:mine?'flex-end':'flex-start' }}>
                    <span style={{ fontSize:10, color:'#404060' }}>{fmtTime(msg.createdAt)}</span>
                    {mine && (
                      <button className="ts-del-btn" onClick={() => deleteMsg(msg._id)}
                        style={{ background:'none', border:'none', color:'#505070', cursor:'pointer', padding:0, display:'flex', alignItems:'center', opacity:0, transition:'opacity .15s' }}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
            <div style={{ padding:'8px 14px', borderRadius:'14px 14px 14px 4px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#4f8ef7', display:'inline-block', animation:`bounce .9s ease ${i*0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize:11, color:'#404060' }}>{typingUsers.map(u => u.user).join(', ')} typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea ref={inputRef} rows={1} placeholder="Message… (Enter to send)"
            value={text} onChange={handleInput} onKeyDown={handleKeyDown}
            style={{ flex:1, padding:'10px 13px', borderRadius:11, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#f0f0f5', fontSize:13, outline:'none', resize:'none', fontFamily:"'DM Sans',sans-serif", lineHeight:1.5, maxHeight:96, overflowY:'auto', transition:'border-color .15s', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='#4f8ef7'}
            onBlur={e  => e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
          <button onClick={sendMessage} disabled={!text.trim()||sending}
            style={{ width:38, height:38, borderRadius:10, border:'none', background:text.trim()?'linear-gradient(135deg,#4f8ef7,#7c3aed)':'rgba(255,255,255,0.06)', color:text.trim()?'#fff':'#404060', display:'flex', alignItems:'center', justifyContent:'center', cursor:text.trim()?'pointer':'not-allowed', flexShrink:0, transition:'all .15s', boxShadow:text.trim()?'0 4px 14px rgba(79,142,247,0.3)':'none' }}>
            {sending ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Send size={14} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .ts-msg-row:hover .ts-del-btn { opacity:1 !important }
      `}</style>
    </div>
  )
}