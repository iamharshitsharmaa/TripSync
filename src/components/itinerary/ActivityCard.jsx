import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import CommentThread from '../comments/CommentThread'
import { Clock, MapPin, Wallet, Trash2, Pencil, MessageSquare, GripVertical, X, FileText } from 'lucide-react'

const TYPES = [
  { value:'activity',  label:'Activity',     emoji:'🎯' },
  { value:'food',      label:'Food & Dining', emoji:'🍽️' },
  { value:'transport', label:'Transport',     emoji:'🚌' },
  { value:'lodging',   label:'Lodging',       emoji:'🏨' },
  { value:'other',     label:'Other',         emoji:'📌' },
]

const TYPE_CFG = Object.fromEntries(TYPES.map(t => [t.value, t]))

export default function ActivityCard({ activity, tripId, role, dragHandleProps }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [hovered,      setHovered]      = useState(false)

  const cfg = TYPE_CFG[activity.type] || TYPE_CFG.other

  const { mutate: deleteActivity } = useMutation({
    mutationFn: () => api.delete(`/activities/${activity._id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['activities', tripId] }); toast.success('Deleted') },
    onError:    () => toast.error('Failed to delete'),
  })

  if (editing) return <EditActivityForm activity={activity} tripId={tripId} onClose={() => setEditing(false)} T={T} />

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   hovered ? T.bgCardAlt : T.bgCard,
        border:       `1px solid ${hovered ? T.deepTeal+'2e' : T.borderCard}`,
        borderRadius: 12, overflow:'hidden',
        transition:   'background .15s, border-color .15s',
      }}>

      <div style={{ padding:'12px 13px 8px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>

          {/* Drag handle */}
          {role !== 'viewer' && (
            <div {...dragHandleProps} style={{ marginTop:2, color:T.textMuted, cursor:'grab', flexShrink:0, opacity: hovered ? 1 : 0, transition:'opacity .15s' }}>
              <GripVertical size={14}/>
            </div>
          )}

          <div style={{ flex:1, minWidth:0 }}>
            {/* Type badge */}
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, letterSpacing:.3, marginBottom:6,
              background:`${T.deepTeal}10`, color:T.deepTeal, border:`1px solid ${T.deepTeal}22`,
              fontFamily:"'DM Sans',sans-serif" }}>
              {cfg.emoji} {cfg.label}
            </span>

            <h4 style={{ fontSize:13, fontWeight:700, color:T.text, lineHeight:1.3, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
              {activity.title}
            </h4>

            <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:11, color:T.textMuted }}>
              {(activity.startTime || activity.endTime) && (
                <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <Clock size={10} color={T.skyTeal}/>{activity.startTime}{activity.endTime ? ` – ${activity.endTime}` : ''}
                </span>
              )}
              {activity.location && (
                <span style={{ display:'flex', alignItems:'center', gap:3, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  <MapPin size={10} color={T.sage}/>{activity.location}
                </span>
              )}
              {activity.estimatedCost > 0 && (
                <span style={{ display:'flex', alignItems:'center', gap:3, color:T.deepTeal, fontWeight:600 }}>
                  <Wallet size={10}/>{activity.estimatedCost}
                </span>
              )}
            </div>

            {activity.notes && (
              <p style={{ marginTop:6, fontSize:11, color:T.textMuted, lineHeight:1.55, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {activity.notes}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {role !== 'viewer' && (
            <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, opacity:hovered?1:0, transition:'opacity .15s' }}>
              <button onClick={() => setEditing(true)}
                style={{ width:26, height:26, borderRadius:7, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color=T.deepTeal; e.currentTarget.style.borderColor=T.deepTeal; e.currentTarget.style.background=`${T.deepTeal}10` }}
                onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
                <Pencil size={11}/>
              </button>
              <button onClick={() => { if (confirm('Delete this activity?')) deleteActivity() }}
                style={{ width:26, height:26, borderRadius:7, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,.3)'; e.currentTarget.style.background='rgba(220,38,38,.07)' }}
                onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
                <Trash2 size={11}/>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments footer */}
      <div style={{ padding:'2px 13px 10px' }}>
        <button onClick={() => setShowComments(p => !p)}
          style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:500, color:showComments?T.deepTeal:T.textMuted, background:'none', border:'none', cursor:'pointer', padding:0, transition:'color .15s', fontFamily:"'DM Sans',sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color=T.deepTeal}
          onMouseLeave={e => e.currentTarget.style.color=showComments?T.deepTeal:T.textMuted}>
          <MessageSquare size={11}/>{showComments ? 'Hide comments' : 'Comments'}
        </button>
      </div>

      {showComments && (
        <div style={{ borderTop:`1px solid ${T.border}`, padding:'12px 13px' }}>
          <CommentThread tripId={tripId} entityType="activity" entityId={activity._id}/>
        </div>
      )}
    </div>
  )
}

/* ── Inline Edit Form ── */
function EditActivityForm({ activity, tripId, onClose, T }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title:         activity.title         || '',
    type:          activity.type          || 'activity',
    startTime:     activity.startTime     || '',
    endTime:       activity.endTime       || '',
    location:      activity.location      || '',
    notes:         activity.notes         || '',
    estimatedCost: activity.estimatedCost || '',
  })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: d => api.patch(`/activities/${activity._id}`, d),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['activities', tripId] }); onClose() },
    onError:    () => toast.error('Failed to save'),
  })

  const IS = { width:'100%', padding:'8px 11px', borderRadius:8, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ padding:'13px', background:T.bgCard, borderRadius:12, border:`1.5px solid ${T.deepTeal}35`, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
        <span style={{ fontSize:10, fontWeight:800, color:T.deepTeal, textTransform:'uppercase', letterSpacing:1.5 }}>Edit Activity</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:T.textMuted, cursor:'pointer', display:'flex' }}><X size={13}/></button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <input placeholder="Title *" required style={IS} value={form.title} onChange={set('title')} onFocus={focus} onBlur={blur}/>

        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {TYPES.map(t => {
            const active = form.type === t.value
            return (
              <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type:t.value }))}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                  border:`1.5px solid ${active ? T.deepTeal : T.border}`, background:active?`${T.deepTeal}12`:'none', color:active?T.deepTeal:T.textMuted }}>
                {t.emoji} {t.label}
              </button>
            )
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          <input type="number" placeholder="Cost" style={IS} value={form.estimatedCost} onChange={set('estimatedCost')} onFocus={focus} onBlur={blur}/>
          <input placeholder="Location" style={IS} value={form.location} onChange={set('location')} onFocus={focus} onBlur={blur}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          <input type="time" style={IS} value={form.startTime} onChange={set('startTime')} onFocus={focus} onBlur={blur}/>
          <input type="time" style={IS} value={form.endTime} onChange={set('endTime')} onFocus={focus} onBlur={blur}/>
        </div>
        <textarea placeholder="Notes" rows={2} style={{ ...IS, resize:'none', lineHeight:1.5 }} value={form.notes} onChange={set('notes')} onFocus={focus} onBlur={blur}/>

        <div style={{ display:'flex', gap:7, marginTop:2 }}>
          <button onClick={onClose} style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
          <button onClick={() => mutate(form)} disabled={isPending}
            style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:12, fontWeight:700, cursor:isPending?'not-allowed':'pointer', opacity:isPending?.7:1, fontFamily:"'DM Sans',sans-serif" }}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}