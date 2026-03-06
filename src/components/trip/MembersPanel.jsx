import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import {
  UserPlus, Trash2, Crown, Pencil, Eye, Copy,
  RefreshCw, Link2, Hash, X, Users, ChevronDown,
} from 'lucide-react'

const ROLE_CFG = {
  owner:  { label:'Owner',  icon:Crown,  accent: T => T.sage    },
  editor: { label:'Editor', icon:Pencil, accent: T => T.skyTeal  },
  viewer: { label:'Viewer', icon:Eye,    accent: T => T.textMuted },
}

const AVATAR_COLORS = T => [
  `${T.deepTeal}cc`, `${T.sage}cc`, `${T.skyTeal}cc`,
  `${T.deepTeal}99`, `${T.sage}99`, `${T.skyTeal}99`,
]

export default function MembersPanel({ trip, role, currentUserId }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [tab,        setTab]        = useState('email')
  const [inviteForm, setInviteForm] = useState({ email:'', role:'editor' })
  const [joinCode,   setJoinCode]   = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState(null)

  const accepted = trip.members?.filter(m => m.inviteStatus === 'accepted') || []
  const pending  = trip.members?.filter(m => m.inviteStatus === 'pending')  || []

  /* ── Mutations ── */
  const { mutate: invite, isPending: inviting } = useMutation({
    mutationFn: d => api.post(`/trips/${trip._id}/invite`, d).then(r => r.data.data),
    onSuccess: d => {
      toast.success('Invite sent!')
      setInviteLink(d.inviteLink)
      setInviteForm({ email:'', role:'editor' })
      qc.invalidateQueries({ queryKey:['trip', trip._id] })
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to send invite'),
  })

  const { mutate: regenCode, isPending: regening } = useMutation({
    mutationFn: () => api.post(`/trips/${trip._id}/invite-code/regenerate`).then(r => r.data.data),
    onSuccess: () => { toast.success('New code generated'); qc.invalidateQueries({ queryKey:['trip', trip._id] }) },
  })

  const { mutate: joinByCode, isPending: joining } = useMutation({
    mutationFn: code => api.post(`/trips/${trip._id}/join`, { code }).then(r => r.data.data),
    onSuccess: () => { toast.success('Joined trip!'); qc.invalidateQueries({ queryKey:['trip', trip._id] }); setJoinCode('') },
    onError: e => toast.error(e.response?.data?.message || 'Invalid code'),
  })

  const { mutate: updateRole } = useMutation({
    mutationFn: ({ userId, role }) => api.patch(`/trips/${trip._id}/members/${userId}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['trip', trip._id] }); toast.success('Role updated') },
  })

  const { mutate: removeMember } = useMutation({
    mutationFn: userId => api.delete(`/trips/${trip._id}/members/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['trip', trip._id] }); toast.success('Member removed') },
  })

  const copy = (text, label) => { navigator.clipboard.writeText(text); toast.success(`${label} copied!`) }

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ maxWidth:680, fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, gap:12, flexWrap:'wrap' }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.textMuted, marginBottom:4 }}>Trip</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:T.text, lineHeight:1 }}>Members</h2>
          <p style={{ fontSize:12, color:T.textMuted, marginTop:5 }}>
            <Users size={11} style={{ display:'inline', marginRight:4 }} color={T.skyTeal}/>
            {accepted.length} member{accepted.length !== 1 ? 's' : ''}
            {pending.length > 0 && <span style={{ marginLeft:8, color:T.textMuted }}>· {pending.length} pending</span>}
          </p>
        </div>
        {role === 'owner' && (
          <button onClick={() => setShowInvite(p => !p)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, border: showInvite ? `1.5px solid ${T.deepTeal}` : 'none', background: showInvite ? `${T.deepTeal}12` : `linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color: showInvite ? T.deepTeal : '#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow: showInvite ? 'none' : `0 4px 14px ${T.deepTeal}35`, transition:'all .2s' }}>
            {showInvite ? <X size={13}/> : <UserPlus size={13}/>}
            {showInvite ? 'Close' : 'Invite'}
          </button>
        )}
      </div>

      {/* ── Invite panel ── */}
      {showInvite && role === 'owner' && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'18px', marginBottom:20, boxShadow:`0 4px 20px ${T.shadow}` }}>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:4, background:T.bgAlt, borderRadius:9, padding:4, marginBottom:18 }}>
            {[
              { id:'email', icon:Link2,  label:'Invite by Email' },
              { id:'code',  icon:Hash,   label:'Invite Code'     },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'7px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                  background: tab===t.id ? T.bgCard : 'none',
                  color:      tab===t.id ? T.deepTeal : T.textMuted,
                  border:     tab===t.id ? `1px solid ${T.border}` : '1px solid transparent',
                  boxShadow:  tab===t.id ? `0 1px 4px ${T.shadow}` : 'none',
                }}>
                <t.icon size={11}/>{t.label}
              </button>
            ))}
          </div>

          {/* Email tab */}
          {tab === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <input type="email" placeholder="colleague@email.com" style={{ ...IS, flex:'1 1 180px' }}
                  value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email:e.target.value }))}
                  onFocus={focus} onBlur={blur}/>

                {/* Role select */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <select style={{ ...IS, width:'auto', paddingRight:30, cursor:'pointer', appearance:'none' }}
                    value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role:e.target.value }))}
                    onFocus={focus} onBlur={blur}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown size={11} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
                </div>

                <button onClick={() => inviteForm.email && invite(inviteForm)} disabled={!inviteForm.email || inviting}
                  style={{ padding:'10px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:(!inviteForm.email||inviting)?'not-allowed':'pointer', opacity:(!inviteForm.email||inviting)?.6:1, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', boxShadow:`0 4px 14px ${T.deepTeal}30` }}>
                  {inviting ? 'Sending…' : 'Send Invite'}
                </button>
              </div>

              {/* Manual link fallback */}
              {inviteLink && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:9 }}>
                  <p style={{ fontSize:11, color:T.textMuted, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <span style={{ color:T.deepTeal, fontWeight:600 }}>Link: </span>{inviteLink}
                  </p>
                  <button onClick={() => copy(inviteLink, 'Invite link')}
                    style={{ background:'none', border:'none', color:T.textMuted, cursor:'pointer', display:'flex', flexShrink:0, transition:'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color=T.deepTeal}
                    onMouseLeave={e => e.currentTarget.style.color=T.textMuted}>
                    <Copy size={13}/>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Code tab */}
          {tab === 'code' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.6 }}>
                Share this code — anyone can join instantly as a Viewer. You can change their role afterwards.
              </p>

              {/* Code display */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px', background:T.bgAlt, border:`1px solid ${T.border}`, borderRadius:12 }}>
                <div style={{ flex:1, textAlign:'center' }}>
                  <p style={{ fontSize:9, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.textMuted, marginBottom:8 }}>Invite Code</p>
                  <p style={{ fontSize:32, fontWeight:800, letterSpacing:'0.35em', color:T.text, fontFamily:'monospace', lineHeight:1 }}>
                    {trip.inviteCode || '——————'}
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <button onClick={() => copy(trip.inviteCode, 'Invite code')} title="Copy code"
                    style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color=T.deepTeal; e.currentTarget.style.borderColor=T.deepTeal }}
                    onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
                    <Copy size={13}/>
                  </button>
                  <button onClick={() => regenCode()} disabled={regening} title="Generate new code"
                    style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgCard, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:regening?'not-allowed':'pointer', transition:'all .15s', opacity:regening?.6:1 }}
                    onMouseEnter={e => { e.currentTarget.style.color='#d97706'; e.currentTarget.style.borderColor='rgba(217,119,6,.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border }}>
                    <RefreshCw size={13} style={{ animation:regening?'spin 1s linear infinite':'none' }}/>
                  </button>
                </div>
              </div>

              <button onClick={() => copy(`Join my trip "${trip.title}" on TripSync!\nTrip ID: ${trip._id}\nInvite Code: ${trip.inviteCode}`, 'Invite details')}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px', borderRadius:9, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=T.deepTeal}
                onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                <Copy size={11}/> Copy invite details
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Join by code (viewer) ── */}
      {role === 'viewer' && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px 18px', marginBottom:20 }}>
          <p style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
            <Hash size={12} color={T.deepTeal}/> Join another trip with code
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <input placeholder="Enter 6-digit code" maxLength={6} style={{ ...IS, flex:1, letterSpacing:'0.25em', textTransform:'uppercase', fontFamily:'monospace' }}
              value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onFocus={focus} onBlur={blur}/>
            <button onClick={() => joinCode.length === 6 && joinByCode(joinCode)} disabled={joinCode.length !== 6 || joining}
              style={{ padding:'10px 18px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:(joinCode.length!==6||joining)?'not-allowed':'pointer', opacity:(joinCode.length!==6||joining)?.6:1, fontFamily:"'DM Sans',sans-serif" }}>
              {joining ? 'Joining…' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* ── Member list ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
        {accepted.map((member, i) => {
          const cfg    = ROLE_CFG[member.role] || ROLE_CFG.viewer
          const Icon   = cfg.icon
          const accent = cfg.accent(T)
          const isMe   = member.user?._id === currentUserId || member.user === currentUserId
          const isOwner = member.role === 'owner'
          const avatarBg = AVATAR_COLORS(T)[i % 6]

          return (
            <MemberRow key={member._id}
              member={member} isMe={isMe} isOwner={isOwner}
              cfg={cfg} Icon={Icon} accent={accent} avatarBg={avatarBg}
              canEdit={role === 'owner' && !isOwner && !isMe}
              T={T}
              onRoleChange={r => updateRole({ userId: member.user?._id || member.user, role: r })}
              onRemove={() => confirm('Remove this member?') && removeMember(member.user?._id || member.user)}
            />
          )
        })}
      </div>

      {/* ── Pending invites ── */}
      {pending.length > 0 && (
        <div>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.textMuted, marginBottom:10 }}>Pending Invites</p>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {pending.map(m => (
              <div key={m._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:T.bgCard, border:`1px dashed ${T.border}`, borderRadius:12 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:T.bgAlt, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:T.textMuted, flexShrink:0 }}>?</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:T.textMid, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.inviteEmail || 'Invited user'}</p>
                  <p style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Pending · {m.role}</p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#d97706', background:'rgba(217,119,6,.1)', border:'1px solid rgba(217,119,6,.25)', padding:'3px 10px', borderRadius:20 }}>Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Member row — own component for hover state ── */
function MemberRow({ member, isMe, isOwner, cfg, Icon, accent, avatarBg, canEdit, T, onRoleChange, onRemove }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'13px 14px',
        background: hovered ? T.bgCardAlt : T.bgCard,
        border:`1px solid ${hovered ? `${accent}30` : T.border}`,
        borderRadius:13, transition:'all .15s',
      }}>

      {/* Avatar */}
      <div style={{ width:38, height:38, borderRadius:'50%', background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0, overflow:'hidden', border:`2px solid ${T.bgCard}` }}>
        {member.user?.avatar
          ? <img src={member.user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : member.user?.name?.[0]?.toUpperCase() || '?'
        }
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:700, color:T.text, display:'flex', alignItems:'center', gap:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {member.user?.name || 'Unknown'}
          {isMe && <span style={{ fontSize:10, color:T.textMuted, fontWeight:500 }}>(you)</span>}
        </p>
        <p style={{ fontSize:11, color:T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>{member.user?.email}</p>
      </div>

      {/* Role badge */}
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, letterSpacing:.3, background:`${accent}14`, color:accent, border:`1px solid ${accent}28`, flexShrink:0 }}>
        <Icon size={10}/>{cfg.label}
      </span>

      {/* Owner controls */}
      {canEdit && (
        <div style={{ display:'flex', gap:6, alignItems:'center', opacity:hovered?1:.5, transition:'opacity .15s' }}>
          <div style={{ position:'relative' }}>
            <select
              value={member.role} onChange={e => onRoleChange(e.target.value)}
              style={{ padding:'5px 26px 5px 9px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMid, fontSize:12, fontWeight:500, cursor:'pointer', outline:'none', appearance:'none', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor=T.deepTeal}
              onBlur={e => e.target.style.borderColor=T.border}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <ChevronDown size={10} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
          </div>
          <button onClick={onRemove}
            style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,.3)'; e.currentTarget.style.background='rgba(220,38,38,.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
            <Trash2 size={12}/>
          </button>
        </div>
      )}
    </div>
  )
}