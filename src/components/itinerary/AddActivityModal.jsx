import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import { Clock, MapPin, Wallet, FileText, X } from 'lucide-react'

const TYPES = [
  { value:'activity',  label:'Activity',     emoji:'🎯' },
  { value:'food',      label:'Food & Dining', emoji:'🍽️' },
  { value:'transport', label:'Transport',     emoji:'🚌' },
  { value:'lodging',   label:'Lodging',       emoji:'🏨' },
  { value:'other',     label:'Other',         emoji:'📌' },
]

export default function AddActivityModal({ tripId, dayIndex, onClose }) {
  const { T } = useTheme()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title:'', type:'activity', startTime:'', endTime:'',
    location:'', notes:'', estimatedCost:'',
  })
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const { mutate, isPending } = useMutation({
    mutationFn: d => api.post(`/trips/${tripId}/activities`, d).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['activities', tripId] }); toast.success('Activity added!'); onClose() },
    onError:   e => toast.error(e.response?.data?.message || 'Failed to add activity'),
  })

  const submit = e => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    mutate({ ...form, dayIndex, estimatedCost: Number(form.estimatedCost) || 0 })
  }

  const IS = { width:'100%', padding:'10px 13px', borderRadius:9, border:`1.5px solid ${T.border}`, background:T.inputBg, color:T.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box', transition:'border-color .15s' }
  const LS = { fontSize:11, fontWeight:600, color:T.textMuted, display:'block', marginBottom:5, letterSpacing:.3 }
  const focus = e => e.target.style.borderColor = T.deepTeal
  const blur  = e => e.target.style.borderColor = T.border

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(14,26,28,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(5px)' }}
      onClick={onClose}>
      <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:20, width:'100%', maxWidth:440, padding:'22px 20px', boxShadow:`0 28px 72px ${T.shadow}`, fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:2.5, textTransform:'uppercase', color:T.deepTeal, marginBottom:4 }}>Day {dayIndex + 1}</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.text, lineHeight:1 }}>Add Activity</h2>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgAlt, color:T.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <X size={13}/>
          </button>
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Title */}
          <div>
            <label style={LS}>Title *</label>
            <input placeholder="e.g. Visit Mehrangarh Fort" required style={IS}
              value={form.title} onChange={set('title')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* Type — pill buttons */}
          <div>
            <label style={LS}>Type</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {TYPES.map(t => {
                const active = form.type === t.value
                return (
                  <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, type:t.value }))}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s', fontFamily:"'DM Sans',sans-serif",
                      border:       `1.5px solid ${active ? T.deepTeal : T.border}`,
                      background:   active ? `${T.deepTeal}12` : 'none',
                      color:        active ? T.deepTeal : T.textMuted,
                    }}>
                    <span>{t.emoji}</span>{t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[['Start Time','startTime'],['End Time','endTime']].map(([lbl,f]) => (
              <div key={f}>
                <label style={LS}><Clock size={9} style={{ display:'inline', marginRight:4 }}/>{lbl}</label>
                <input type="time" style={IS} value={form[f]} onChange={set(f)} onFocus={focus} onBlur={blur}/>
              </div>
            ))}
          </div>

          {/* Location */}
          <div>
            <label style={LS}><MapPin size={9} style={{ display:'inline', marginRight:4 }}/>Location</label>
            <input placeholder="e.g. Old City, Jaipur" style={IS} value={form.location} onChange={set('location')} onFocus={focus} onBlur={blur}/>
          </div>

          {/* Cost */}
          <div>
            <label style={LS}><Wallet size={9} style={{ display:'inline', marginRight:4 }}/>Estimated Cost</label>
            <input type="number" placeholder="0" min="0" style={IS} value={form.estimatedCost} onChange={set('estimatedCost')} onFocus={focus} onBlur={blur}/>
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
              {isPending ? 'Adding…' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}