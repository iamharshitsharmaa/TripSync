import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import { Plus, Trash2, Hotel, Plane, Car, Utensils, MapPin, X, Hash, CalendarDays, Clock, FileText, Loader2 } from 'lucide-react'

const TYPES = [
  { value:'hotel',      label:'Hotel',       emoji:'🏨', icon:Hotel    },
  { value:'flight',     label:'Flight',      emoji:'✈️', icon:Plane    },
  { value:'car',        label:'Car Rental',  emoji:'🚗', icon:Car      },
  { value:'restaurant', label:'Restaurant',  emoji:'🍽️', icon:Utensils },
  { value:'other',      label:'Other',       emoji:'📌', icon:MapPin   },
]
const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.value, t]))

// Accent colors per type using brand palette indices
const typeAccent = (type, T) => ({
  hotel:      T.skyTeal,
  flight:     T.deepTeal,
  car:        T.sage,
  restaurant: '#d97706',
  other:      T.textMuted,
}[type] || T.textMuted)

const fetchReservations = (tripId) =>
  api.get(`/trips/${tripId}/reservations`).then(r => {
    const d = r.data
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
  })

const fmtDateTime = (dt) => {
  if (!dt) return null
  return new Date(dt).toLocaleString('en', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

/* ══════════════════════════════════════════════════════════
   ADD RESERVATION MODAL
══════════════════════════════════════════════════════════ */
function AddReservationModal({ tripId, onClose }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [form, setForm] = useState({ title:'', type:'hotel', confirmationNo:'', checkIn:'', checkOut:'', notes:'' })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const { mutate: create, isPending } = useMutation({
    mutationFn: d => api.post(`/trips/${tripId}/reservations`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['reservations', tripId] })
      toast.success('Reservation saved!')
      onClose()
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to save'),
  })

  const submit = e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    create(form)
  }

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const LS = { fontSize:11, fontWeight:600, color:T.textMuted, display:'block', marginBottom:5, letterSpacing:.3 }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(14,26,28,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(5px)' }}
      onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:460, padding:'22px 20px', boxShadow:`0 28px 72px ${T.shadow}`, fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.deepTeal, marginBottom:4 }}>New Entry</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.text, lineHeight:1 }}>Add Reservation</h2>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={13}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Type pills */}
          <div>
            <label style={LS}>Type</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {TYPES.map(t => {
                const active = form.type === t.value
                const accent = typeAccent(t.value, T)
                return (
                  <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type:t.value }))}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                      border:     `1.5px solid ${active ? accent : T.border}`,
                      background: active ? `${accent}14` : 'none',
                      color:      active ? accent : T.textMuted,
                    }}>
                    <span>{t.emoji}</span>{t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={LS}>Name / Title *</label>
            <input placeholder="e.g. Rambagh Palace Hotel" required style={IS}
              value={form.title} onChange={set('title')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* Confirmation no */}
          <div>
            <label style={LS}><Hash size={9} style={{ display:'inline', marginRight:4 }}/>Confirmation No.</label>
            <input placeholder="e.g. ABC123456" style={IS}
              value={form.confirmationNo} onChange={set('confirmationNo')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* Dates */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={LS}><CalendarDays size={9} style={{ display:'inline', marginRight:4 }}/>Check-in / Departure</label>
              <input type="datetime-local" style={IS} value={form.checkIn} onChange={set('checkIn')} onFocus={focus} onBlur={blur}/>
            </div>
            <div>
              <label style={LS}><CalendarDays size={9} style={{ display:'inline', marginRight:4 }}/>Check-out / Arrival</label>
              <input type="datetime-local" style={IS} value={form.checkOut} onChange={set('checkOut')} onFocus={focus} onBlur={blur}/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={LS}><FileText size={9} style={{ display:'inline', marginRight:4 }}/>Notes</label>
            <textarea placeholder="Optional notes…" rows={2} style={{ ...IS, resize:'none', lineHeight:1.6 }}
              value={form.notes} onChange={set('notes')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:10, marginTop:2 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'10px', borderRadius:10, border:`1.5px solid ${T.border}`, background:'none', color:T.textMuted, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor=T.deepTeal}
              onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:isPending?'not-allowed':'pointer', opacity:isPending?.7:1, fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 16px ${T.deepTeal}35`, transition:'opacity .15s' }}>
              {isPending ? 'Saving…' : 'Save Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   RESERVATION CARD
══════════════════════════════════════════════════════════ */
function ReservationCard({ res, role, onDelete, T }) {
  const [hovered, setHovered] = useState(false)
  const cfg    = TYPE_MAP[res.type] || TYPE_MAP.other
  const Icon   = cfg.icon
  const accent = typeAccent(res.type, T)
  const inDt   = fmtDateTime(res.checkIn)
  const outDt  = fmtDateTime(res.checkOut)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', gap:14, padding:'16px',
        background: T.bgCard,
        border:`1px solid ${hovered ? accent+'40' : T.border}`,
        borderRadius:14, transition:'border-color .18s, box-shadow .18s',
        boxShadow: hovered ? `0 6px 24px ${T.shadow}` : `0 2px 10px ${T.shadow}`,
      }}>

      {/* Type icon tile */}
      <div style={{ width:42, height:42, borderRadius:12, background:`${accent}12`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={18} color={accent}/>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:5 }}>
          <div style={{ minWidth:0 }}>
            <h4 style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:"'DM Sans',sans-serif", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.3 }}>
              {res.title}
            </h4>
            <span style={{ fontSize:11, fontWeight:700, color:accent, letterSpacing:.3 }}>{cfg.label}</span>
          </div>
          {role !== 'viewer' && (
            <button onClick={() => onDelete(res._id)}
              style={{ width:26, height:26, borderRadius:7, border:`1px solid ${T.border}`, background:'none', color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, opacity:hovered?1:0, transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color='#dc2626'; e.currentTarget.style.borderColor='rgba(220,38,38,.3)'; e.currentTarget.style.background='rgba(220,38,38,.07)' }}
              onMouseLeave={e => { e.currentTarget.style.color=T.textMuted; e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background='none' }}>
              <Trash2 size={11}/>
            </button>
          )}
        </div>

        {/* Meta chips */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
          {res.confirmationNo && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:T.textMuted, background:T.bgAlt, border:`1px solid ${T.border}`, padding:'2px 9px', borderRadius:6 }}>
              <Hash size={9} color={T.deepTeal}/>
              <span style={{ fontFamily:'monospace', fontWeight:700, color:T.text }}>{res.confirmationNo}</span>
            </span>
          )}
          {(inDt || outDt) && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:T.textMuted }}>
              <Clock size={9} color={T.skyTeal}/>
              {inDt && <span>{inDt}</span>}
              {inDt && outDt && <span style={{ color:T.border }}>→</span>}
              {outDt && <span>{outDt}</span>}
            </span>
          )}
          {res.notes && (
            <span style={{ fontSize:11, color:T.textMuted, fontStyle:'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:260 }}>
              {res.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PANEL
══════════════════════════════════════════════════════════ */
export default function ReservationsPanel({ tripId, role }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: _raw, isLoading } = useQuery({
    queryKey: ['reservations', tripId],
    queryFn:  () => fetchReservations(tripId),
  })
  const reservations = Array.isArray(_raw) ? _raw : []

  const { mutate: remove } = useMutation({
    mutationFn: id => api.delete(`/reservations/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey:['reservations', tripId] }); toast.success('Reservation removed') },
    onError:    () => toast.error('Failed to delete'),
  })

  const filtered = typeFilter === 'all' ? reservations : reservations.filter(r => r.type === typeFilter)

  // Group by type for summary counts
  const counts = TYPES.map(t => ({ ...t, count: reservations.filter(r => r.type === t.value).length })).filter(t => t.count > 0)

  return (
    <div style={{ maxWidth:760, fontFamily:"'DM Sans',sans-serif" }}>

      {showAdd && <AddReservationModal tripId={tripId} onClose={() => setShowAdd(false)}/>}

      {/* ── Header row ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:T.textMuted, marginBottom:4 }}>Trip</p>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:T.text, lineHeight:1 }}>Stays & Bookings</h2>
        </div>
        {role !== 'viewer' && (
          <button onClick={() => setShowAdd(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, border:'none', background:`linear-gradient(135deg,${T.deepTeal},${T.skyTeal})`, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 14px ${T.deepTeal}35` }}>
            <Plus size={13}/> Add Reservation
          </button>
        )}
      </div>

      {/* ── Type filter pills ── */}
      {reservations.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          <button onClick={() => setTypeFilter('all')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
              border:     `1.5px solid ${typeFilter==='all' ? T.deepTeal : T.border}`,
              background: typeFilter==='all' ? `${T.deepTeal}12` : 'none',
              color:      typeFilter==='all' ? T.deepTeal : T.textMuted,
            }}>
            All
            <span style={{ fontSize:10, fontWeight:700, background:typeFilter==='all'?`${T.deepTeal}20`:T.bgAlt, color:typeFilter==='all'?T.deepTeal:T.textMuted, padding:'1px 6px', borderRadius:20 }}>
              {reservations.length}
            </span>
          </button>
          {counts.map(t => {
            const accent = typeAccent(t.value, T)
            const active = typeFilter === t.value
            return (
              <button key={t.value} onClick={() => setTypeFilter(t.value)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                  border:     `1.5px solid ${active ? accent : T.border}`,
                  background: active ? `${accent}12` : 'none',
                  color:      active ? accent : T.textMuted,
                }}>
                <span>{t.emoji}</span>{t.label}
                <span style={{ fontSize:10, fontWeight:700, background:active?`${accent}20`:T.bgAlt, color:active?accent:T.textMuted, padding:'1px 6px', borderRadius:20 }}>{t.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
          <Loader2 size={22} color={T.deepTeal} style={{ animation:'spin 1s linear infinite' }}/>
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && reservations.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', textAlign:'center' }}>
          <div style={{ width:56, height:56, borderRadius:16, background:`${T.deepTeal}0e`, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:14 }}>✈️</div>
          <p style={{ fontSize:14, color:T.textMuted, marginBottom:6 }}>No reservations yet.</p>
          {role !== 'viewer' && (
            <p style={{ fontSize:12, color:T.textMuted }}>Add hotels, flights, car rentals and more.</p>
          )}
        </div>
      )}

      {/* ── No filter results ── */}
      {!isLoading && reservations.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <p style={{ fontSize:13, color:T.textMuted }}>No {typeFilter} reservations yet.</p>
          <button onClick={() => setTypeFilter('all')} style={{ marginTop:10, fontSize:12, color:T.deepTeal, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            Show all
          </button>
        </div>
      )}

      {/* ── List ── */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(res => (
            <ReservationCard key={res._id} res={res} role={role} onDelete={remove} T={T}/>
          ))}
        </div>
      )}
    </div>
  )
}